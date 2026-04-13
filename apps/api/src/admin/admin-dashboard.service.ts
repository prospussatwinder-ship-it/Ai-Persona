import { Injectable } from "@nestjs/common";
import {
  AccountSubscriptionStatus,
  UserAccountStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      rolesCount,
      planCount,
      activeSubs,
      expiredSubs,
      trialSubs,
      personaTotal,
      personaPublished,
      recentUsers,
      recentSubs,
      recentAudit,
      aiUsage30d,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { deletedAt: null, status: UserAccountStatus.active },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, status: UserAccountStatus.inactive },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, status: UserAccountStatus.suspended },
      }),
      this.prisma.role.count({ where: { status: "active" } }),
      this.prisma.subscriptionPlan.count(),
      this.prisma.userPlanSubscription.count({
        where: { status: AccountSubscriptionStatus.active },
      }),
      this.prisma.userPlanSubscription.count({
        where: { status: AccountSubscriptionStatus.expired },
      }),
      this.prisma.userPlanSubscription.count({
        where: { status: AccountSubscriptionStatus.trial },
      }),
      this.prisma.persona.count(),
      this.prisma.persona.count({ where: { isPublished: true, isActive: true } }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.userPlanSubscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { email: true } },
          plan: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { actor: { select: { email: true } } },
      }),
      this.prisma.aiUsageLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
      },
      roles: rolesCount,
      subscriptionPlans: planCount,
      subscriptions: {
        active: activeSubs,
        expired: expiredSubs,
        trial: trialSubs,
      },
      personas: {
        total: personaTotal,
        publishedActive: personaPublished,
      },
      recentUsers,
      recentSubscriptions: recentSubs,
      recentAuditLogs: recentAudit,
      aiUsageLast30Days: aiUsage30d,
    };
  }
}
