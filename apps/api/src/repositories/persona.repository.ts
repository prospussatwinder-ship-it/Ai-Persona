import { Injectable } from "@nestjs/common";
import type { PersonaVisibility, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PersonaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstPublishedBySlug(slug: string) {
    return this.prisma.persona.findFirst({
      where: {
        slug,
        isPublished: true,
        isActive: true,
        visibility: "PUBLIC",
      },
      include: { profile: true },
    });
  }

  findManyPublishedOrdered() {
    return this.prisma.persona.findMany({
      where: { isPublished: true, isActive: true, visibility: "PUBLIC" },
      orderBy: { name: "asc" },
      include: { profile: true },
    });
  }

  findManyAllWithCounts() {
    return this.prisma.persona.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        profile: true,
        createdBy: { select: { id: true, email: true } },
        _count: { select: { conversations: true } },
      },
    });
  }

  findByIdWithProfile(id: string) {
    return this.prisma.persona.findUnique({
      where: { id },
      include: {
        profile: true,
        createdBy: { select: { id: true, email: true } },
        _count: { select: { conversations: true } },
      },
    });
  }

  create(data: Prisma.PersonaCreateInput) {
    return this.prisma.persona.create({
      data,
      include: { profile: true },
    });
  }

  updateById(
    id: string,
    data: {
      slug?: string;
      name?: string;
      isPublished?: boolean;
      isActive?: boolean;
      visibility?: PersonaVisibility;
    }
  ) {
    return this.prisma.persona.update({ where: { id }, data });
  }

  updateProfileByPersonaId(
    personaId: string,
    data: {
      tagline?: string | null;
      description?: string | null;
      systemPrompt?: string | null;
      avatarUrl?: string | null;
    }
  ) {
    return this.prisma.personaProfile.update({
      where: { personaId },
      data,
    });
  }

  findUniqueWithProfileAfterUpdate(id: string) {
    return this.prisma.persona.findUnique({
      where: { id },
      include: {
        profile: true,
        createdBy: { select: { id: true, email: true } },
        _count: { select: { conversations: true } },
      },
    });
  }

  countConversations(id: string) {
    return this.prisma.conversation.count({ where: { personaId: id } });
  }

  deleteById(id: string) {
    return this.prisma.persona.delete({ where: { id } });
  }
}
