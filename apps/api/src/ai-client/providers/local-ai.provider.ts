import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import type { CompleteChatInput } from "../ai-client.service";
import type { AiProvider } from "./ai-provider.interface";

@Injectable()
export class LocalAiProvider implements AiProvider {
  readonly name = "local";
  private readonly log = new Logger(LocalAiProvider.name);

  private baseUrl() {
    return process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8001";
  }

  private headers() {
    return { "X-Internal-Key": process.env.AI_INTERNAL_KEY ?? "dev-internal" };
  }

  async embed(text: string): Promise<number[]> {
    try {
      const res = await axios.post<{ embedding: number[] }>(
        `${this.baseUrl()}/memory/store`,
        { text },
        { headers: this.headers(), timeout: 30_000 }
      );
      return res.data.embedding;
    } catch (e) {
      this.log.warn(`Local AI embed unavailable (${String(e)})`);
      return this.fallbackEmbedding(text);
    }
  }

  async complete(input: CompleteChatInput): Promise<string> {
    try {
      const res = await axios.post<{ text: string }>(`${this.baseUrl()}/chat/respond`, input, {
        headers: this.headers(),
        timeout: 60_000,
      });
      const text = (res.data.text ?? "").trim();
      if (!text) return this.localFallbackReply(input.system, input.messages.at(-1)?.content ?? "");
      return text;
    } catch (e) {
      this.log.warn(`Local AI completion unavailable (${String(e)})`);
      return this.localFallbackReply(input.system, input.messages.at(-1)?.content ?? "");
    }
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
    const compact = userText.trim().replace(/\s+/g, " ").slice(0, 240) || "your request";
    const lowerScope = scope.toLowerCase();

    if (lowerScope.includes("food") || lowerScope.includes("meal")) {
      return `Food baseline: focus on balanced meals with protein + fiber + controlled carbs. Based on "${compact}", share your goal and I will give a practical 7-day meal framework.`;
    }
    if (lowerScope.includes("fashion") || lowerScope.includes("style")) {
      return `Style baseline: prioritize fit, a neutral capsule wardrobe, and context-based outfits. Based on "${compact}", share your budget and occasion for targeted outfit ideas.`;
    }
    if (lowerScope.includes("gym") || lowerScope.includes("fitness")) {
      return `Fitness baseline: 3-4 consistent sessions weekly, progressive overload, adequate sleep/protein, and weekly tracking. Based on "${compact}", share your training days and goal for a custom split.`;
    }
    if (lowerScope.includes("business")) {
      return `Business baseline: sharpen one offer for one audience, track lead/conversion/retention, and prioritize repeatable execution. Based on "${compact}", share your bottleneck for a focused plan.`;
    }
    return `I can help within ${scope}. Based on "${compact}", share your goal and constraints for a targeted answer.`;
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

