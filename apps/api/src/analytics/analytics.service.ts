import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  track(input: { userId?: string; personaId?: string; type: string; payload?: unknown }) {
    return this.prisma.analyticsEvent.create({
      data: {
        userId: input.userId,
        personaId: input.personaId,
        type: input.type,
        payload: input.payload === undefined ? undefined : (input.payload as object),
      },
    });
  }

  listRecent(limit: number, offset: number) {
    return this.prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 200),
      skip: Math.max(offset, 0),
    });
  }
}
