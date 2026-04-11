import { Injectable, NotFoundException } from "@nestjs/common";
import { ConversationRepository } from "../repositories/conversation.repository";
import { PersonaRepository } from "../repositories/persona.repository";
import type { CreateConversationDto } from "./dto/create-conversation.dto";

@Injectable()
export class ConversationsService {
  constructor(
    private readonly personas: PersonaRepository,
    private readonly conversations: ConversationRepository
  ) {}

  async create(userId: string, dto: CreateConversationDto) {
    const persona = await this.personas.findFirstPublishedBySlug(dto.personaSlug.toLowerCase());
    if (!persona) throw new NotFoundException("Persona not found");
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
