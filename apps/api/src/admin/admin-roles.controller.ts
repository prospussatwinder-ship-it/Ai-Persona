import {
  Body,
  Controller,
  Get,
  Param,
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
import { AdminRolesService } from "./admin-roles.service";

type Authed = Request & { user: { sub: string; role: UserRole } };

@Controller("admin")
@UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
export class AdminRolesController {
  constructor(private readonly roles: AdminRolesService) {}

  @Get("roles")
  @RequirePermissions("roles.view")
  listRoles() {
    return this.roles.listRoles();
  }

  @Get("roles/:id")
  @RequirePermissions("roles.view")
  getRole(@Param("id") id: string) {
    return this.roles.getRole(id);
  }

  @Get("permissions")
  @RequirePermissions("roles.view")
  listPermissions() {
    return this.roles.listPermissions();
  }

  @Put("roles/:id/permissions")
  @RequirePermissions("roles.edit")
  setPermissions(
    @Req() req: Authed,
    @Param("id") id: string,
    @Body() body: { permissionIds: string[] }
  ) {
    return this.roles.setRolePermissions(id, body.permissionIds ?? [], req.user.sub);
  }
}
