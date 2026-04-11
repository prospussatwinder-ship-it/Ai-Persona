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
    const res = await axios.post<{ embedding: number[] }>(
      `${base}/memory/store`,
      { text },
      { headers: this.headers(), timeout: 30_000 }
    );
    return res.data.embedding;
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
}
