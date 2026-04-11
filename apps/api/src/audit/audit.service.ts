import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: unknown;
    ip?: string;
    module?: string;
    description?: string;
    oldValues?: unknown;
    newValues?: unknown;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata === undefined ? undefined : (input.metadata as object),
        ip: input.ip,
        module: input.module,
        description: input.description,
        oldValues:
          input.oldValues === undefined ? undefined : (input.oldValues as object),
        newValues:
          input.newValues === undefined ? undefined : (input.newValues as object),
        userAgent: input.userAgent,
      },
    });
  }

  listRecent(limit: number, offset: number) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 200),
      skip: Math.max(offset, 0),
      include: {
        actor: { select: { id: true, email: true } },
      },
    });
  }

  async listFiltered(q: {
    limit?: number;
    offset?: number;
    module?: string;
    action?: string;
    actorId?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const limit = Math.min(Math.max(q.limit ?? 50, 1), 200);
    const offset = Math.max(q.offset ?? 0, 0);

    const where: Prisma.AuditLogWhereInput = {};
    if (q.module?.trim()) {
      where.module = { contains: q.module.trim(), mode: "insensitive" };
    }
    if (q.action?.trim()) {
      where.action = { contains: q.action.trim(), mode: "insensitive" };
    }
    if (q.actorId?.trim()) where.actorId = q.actorId.trim();
    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [
        { action: { contains: s, mode: "insensitive" } },
        { entityType: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          actor: { select: { id: true, email: true } },
        },
      }),
    ]);

    return { total, limit, offset, items };
  }

  getById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: { select: { id: true, email: true } },
      },
    });
  }
}
