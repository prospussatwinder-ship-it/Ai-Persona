import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserRole } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { RequirePermissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { AuditLogQueryDto } from "./dto/audit-log-query.dto";

@Controller()
@UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
export class AuditLogsController {
  constructor(private readonly audit: AuditService) {}

  @Get("admin/audit-logs")
  @RequirePermissions("audit_logs.view")
  list(@Query() q: AuditLogQueryDto) {
    return this.audit.listFiltered(q);
  }

  @Get("admin/audit-logs/:id")
  @RequirePermissions("audit_logs.view")
  async getOne(@Param("id") id: string) {
    const row = await this.audit.getById(id);
    if (!row) throw new NotFoundException();
    return row;
  }
}
