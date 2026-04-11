import { Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";
import { PurchaseStatus, SubscriptionStatus } from "@prisma/client";

@Injectable()
export class BillingService {
  private readonly log = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.STRIPE_SECRET_KEY;
    this.stripe = key ? new Stripe(key) : null;
  }

  /**
   * Placeholder Checkout Session — returns { url } when Stripe configured, else null.
   */
  async createSubscriptionCheckout(userId: string, priceId: string) {
    if (!this.stripe) {
      return { mock: true, message: "Set STRIPE_SECRET_KEY to enable Checkout." };
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL ?? "http://localhost:3002/account?sub=ok",
      cancel_url: process.env.STRIPE_CANCEL_URL ?? "http://localhost:3002/pricing",
    });
    return { url: session.url };
  }

  /**
   * PPV one-time payment placeholder.
   */
  async createPpvPaymentIntent(userId: string, productKey:string, amountCents: number) {
    if (!this.stripe) {
      const purchase = await this.prisma.purchase.create({
        data: {
          userId,
          productKey,
          amountCents,
          status: PurchaseStatus.succeeded,
          fulfilledAt: new Date(),
        },
      });
      return { mock: true, purchaseId: purchase.id };
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe!.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }
    const intent = await this.stripe!.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      metadata: { userId, productKey },
    });
    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        stripePaymentIntentId: intent.id,
        productKey,
        amountCents,
        status: PurchaseStatus.pending,
      },
    });
    return { clientSecret: intent.client_secret, purchaseId: purchase.id };
  }

  /** Stub webhook: extend with signature verification + event handlers. */
  async handleWebhook(rawBody: Buffer, signature?: string) {
    this.log.log(`Stripe webhook received (${rawBody.length} bytes, sig=${!!signature})`);
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return { received: true, mock: true };
    }
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature ?? "",
        process.env.STRIPE_WEBHOOK_SECRET
      );
      if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await this.findUserByCustomer(String(sub.customer));
        if (userId) {
          await this.prisma.subscription.upsert({
            where: { stripeSubscriptionId: sub.id },
            create: {
              userId,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0]?.price?.id,
              status: this.mapSubStatus(sub.status),
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
            },
            update: {
              status: this.mapSubStatus(sub.status),
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
            },
          });
        }
      }
      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.purchase.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: PurchaseStatus.succeeded, fulfilledAt: new Date() },
        });
      }
      return { received: true };
    } catch (e) {
      this.log.error(String(e));
      return { received: false };
    }
  }

  private async findUserByCustomer(customerId: string) {
    const u = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    return u?.id ?? null;
  }

  private mapSubStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
    switch (s) {
      case "active":
        return SubscriptionStatus.active;
      case "trialing":
        return SubscriptionStatus.trialing;
      case "past_due":
        return SubscriptionStatus.past_due;
      case "canceled":
      case "unpaid":
        return SubscriptionStatus.canceled;
      default:
        return SubscriptionStatus.incomplete;
    }
  }
}
