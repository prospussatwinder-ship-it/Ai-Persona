import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserRole } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";

@Controller()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditLogsController {
  constructor(private readonly audit: AuditService) {}

  @Get("admin/audit-logs")
  list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.audit.listRecent(Number(limit ?? 50), Number(offset ?? 0));
  }
}
