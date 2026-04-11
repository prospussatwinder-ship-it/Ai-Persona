import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BillingCycle, PlanStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

export type PlanUpsertInput = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency?: string;
  billingCycle: BillingCycle;
  trialDays: number;
  aiRequestLimit: number;
  maxUsers?: number | null;
  maxProjects?: number | null;
  maxFiles?: number | null;
  featureConfig?: Prisma.InputJsonValue;
  status?: PlanStatus;
  sortOrder?: number;
};

@Injectable()
export class SubscriptionPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  getById(id: string) {
    return this.prisma.subscriptionPlan.findUnique({ where: { id } });
  }

  async create(input: PlanUpsertInput, actorId: string) {
    const exists = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: input.slug },
    });
    if (exists) throw new ConflictException("Slug already used");
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: input.price,
        currency: input.currency ?? "usd",
        billingCycle: input.billingCycle,
        trialDays: input.trialDays,
        aiRequestLimit: input.aiRequestLimit,
        maxUsers: input.maxUsers,
        maxProjects: input.maxProjects,
        maxFiles: input.maxFiles,
        featureConfig: input.featureConfig ?? undefined,
        status: input.status ?? PlanStatus.ACTIVE,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    void this.audit.log({
      actorId,
      action: "subscription_plan.create",
      entityType: "SubscriptionPlan",
      entityId: plan.id,
      module: "subscriptions",
      newValues: { slug: plan.slug, name: plan.name },
    });
    return plan;
  }

  async update(id: string, input: Partial<PlanUpsertInput>, actorId: string) {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.prisma.subscriptionPlan.findUnique({
        where: { slug: input.slug },
      });
      if (clash) throw new ConflictException("Slug already used");
    }
    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: input.price,
        currency: input.currency,
        billingCycle: input.billingCycle,
        trialDays: input.trialDays,
        aiRequestLimit: input.aiRequestLimit,
        maxUsers: input.maxUsers,
        maxProjects: input.maxProjects,
        maxFiles: input.maxFiles,
        featureConfig: input.featureConfig ?? undefined,
        status: input.status,
        sortOrder: input.sortOrder,
      },
    });
    void this.audit.log({
      actorId,
      action: "subscription_plan.update",
      entityType: "SubscriptionPlan",
      entityId: id,
      module: "subscriptions",
      oldValues: { slug: existing.slug },
      newValues: { slug: plan.slug },
    });
    return plan;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { userSubscriptions: true } } },
    });
    if (!existing) throw new NotFoundException();
    if (existing._count.userSubscriptions > 0) {
      throw new ConflictException(
        "Cannot delete a plan that has user subscriptions. Deactivate it instead."
      );
    }
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    void this.audit.log({
      actorId,
      action: "subscription_plan.delete",
      entityType: "SubscriptionPlan",
      entityId: id,
      module: "subscriptions",
      oldValues: { slug: existing.slug, name: existing.name },
    });
    return { ok: true };
  }
}
