import { Injectable } from "@nestjs/common";
import type { UserAccountStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type UserProfileSelect = {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserAccountStatus;
  ageVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
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
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        ageVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
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

  updateProfile(
    id: string,
    data: {
      displayName?: string;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
    }
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        ageVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }
}
