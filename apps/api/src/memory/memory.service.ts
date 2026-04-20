import { Injectable, Logger } from "@nestjs/common";
import { MemorySource, Prisma } from "@prisma/client";
import { AiClientService } from "../ai-client/ai-client.service";
import { scheduleMemoryPostTurnJob } from "../jobs/memory-post-turn.job";
import { MemoryRepository } from "../repositories/memory.repository";

@Injectable()
export class MemoryService {
  private readonly log = new Logger(MemoryService.name);
  private readonly runDeferred = scheduleMemoryPostTurnJob((p) => this.processDeferredPostTurn(p));

  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly ai: AiClientService
  ) {}

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

  async learnFromTurn(input: {
    userId: string;
    personaId: string;
    conversationId: string;
    userText: string;
    assistantText: string;
    history: Array<{ role: string; content: string }>;
    recentExchange: string;
  }) {
    const existing = await this.listStructured(input.userId, input.personaId, 48);
    const existingByKey = new Map(existing.map((item) => [item.memoryKey ?? "", item.content]));

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

    if (process.env.MEMORY_DEFERRED_EXTRACTION !== "false") {
      this.runDeferred({
        userId: input.userId,
        personaId: input.personaId,
        conversationId: input.conversationId,
        userText: input.userText,
        assistantText: input.assistantText,
        recentExchange: input.recentExchange,
      });
    }
  }

  /** Semantic RAG row + structured facts from the local/self-hosted model (not regex). */
  private async processDeferredPostTurn(payload: {
    userId: string;
    personaId: string;
    conversationId: string;
    userText: string;
    assistantText: string;
    recentExchange: string;
  }) {
    await this.storeSemanticTurnSnippet(payload);
    await this.extractStructuredFactsWithModel(payload);
  }

  private async storeSemanticTurnSnippet(payload: {
    userId: string;
    personaId: string;
    conversationId: string;
    userText: string;
    assistantText: string;
  }) {
    const u = payload.userText.trim().replace(/\s+/g, " ").slice(0, 600);
    const a = payload.assistantText.trim().replace(/\s+/g, " ").slice(0, 600);
    const line = `User: ${u}\nAssistant: ${a}`;
    try {
      const embedding = await this.ai.embed(line);
      await this.insertVectorRow(
        payload.userId,
        payload.personaId,
        payload.conversationId,
        MemorySource.chat_summary,
        line,
        embedding,
        { kind: "turn_snippet" }
      );
    } catch (e) {
      this.log.warn(`Semantic memory insert skipped: ${String(e)}`);
    }
  }

  private async extractStructuredFactsWithModel(payload: {
    userId: string;
    personaId: string;
    conversationId: string;
    userText: string;
    recentExchange: string;
  }) {
    const system = `You extract durable user-specific preferences for a personal AI assistant memory store.
Return ONLY a JSON array (no markdown fences) of up to 5 objects with this exact shape:
[{"memoryKey":"snake.case.id","memoryType":"preference|goal|restriction|fact","content":"short plain text","confidence":0.5}]
Rules:
- Only include stable facts the user states about themselves (goals, allergies, budget, schedule, likes/dislikes).
- Omit chit-chat, hypotheticals, and third-party-only facts.
- memoryKey must be unique-ish (e.g. preference.coffee, goal.fat_loss).
- If nothing is worth storing, return []`;

    const userBlock = `Recent conversation (most recent last, truncated):\n${payload.recentExchange.slice(0, 3500)}\n\nLatest user message:\n${payload.userText.slice(0, 2000)}`;

    let raw: string;
    try {
      raw = await this.ai.complete({
        system,
        model: process.env.MEMORY_EXTRACTION_MODEL,
        temperature: 0.15,
        messages: [{ role: "user", content: userBlock }],
      });
    } catch (e) {
      this.log.warn(`Model memory extraction failed: ${String(e)}`);
      return;
    }

    const items = this.parseMemoryExtractionJson(raw);
    for (const item of items) {
      if (!item.memoryKey || !item.content) continue;
      const confidence = typeof item.confidence === "number" ? item.confidence : 0.7;
      try {
        await this.upsertStructured({
          userId: payload.userId,
          personaId: payload.personaId,
          conversationId: payload.conversationId,
          memoryKey: String(item.memoryKey).slice(0, 120),
          memoryType: String(item.memoryType || "fact").slice(0, 80),
          content: String(item.content).slice(0, 2000),
          confidenceScore: Math.min(1, Math.max(0, confidence)),
          source: MemorySource.user_fact,
          metadata: { from: "model_extract", model: true },
        });
      } catch (e) {
        this.log.warn(`Memory upsert failed for key ${item.memoryKey}: ${String(e)}`);
      }
    }
  }

  private parseMemoryExtractionJson(raw: string): Array<{
    memoryKey?: string;
    memoryType?: string;
    content?: string;
    confidence?: number;
  }> {
    let t = raw.trim();
    if (t.startsWith("```")) {
      t = t.replace(/^```[a-zA-Z]*\s*/m, "").replace(/```\s*$/m, "").trim();
    }

    const candidates = [t];
    const extracted = this.extractLikelyJsonBlock(t);
    if (extracted && extracted !== t) candidates.push(extracted);

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        const rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
        if (rows.length === 0) continue;
        return rows.filter((x) => x && typeof x === "object") as Array<{
          memoryKey?: string;
          memoryType?: string;
          content?: string;
          confidence?: number;
        }>;
      } catch {
        // keep trying fallback candidate
      }
    }

    // Non-JSON model output is expected occasionally (worker fallback / small local models).
    this.log.debug("Memory extraction returned non-JSON output; skipping model facts for this turn");
    return [];
  }

  private extractLikelyJsonBlock(text: string): string | null {
    const firstArray = text.indexOf("[");
    const lastArray = text.lastIndexOf("]");
    if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
      return text.slice(firstArray, lastArray + 1).trim();
    }

    const firstObj = text.indexOf("{");
    const lastObj = text.lastIndexOf("}");
    if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
      return text.slice(firstObj, lastObj + 1).trim();
    }

    return null;
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
