import { Injectable, OnModuleInit } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { userRoleToSlug } from "./role-slugs";

@Injectable()
export class PermissionService implements OnModuleInit {
  private cache = new Map<string, Set<string>>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  async refreshCache() {
    const roles = await this.prisma.role.findMany({
      where: { status: "active" },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    this.cache.clear();
    for (const r of roles) {
      const set = new Set<string>();
      for (const rp of r.permissions) {
        set.add(rp.permission.slug);
      }
      this.cache.set(r.slug, set);
    }
  }

  /** Permissions granted to this app role (by Role.slug mapping). */
  async getSlugsForUserRole(role: UserRole): Promise<Set<string>> {
    const slug = userRoleToSlug(role);
    const cached = this.cache.get(slug);
    if (cached) return cached;
    const db = await this.prisma.role.findUnique({
      where: { slug },
      include: { permissions: { include: { permission: true } } },
    });
    if (!db) return new Set();
    return new Set(db.permissions.map((p) => p.permission.slug));
  }

  async userHasPermission(role: UserRole, permissionSlug: string): Promise<boolean> {
    const set = await this.getSlugsForUserRole(role);
    return set.has(permissionSlug);
  }

  /** Staff roles bypass AI quota checks. */
  bypassesAiQuota(role: UserRole): boolean {
    return (
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.ADMIN ||
      role === UserRole.OPERATOR
    );
  }
}
