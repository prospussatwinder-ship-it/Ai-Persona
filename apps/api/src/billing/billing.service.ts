import { Injectable } from "@nestjs/common";
import { CcBillPaymentProvider } from "./providers/ccbill.provider";
import { CryptoPaymentProvider } from "./providers/crypto.provider";
import { StripePaymentProvider } from "./providers/stripe.provider";

@Injectable()
export class BillingService {
  private readonly providers: Record<string, StripePaymentProvider | CcBillPaymentProvider | CryptoPaymentProvider>;

  constructor(
    private readonly stripeProvider: StripePaymentProvider,
    private readonly ccbillProvider: CcBillPaymentProvider,
    private readonly cryptoProvider: CryptoPaymentProvider
  ) {
    this.providers = {
      stripe: stripeProvider,
      ccbill: ccbillProvider,
      crypto: cryptoProvider,
    };
  }

  async createSubscriptionCheckout(input: {
    userId: string;
    provider?: string;
    priceId?: string;
    planSlug?: string;
  }) {
    return this.getProvider(input.provider).createSubscriptionCheckout({
      userId: input.userId,
      priceId: input.priceId,
      planSlug: input.planSlug,
    });
  }

  async createPpvPaymentIntent(input: {
    userId: string;
    provider?: string;
    productKey: string;
    amountCents: number;
  }) {
    return this.getProvider(input.provider).createPpvPayment({
      userId: input.userId,
      productKey: input.productKey,
      amountCents: input.amountCents,
    });
  }

  handleWebhook(provider: string | undefined, rawBody: Buffer, signature?: string) {
    return this.getProvider(provider).handleWebhook({ rawBody, signature });
  }

  private getProvider(provider: string | undefined) {
    const key = (provider ?? "stripe").toLowerCase();
    return this.providers[key] ?? this.providers.stripe;
  }
}
