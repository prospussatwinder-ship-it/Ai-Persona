import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { RequirePermissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { SubscriptionPlansService } from "./subscription-plans.service";
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from "./dto/subscription-plan.dto";

type Authed = Request & { user: { sub: string; role: UserRole } };

@Controller("admin/subscription-plans")
@UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
export class AdminSubscriptionPlansController {
  constructor(private readonly plans: SubscriptionPlansService) {}

  @Get()
  @RequirePermissions("subscriptions.view")
  list() {
    return this.plans.list();
  }

  @Get(":id")
  @RequirePermissions("subscriptions.view")
  getOne(@Param("id") id: string) {
    return this.plans.getById(id);
  }

  @Post()
  @RequirePermissions("subscriptions.create")
  create(@Req() req: Authed, @Body() body: CreateSubscriptionPlanDto) {
    return this.plans.create(
      {
        ...body,
        featureConfig: body.featureConfig as object | undefined,
      },
      req.user.sub
    );
  }

  @Put(":id")
  @RequirePermissions("subscriptions.edit")
  update(
    @Req() req: Authed,
    @Param("id") id: string,
    @Body() body: UpdateSubscriptionPlanDto
  ) {
    return this.plans.update(
      id,
      {
        ...body,
        featureConfig: body.featureConfig as object | undefined,
      },
      req.user.sub
    );
  }

  @Delete(":id")
  @RequirePermissions("subscriptions.delete")
  remove(@Req() req: Authed, @Param("id") id: string) {
    return this.plans.remove(id, req.user.sub);
  }
}
