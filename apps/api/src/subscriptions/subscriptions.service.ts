import { Injectable } from "@nestjs/common";
import { AccountSubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly prisma: PrismaService
  ) {}

  listCatalogPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        currency: true,
        billingCycle: true,
        trialDays: true,
        aiRequestLimit: true,
        maxUsers: true,
        maxProjects: true,
        maxFiles: true,
        featureConfig: true,
        status: true,
      },
    });
  }

  listForUser(userId: string) {
    return this.subscriptions.findManyByUserId(userId);
  }

  async getOverviewForUser(userId: string) {
    const subscriptions = await this.subscriptions.findManyByUserId(userId);
    const active = await this.prisma.userPlanSubscription.findFirst({
      where: {
        userId,
        status: {
          in: [AccountSubscriptionStatus.active, AccountSubscriptionStatus.trial],
        },
      },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rolling30 = new Date(now);
    rolling30.setDate(rolling30.getDate() - 30);

    const [usedDaily, usedMonthly, usedRolling30] = await Promise.all([
      this.prisma.aiUsageLog.count({
        where: { userId, featureName: "chat.complete", status: "ok", createdAt: { gte: dayStart } },
      }),
      this.prisma.aiUsageLog.count({
        where: { userId, featureName: "chat.complete", status: "ok", createdAt: { gte: monthStart } },
      }),
      this.prisma.aiUsageLog.count({
        where: { userId, featureName: "chat.complete", status: "ok", createdAt: { gte: rolling30 } },
      }),
    ]);

    const features = (active?.plan.featureConfig ?? {}) as {
      dailyLimit?: unknown;
      monthlyLimit?: unknown;
    };
    const dailyLimit = Number(features.dailyLimit ?? 0) || null;
    const monthlyLimit = Number(features.monthlyLimit ?? active?.plan.aiRequestLimit ?? 0) || null;

    return {
      subscriptions,
      active,
      usage: {
        usedDaily,
        usedMonthly,
        usedRolling30,
        dailyLimit,
        monthlyLimit,
        remainingDaily: dailyLimit ? Math.max(dailyLimit - usedDaily, 0) : null,
        remainingMonthly: monthlyLimit ? Math.max(monthlyLimit - usedMonthly, 0) : null,
      },
    };
  }
}
