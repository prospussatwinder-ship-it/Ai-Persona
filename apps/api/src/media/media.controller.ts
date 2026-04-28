import {
  BadRequestException,
  Controller,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { MediaService } from "./media.service";

type Authed = Request & { user: { sub: string } };

@Controller("media")
@UseGuards(AuthGuard("jwt"))
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("upload/:personaSlug")
  @UseInterceptors(FileInterceptor("file"))
  async uploadForPersona(
    @Req() _req: Authed,
    @Param("personaSlug") personaSlug: string,
    @UploadedFile() file?: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    }
  ) {
    return this.handleUpload(file, personaSlug);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @Req() _req: Authed,
    @UploadedFile()
    file?: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    }
  ) {
    return this.handleUpload(file);
  }

  private async handleUpload(
    file?: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    personaSlug?: string
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }
    const mime = (file.mimetype || "").toLowerCase();
    if (!mime.startsWith("image/") && !mime.startsWith("video/")) {
      throw new BadRequestException("only image/video files are supported");
    }
    const maxBytes = Number(process.env.MEDIA_UPLOAD_MAX_BYTES ?? 25 * 1024 * 1024);
    if (file.size > maxBytes) {
      throw new BadRequestException(`file too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)`);
    }
    return this.media.uploadMedia({
      buffer: file.buffer,
      mimeType: mime,
      fileName: file.originalname,
      personaSlug,
    });
  }
}

