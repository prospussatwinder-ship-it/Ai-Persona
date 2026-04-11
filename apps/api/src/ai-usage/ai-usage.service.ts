import { ForbiddenException, Injectable } from "@nestjs/common";
import {
  AccountSubscriptionStatus,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PermissionService } from "../rbac/permission.service";

const CHAT_FEATURE = "chat.complete";

@Injectable()
export class AiUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: PermissionService
  ) {}

  /** Enforce plan limits before calling Python AI. */
  async assertCanUseAi(userId: string, role: UserRole): Promise<{
    subscriptionId: string | null;
    aiLimit: number;
  }> {
    if (this.rbac.bypassesAiQuota(role)) {
      return { subscriptionId: null, aiLimit: Number.MAX_SAFE_INTEGER };
    }

    const sub = await this.prisma.userPlanSubscription.findFirst({
      where: {
        userId,
        status: {
          in: [
            AccountSubscriptionStatus.active,
            AccountSubscriptionStatus.trial,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    if (!sub) {
      throw new ForbiddenException(
        "No active subscription — upgrade your plan to use AI chat."
      );
    }

    const limit = sub.plan.aiRequestLimit;
    if (limit <= 0) {
      throw new ForbiddenException("AI usage is disabled for your current plan.");
    }

    const start = new Date();
    start.setDate(start.getDate() - 30);
    const used = await this.prisma.aiUsageLog.count({
      where: {
        userId,
        featureName: CHAT_FEATURE,
        createdAt: { gte: start },
        status: "ok",
      },
    });

    if (used >= limit) {
      throw new ForbiddenException(
        "AI request limit reached for your billing period. Upgrade or wait for renewal."
      );
    }

    return { subscriptionId: sub.id, aiLimit: limit };
  }

  async recordSuccess(input: {
    userId: string;
    subscriptionId: string | null;
    featureName: string;
    requestType: string;
    creditsUsed?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  }) {
    try {
      await this.prisma.aiUsageLog.create({
        data: {
          userId: input.userId,
          subscriptionId: input.subscriptionId ?? undefined,
          featureName: input.featureName,
          requestType: input.requestType,
          creditsUsed: input.creditsUsed ?? 1,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
          totalTokens: input.totalTokens,
          status: "ok",
        },
      });
    } catch {
      // Non-blocking: usage logging must not break chat
    }
  }
}
