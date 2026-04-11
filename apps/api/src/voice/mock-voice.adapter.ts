import { Injectable } from "@nestjs/common";
import type { VoiceSynthesisPort, VoiceSynthesisRequest } from "./voice.port";

@Injectable()
export class MockVoiceAdapter implements VoiceSynthesisPort {
  async synthesize(req: VoiceSynthesisRequest) {
    return {
      mime: "text/plain",
      url: `mock://tts?len=${encodeURIComponent(req.text).length}`,
    };
  }
}
