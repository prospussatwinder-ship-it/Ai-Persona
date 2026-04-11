import { Injectable } from "@nestjs/common";
import { PurchaseRepository } from "../repositories/purchase.repository";

@Injectable()
export class PurchasesService {
  constructor(private readonly purchases: PurchaseRepository) {}

  listForUser(userId: string) {
    return this.purchases.findManyByUserId(userId);
  }
}
