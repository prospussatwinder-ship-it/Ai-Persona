import { Injectable, NotFoundException } from "@nestjs/common";
import { MessageRole } from "@prisma/client";
import { AiUsageService } from "../ai-usage/ai-usage.service";
import { AiClientService } from "../ai-client/ai-client.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { AuditService } from "../audit/audit.service";
import { ComplianceService } from "../compliance/compliance.service";
import { MemoryService } from "../memory/memory.service";
import { ConversationRepository } from "../repositories/conversation.repository";
import { MessageRepository } from "../repositories/message.repository";
import { UserRepository } from "../repositories/user.repository";
import { VoiceService } from "../voice/voice.service";
import type { PostMessageDto } from "./dto/post-message.dto";

@Injectable()
export class MessagesService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly memory: MemoryService,
    private readonly ai: AiClientService,
    private readonly aiUsage: AiUsageService,
    private readonly usersRepo: UserRepository,
    private readonly compliance: ComplianceService,
    private readonly analytics: AnalyticsService,
    private readonly audit: AuditService,
    private readonly voice: VoiceService
  ) {}

  async listMessages(userId: string, conversationId: string) {
    const c = await this.conversations.findFirstForUser(userId, conversationId);
    if (!c) throw new NotFoundException();
    return this.messages.findManyByConversation(conversationId);
  }

  async appendMessage(userId: string, conversationId: string, dto: PostMessageDto, ip?: string) {
    this.compliance.assertMessageAllowed(dto.content);
    const conv = await this.conversations.findFirstWithPersonaForUser(userId, conversationId);
    if (!conv) throw new NotFoundException();

    const account = await this.usersRepo.findByIdWithPassword(userId);
    if (!account) throw new NotFoundException();
    const quota = await this.aiUsage.assertCanUseAi(userId, account.role);

    const userMsg = await this.messages.create({
      conversationId,
      role: MessageRole.user,
      content: dto.content,
    });

    const embedding = await this.ai.embed(dto.content);
    const rows = await this.memory.search(userId, conv.personaId, embedding, 8);
    const memoryBlock =
      rows.length === 0 ? "(no memories)" : rows.map((r) => `- ${r.content}`).join("\n");

    const system =
      (conv.persona.profile?.systemPrompt ?? `You are ${conv.persona.name}.`) +
      `\n\nRetrieved memories for this user:\n${memoryBlock}`;

    const historyDesc = await this.messages.findRecentForPrompt(conversationId, 24);
    let history = historyDesc.slice().reverse();
    const last = history[history.length - 1];
    if (last && last.role === MessageRole.user && last.content === dto.content) {
      history = history.slice(0, -1);
    }

    const agentCfg = (conv.persona.profile?.agentConfig as { model?: string; temperature?: number }) ?? {};
    const assistantText = await this.ai.complete({
      system,
      model: agentCfg.model,
      temperature: agentCfg.temperature ?? 0.7,
      messages: [
        ...history.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
        { role: "user", content: dto.content },
      ],
    });

    const assistantMsg = await this.messages.create({
      conversationId,
      role: MessageRole.assistant,
      content: assistantText,
      metadata: { memoryCount: rows.length },
    });

    void this.aiUsage.recordSuccess({
      userId,
      subscriptionId: quota.subscriptionId,
      featureName: "chat.complete",
      requestType: "chat",
    });

    await this.conversations.touchUpdatedAt(conversationId);

    void this.analytics.track({
      userId,
      personaId: conv.personaId,
      type: "chat.message",
      payload: { conversationId, assistantLen: assistantText.length },
    });
    void this.audit.log({
      actorId: userId,
      action: "chat.message",
      entityType: "Conversation",
      entityId: conversationId,
      metadata: { snippet: dto.content.slice(0, 120) },
      ip,
    });

    const voice = await this.voice.prepare(assistantText, conv.persona.profile?.voiceConfig);

    return { userMessage: userMsg, assistantMessage: assistantMsg, voice };
  }
}
