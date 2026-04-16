import { Injectable } from "@nestjs/common";
import { AccountSubscriptionStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  CheckoutPpvInput,
  CheckoutSubscriptionInput,
  PaymentProvider,
  WebhookInput,
} from "./payment-provider.interface";

@Injectable()
export class CcBillPaymentProvider implements PaymentProvider {
  readonly provider = "ccbill";

  constructor(private readonly prisma: PrismaService) {}

  async createSubscriptionCheckout(input: CheckoutSubscriptionInput) {
    const canAutoActivate = Boolean(input.planSlug);
    const tx = await this.prisma.billingTransaction.create({
      data: {
        userId: input.userId,
        provider: this.provider,
        externalId: `ccbill_checkout_${randomUUID()}`,
        amountCents: 0,
        status: canAutoActivate ? "succeeded" : "pending",
        metadata: { planSlug: input.planSlug ?? null, mode: "subscription" },
      },
    });
    if (canAutoActivate && input.planSlug) {
      await this.grantUserPlanBySlug(input.userId, input.planSlug);
    }

    return {
      provider: this.provider,
      checkoutId: tx.externalId,
      url: null,
      mock: true,
      message: canAutoActivate
        ? "Mock CCBill checkout completed and subscription activated for development."
        : "CCBill integration scaffolded. Configure CCBILL_* env values and replace checkout URL builder.",
    };
  }

  async createPpvPayment(input: CheckoutPpvInput) {
    const tx = await this.prisma.billingTransaction.create({
      data: {
        userId: input.userId,
        provider: this.provider,
        externalId: `ccbill_ppv_${randomUUID()}`,
        amountCents: input.amountCents,
        status: "pending",
        metadata: { productKey: input.productKey, mode: "ppv" },
      },
    });
    return {
      provider: this.provider,
      transactionId: tx.id,
      mock: true,
      message: "CCBill PPV integration scaffolded. Implement API request flow once gateway credentials are available.",
    };
  }

  async handleWebhook(input: WebhookInput) {
    const event = this.parseWebhookPayload(input.rawBody);
    await this.prisma.billingTransaction.create({
      data: {
        userId: event.userId ?? null,
        provider: this.provider,
        externalId: event.externalId,
        amountCents: event.amountCents ?? 0,
        status: event.status ?? "received",
        metadata: event,
      },
    });

    if (event.status === "succeeded" && event.userId && event.planSlug) {
      await this.grantUserPlanBySlug(event.userId, event.planSlug);
    }
    return { received: true, provider: this.provider };
  }

  private parseWebhookPayload(rawBody: Buffer) {
    try {
      return JSON.parse(rawBody.toString("utf-8")) as {
        userId?: string;
        externalId: string;
        amountCents?: number;
        status?: string;
        planSlug?: string;
      };
    } catch {
      return { externalId: `ccbill_event_${randomUUID()}`, status: "malformed" };
    }
  }

  private async grantUserPlanBySlug(userId: string, planSlug: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { slug: planSlug.toLowerCase(), status: "ACTIVE" },
      select: { id: true },
    });
    if (!plan) return;
    await this.prisma.userPlanSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: AccountSubscriptionStatus.active,
        startDate: new Date(),
      },
    });
  }
}

