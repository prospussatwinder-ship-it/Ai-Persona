import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PermissionService } from "../rbac/permission.service";

@Injectable()
export class AdminRolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rbac: PermissionService
  ) {}

  listRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { permissions: true } },
      },
    });
  }

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { module: "asc" } });
  }

  async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException();
    return role;
  }

  async setRolePermissions(roleId: string, permissionIds: string[], actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException();
    if (role.slug === "super_admin") {
      throw new ForbiddenException("Cannot modify super_admin permissions");
    }
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
    await this.rbac.refreshCache();
    void this.audit.log({
      actorId,
      action: "role.permissions",
      entityType: "Role",
      entityId: roleId,
      module: "roles",
      newValues: { permissionIds },
    });
    return this.getRole(roleId);
  }
}
