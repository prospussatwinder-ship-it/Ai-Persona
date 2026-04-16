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
export class CryptoPaymentProvider implements PaymentProvider {
  readonly provider = "crypto";

  constructor(private readonly prisma: PrismaService) {}

  async createSubscriptionCheckout(input: CheckoutSubscriptionInput) {
    const canAutoActivate = Boolean(input.planSlug);
    const tx = await this.prisma.billingTransaction.create({
      data: {
        userId: input.userId,
        provider: this.provider,
        externalId: `crypto_checkout_${randomUUID()}`,
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
      invoiceId: tx.externalId,
      paymentAddress: null,
      mock: true,
      message: canAutoActivate
        ? "Mock crypto checkout completed and subscription activated for development."
        : "Crypto payment scaffolded. Plug your gateway client using CRYPTO_GATEWAY_* env values.",
    };
  }

  async createPpvPayment(input: CheckoutPpvInput) {
    const tx = await this.prisma.billingTransaction.create({
      data: {
        userId: input.userId,
        provider: this.provider,
        externalId: `crypto_ppv_${randomUUID()}`,
        amountCents: input.amountCents,
        status: "pending",
        metadata: { productKey: input.productKey, mode: "ppv" },
      },
    });
    return {
      provider: this.provider,
      invoiceId: tx.externalId,
      transactionId: tx.id,
      mock: true,
      message: "Crypto PPV scaffolded. Replace with gateway-specific invoice creation when credentials are ready.",
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

    if (event.status === "confirmed" && event.userId && event.planSlug) {
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
      return { externalId: `crypto_event_${randomUUID()}`, status: "malformed" };
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

