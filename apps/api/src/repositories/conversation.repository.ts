import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { userId: string; personaId: string; title?: string | null }) {
    return this.prisma.conversation.create({ data });
  }

  findManyForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { persona: { select: { slug: true, name: true } } },
    });
  }

  findFirstForUser(userId: string, conversationId: string) {
    return this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
  }

  findFirstWithPersonaForUser(userId: string, conversationId: string) {
    return this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        persona: { include: { profile: true } },
      },
    });
  }

  touchUpdatedAt(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }
}
