import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { CcBillPaymentProvider } from "./providers/ccbill.provider";
import { CryptoPaymentProvider } from "./providers/crypto.provider";
import { StripePaymentProvider } from "./providers/stripe.provider";

@Module({
  controllers: [BillingController],
  providers: [BillingService, StripePaymentProvider, CcBillPaymentProvider, CryptoPaymentProvider],
  exports: [BillingService],
})
export class BillingModule {}
