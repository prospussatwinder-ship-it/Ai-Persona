import { Injectable } from "@nestjs/common";
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
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata === undefined ? undefined : (input.metadata as object),
        ip: input.ip,
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
}
