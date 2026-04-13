import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUserId(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  hasActive(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing"] } },
      select: { id: true },
    });
  }
}
