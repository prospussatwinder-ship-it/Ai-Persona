import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { TrackEventDto } from "./dto/track-event.dto";
import { AnalyticsService } from "./analytics.service";

type Authed = Request & { user: { sub: string } };

@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("analytics/events")
  track(@Req() req: Authed, @Body() body: TrackEventDto) {
    return this.analytics.track({
      userId: req.user.sub,
      personaId: body.personaId,
      type: body.type,
      payload: body.payload,
    });
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("admin/analytics/events")
  list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.analytics.listRecent(Number(limit ?? 50), Number(offset ?? 0));
  }
}
