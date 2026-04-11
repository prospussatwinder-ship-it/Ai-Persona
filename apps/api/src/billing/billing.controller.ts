import {
  Body,
  Controller,
  Headers,
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
  checkoutSubscription(@Req() req: Authed, @Body() body: { priceId: string }) {
    return this.billing.createSubscriptionCheckout(req.user.sub, body.priceId);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("checkout/ppv")
  checkoutPpv(
    @Req() req: Authed,
    @Body() body: { productKey: string; amountCents: number }
  ) {
    return this.billing.createPpvPaymentIntent(req.user.sub, body.productKey, body.amountCents);
  }

  @Post("webhook")
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature?: string
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.billing.handleWebhook(raw, signature);
  }
}
