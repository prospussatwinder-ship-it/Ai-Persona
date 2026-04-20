import { randomUUID } from "crypto";
import { Injectable } from "@nestjs/common";
import type { MemorySource, Prisma } from "@prisma/client";
import { EMBEDDING_DIM } from "../common/embedding.util";
import { PrismaService } from "../prisma/prisma.service";

/** Re-export for callers that already import from here */
export const MEMORY_EMBEDDING_DIM = EMBEDDING_DIM;

@Injectable()
export class MemoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchSimilar(
    userId: string,
    personaId: string,
    embedding: number[],
    limit = 8
  ) {
    if (embedding.length !== MEMORY_EMBEDDING_DIM) {
      throw new Error(`Embedding dimension must be ${MEMORY_EMBEDDING_DIM}`);
    }
    const vec = `[${embedding.join(",")}]`;
    return this.prisma.$queryRawUnsafe<
      { id: string; content: string; source: string; score: string | number }[]
    >(
      `SELECT id, content, source::text,
              1 - (embedding <=> $1::vector) AS score
       FROM "MemoryEntry"
       WHERE "userId" = $2 AND "personaId" = $3 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $4`,
      vec,
      userId,
      personaId,
      limit
    );
  }

  async insertWithEmbedding(
    userId: string,
    personaId: string,
    conversationId: string | null,
    source: string,
    content: string,
    embedding: number[],
    metadata?: Prisma.InputJsonValue
  ) {
    if (embedding.length !== MEMORY_EMBEDDING_DIM) {
      throw new Error(`Embedding dimension must be ${MEMORY_EMBEDDING_DIM}`);
    }
    const id = randomUUID();
    const vec = `[${embedding.join(",")}]`;
    const meta = metadata ? JSON.stringify(metadata) : null;
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "MemoryEntry" (id, "userId", "personaId", "conversationId", source, content, metadata, embedding, "createdAt")
       VALUES ($1, $2, $3, $4, $5::"MemorySource", $6, $7::jsonb, $8::vector, NOW())`,
      id,
      userId,
      personaId,
      conversationId,
      source,
      content,
      meta,
      vec
    );
    return { id };
  }

  listStructuredForUserPersona(userId: string, personaId: string, limit = 32) {
    return this.prisma.memoryEntry.findMany({
      where: { userId, personaId, memoryKey: { not: null } },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        memoryKey: true,
        memoryType: true,
        content: true,
        confidenceScore: true,
        source: true,
        metadata: true,
        updatedAt: true,
      },
    });
  }

  async upsertStructured(input: {
    userId: string;
    personaId: string;
    conversationId?: string | null;
    memoryKey: string;
    memoryType: string;
    content: string;
    source: MemorySource;
    confidenceScore?: number;
    metadata?: Prisma.InputJsonValue;
  }) {
    const existing = await this.prisma.memoryEntry.findFirst({
      where: {
        userId: input.userId,
        personaId: input.personaId,
        memoryKey: input.memoryKey,
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.memoryEntry.update({
        where: { id: existing.id },
        data: {
          memoryType: input.memoryType,
          content: input.content,
          source: input.source,
          confidenceScore: input.confidenceScore,
          conversationId: input.conversationId ?? null,
          metadata: input.metadata,
        },
      });
    }

    return this.prisma.memoryEntry.create({
      data: {
        userId: input.userId,
        personaId: input.personaId,
        conversationId: input.conversationId ?? null,
        source: input.source,
        memoryKey: input.memoryKey,
        memoryType: input.memoryType,
        content: input.content,
        confidenceScore: input.confidenceScore,
        metadata: input.metadata,
      },
    });
  }
}
