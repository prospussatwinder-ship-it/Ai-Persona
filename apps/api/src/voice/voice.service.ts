import { Injectable } from "@nestjs/common";
import { MockVoiceAdapter } from "./mock-voice.adapter";
import type { VoiceSynthesisPort } from "./voice.port";

@Injectable()
export class VoiceService {
  private readonly backend: VoiceSynthesisPort;

  constructor(adapter: MockVoiceAdapter) {
    this.backend = adapter;
  }

  prepare(text: string, voiceConfig: unknown) {
    return this.backend.synthesize({ text, voiceConfig });
  }
}
