import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { PurchasesService } from "./purchases.service";

type Authed = Request & { user: { sub: string } };

@Controller("purchases")
@UseGuards(AuthGuard("jwt"))
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Get()
  async list(@Req() req: Authed) {
    const purchases = await this.purchases.listForUser(req.user.sub);
    return { purchases };
  }
}
