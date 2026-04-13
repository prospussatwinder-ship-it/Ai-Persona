import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserPersonaTrainingRepository {
  constructor(private readonly prisma: PrismaService) {}

  getActive(userId: string, personaId: string) {
    return this.prisma.userPersonaTrainingProfile.findUnique({
      where: { userId_personaId: { userId, personaId } },
    });
  }

  upsertActive(input: {
    userId: string;
    personaId: string;
    title?: string | null;
    trainingNotes?: string | null;
    structuredProfile?: Prisma.InputJsonValue;
  }) {
    return this.prisma.userPersonaTrainingProfile.upsert({
      where: { userId_personaId: { userId: input.userId, personaId: input.personaId } },
      create: {
        userId: input.userId,
        personaId: input.personaId,
        title: input.title ?? null,
        trainingNotes: input.trainingNotes ?? null,
        structuredProfile: input.structuredProfile,
        status: "active",
      },
      update: {
        title: input.title ?? null,
        trainingNotes: input.trainingNotes ?? null,
        structuredProfile: input.structuredProfile,
        status: "active",
      },
    });
  }
}
