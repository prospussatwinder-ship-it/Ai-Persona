import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PersonaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstPublishedBySlug(slug: string) {
    return this.prisma.persona.findFirst({
      where: { slug, isPublished: true },
      include: { profile: true },
    });
  }

  findManyPublishedOrdered() {
    return this.prisma.persona.findMany({
      where: { isPublished: true },
      orderBy: { name: "asc" },
      include: { profile: true },
    });
  }

  findManyAllWithCounts() {
    return this.prisma.persona.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        profile: true,
        _count: { select: { conversations: true } },
      },
    });
  }

  findByIdWithProfile(id: string) {
    return this.prisma.persona.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  create(data: Prisma.PersonaCreateInput) {
    return this.prisma.persona.create({
      data,
      include: { profile: true },
    });
  }

  updateById(id: string, data: { slug?: string; name?: string; isPublished?: boolean }) {
    return this.prisma.persona.update({ where: { id }, data });
  }

  updateProfileByPersonaId(
    personaId: string,
    data: { tagline?: string | null; description?: string | null; systemPrompt?: string | null }
  ) {
    return this.prisma.personaProfile.update({
      where: { personaId },
      data,
    });
  }

  findUniqueWithProfileAfterUpdate(id: string) {
    return this.prisma.persona.findUnique({
      where: { id },
      include: { profile: true },
    });
  }
}
