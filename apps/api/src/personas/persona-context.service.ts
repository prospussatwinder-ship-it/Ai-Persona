import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  Persona,
  PersonaAccessType,
  PersonaProfile,
  Prisma,
  UserPersonaAccessStatus,
} from "@prisma/client";
import { MemoryService } from "../memory/memory.service";
import { PersonaRepository } from "../repositories/persona.repository";
import { PurchaseRepository } from "../repositories/purchase.repository";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { UserPersonaAccessRepository } from "../repositories/user-persona-access.repository";
import { UserPersonaTrainingRepository } from "../repositories/user-persona-training.repository";

type PersonaWithProfile = Persona & { profile: PersonaProfile | null };

@Injectable()
export class PersonaContextService {
  constructor(
    private readonly personas: PersonaRepository,
    private readonly accessRepo: UserPersonaAccessRepository,
    private readonly trainingRepo: UserPersonaTrainingRepository,
    private readonly purchases: PurchaseRepository,
    private readonly subscriptions: SubscriptionRepository,
    private readonly memory: MemoryService
  ) {}

  async resolvePersonaForUserBySlug(userId: string, slug: string) {
    const persona = await this.personas.findFirstPublishedActiveBySlugAnyVisibility(slug);
    if (!persona) throw new NotFoundException("Persona not found");
    await this.assertUserCanAccessPersona(userId, persona);
    return persona;
  }

  async assertUserCanAccessPersona(userId: string, persona: PersonaWithProfile) {
    if (persona.visibility === "PUBLIC") return;

    const explicit = await this.accessRepo.findActiveByUserAndPersona(userId, persona.id);
    if (explicit) return;

    const purchase = await this.purchases.hasSucceededForProductKeys(userId, [
      `persona:${persona.id}`,
      `persona:${persona.slug}`,
    ]);
    if (purchase) return;

    const activeSubscription = await this.subscriptions.hasActive(userId);
    if (activeSubscription) return;

    throw new ForbiddenException("You do not have access to this persona");
  }

  listUserAccessiblePersonas(userId: string) {
    return this.accessRepo.listForUser(userId);
  }

  grantPersonaAccess(input: {
    userId: string;
    personaId: string;
    accessType: PersonaAccessType;
    status?: UserPersonaAccessStatus;
    startDate?: Date | null;
    endDate?: Date | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.accessRepo.upsertAccess(input);
  }

  getUserTraining(userId: string, personaId: string) {
    return this.trainingRepo.getActive(userId, personaId);
  }

  upsertUserTraining(input: {
    userId: string;
    personaId: string;
    title?: string | null;
    trainingNotes?: string | null;
    structuredProfile?: Prisma.InputJsonValue;
  }) {
    return this.trainingRepo.upsertActive(input);
  }

  async buildPromptContext(input: {
    userId: string;
    persona: PersonaWithProfile;
    semanticMemoryLines: string[];
  }) {
    const structured = await this.memory.listStructured(input.userId, input.persona.id, 20);
    const profile = input.persona.profile;

    const allowedTopics = this.jsonArrayToLines(profile?.allowedTopics);
    const blockedTopics = this.jsonArrayToLines(profile?.blockedTopics);
    const feedData = this.jsonToPretty(profile?.feedData);
    const structuredLines =
      structured.length === 0
        ? ["(none)"]
        : structured.map(
            (item) =>
              `- ${item.memoryKey ?? "fact"}: ${item.content} (${item.memoryType ?? "memory"})`
          );
    const semanticLines = input.semanticMemoryLines.length
      ? input.semanticMemoryLines.map((m) => `- ${m}`)
      : ["(none)"];

    const scopeName = profile?.scopeName?.trim() || `${input.persona.name} specialty`;
    const scopeDescription = profile?.scopeDescription?.trim() || "";
    const behaviorRules = profile?.behaviorRules?.trim() || "";
    const basePrompt = profile?.systemPrompt?.trim() || `You are ${input.persona.name}.`;

    const system = `${basePrompt}

Persona scope:
- Name: ${scopeName}
- Description: ${scopeDescription || "(not set)"}
- Allowed topics:
${allowedTopics.join("\n")}
- Blocked topics:
${blockedTopics.join("\n")}
- Behavior rules:
${behaviorRules || "(none)"}

Persona feed / knowledge configuration:
${feedData}

User-specific memories for this persona (structured):
${structuredLines.join("\n")}

Retrieved semantic memories for this persona:
${semanticLines.join("\n")}

Guardrails:
1) Never answer outside this persona scope as if you are another persona.
2) If user asks outside allowed topics, politely state this persona is specialized for "${scopeName}" and redirect to in-scope help.
3) Use only this user's memories and learned behavior for this persona.
4) Do not claim access to data from other users or other personas.
5) Keep responses practical and concise.`;

    return { system, training: null, structuredMemory: structured };
  }

  private jsonArrayToLines(value: unknown): string[] {
    if (!Array.isArray(value) || value.length === 0) return ["- (none)"];
    const rows = value
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 40)
      .map((x) => `- ${x}`);
    return rows.length ? rows : ["- (none)"];
  }

  private jsonToPretty(value: unknown): string {
    if (value === null || value === undefined) return "(none)";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}
