import { Injectable } from "@nestjs/common";
import axios from "axios";
import type { VoiceSynthesisPort, VoiceSynthesisRequest } from "./voice.port";

@Injectable()
export class OpenAiVoiceAdapter implements VoiceSynthesisPort {
  private baseUrl() {
    return (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  }

  private apiKey() {
    return (process.env.OPENAI_API_KEY ?? "").trim();
  }

  private model() {
    return (process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts").trim();
  }

  private voice() {
    return (process.env.OPENAI_TTS_VOICE ?? "alloy").trim();
  }

  async synthesize(req: VoiceSynthesisRequest) {
    const key = this.apiKey();
    if (!key) {
      throw new Error("OPENAI_API_KEY is not configured for voice synthesis");
    }
    const body = {
      model: this.model(),
      voice: this.voice(),
      input: req.text.slice(0, 4000),
      format: "mp3",
    };
    const res = await axios.post<ArrayBuffer>(`${this.baseUrl()}/audio/speech`, body, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
      timeout: 120_000,
    });
    const base64 = Buffer.from(res.data).toString("base64");
    return {
      mime: "audio/mpeg",
      base64,
      url: `data:audio/mpeg;base64,${base64}`,
    };
  }
}

