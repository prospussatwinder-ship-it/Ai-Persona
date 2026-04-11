import { randomUUID } from "crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export const MEMORY_EMBEDDING_DIM = 1536;

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
    metadata?: Record<string, unknown>
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
}
