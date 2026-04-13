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
      this.log.warn(`AI embed unavailable, using deterministic fallback (${String(e)})`);
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
      return res.data.text;
    } catch (e) {
      this.log.warn(`AI service unavailable, using mock fallback (${String(e)})`);
      return `[mock-ai] Echo: ${input.messages.at(-1)?.content ?? ""}`;
    }
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
