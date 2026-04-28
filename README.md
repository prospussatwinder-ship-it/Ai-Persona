# Persona Platform — Phase 1 monorepo

Stack: **Next.js** (`apps/web`), **NestJS** (`apps/api`), **FastAPI** (`apps/ai`), **PostgreSQL + pgvector**, **Redis**, **Prisma** (`packages/db`).

**Full local setup (Docker, Postgres, Redis, migrations, env files, ports):** see **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)**.
**Production/server/database requirements:** see **[docs/PRODUCTION_REQUIREMENTS.md](docs/PRODUCTION_REQUIREMENTS.md)**.

## Monorepo layout

| Path | Role |
|------|------|
| `apps/web` | Next.js App Router UI; calls the Nest API via `NEXT_PUBLIC_API_URL`. |
| `apps/api` | NestJS HTTP API (`/v1` prefix), Prisma, Redis, Stripe/R2 hooks. |
| `apps/ai` | FastAPI internal worker (embeddings + completions); called only from Nest. |
| `packages/db` | Prisma schema, migrations, seed. |
| `packages/shared` | Cross-app TypeScript types, Zod schemas, route constants. |
| `packages/ui` | Shared React primitives for `apps/web`. |
| `infra/` | `docker-compose.yml` for Postgres + Redis; optional env template. |
| `docs/` | Architecture and milestone notes. |

## Prerequisites

- Node 20+
- Docker Desktop (Postgres + Redis)
- Python 3.12+ (for `apps/ai`)

## 1. Infra

```bash
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps
docker exec -it phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

- Postgres: host `127.0.0.1` / `localhost`, port **5433** (user/db `persona`, password `persona_dev` per compose).
- Redis: host **127.0.0.1** / `localhost`, port **6380**.
- Containers use `restart: unless-stopped`. Wait until `docker compose ps` shows **healthy** before running Prisma.
- Copy `apps/api/.env.example` → `apps/api/.env` and `packages/db/.env.example` → `packages/db/.env`; connection strings use **`127.0.0.1`** by default (more reliable than `localhost` on some Windows setups).

## 2. Database

```bash
cd packages/db
# Copy .env.example → .env (same folder)
npx prisma db push
npx prisma db seed
```

From repo root after `npm install`, you can also run `npm run db:seed` (and use `npm run db:migrate -w @persona/db` when you adopt Prisma migrations).

Default seed logins (see table below for full list):

- `superadmin@phase1.local` / `SuperAdmin123!Phase1` (**SUPER_ADMIN**)
- `admin@phase1.local` / `Admin123!Phase1` (**ADMIN**)
- `operator@phase1.local` / `Operator123!Phase1` (**OPERATOR**)
- `customer@phase1.local` / `Customer123!Phase1` (**CUSTOMER**)

## 3. AI worker

```bash
cd apps/ai
python -m venv .venv
.\.venv\Scripts\activate   # Windows; use `source .venv/bin/activate` on Unix
python -m pip install --upgrade pip
pip install -r requirements.txt -r requirements-dev.txt
# Windows cmd: copy .env.example .env
python -m uvicorn app.main:app --reload --port 8001
```

Secrets load from `apps/ai/.env` (see `apps/ai/.env.example`).

## 4. API (Nest)

```bash
# Copy apps/api/.env.example → apps/api/.env
npm install
npm run dev:api
```

Important env vars (see `apps/api/.env.example`): `DATABASE_URL`, `JWT_SECRET`, `AI_SERVICE_URL`, `AI_INTERNAL_KEY`, `REDIS_URL`, optional Stripe keys.

- API base: `http://localhost:3001/v1`
- Health: `GET http://localhost:3001/v1/health`

## 5. Web

```bash
# Copy apps/web/.env.example → apps/web/.env.local
npm run dev:web
```

Open `http://localhost:3002`.

- Health: `GET http://localhost:3002/api/health`

## Health checks (local)

| Service | URL |
|---------|-----|
| Nest | `GET /v1/health` |
| Next | `GET /api/health` |
| FastAPI | `GET /health` |

## Current full process (chat + media)

Use this order for the current project state:

1. Start infra (Postgres + Redis).
2. Start AI chat worker (`apps/ai`).
3. Start media worker (`services/media-worker`).
4. Start API (`apps/api`).
5. Start web (`apps/web`).

### Recommended local ports

- Web: `3002`
- API: `3001`
- AI worker: `8002` (or `8001`, but must match API env)
- Media worker: `8003`
- Ollama: `11434`

### Required env alignment

- `apps/api/.env`
  - `AI_SERVICE_URL=http://127.0.0.1:8002` (or your AI worker port)
  - `MEDIA_SERVICE_URL=http://127.0.0.1:8003`
- `apps/ai/.env`
  - `AI_PROVIDER=ollama`
  - `AI_EMBED_PROVIDER=ollama`
  - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
  - `OLLAMA_CHAT_MODEL=tinyllama` (safe on lower-memory machines)
  - `OLLAMA_EMBED_MODEL=nomic-embed-text`

