export type CheckoutSubscriptionInput = {
  userId: string;
  priceId?: string;
  planSlug?: string;
};

export type CheckoutPpvInput = {
  userId: string;
  productKey: string;
  amountCents: number;
};

export type WebhookInput = {
  rawBody: Buffer;
  signature?: string;
};

export interface PaymentProvider {
  readonly provider: string;
  createSubscriptionCheckout(input: CheckoutSubscriptionInput): Promise<Record<string, unknown>>;
  createPpvPayment(input: CheckoutPpvInput): Promise<Record<string, unknown>>;
  handleWebhook(input: WebhookInput): Promise<Record<string, unknown>>;
}

