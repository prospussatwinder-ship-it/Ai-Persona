import { Injectable, NotFoundException } from "@nestjs/common";
import { ScheduledPostStatus } from "@prisma/client";
import { ScheduledPostRepository } from "../repositories/scheduled-post.repository";
import type { CreateScheduledPostDto } from "./dto/create-scheduled-post.dto";

@Injectable()
export class ScheduledPostsService {
  constructor(private readonly scheduledPosts: ScheduledPostRepository) {}

  list(personaId?: string) {
    return this.scheduledPosts.findMany(personaId);
  }

  create(dto: CreateScheduledPostDto) {
    return this.scheduledPosts.create({
      personaId: dto.personaId,
      body: dto.body,
      mediaUrl: dto.mediaUrl,
      scheduledFor: new Date(dto.scheduledFor),
    });
  }

  async markPublished(id: string) {
    const row = await this.scheduledPosts.findById(id);
    if (!row) throw new NotFoundException();
    return this.scheduledPosts.update(id, {
      status: ScheduledPostStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }
}
