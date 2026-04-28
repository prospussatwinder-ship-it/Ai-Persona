import { Injectable, NotFoundException } from "@nestjs/common";
import { MessageRole } from "@prisma/client";
import { AiUsageService } from "../ai-usage/ai-usage.service";
import { AiClientService } from "../ai-client/ai-client.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { AuditService } from "../audit/audit.service";
import { ComplianceService } from "../compliance/compliance.service";
import { MediaService } from "../media/media.service";
import { MemoryService } from "../memory/memory.service";
import { PersonaContextService } from "../personas/persona-context.service";
import { ConversationRepository } from "../repositories/conversation.repository";
import { MessageRepository } from "../repositories/message.repository";
import { UserRepository } from "../repositories/user.repository";
import { VoiceService } from "../voice/voice.service";
import type { PostMessageDto } from "./dto/post-message.dto";

type MediaItem = {
  kind?: "image" | "video";
  status?: string;
  url?: string;
  prompt?: string;
  message?: string;
  source?: "upload" | "generated";
  fileName?: string;
  mimeType?: string;
};

function asksForMediaAnalysis(text: string) {
  return /\b(what is this image|which image|identify|analy[sz]e|describe|what do you see|check this image)\b/i.test(
    text
  );
}

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
    private readonly media: MediaService,
    private readonly analytics: AnalyticsService,
    private readonly audit: AuditService,
    private readonly voice: VoiceService,
    private readonly personaContext: PersonaContextService
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
    await this.personaContext.assertUserCanAccessPersona(userId, conv.persona);

    const account = await this.usersRepo.findByIdWithPassword(userId);
    if (!account) throw new NotFoundException();
    const quota = await this.aiUsage.assertCanUseAi(userId, account.role);

    let replyMeta:
      | {
          replyToMessageId: string;
          replyToRole: string;
          replyToSnippet: string;
        }
      | undefined;
    if (dto.replyToMessageId) {
      const target = await this.messages.findFirstByConversationAndId(
        conversationId,
        dto.replyToMessageId
      );
      if (target) {
        replyMeta = {
          replyToMessageId: target.id,
          replyToRole: target.role,
          replyToSnippet: target.content.slice(0, 240),
        };
      }
    }

    const uploadedMedia: MediaItem[] = (dto.uploadedMedia ?? []).map((item) => ({
      kind: item.kind,
      status: "ok",
      url: item.url,
      source: "upload",
      fileName: item.fileName,
      mimeType: item.mimeType,
      message: "Uploaded by user.",
    }));
    const uploadContext = uploadedMedia.length
      ? `\n\n[Uploaded media context]\n${uploadedMedia
          .map((m, i) => `${i + 1}. ${m.kind} file${m.fileName ? ` (${m.fileName})` : ""} url: ${m.url}`)
          .join("\n")}`
      : "";
    const uploadedImages = uploadedMedia.filter((m) => m.kind === "image" && !!m.url);
    const needsImageAnalysis = uploadedImages.length > 0 && asksForMediaAnalysis(dto.content);
    const visionNotes: string[] = [];
    if (needsImageAnalysis) {
      for (const item of uploadedImages.slice(0, 2)) {
        const visionText = await this.ai.describeImage({
          imageUrl: item.url as string,
          prompt: "Describe this image in a factual way. Mention key objects, scene, and likely context.",
        });
        if (visionText?.trim()) {
          visionNotes.push(visionText.trim());
        }
      }
    }
    const visionContext = visionNotes.length
      ? `\n\n[Vision analysis]\n${visionNotes.map((v, i) => `${i + 1}. ${v}`).join("\n")}`
      : "";
    const userInputForAi = `${dto.content}${uploadContext}${visionContext}`;

    const userMsg = await this.messages.create({
      conversationId,
      role: MessageRole.user,
      content: dto.content,
      metadata: {
        ...(replyMeta ?? {}),
        ...(uploadedMedia.length ? { media: uploadedMedia } : {}),
      },
    });

    const embedding = await this.ai.embed(userInputForAi);
    const rows = await this.memory.search(userId, conv.personaId, embedding, 8);
    const promptContext = await this.personaContext.buildPromptContext({
      userId,
      persona: conv.persona,
      semanticMemoryLines: rows.map((r) => r.content),
    });

    const historyDesc = await this.messages.findRecentForPrompt(conversationId, 24);
    let history = historyDesc.slice().reverse();
    const last = history[history.length - 1];
    if (last && last.role === MessageRole.user && last.content === dto.content) {
      history = history.slice(0, -1);
    }

    const chronological = historyDesc.slice().reverse();
    const recentExchange = chronological
      .slice(-14)
      .map((m) => `${m.role}: ${(m.content ?? "").replace(/\s+/g, " ").slice(0, 420)}`)
      .join("\n")
      .slice(0, 4500);

    const agentCfg = (conv.persona.profile?.agentConfig as { model?: string; temperature?: number }) ?? {};
    const assistantText = await this.ai.complete({
      system: promptContext.system,
      model: agentCfg.model,
      temperature: agentCfg.temperature ?? 0.7,
      messages: [
        ...history.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
        { role: "user", content: userInputForAi },
      ],
    });

    const mediaItems =
      uploadedMedia.length > 0 && needsImageAnalysis
        ? []
        : await this.media.tryGenerateFromPrompt({
            text: userInputForAi,
            personaSlug: conv.persona.slug,
          });
    const hasReadyMedia = mediaItems.some((m) => Boolean(m.url));
    const assistantContent = hasReadyMedia
      ? `${assistantText}\n\nMedia generated and attached below.`
      : assistantText;

    const assistantMsg = await this.messages.create({
      conversationId,
      role: MessageRole.assistant,
      content: assistantContent,
      metadata: {
        memoryCount: rows.length,
        structuredMemoryCount: promptContext.structuredMemory.length,
        media: [
          ...uploadedMedia.map((m) => ({ ...m, message: "Referenced uploaded media.", source: "upload" })),
          ...mediaItems.map((m) => ({ ...m, source: "generated" as const })),
        ],
      },
    });

    await this.memory.learnFromTurn({
      userId,
      personaId: conv.personaId,
      conversationId,
      userText: userInputForAi,
      assistantText,
      history: history.map((h) => ({ role: h.role, content: h.content })),
      recentExchange,
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
      metadata: { snippet: dto.content.slice(0, 120), uploadCount: uploadedMedia.length },
      ip,
    });

    const voice = await this.voice.prepare(assistantText, conv.persona.profile?.voiceConfig);

    return { userMessage: userMsg, assistantMessage: assistantMsg, voice };
  }
}
