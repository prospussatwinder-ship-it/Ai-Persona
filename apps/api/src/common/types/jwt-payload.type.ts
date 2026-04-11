import type { UserRole } from "@prisma/client";

export type JwtAccessPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
