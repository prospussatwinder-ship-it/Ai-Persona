import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PersonaRepository } from "../repositories/persona.repository";
import { AuditService } from "../audit/audit.service";
import type { CreatePersonaDto } from "./dto/create-persona.dto";
import type { UpdatePersonaDto } from "./dto/update-persona.dto";

@Injectable()
export class PersonasService {
  constructor(
    private readonly personas: PersonaRepository,
    private readonly audit: AuditService
  ) {}

  listPublished() {
    return this.personas.findManyPublishedOrdered();
  }

  getPublishedBySlug(slug: string) {
    return this.personas.findFirstPublishedBySlug(slug);
  }

  listAll() {
    return this.personas.findManyAllWithCounts();
  }

  getById(id: string) {
    return this.personas.findByIdWithProfile(id);
  }

  async create(dto: CreatePersonaDto, authorId: string) {
    const slug = dto.slug.toLowerCase();
    const persona = await this.personas.create({
      slug,
      name: dto.name,
      isPublished: dto.isPublished ?? false,
      isActive: dto.isActive ?? true,
      visibility: dto.visibility ?? "PUBLIC",
      createdBy: { connect: { id: authorId } },
      profile: {
        create: {
          tagline: dto.tagline,
          description: dto.description,
          systemPrompt: dto.systemPrompt,
          avatarUrl: dto.avatarUrl,
          agentConfig: { model: "gpt-4o-mini", temperature: 0.7 },
          voiceConfig: { provider: "mock" },
        },
      },
    });
    void this.audit.log({
      actorId: authorId,
      action: "persona.create",
      entityType: "Persona",
      entityId: persona.id,
      module: "personas",
      newValues: { slug: persona.slug, name: persona.name },
    });
    return this.personas.findUniqueWithProfileAfterUpdate(persona.id);
  }

  async update(id: string, dto: UpdatePersonaDto, actorId?: string) {
    const persona = await this.personas.findByIdWithProfile(id);
    if (!persona) throw new NotFoundException();
    await this.personas.updateById(id, {
      slug: dto.slug?.toLowerCase(),
      name: dto.name,
      isPublished: dto.isPublished,
      isActive: dto.isActive,
      visibility: dto.visibility,
    });
    if (
      persona.profile &&
      (dto.tagline !== undefined ||
        dto.description !== undefined ||
        dto.systemPrompt !== undefined ||
        dto.avatarUrl !== undefined)
    ) {
      await this.personas.updateProfileByPersonaId(id, {
        tagline: dto.tagline,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        avatarUrl: dto.avatarUrl,
      });
    }
    const updated = await this.personas.findUniqueWithProfileAfterUpdate(id);
    if (actorId) {
      void this.audit.log({
        actorId,
        action: "persona.update",
        entityType: "Persona",
        entityId: id,
        module: "personas",
        newValues: { slug: updated?.slug, name: updated?.name },
      });
    }
    return updated;
  }

  async remove(id: string, actorId: string) {
    const persona = await this.personas.findByIdWithProfile(id);
    if (!persona) throw new NotFoundException();
    const convs = await this.personas.countConversations(id);
    if (convs > 0) {
      throw new ConflictException(
        "Cannot delete a persona that has conversations. Unpublish or archive instead."
      );
    }
    await this.personas.deleteById(id);
    void this.audit.log({
      actorId,
      action: "persona.delete",
      entityType: "Persona",
      entityId: id,
      module: "personas",
      oldValues: { slug: persona.slug, name: persona.name },
    });
    return { ok: true };
  }
}
