import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { SubscriptionsService } from "./subscriptions.service";

type Authed = Request & { user: { sub: string } };

@Controller("subscriptions")
@UseGuards(AuthGuard("jwt"))
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  async list(@Req() req: Authed) {
    const subscriptions = await this.subscriptions.listForUser(req.user.sub);
    return { subscriptions };
  }
}
