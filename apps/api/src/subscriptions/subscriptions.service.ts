import { Injectable } from "@nestjs/common";
import { SubscriptionRepository } from "../repositories/subscription.repository";

@Injectable()
export class SubscriptionsService {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  listForUser(userId: string) {
    return this.subscriptions.findManyByUserId(userId);
  }
}
