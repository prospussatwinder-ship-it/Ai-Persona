import { Injectable, NotFoundException } from "@nestjs/common";
import { PersonaRepository } from "../repositories/persona.repository";
import type { CreatePersonaDto } from "./dto/create-persona.dto";
import type { UpdatePersonaDto } from "./dto/update-persona.dto";

@Injectable()
export class PersonasService {
  constructor(private readonly personas: PersonaRepository) {}

  listPublished() {
    return this.personas.findManyPublishedOrdered();
  }

  getPublishedBySlug(slug: string) {
    return this.personas.findFirstPublishedBySlug(slug);
  }

  listAll() {
    return this.personas.findManyAllWithCounts();
  }

  async create(dto: CreatePersonaDto, authorId: string) {
    const slug = dto.slug.toLowerCase();
    return this.personas.create({
      slug,
      name: dto.name,
      isPublished: dto.isPublished ?? false,
      createdBy: { connect: { id: authorId } },
      profile: {
        create: {
          tagline: dto.tagline,
          description: dto.description,
          systemPrompt: dto.systemPrompt,
          agentConfig: { model: "gpt-4o-mini", temperature: 0.7 },
          voiceConfig: { provider: "mock" },
        },
      },
    });
  }

  async update(id: string, dto: UpdatePersonaDto) {
    const persona = await this.personas.findByIdWithProfile(id);
    if (!persona) throw new NotFoundException();
    await this.personas.updateById(id, {
      slug: dto.slug?.toLowerCase(),
      name: dto.name,
      isPublished: dto.isPublished,
    });
    if (
      persona.profile &&
      (dto.tagline !== undefined ||
        dto.description !== undefined ||
        dto.systemPrompt !== undefined)
    ) {
      await this.personas.updateProfileByPersonaId(id, {
        tagline: dto.tagline,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
      });
    }
    return this.personas.findUniqueWithProfileAfterUpdate(id);
  }
}
