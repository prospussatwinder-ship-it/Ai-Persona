import { Injectable } from "@nestjs/common";
import { MemoryRepository } from "../repositories/memory.repository";

@Injectable()
export class MemoryService {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  search(userId: string, personaId: string, embedding: number[], limit = 8) {
    return this.memoryRepository.searchSimilar(userId, personaId, embedding, limit);
  }

  insertVectorRow(
    userId: string,
    personaId: string,
    conversationId: string | null,
    source: string,
    content: string,
    embedding: number[],
    metadata?: Record<string, unknown>
  ) {
    return this.memoryRepository.insertWithEmbedding(
      userId,
      personaId,
      conversationId,
      source,
      content,
      embedding,
      metadata
    );
  }
}
