import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { AccountSubscriptionStatus, UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { RequirePermissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { UserPlanSubscriptionsService } from "./user-plan-subscriptions.service";
import type { Prisma } from "@prisma/client";
import {
  CreateUserPlanSubscriptionDto,
  UpdateUserPlanSubscriptionDto,
} from "./dto/user-plan-subscription.dto";

type Authed = Request & { user: { sub: string; role: UserRole } };

@Controller("admin/user-subscriptions")
@UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
export class AdminUserSubscriptionsController {
  constructor(private readonly subs: UserPlanSubscriptionsService) {}

  @Get()
  @RequirePermissions("subscriptions.view")
  list() {
    return this.subs.list();
  }

  @Get(":id")
  @RequirePermissions("subscriptions.view")
  getOne(@Param("id") id: string) {
    return this.subs.getById(id);
  }

  @Post()
  @RequirePermissions("subscriptions.create")
  create(@Req() req: Authed, @Body() body: CreateUserPlanSubscriptionDto) {
    return this.subs.create(
      {
        userId: body.userId,
        planId: body.planId,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : undefined,
        trialStartDate: body.trialStartDate
          ? new Date(body.trialStartDate)
          : undefined,
        trialEndDate: body.trialEndDate ? new Date(body.trialEndDate) : undefined,
        metadata: body.metadata as Prisma.InputJsonValue | undefined,
      },
      req.user.sub
    );
  }

  @Put(":id")
  @RequirePermissions("subscriptions.edit")
  update(
    @Req() req: Authed,
    @Param("id") id: string,
    @Body() body: UpdateUserPlanSubscriptionDto
  ) {
    return this.subs.update(
      id,
      {
        planId: body.planId,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : undefined,
        cancelAtPeriodEnd: body.cancelAtPeriodEnd,
        trialStartDate: body.trialStartDate
          ? new Date(body.trialStartDate)
          : undefined,
        trialEndDate: body.trialEndDate ? new Date(body.trialEndDate) : undefined,
        metadata: body.metadata as Prisma.InputJsonValue | undefined,
      },
      req.user.sub
    );
  }

  @Patch(":id/status")
  @RequirePermissions("subscriptions.edit")
  patchStatus(
    @Req() req: Authed,
    @Param("id") id: string,
    @Body() body: { status: AccountSubscriptionStatus }
  ) {
    return this.subs.patchStatus(id, body.status, req.user.sub);
  }
}
