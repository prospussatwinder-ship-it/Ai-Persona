import { UserRole } from "@prisma/client";

/** Maps Prisma UserRole to Role.slug rows seeded in DB. */
export function userRoleToSlug(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "super_admin";
    case UserRole.ADMIN:
      return "admin";
    case UserRole.OPERATOR:
      return "manager";
    case UserRole.CUSTOMER:
      return "user";
    default:
      return "user";
  }
}

export function isStaffRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.OPERATOR;
}
