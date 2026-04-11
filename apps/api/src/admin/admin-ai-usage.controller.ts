import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { RequirePermissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { AdminAiUsageService } from "./admin-ai-usage.service";
import { AdminAiUsageQueryDto } from "./dto/admin-ai-usage-query.dto";

@Controller("admin/ai-usage")
@UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
export class AdminAiUsageController {
  constructor(private readonly aiUsage: AdminAiUsageService) {}

  @Get()
  @RequirePermissions("ai_usage.view")
  list(@Query() q: AdminAiUsageQueryDto) {
    return this.aiUsage.list(q);
  }

  @Get("summary")
  @RequirePermissions("ai_usage.view")
  summary() {
    return this.aiUsage.summary();
  }
}