### Start commands (Windows PowerShell)

```powershell
# 1) API
npm run dev:api

# 2) Web
npm run dev:web

# 3) AI worker
cd apps/ai
  .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8002

# 4) Media worker
cd services/media-worker
$env:PYTHONPATH='d:\xampp-8.2-new\htdocs\Ai-Persona\services\media-worker'
& "d:\xampp-8.2-new\htdocs\Ai-Persona\apps\ai\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8003
```

### Features currently enabled

- Persona chat with local/self-hosted model
- Per-user/persona memory updates
- Live typing-style assistant response in web chat UI
- Reply-to-message in chat
- Delete chat conversation
- Media request detection from prompt text (`image/images/video/videos`)
- Media preview rendering in chat (`metadata.media`)

### Ollama + media clarification

- Ollama is used for persona chat, memory-related text flows, and image understanding/description.
- Ollama is **not** the primary production path for realistic image generation in this project.
- For real generated images/videos, use `services/media-worker` with a real media provider (OpenAI Images, ComfyUI/SDXL, or another dedicated generator).
- If no real media provider is configured, media worker falls back to local placeholder outputs so end-to-end media flow still works.

### Real media + voice setup (current implementation)

- Real image generation is enabled through `services/media-worker` when `OPENAI_API_KEY` is set for that worker process.
- Voiceover can be enabled in API via `VOICE_PROVIDER=openai` (otherwise it uses mock voice URLs).
- Required API env keys for voice:
  - `VOICE_PROVIDER=openai`
  - `OPENAI_API_KEY=...`
  - `OPENAI_TTS_MODEL=gpt-4o-mini-tts`
  - `OPENAI_TTS_VOICE=alloy` (or any supported voice)
- Video generation is still placeholder by default; connect a dedicated video provider in media-worker for production-grade output.

### What users should expect

- If a user asks to **analyze/describe an uploaded image**, the system uses the vision analysis path.
- If a user explicitly asks to **generate/create an image or video**, the media worker generation path is used.
- If generation provider is missing/unavailable, chat still responds normally and media may show a placeholder/fallback message.

### Media behavior right now

- Media worker currently returns a local placeholder SVG image URL for image requests.
- This confirms full media flow (API -> worker -> UI render) is working.
- Replace media worker provider logic later for real photorealistic image/video generation.

### Quick troubleshooting

- **Images not showing**:
  - check API `/v1/health`
  - check media worker `/health` on `8003`
  - send a new message with words like `image` or `images`
- **Port already in use** (`WinError 10048` / `EADDRINUSE`):
  - stop old process on that port, then restart service
- **Fallback text instead of dynamic answer**:
  - verify Ollama is running and model fits available RAM
  - verify `AI_SERVICE_URL` points to active AI worker

## Lint and format

```bash
npm run lint
npm run format
npm run format:check
```

- `apps/web`: `next lint` (ESLint flat config).
- `apps/api`: `eslint "src/**/*.ts"`.
- `apps/ai` (with venv active): `ruff check app` and `ruff format app`.

## Architecture

See `docs/PHASE1_ARCHITECTURE.md` for service boundaries, schema overview, and implementation order.

## What to build next

1. **Memory**: persist vector rows after chat turns (domain service + optional queue).
2. **Stripe**: harden webhook signature verification and entitlement updates.
3. **Streaming**: SSE or WebSocket for chat while keeping FastAPI as the worker.
4. **R2**: presigned upload/download in Nest.
5. **Workers**: BullMQ (or similar) on Redis for scheduled posts and background jobs.

## Phase 1 notes

- **Realtime/WebSocket streaming** for chat is deferred; the UI uses request/response. The AI worker and Nest layering are structured so SSE/WebSocket can be added without rewriting core flows.
- **Cloudflare R2**: store `mediaUrl` / `avatarUrl` as strings; add a presign module in Nest when buckets exist.
- **Stripe**: billing module uses real SDK when `STRIPE_SECRET_KEY` is set; otherwise checkout/PPV return mock payloads safe for local dev.

## Env templates

Copy the `.env.example` in each app/package you run:

- `apps/api/.env.example`
- `apps/web/.env.example` → `.env.local`
- `apps/ai/.env.example`
- `packages/db/.env.example`
- `infra/.env.example` (optional compose overrides)
- Root `.env.example` (quick reference only)

### Seed accounts (after `npm run db:seed`)

| Account | Password | Role |
|---------|----------|------|
| `superadmin@phase1.local` | `SuperAdmin123!Phase1` | SUPER_ADMIN |
| `admin@phase1.local` | `Admin123!Phase1` | ADMIN |
| `operator@phase1.local` | `Operator123!Phase1` | OPERATOR |
| `customer@phase1.local` | `Customer123!Phase1` | CUSTOMER (Free plan for AI quota tests) |

Staff logins open **Admin** at `http://localhost:3002/admin/dashboard` after signing in.