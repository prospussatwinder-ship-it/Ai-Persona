import { Injectable } from "@nestjs/common";
import { MockVoiceAdapter } from "./mock-voice.adapter";
import { OpenAiVoiceAdapter } from "./openai-voice.adapter";
import type { VoiceSynthesisPort } from "./voice.port";

@Injectable()
export class VoiceService {
  private readonly mockBackend: VoiceSynthesisPort;
  private readonly openAiBackend: VoiceSynthesisPort;

  constructor(mockAdapter: MockVoiceAdapter, openAiAdapter: OpenAiVoiceAdapter) {
    this.mockBackend = mockAdapter;
    this.openAiBackend = openAiAdapter;
  }

  async prepare(text: string, voiceConfig: unknown) {
    const provider = (process.env.VOICE_PROVIDER ?? "mock").toLowerCase().trim();
    if (provider === "openai") {
      try {
        return await this.openAiBackend.synthesize({ text, voiceConfig });
      } catch {
        return this.mockBackend.synthesize({ text, voiceConfig });
      }
    }
    return this.mockBackend.synthesize({ text, voiceConfig });
  }
}
