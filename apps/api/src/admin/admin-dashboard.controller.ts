import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { RequirePermissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { AdminDashboardService } from "./admin-dashboard.service";

@Controller("admin/dashboard")
@UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get("stats")
  @RequirePermissions("dashboard.view")
  stats() {
    return this.dashboard.stats();
  }
}
