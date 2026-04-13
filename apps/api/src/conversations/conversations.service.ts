import { Injectable, NotFoundException } from "@nestjs/common";
import { ConversationRepository } from "../repositories/conversation.repository";
import { PersonaContextService } from "../personas/persona-context.service";
import type { CreateConversationDto } from "./dto/create-conversation.dto";

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly personaContext: PersonaContextService
  ) {}

  async create(userId: string, dto: CreateConversationDto) {
    const persona = await this.personaContext.resolvePersonaForUserBySlug(
      userId,
      dto.personaSlug.toLowerCase()
    );
    return this.conversations.create({
      userId,
      personaId: persona.id,
      title: persona.name,
    });
  }

  list(userId: string) {
    return this.conversations.findManyForUser(userId);
  }

  async getOne(userId: string, conversationId: string) {
    const row = await this.conversations.findFirstForUser(userId, conversationId);
    if (!row) throw new NotFoundException();
    return row;
  }
}
