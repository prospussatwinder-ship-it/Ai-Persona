import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AdminAiUsageQueryDto } from "./dto/admin-ai-usage-query.dto";

@Injectable()
export class AdminAiUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: AdminAiUsageQueryDto) {
    const limit = Math.min(q.limit ?? 25, 100);
    const offset = q.offset ?? 0;

    const where: Prisma.AiUsageLogWhereInput = {};
    if (q.userId) where.userId = q.userId;
    if (q.featureName?.trim()) {
      where.featureName = { contains: q.featureName.trim(), mode: "insensitive" };
    }
    if (q.requestType?.trim()) {
      where.requestType = { contains: q.requestType.trim(), mode: "insensitive" };
    }
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.aiUsageLog.count({ where }),
      this.prisma.aiUsageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          user: { select: { email: true } },
          subscription: {
            select: { id: true, plan: { select: { name: true, slug: true } } },
          },
        },
      }),
    ]);

    return { total, limit, offset, items: rows };
  }

  async summary() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [total30d, ok30d, err30d, byFeature] = await this.prisma.$transaction([
      this.prisma.aiUsageLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.aiUsageLog.count({
        where: { createdAt: { gte: since }, status: "ok" },
      }),
      this.prisma.aiUsageLog.count({
        where: { createdAt: { gte: since }, status: { not: "ok" } },
      }),
      this.prisma.aiUsageLog.groupBy({
        by: ["featureName"],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 12,
      }),
    ]);

    return {
      windowDays: 30,
      since: since.toISOString(),
      totalRequests: total30d,
      successful: ok30d,
      errors: err30d,
      byFeature: byFeature.map((x) => {
        const c = x._count as { id?: number };
        return { featureName: x.featureName, count: c.id ?? 0 };
      }),
    };
  }
}
