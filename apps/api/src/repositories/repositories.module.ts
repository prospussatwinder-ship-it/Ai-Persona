import { Global, Module } from "@nestjs/common";
import { ConversationRepository } from "./conversation.repository";
import { MemoryRepository } from "./memory.repository";
import { MessageRepository } from "./message.repository";
import { PersonaRepository } from "./persona.repository";
import { PurchaseRepository } from "./purchase.repository";
import { ScheduledPostRepository } from "./scheduled-post.repository";
import { SubscriptionRepository } from "./subscription.repository";
import { UserRepository } from "./user.repository";

@Global()
@Module({
  providers: [
    UserRepository,
    PersonaRepository,
    ConversationRepository,
    MessageRepository,
    MemoryRepository,
    SubscriptionRepository,
    PurchaseRepository,
    ScheduledPostRepository,
  ],
  exports: [
    UserRepository,
    PersonaRepository,
    ConversationRepository,
    MessageRepository,
    MemoryRepository,
    SubscriptionRepository,
    PurchaseRepository,
    ScheduledPostRepository,
  ],
})
export class RepositoriesModule {}
