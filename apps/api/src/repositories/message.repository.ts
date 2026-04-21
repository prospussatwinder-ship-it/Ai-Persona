import { Injectable } from "@nestjs/common";
import type { MessageRole, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByConversation(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  findRecentForPrompt(conversationId: string, take: number) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take,
      select: { role: true, content: true },
    });
  }

  create(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.message.create({ data });
  }

  findFirstByConversationAndId(conversationId: string, messageId: string) {
    return this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
      select: { id: true, role: true, content: true },
    });
  }
}
