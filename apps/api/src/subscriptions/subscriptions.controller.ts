import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { SubscriptionsService } from "./subscriptions.service";

type Authed = Request & { user: { sub: string } };

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get("plans")
  async listPlans() {
    const plans = await this.subscriptions.listCatalogPlans();
    return { plans };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get()
  async list(@Req() req: Authed) {
    return this.subscriptions.getOverviewForUser(req.user.sub);
  }
}
