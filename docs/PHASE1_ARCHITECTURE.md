# Phase 1 — Architecture & Implementation Plan

## 1. Final recommended architecture

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│  apps/web   │ ─────────────► │    apps/api      │
│  (Next.js)  │                │    (NestJS)      │
└─────────────┘                └────────┬─────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
             ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼    ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼   ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
             ┌─────────────┐     ┌─────────────┐    ┌─────────────┐
             │ PostgreSQL  │     │    Redis    │    │  apps/ai    │
             │  + pgvector │     │queue/pubsub │    │ (FastAPI)   │
             └─────────────┘     └─────────────┘    └─────────────┘
                    │                                   │
                    └────────── embeddings / chat ──────┘
```

- **Next.js (`apps/web`)**: marketing, auth UI, admin, chat UI, customer flows. Calls Nest REST (and later SSE/WebSocket from the same origin via API).
- **NestJS (`apps/api`)**: auth, RBAC, CRUD, Stripe webhooks, scheduling jobs enqueue, audit/analytics writes, orchestration to `apps/ai`, R2 presign (placeholder).
- **FastAPI (`apps/ai`)**: stateless AI worker — embeddings, RAG retrieval call, LLM completion, future moderation pre-check; no end-user auth (internal network + shared secret).
- **PostgreSQL + pgvector**: system of record; vectors in `MemoryEntry.embedding`.
- **Redis**: BullMQ or raw Redis lists later; Phase 1 uses **Redis for presence/rate-limit placeholder** and a **job queue stub** interface.
- **Stripe**: subscriptions + one-off PPV via Checkout/PaymentIntent; webhooks update `Subscription`, `Purchase`, `Entitlement`.
- **Cloudflare R2**: presigned upload URLs (stub); URLs stored on `PersonaProfile`, `ScheduledPost`.

Voice / Realtime: **no full OpenAI Realtime in Phase 1**. Nest exposes `VoiceModule` with a **port/adapter** (mock now; swap for TTS or Realtime later).

---

## 2. Monorepo folder structure

```
persona-platform/
├── apps/
│   ├── web/                 # Next.js App Router
│   ├── api/                 # NestJS
│   └── ai/                  # FastAPI (Python, not npm workspace)
├── packages/
│   ├── db/                  # Prisma schema + migrations path
│   ├── shared/              # Types, Zod contracts, API route constants
│   └── ui/                  # Shared React components (shadcn-ready primitives)
├── infra/
│   ├── docker-compose.yml
│   └── .env.example
├── docs/
│   └── PHASE1_ARCHITECTURE.md
├── package.json             # npm workspaces (apps/*, packages/*)
└── README.md
```

---

## 3. Service responsibilities

| Service | Owns |
|--------|------|
| **web** | UI, server components where useful, client calls to `api` |
| **api** | Identity, RBAC, personas, chat orchestration, billing, schedule API, audit/analytics, compliance hooks, voice orchestration |
| **ai** | Embed text, retrieve memory chunks (HTTP receives scope + query), complete chat (OpenAI-compatible stub), optional moderation score |

---

## 4. Database schema overview (initial)

- **User** + **`UserRole`**: `ADMIN`, `OPERATOR`, `CUSTOMER`.
- **Persona** + **PersonaProfile**: public vs draft, R2 URLs, `agentConfig` JSON, `voiceConfig` JSON.
- **Conversation** / **Message**: chat history; `MessageRole`.
- **MemoryEntry**: `(userId, personaId)` scoped content + `vector(1536)`.
- **Subscription** / **Purchase** / **Entitlement**: Stripe-backed access control.
- **ScheduledPost**: persona content calendar.
- **AnalyticsEvent** / **AuditLog**: product metrics vs security/compliance trail.

---

## 5. API / module breakdown (NestJS)

| Module | Responsibility |
|--------|----------------|
| `AuthModule` | JWT access tokens, login/register, `RolesGuard` |
| `UsersModule` | user queries (admin) |
| `PersonasModule` | CRUD + publish (operator/admin) |
| `ConversationsModule` | threads, append message, call AI + memory |
| `MemoryModule` | write/read helpers; pgvector SQL |
| `BillingModule` | Stripe customer, checkout session stub, webhook |
| `ScheduleModule` | CRUD scheduled posts, mark published |
| `AnalyticsModule` | record `AnalyticsEvent` |
| `AuditModule` | record `AuditLog` |
| `VoiceModule` | `VoicePort` + mock adapter |
| `ComplianceModule` | hook: pre/post message checks (stub) |
| `HealthModule` | `/health` |

**Typed contracts**: HTTP DTOs in Nest; shared request/response **Zod** schemas in `packages/shared` where the web mirrors (optional Phase 1 incremental).

---

## 6. Implementation order (Phase 1 only)

1. **Infra + workspace** — Docker Postgres/Redis, env templates, root README.
2. **packages/db** — Prisma schema + `db push` / migrate workflow.
3. **packages/shared** + **packages/ui** — constants, role enum mirror, minimal UI package.
4. **apps/ai** — FastAPI health + `/internal/embed`, `/internal/complete` stubs (protect with `X-Internal-Key`).
5. **apps/api** — `PrismaService`, `AuthModule` (register/login/JWT), global validation.
6. **Personas + PersonaProfile** — operator/admin CRUD; seed 3–5 personas.
7. **Conversations + Messages** — send message → memory retrieve → AI complete → persist.
8. **Stripe** — `CheckoutService` stub + webhook skeleton + `Entitlement` updates (mock until keys).
9. **Schedule** — `ScheduledPost` CRUD + optional Redis “due” poll stub.
10. **Analytics + Audit** — interceptor/service for mutations.
11. **Voice** — port + mock; document Realtime swap-in.
12. **web** — wire to Nest base URL; thin admin + chat pages (incremental UI).

This document is **Step 1**. Steps 2–3 are scaffold + schema committed in-repo; Steps 4–11 are implemented in `apps/api` / `apps/ai` in modular Nest/FastAPI layout following the table above.

---

## 7. Testing (per layer)

- **DB**: `npx prisma db push` + Prisma Studio.
- **ai**: `curl http://localhost:8001/health` + `POST /internal/complete` with header.
- **api**: `POST /auth/register`, `POST /auth/login`, `GET /personas` with Bearer token.
- **web**: sign-in flow against Nest (after env `NEXT_PUBLIC_API_URL`).

---

## 8. Out of scope (explicit)

Marketplace, Connect/revenue split, live streaming, affiliates, i18n, E2EE messaging, full video calling — **not** in Phase 1.
