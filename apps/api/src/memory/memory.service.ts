import { Injectable } from "@nestjs/common";
import { MemorySource, Prisma } from "@prisma/client";
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
    metadata?: Prisma.InputJsonValue
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

  listStructured(userId: string, personaId: string, limit = 24) {
    return this.memoryRepository.listStructuredForUserPersona(userId, personaId, limit);
  }

  upsertStructured(input: {
    userId: string;
    personaId: string;
    conversationId?: string | null;
    memoryKey: string;
    memoryType: string;
    content: string;
    source?: MemorySource;
    confidenceScore?: number;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.memoryRepository.upsertStructured({
      ...input,
      source: input.source ?? MemorySource.user_fact,
    });
  }

  async extractAndStoreStableFacts(input: {
    userId: string;
    personaId: string;
    conversationId: string;
    userText: string;
  }) {
    const text = input.userText.trim();
    if (!text) return;
    const normalized = text.toLowerCase();
    const extracted: Array<{
      key: string;
      type: string;
      value: string;
      confidence: number;
    }> = [];

    const pick = (re: RegExp, key: string, type: string, confidence = 0.75) => {
      const m = normalized.match(re);
      if (!m?.[1]) return;
      extracted.push({ key, type, value: m[1].trim(), confidence });
    };

    pick(/\bi prefer ([^.!?\n]{2,120})/i, "preference.general", "preference");
    pick(/\bi like ([^.!?\n]{2,120})/i, "likes.general", "preference", 0.68);
    pick(/\bi (?:dislike|hate|avoid) ([^.!?\n]{2,120})/i, "dislikes.general", "dislike", 0.82);
    pick(/\bi(?:'m| am) allergic to ([^.!?\n]{2,120})/i, "restriction.allergy", "restriction", 0.9);
    pick(/\bmy goal is ([^.!?\n]{2,120})/i, "goal.primary", "goal", 0.88);
    pick(/\bi want to ([^.!?\n]{2,120})/i, "goal.intent", "goal", 0.72);
    pick(/\b(?:my )?protein target(?: is)? ([0-9]{2,4}\s?g)\b/i, "nutrition.protein_target", "target", 0.9);

    if (extracted.length === 0) return;

    for (const item of extracted) {
      await this.upsertStructured({
        userId: input.userId,
        personaId: input.personaId,
        conversationId: input.conversationId,
        memoryKey: item.key,
        memoryType: item.type,
        content: item.value,
        confidenceScore: item.confidence,
        source: MemorySource.user_fact,
        metadata: { extractedFrom: "chat", rawSnippet: text.slice(0, 220) },
      });
    }
  }
}
