export type VoiceSynthesisRequest = {
  text: string;
  voiceConfig: unknown;
};

/**
 * Phase 1: mock adapter. Swap for ElevenLabs, OpenAI TTS, or Realtime audio later.
 */
export interface VoiceSynthesisPort {
  synthesize(req: VoiceSynthesisRequest): Promise<{ mime: string; base64?: string; url?: string }>;
}
