import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

export type CompleteChatInput = {
  system: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  model?: string;
  temperature?: number;
};

@Injectable()
export class AiClientService {
  private readonly log = new Logger(AiClientService.name);
  private readonly openAiKey = (process.env.OPENAI_API_KEY ?? "").trim();

  private baseUrl() {
    return process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8001";
  }

  private headers() {
    return { "X-Internal-Key": process.env.AI_INTERNAL_KEY ?? "dev-internal" };
  }

  async embed(text: string): Promise<number[]> {
    const base = this.baseUrl();
    try {
      const res = await axios.post<{ embedding: number[] }>(
        `${base}/memory/store`,
        { text },
        { headers: this.headers(), timeout: 30_000 }
      );
      return res.data.embedding;
    } catch (e) {
      this.log.warn(`AI embed service unavailable (${String(e)})`);
      if (this.openAiKey) {
        try {
          const emb = await this.openAiEmbed(text);
          return emb;
        } catch (openAiErr) {
          this.log.warn(`OpenAI embed fallback failed (${String(openAiErr)})`);
        }
      }
      this.log.warn("Using deterministic local embedding fallback");
      return this.fallbackEmbedding(text);
    }
  }

  async complete(input: CompleteChatInput): Promise<string> {
    const base = this.baseUrl();
    try {
      const res = await axios.post<{ text: string }>(
        `${base}/chat/respond`,
        input,
        { headers: this.headers(), timeout: 60_000 }
      );
      const text = (res.data.text ?? "").trim();
      if (text.startsWith("[ai-fallback]") || text.startsWith("[mock-ai]")) {
        return this.localFallbackReply(input.system, input.messages.at(-1)?.content ?? "");
      }
      return text;
    } catch (e) {
      this.log.warn(`AI completion service unavailable (${String(e)})`);
      if (this.openAiKey) {
        try {
          return await this.openAiComplete(input);
        } catch (openAiErr) {
          this.log.warn(`OpenAI completion fallback failed (${String(openAiErr)})`);
        }
      }
      return this.localFallbackReply(input.system, input.messages.at(-1)?.content ?? "");
    }
  }

  private async openAiEmbed(text: string): Promise<number[]> {
    const model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
    const res = await axios.post<{
      data: Array<{ embedding: number[] }>;
    }>(
      "https://api.openai.com/v1/embeddings",
      { model, input: text },
      {
        headers: {
          Authorization: `Bearer ${this.openAiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60_000,
      }
    );
    const emb = res.data.data?.[0]?.embedding;
    if (!Array.isArray(emb) || emb.length === 0) {
      throw new Error("OpenAI embeddings response missing vector");
    }
    return emb;
  }

  private async openAiComplete(input: CompleteChatInput): Promise<string> {
    const model = input.model ?? process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
    const res = await axios.post<{
      choices?: Array<{ message?: { content?: string } }>;
    }>(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        temperature: input.temperature ?? 0.7,
        messages: [{ role: "system", content: input.system }, ...input.messages],
      },
      {
        headers: {
          Authorization: `Bearer ${this.openAiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 90_000,
      }
    );
    const text = res.data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI chat response missing content");
    return text;
  }

  private localFallbackReply(system: string, userText: string): string {
    let scope = "this persona";
    for (const rawLine of system.split("\n")) {
      const line = rawLine.trim().toLowerCase();
      if (line.startsWith("- name:")) {
        scope = rawLine.split(":", 2)[1]?.trim() || scope;
        break;
      }
    }
    const compact = userText.trim().replace(/\s+/g, " ").slice(0, 240);
    return [
      `I am running in local fallback mode for ${scope}.`,
      "",
      `I understood: "${compact || "your request"}".`,
      "Share one specific goal and 2-3 preferences, and I will generate a focused answer in this persona scope.",
    ].join("\n");
  }

  private fallbackEmbedding(text: string, dim = 1536): number[] {
    let seed = 2166136261;
    for (let i = 0; i < text.length; i++) {
      seed ^= text.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }
    const vec: number[] = [];
    let x = seed >>> 0;
    for (let i = 0; i < dim; i++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      const v = ((x >>> 0) / 0xffffffff) * 2 - 1;
      vec.push(v);
    }
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}
