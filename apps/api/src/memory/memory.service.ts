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

  async learnFromTurn(input: {
    userId: string;
    personaId: string;
    conversationId: string;
    userText: string;
    assistantText: string;
    history: Array<{ role: string; content: string }>;
  }) {
    const existing = await this.listStructured(input.userId, input.personaId, 48);
    const existingByKey = new Map(existing.map((item) => [item.memoryKey ?? "", item.content]));

    await this.extractAndStoreStableFacts({
      userId: input.userId,
      personaId: input.personaId,
      conversationId: input.conversationId,
      userText: input.userText,
    });

    const topicKeywords = this.extractKeywords(input.userText);
    if (this.shouldStoreTopicKeywords(input.userText, topicKeywords)) {
      await this.upsertStructuredIfChanged(existingByKey, {
        userId: input.userId,
        personaId: input.personaId,
        conversationId: input.conversationId,
        memoryKey: "topics.recent",
        memoryType: "short_term_topics",
        content: topicKeywords.join(", "),
        confidenceScore: 0.65,
        source: MemorySource.chat_summary,
        metadata: { from: "learnFromTurn", kind: "topics" },
      });
    }

    const tone = this.detectTonePreference(input.userText, input.history);
    await this.upsertStructuredIfChanged(existingByKey, {
      userId: input.userId,
      personaId: input.personaId,
      conversationId: input.conversationId,
      memoryKey: "style.preference",
      memoryType: "long_term_trait",
      content: tone,
      confidenceScore: 0.6,
      source: MemorySource.chat_summary,
      metadata: { from: "learnFromTurn", kind: "tone" },
    });

    const intent = this.detectIntentPattern(input.userText);
    await this.upsertStructuredIfChanged(existingByKey, {
      userId: input.userId,
      personaId: input.personaId,
      conversationId: input.conversationId,
      memoryKey: "intent.recent",
      memoryType: "short_term_intent",
      content: intent,
      confidenceScore: 0.58,
      source: MemorySource.chat_summary,
      metadata: { from: "learnFromTurn", kind: "intent" },
    });

    const summary = this.buildRecentSummary(input.userText, input.assistantText);
    await this.upsertStructuredIfChanged(existingByKey, {
      userId: input.userId,
      personaId: input.personaId,
      conversationId: input.conversationId,
      memoryKey: "summary.recent",
      memoryType: "short_term_summary",
      content: summary,
      confidenceScore: 0.72,
      source: MemorySource.chat_summary,
      metadata: { from: "learnFromTurn", kind: "summary" },
    });

    const rollingSummary = this.buildRollingSummary(input.userText, input.assistantText, input.history);
    if (rollingSummary) {
      await this.upsertStructuredIfChanged(existingByKey, {
        userId: input.userId,
        personaId: input.personaId,
        conversationId: input.conversationId,
        memoryKey: "summary.long_term",
        memoryType: "long_term_summary",
        content: rollingSummary,
        confidenceScore: 0.76,
        source: MemorySource.chat_summary,
        metadata: { from: "learnFromTurn", kind: "rolling-summary" },
      });
    }
  }

  private async upsertStructuredIfChanged(
    existingByKey: Map<string, string>,
    input: Parameters<MemoryService["upsertStructured"]>[0]
  ) {
    const current = existingByKey.get(input.memoryKey);
    const normalizedCurrent = current?.trim().toLowerCase();
    const normalizedNext = input.content.trim().toLowerCase();
    if (normalizedCurrent && normalizedCurrent === normalizedNext) {
      return;
    }
    await this.upsertStructured(input);
    existingByKey.set(input.memoryKey, input.content);
  }

  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .filter((w) => !["this", "that", "with", "from", "have", "want", "need", "please"].includes(w));
    return Array.from(new Set(words)).slice(0, 6);
  }

  private shouldStoreTopicKeywords(userText: string, keywords: string[]) {
    if (keywords.length < 2) return false;
    if (userText.trim().length < 20) return false;
    return true;
  }

  private detectTonePreference(userText: string, history: Array<{ role: string; content: string }>): string {
    const sample = [userText, ...history.slice(-6).map((m) => m.content)].join(" ").toLowerCase();
    const conciseSignals = ["short", "brief", "quick", "simple"];
    if (conciseSignals.some((s) => sample.includes(s))) return "prefers concise responses";
    if (sample.includes("step by step") || sample.includes("detailed")) {
      return "prefers detailed step-by-step responses";
    }
    return "neutral and practical response style";
  }

  private detectIntentPattern(userText: string): string {
    const t = userText.trim().toLowerCase();
    if (t.endsWith("?") || t.startsWith("what") || t.startsWith("how")) return "question-driven";
    if (t.startsWith("give me") || t.startsWith("create") || t.startsWith("make")) return "action-request";
    return "mixed intent";
  }

  private buildRecentSummary(userText: string, assistantText: string): string {
    const u = userText.trim().replace(/\s+/g, " ").slice(0, 180);
    const a = assistantText.trim().replace(/\s+/g, " ").slice(0, 180);
    return `User asked: "${u}". Assistant responded with guidance: "${a}".`;
  }

  private buildRollingSummary(
    userText: string,
    assistantText: string,
    history: Array<{ role: string; content: string }>
  ): string | null {
    const userTurns = history.filter((item) => item.role === "user").length + 1;
    if (userTurns % 5 !== 0) return null;

    const longTermTopics = this.extractKeywords(
      `${history
        .slice(-8)
        .map((item) => item.content)
        .join(" ")} ${userText}`
    );
    const assistantSnippet = assistantText.replace(/\s+/g, " ").slice(0, 140);
    return `Long-term pattern update: user focuses on ${longTermTopics.join(", ") || "general topics"} and responds well to guidance like "${assistantSnippet}".`;
  }
}
