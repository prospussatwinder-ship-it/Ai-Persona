import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { extname } from "path";

type MediaKind = "image" | "video";

export type GeneratedMedia = {
  kind: MediaKind;
  status: "ok" | "stub" | "failed";
  prompt: string;
  url?: string;
  message?: string;
};

export type UploadedMedia = {
  kind: MediaKind;
  status: "ok" | "failed";
  url?: string;
  mimeType?: string;
  fileName?: string;
  source?: "upload";
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

  private absolutize(url?: string) {
    if (!url) return url;
    if (/^https?:\/\//i.test(url) || /^data:/i.test(url)) return url;
    if (url.startsWith("/")) return `${this.baseUrl()}${url}`;
    return `${this.baseUrl()}/${url}`;
  }

  private asksForImage(text: string) {
    const lower = text.toLowerCase();
    const explicitlyAnalysisIntent =
      /\b(what is this image|which image|identify|analy[sz]e|describe|what do you see|check this image|explain this image)\b/i.test(
        lower
      );
    if (explicitlyAnalysisIntent) return false;
    const explicitGeneratePattern =
      /\b(generate|create|draw|design|produce|render|make)\b[\w\s]{0,40}\b(image|images|photo|photos|picture|pictures|illustration|graphic|poster)\b/i;
    const explicitRequestPattern =
      /\b(show|send|give|share|need|want)\b[\w\s]{0,40}\b(image|images|photo|photos|picture|pictures)\b/i;
    return explicitGeneratePattern.test(lower) || explicitRequestPattern.test(lower);
  }

  private asksForVideo(text: string) {
    const lower = text.toLowerCase();
    const explicitlyAnalysisIntent = /\b(analy[sz]e|describe|what is in this video|check this video)\b/i.test(lower);
    if (explicitlyAnalysisIntent) return false;
    const explicitGeneratePattern =
      /\b(generate|create|make|produce|render|build)\b[\w\s]{0,40}\b(video|videos|reel|reels|clip|clips|short|shorts)\b/i;
    const explicitRequestPattern =
      /\b(show|send|give|share|need|want)\b[\w\s]{0,40}\b(video|videos|reel|reels|clip|clips|short|shorts)\b/i;
    return explicitGeneratePattern.test(lower) || explicitRequestPattern.test(lower);
  }

  private inferKind(mimeType: string, fileName?: string): MediaKind {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    const ext = extname(fileName ?? "").toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(ext)) return "image";
    return "video";
  }

  async uploadMedia(input: {
    buffer: Buffer;
    mimeType: string;
    fileName?: string;
    personaSlug?: string;
  }): Promise<UploadedMedia> {
    try {
      const res = await axios.post<{
        status?: string;
        kind?: MediaKind;
        url?: string;
        mime_type?: string;
        file_name?: string;
        message?: string;
      }>(
        `${this.baseUrl()}/v1/upload`,
        {
          data_base64: input.buffer.toString("base64"),
          mime_type: input.mimeType,
          file_name: input.fileName,
          persona_slug: input.personaSlug,
        },
        { timeout: this.timeoutMs() }
      );
      return {
        kind: res.data.kind ?? this.inferKind(input.mimeType, input.fileName),
        status: res.data.url ? "ok" : "failed",
        url: this.absolutize(res.data.url),
        mimeType: res.data.mime_type ?? input.mimeType,
        fileName: res.data.file_name ?? input.fileName,
        source: "upload",
        message: res.data.message,
      };
    } catch (e) {
      this.log.warn(`Media upload unavailable (${String(e)})`);
      return {
        kind: this.inferKind(input.mimeType, input.fileName),
        status: "failed",
        mimeType: input.mimeType,
        fileName: input.fileName,
        source: "upload",
        message: "Media upload is temporarily unavailable.",
      };
    }
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
        url: this.absolutize(res.data.image_url),
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
        url: this.absolutize(res.data.video_url),
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

