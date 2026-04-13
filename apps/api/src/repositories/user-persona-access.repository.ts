import { Injectable } from "@nestjs/common";
import type { PersonaAccessType, Prisma, UserPersonaAccessStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserPersonaAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByUserAndPersona(userId: string, personaId: string, now = new Date()) {
    return this.prisma.userPersonaAccess.findFirst({
      where: {
        userId,
        personaId,
        status: "active",
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  listForUser(userId: string) {
    return this.prisma.userPersonaAccess.findMany({
      where: { userId, status: "active" },
      include: {
        persona: { select: { id: true, slug: true, name: true, visibility: true, isActive: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  upsertAccess(input: {
    userId: string;
    personaId: string;
    accessType: PersonaAccessType;
    status?: UserPersonaAccessStatus;
    startDate?: Date | null;
    endDate?: Date | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.userPersonaAccess.upsert({
      where: {
        userId_personaId_accessType: {
          userId: input.userId,
          personaId: input.personaId,
          accessType: input.accessType,
        },
      },
      create: {
        userId: input.userId,
        personaId: input.personaId,
        accessType: input.accessType,
        status: input.status ?? "active",
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        metadata: input.metadata,
      },
      update: {
        status: input.status ?? "active",
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        metadata: input.metadata,
      },
    });
  }
}
