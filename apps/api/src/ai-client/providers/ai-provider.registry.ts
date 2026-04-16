import { Injectable } from "@nestjs/common";
import { LocalAiProvider } from "./local-ai.provider";

@Injectable()
export class AiProviderRegistry {
  constructor(private readonly localProvider: LocalAiProvider) {}

  getDefaultProvider() {
    return this.localProvider;
  }
}

