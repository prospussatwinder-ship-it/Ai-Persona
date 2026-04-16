import { Injectable, Logger } from "@nestjs/common";
import { AccountSubscriptionStatus, PurchaseStatus, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  CheckoutPpvInput,
  CheckoutSubscriptionInput,
  PaymentProvider,
  WebhookInput,
} from "./payment-provider.interface";

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  readonly provider = "stripe";
  private readonly log = new Logger(StripePaymentProvider.name);
  private readonly stripe: Stripe | null;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.STRIPE_SECRET_KEY;
    this.stripe = key ? new Stripe(key) : null;
  }

  async createSubscriptionCheckout(input: CheckoutSubscriptionInput) {
    if (!this.stripe || !input.priceId) {
      return { mock: true, message: "Set STRIPE_SECRET_KEY and provide priceId to enable Stripe Checkout." };
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId: input.userId },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: input.userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL ?? "http://localhost:3002/account?sub=ok",
      cancel_url: process.env.STRIPE_CANCEL_URL ?? "http://localhost:3002/pricing",
      metadata: { userId: input.userId, planSlug: input.planSlug ?? "" },
    });
    return { url: session.url, provider: this.provider };
  }

  async createPpvPayment(input: CheckoutPpvInput) {
    if (!this.stripe) {
      const purchase = await this.prisma.purchase.create({
        data: {
          userId: input.userId,
          productKey: input.productKey,
          amountCents: input.amountCents,
          status: PurchaseStatus.succeeded,
          fulfilledAt: new Date(),
        },
      });
      return { mock: true, purchaseId: purchase.id, provider: this.provider };
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId: input.userId },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: input.userId },
        data: { stripeCustomerId: customerId },
      });
    }
    const intent = await this.stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      customer: customerId,
      metadata: { userId: input.userId, productKey: input.productKey },
    });
    const purchase = await this.prisma.purchase.create({
      data: {
        userId: input.userId,
        stripePaymentIntentId: intent.id,
        productKey: input.productKey,
        amountCents: input.amountCents,
        status: PurchaseStatus.pending,
      },
    });
    return { clientSecret: intent.client_secret, purchaseId: purchase.id, provider: this.provider };
  }

  async handleWebhook(input: WebhookInput) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return { received: true, mock: true, provider: this.provider };
    }
    try {
      const event = this.stripe.webhooks.constructEvent(
        input.rawBody,
        input.signature ?? "",
        process.env.STRIPE_WEBHOOK_SECRET
      );

      await this.prisma.billingTransaction.create({
        data: {
          provider: this.provider,
          externalId: event.id,
          status: event.type,
          metadata: event as unknown as object,
        },
      });

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
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            },
            update: {
              status: this.mapSubStatus(sub.status),
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            },
          });
        }
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = String(session.metadata?.userId ?? "");
        const planSlug = String(session.metadata?.planSlug ?? "");
        if (userId && planSlug) {
          await this.grantUserPlanBySlug(userId, planSlug);
        }
      }

      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.purchase.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: PurchaseStatus.succeeded, fulfilledAt: new Date() },
        });
      }
      return { received: true, provider: this.provider };
    } catch (e) {
      this.log.error(String(e));
      return { received: false, provider: this.provider };
    }
  }

  private async grantUserPlanBySlug(userId: string, planSlug: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { slug: planSlug.toLowerCase(), status: "ACTIVE" },
      select: { id: true },
    });
    if (!plan) return;
    await this.prisma.userPlanSubscription.updateMany({
      where: {
        userId,
        status: { in: [AccountSubscriptionStatus.active, AccountSubscriptionStatus.trial] },
      },
      data: { status: AccountSubscriptionStatus.inactive, endDate: new Date() },
    });
    await this.prisma.userPlanSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: AccountSubscriptionStatus.active,
        startDate: new Date(),
      },
    });
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

