import { Injectable } from "@nestjs/common";
import type { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type UserProfileSelect = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  ageVerified: boolean;
  createdAt: Date;
};

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findProfileById(id: string): Promise<UserProfileSelect> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        ageVerified: true,
        createdAt: true,
      },
    });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    role: UserRole;
  }) {
    return this.prisma.user.create({ data });
  }

  updateProfile(id: string, data: { displayName?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        ageVerified: true,
        createdAt: true,
      },
    });
  }
}
