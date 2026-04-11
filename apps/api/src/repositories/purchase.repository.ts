import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PurchaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUserId(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
