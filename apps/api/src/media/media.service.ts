import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

type MediaKind = "image" | "video";

export type GeneratedMedia = {
  kind: MediaKind;
  status: "ok" | "stub" | "failed";
  prompt: string;
  url?: string;
  message?: string;
};

@Injectable()
export class MediaService {
  private readonly log = new Logger(MediaService.name);

  private baseUrl() {
    return process.env.MEDIA_SERVICE_URL ?? "http://127.0.0.1:8003";
  }

  private timeoutMs() {
    const n = Number(process.env.MEDIA_SERVICE_TIMEOUT_MS ?? 120_000);
    return Number.isFinite(n) && n > 0 ? n : 120_000;
  }

  private asksForImage(text: string) {
    return /\b(image|images|photo|photos|picture|pictures|illustration|illustrations|graphic|graphics|poster|posters)\b/i.test(
      text
    );
  }

  private asksForVideo(text: string) {
    return /\b(video|videos|reel|reels|clip|clips|shorts?)\b/i.test(text);
  }

  async tryGenerateFromPrompt(input: { text: string; personaSlug: string }) {
    const text = input.text.trim();
    if (!text) return [] as GeneratedMedia[];

    const wantsImage = this.asksForImage(text);
    const wantsVideo = this.asksForVideo(text);
    if (!wantsImage && !wantsVideo) return [] as GeneratedMedia[];

    const out: GeneratedMedia[] = [];
    if (wantsImage) {
      out.push(await this.generateImage(text, input.personaSlug));
    }
    if (wantsVideo) {
      out.push(await this.generateVideo(text));
    }
    return out;
  }

  private async generateImage(prompt: string, personaSlug: string): Promise<GeneratedMedia> {
    try {
      const res = await axios.post<{
        status?: string;
        prompt?: string;
        image_url?: string;
        message?: string;
      }>(
        `${this.baseUrl()}/v1/image`,
        { prompt, persona_slug: personaSlug },
        { timeout: this.timeoutMs() }
      );
      return {
        kind: "image",
        status: res.data.image_url ? "ok" : "stub",
        prompt: res.data.prompt ?? prompt,
        url: res.data.image_url,
        message: res.data.message,
      };
    } catch (e) {
      this.log.warn(`Image generation unavailable (${String(e)})`);
      return {
        kind: "image",
        status: "failed",
        prompt,
        message: "Image generation is temporarily unavailable.",
      };
    }
  }

  private async generateVideo(prompt: string): Promise<GeneratedMedia> {
    try {
      const res = await axios.post<{
        status?: string;
        prompt?: string;
        video_url?: string;
        message?: string;
      }>(
        `${this.baseUrl()}/v1/video`,
        { prompt, duration_sec: 6 },
        { timeout: this.timeoutMs() }
      );
      return {
        kind: "video",
        status: res.data.video_url ? "ok" : "stub",
        prompt: res.data.prompt ?? prompt,
        url: res.data.video_url,
        message: res.data.message,
      };
    } catch (e) {
      this.log.warn(`Video generation unavailable (${String(e)})`);
      return {
        kind: "video",
        status: "failed",
        prompt,
        message: "Video generation is temporarily unavailable.",
      };
    }
  }
}

