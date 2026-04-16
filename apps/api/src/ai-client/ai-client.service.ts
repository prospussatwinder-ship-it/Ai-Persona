import { Injectable } from "@nestjs/common";
import { AiProviderRegistry } from "./providers/ai-provider.registry";

export type CompleteChatInput = {
  system: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  model?: string;
  temperature?: number;
};

@Injectable()
export class AiClientService {
  constructor(private readonly providers: AiProviderRegistry) {}

  async embed(text: string): Promise<number[]> {
    return this.providers.getDefaultProvider().embed(text);
  }

  async complete(input: CompleteChatInput): Promise<string> {
    return this.providers.getDefaultProvider().complete(input);
  }
}
