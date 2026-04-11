import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AccountSubscriptionStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class UserPlanSubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list() {
    return this.prisma.userPlanSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        plan: true,
      },
    });
  }

  getById(id: string) {
    return this.prisma.userPlanSubscription.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });
  }

  async create(
    input: {
      userId: string;
      planId: string;
      status: AccountSubscriptionStatus;
      startDate?: Date | null;
      endDate?: Date | null;
      renewalDate?: Date | null;
      trialStartDate?: Date | null;
      trialEndDate?: Date | null;
      metadata?: Prisma.InputJsonValue;
    },
    actorId: string
  ) {
    const row = await this.prisma.userPlanSubscription.create({
      data: {
        userId: input.userId,
        planId: input.planId,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        renewalDate: input.renewalDate,
        trialStartDate: input.trialStartDate,
        trialEndDate: input.trialEndDate,
        metadata: input.metadata ?? undefined,
      },
    });
    void this.audit.log({
      actorId,
      action: "user_subscription.create",
      entityType: "UserPlanSubscription",
      entityId: row.id,
      module: "subscriptions",
      newValues: { userId: row.userId, planId: row.planId, status: row.status },
    });
    return row;
  }

  async update(
    id: string,
    input: {
      planId?: string;
      status?: AccountSubscriptionStatus;
      startDate?: Date | null;
      endDate?: Date | null;
      renewalDate?: Date | null;
      cancelAtPeriodEnd?: boolean;
      trialStartDate?: Date | null;
      trialEndDate?: Date | null;
      metadata?: Prisma.InputJsonValue;
    },
    actorId: string
  ) {
    const existing = await this.prisma.userPlanSubscription.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.userPlanSubscription.update({
      where: { id },
      data: {
        planId: input.planId,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        renewalDate: input.renewalDate,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        trialStartDate: input.trialStartDate,
        trialEndDate: input.trialEndDate,
        metadata: input.metadata ?? undefined,
      },
    });
    void this.audit.log({
      actorId,
      action: "user_subscription.update",
      entityType: "UserPlanSubscription",
      entityId: id,
      module: "subscriptions",
      oldValues: { status: existing.status },
      newValues: { status: row.status },
    });
    return row;
  }

  async patchStatus(
    id: string,
    status: AccountSubscriptionStatus,
    actorId: string
  ) {
    const existing = await this.prisma.userPlanSubscription.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.userPlanSubscription.update({
      where: { id },
      data: { status },
    });
    void this.audit.log({
      actorId,
      action: "user_subscription.status",
      entityType: "UserPlanSubscription",
      entityId: id,
      module: "subscriptions",
      oldValues: { status: existing.status },
      newValues: { status: row.status },
    });
    return row;
  }
}
