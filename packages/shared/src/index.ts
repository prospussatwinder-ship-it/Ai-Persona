import { z } from "zod";

export const MEMORY_EMBEDDING_DIMENSION = 1536 as const;

export const UserRoleSchema = z.enum(["ADMIN", "OPERATOR", "CUSTOMER"]);
export type UserRoleDto = z.infer<typeof UserRoleSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(80).optional(),
});
export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;

export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
});
export type UpdateProfileRequestDto = z.infer<typeof UpdateProfileRequestSchema>;

export const PostMessageRequestSchema = z.object({
  content: z.string().min(1).max(16000),
});
export type PostMessageRequestDto = z.infer<typeof PostMessageRequestSchema>;

export const CreateConversationRequestSchema = z.object({
  personaSlug: z.string().min(1).max(120),
});
export type CreateConversationRequestDto = z.infer<typeof CreateConversationRequestSchema>;

export const TrackAnalyticsEventSchema = z.object({
  type: z.string().min(1).max(120),
  personaId: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type TrackAnalyticsEventDto = z.infer<typeof TrackAnalyticsEventSchema>;

/** Internal AI worker (FastAPI) — Nest calls these with `X-Internal-Key`. */
export const AiMemoryStoreRequestSchema = z.object({
  text: z.string().min(1).max(8000),
});
export type AiMemoryStoreRequestDto = z.infer<typeof AiMemoryStoreRequestSchema>;

export const AiMemoryStoreResponseSchema = z.object({
  embedding: z.array(z.number()).length(MEMORY_EMBEDDING_DIMENSION),
});
export type AiMemoryStoreResponseDto = z.infer<typeof AiMemoryStoreResponseSchema>;

export const AiMemorySearchRequestSchema = z.object({
  query: z.string().min(1).max(8000),
});
export type AiMemorySearchRequestDto = z.infer<typeof AiMemorySearchRequestSchema>;

export const AiMemorySearchResponseSchema = z.object({
  embedding: z.array(z.number()),
  model: z.string().optional(),
});
export type AiMemorySearchResponseDto = z.infer<typeof AiMemorySearchResponseSchema>;

export const AiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});
export type AiChatMessageDto = z.infer<typeof AiChatMessageSchema>;

export const AiChatRespondRequestSchema = z.object({
  system: z.string(),
  messages: z.array(AiChatMessageSchema),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});
export type AiChatRespondRequestDto = z.infer<typeof AiChatRespondRequestSchema>;

export const AiChatRespondResponseSchema = z.object({
  text: z.string(),
});
export type AiChatRespondResponseDto = z.infer<typeof AiChatRespondResponseSchema>;

export const AiPersonaTestRequestSchema = z.object({
  system: z.string().min(1),
  user_message: z.string().min(1).max(8000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});
export type AiPersonaTestRequestDto = z.infer<typeof AiPersonaTestRequestSchema>;

export const AiVoiceRespondRequestSchema = z.object({
  text: z.string().min(1).max(32000),
  voice_config: z.record(z.string(), z.unknown()).optional(),
});
export type AiVoiceRespondRequestDto = z.infer<typeof AiVoiceRespondRequestSchema>;

export const AiVoiceRespondResponseSchema = z.object({
  text: z.string(),
  voice: z.object({
    provider: z.string(),
    audio_url: z.string().nullable().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type AiVoiceRespondResponseDto = z.infer<typeof AiVoiceRespondResponseSchema>;

const v1 = "/v1" as const;

export const API_ROUTES = {
  health: `${v1}/health`,
  auth: {
    login: `${v1}/auth/login`,
    register: `${v1}/auth/register`,
    me: `${v1}/auth/me`,
  },
  users: {
    me: `${v1}/users/me`,
  },
  personas: `${v1}/personas`,
  conversations: `${v1}/conversations`,
  conversationMessages: (conversationId: string) => `${v1}/conversations/${conversationId}/messages`,
  subscriptions: `${v1}/subscriptions`,
   purchases: `${v1}/purchases`,
  billing: {
    checkoutSubscription: `${v1}/billing/checkout/subscription`,
    checkoutPpv: `${v1}/billing/checkout/ppv`,
    webhook: `${v1}/billing/webhook`,
  },
  admin: {
    users: `${v1}/admin/users`,
    personas: `${v1}/admin/personas`,
    scheduledPosts: `${v1}/admin/scheduled-posts`,
    analyticsEvents: `${v1}/admin/analytics/events`,
    auditLogs: `${v1}/admin/audit-logs`,
  },
  analytics: {
    trackEvent: `${v1}/analytics/events`,
  },
} as const;

export const AI_WORKER_ROUTES = {
  health: "/health",
  memoryStore: "/memory/store",
  memorySearch: "/memory/search",
  chatRespond: "/chat/respond",
  personaTest: "/persona/test",
  voiceRespond: "/voice/respond",
  internalEmbed: "/internal/embed",
  internalComplete: "/internal/complete",
} as const;
