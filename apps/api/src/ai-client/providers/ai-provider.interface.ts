import type { CompleteChatInput } from "../ai-client.service";

export interface AiProvider {
  readonly name: string;
  embed(text: string): Promise<number[]>;
  complete(input: CompleteChatInput): Promise<string>;
}

