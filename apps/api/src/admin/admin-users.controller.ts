import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { UserAccountStatus, UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { RequirePermissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { AdminUsersService } from "./admin-users.service";
import { AdminCreateUserDto } from "./dto/admin-create-user.dto";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import { AdminUserQueryDto } from "./dto/admin-user-query.dto";

type Authed = Request & { user: { sub: string; role: UserRole } };

@Controller("admin/users")
@UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  @RequirePermissions("users.view")
  list(@Query() query: AdminUserQueryDto) {
    return this.adminUsers.list(query);
  }

  @Post()
  @RequirePermissions("users.create")
  create(@Req() req: Authed, @Body() body: AdminCreateUserDto) {
    return this.adminUsers.create(body, req.user.sub);
  }

  @Get(":id")
  @RequirePermissions("users.view")
  getOne(@Param("id") id: string) {
    return this.adminUsers.getById(id);
  }

  @Put(":id")
  @RequirePermissions("users.edit")
  update(@Req() req: Authed, @Param("id") id: string, @Body() body: AdminUpdateUserDto) {
    return this.adminUsers.update(id, body, req.user.sub);
  }

  @Patch(":id/status")
  @RequirePermissions("users.edit")
  patchStatus(
    @Req() req: Authed,
    @Param("id") id: string,
    @Body() body: { status: UserAccountStatus }
  ) {
    return this.adminUsers.patchStatus(id, body.status, req.user.sub);
  }

  @Delete(":id")
  @RequirePermissions("users.delete")
  remove(@Req() req: Authed, @Param("id") id: string) {
    return this.adminUsers.softDelete(id, req.user.sub);
  }
}
