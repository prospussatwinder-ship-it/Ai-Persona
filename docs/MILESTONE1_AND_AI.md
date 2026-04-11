# Milestone 1 status, database access, and AI stack

## Milestone 1 — Architecture & setup (Week 1–2)

| Item | Status | Notes |
|------|--------|--------|
| System architecture | **Done (evolving)** | Monorepo: `apps/web` (Next.js), `apps/api` (Fastify), `packages/db` (Prisma + PostgreSQL), optional `services/media-worker` (Python). |
| Database schema | **Done (evolving)** | Prisma schema in `packages/db/prisma/schema.prisma` — includes **pgvector** on `MemoryChunk.embedding` and **per-user persona prefs** (`UserPersonaPreference`). |
| Development environment | **Done** | Docker Compose for Postgres (`5433`) + Redis (`6380`); Node 20+; `npm install` at repo root. |
| Tool accounts (external) | **Your action** | OpenAI (chat + embeddings), ElevenLabs, HeyGen/Tavus, Midjourney/Replicate, etc. are **not** auto-created by code — you register and put keys in env (see below). |

---

## How to access the database (vector + SQL)

**Connection string** (from `packages/db/.env` or `apps/api/.env`):

`postgresql://persona:persona_dev@localhost:5433/persona`

**GUI (Prisma Studio)**

```bash
cd packages/db
npx prisma studio
```

**CLI (psql in Docker)**

```bash
docker exec -it persona-postgres psql -U persona -d persona
```

**pgvector**

Extension is enabled once per DB (`CREATE EXTENSION vector;`). Embeddings are stored in `"MemoryChunk"."embedding"` as `vector(1536)` (text-embedding-3-small).

**Inspect vectors (example)**

```sql
SELECT id, "userId", "personaId", LEFT(content, 80), embedding IS NOT NULL AS has_vec
FROM "MemoryChunk"
LIMIT 20;
```

---

## AI chat agent (Node API)

**Required for full replies:** set in `apps/api/.env`:

```env
OPENAI_API_KEY=sk-...
# optional override:
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Restart `npm run dev:api` after changing env.

**Behavior**

- **Retrieval:** User message is embedded → **pgvector** similarity search scoped to `(userId, personaId)` only.
- **Generation:** OpenAI Chat Completions with persona `PersonaAgentConfig` system prompt + retrieved memories + **per-user** `UserPersonaPreference` (tone + extra instructions).
- **Learning (no custom “model training” in this repo):** After each turn, a small model call may add **one short factual line** to `MemoryChunk` (auto-learning). This is the standard SaaS pattern (RAG + preferences), not LoRA fine-tuning.

**Slash commands (per user + persona)**

| Command | Effect |
|---------|--------|
| `/help` | Lists commands |
| `/remember …` | Stores an explicit note in the vector DB for this user+persona |
| `/tone friendly\|formal\|brief` | Saves style preference |
| `/instruction …` | Appends standing instructions merged into the system prompt |

If `OPENAI_API_KEY` is missing, the API still runs; chat returns setup instructions instead of an LLM reply.

---

## Python media worker (photos / video)

Optional service for heavier generation (diffusion, FFmpeg chains, etc.):

```bash
docker compose --profile ml up -d --build media-worker
# http://localhost:8000/health
```

Or locally:

```bash
cd services/media-worker
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Endpoints `POST /v1/image` and `POST /v1/video` are **stubs** — plug in OpenAI Images, Replicate, ComfyUI, HeyGen, etc.

---

## “Different users, different agents”

- **Global persona brain:** `PersonaAgentConfig` (prompt, model, temperature).
- **Per customer:** `UserPersonaPreference` + vector `MemoryChunk` rows — each user teaches the same persona differently via chat, `/instruction`, `/remember`, and automatic fact extraction.

True **fine-tuning / training** a base model per user is a separate, large infra project; for most platforms, **RAG + structured prefs** is the right first architecture.

---

## Quick env checklist

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | `packages/db/.env`, `apps/api/.env` | Postgres |
| `API_JWT_SECRET` | `apps/api/.env` | JWT + WebSocket token verify |
| `OPENAI_API_KEY` | `apps/api/.env` | Chat + embeddings + memory extraction |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | Browser → API (`http://localhost:3001`) |

---

## Verification commands

```bash
docker compose up -d
cd packages/db && npx prisma db push && npx tsx prisma/seed.ts
cd ../.. && npm run dev:api
npm run dev:web
```

Open `http://localhost:3002`, log in (`demo@persona.local` / `demo1234` from seed), start a chat, try `/help` and normal messages with an OpenAI key set.
