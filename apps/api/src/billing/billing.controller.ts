import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
  RawBodyRequest,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { BillingService } from "./billing.service";

type Authed = Request & { user: { sub: string } };

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("checkout/subscription")
  checkoutSubscription(
    @Req() req: Authed,
    @Body() body: { provider?: "stripe" | "ccbill" | "crypto"; priceId?: string; planSlug?: string }
  ) {
    return this.billing.createSubscriptionCheckout({
      userId: req.user.sub,
      provider: body.provider,
      priceId: body.priceId,
      planSlug: body.planSlug,
    });
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("checkout/ppv")
  checkoutPpv(
    @Req() req: Authed,
    @Body() body: { provider?: "stripe" | "ccbill" | "crypto"; productKey: string; amountCents: number }
  ) {
    return this.billing.createPpvPaymentIntent({
      userId: req.user.sub,
      provider: body.provider,
      productKey: body.productKey,
      amountCents: body.amountCents,
    });
  }

  @Post("webhook")
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature?: string
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.billing.handleWebhook("stripe", raw, signature);
  }

  @Post("webhook/:provider")
  webhookByProvider(
    @Param("provider") provider: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature?: string
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.billing.handleWebhook(provider, raw, signature);
  }
}
