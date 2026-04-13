import { Global, Module } from "@nestjs/common";
import { ConversationRepository } from "./conversation.repository";
import { MemoryRepository } from "./memory.repository";
import { MessageRepository } from "./message.repository";
import { PersonaRepository } from "./persona.repository";
import { PurchaseRepository } from "./purchase.repository";
import { ScheduledPostRepository } from "./scheduled-post.repository";
import { SubscriptionRepository } from "./subscription.repository";
import { UserRepository } from "./user.repository";
import { UserPersonaAccessRepository } from "./user-persona-access.repository";
import { UserPersonaTrainingRepository } from "./user-persona-training.repository";

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
    UserPersonaAccessRepository,
    UserPersonaTrainingRepository,
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
    UserPersonaAccessRepository,
    UserPersonaTrainingRepository,
  ],
})
export class RepositoriesModule {}
