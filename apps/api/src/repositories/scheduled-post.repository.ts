import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ScheduledPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(personaId?: string) {
    return this.prisma.scheduledPost.findMany({
      where: personaId ? { personaId } : undefined,
      orderBy: { scheduledFor: "asc" },
    });
  }

  create(data: {
    personaId: string;
    body: string;
    mediaUrl?: string | null;
    scheduledFor: Date;
  }) {
    return this.prisma.scheduledPost.create({ data });
  }

  findById(id: string) {
    return this.prisma.scheduledPost.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.ScheduledPostUpdateInput) {
    return this.prisma.scheduledPost.update({ where: { id }, data });
  }
}
