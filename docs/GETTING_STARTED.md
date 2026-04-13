# Getting started — local development

This guide walks through **Docker (PostgreSQL + Redis)**, **environment files**, **Prisma migrations and seed**, and **running the apps**. Use it when you clone the repo on a new machine.

## Prerequisites

| Tool | Notes |
|------|--------|
| **Node.js 20+** | Required for the monorepo (`npm install` at repo root). |
| **Docker Desktop** | Required for local Postgres + Redis unless you use a hosted database. |
| **Python 3.12+** | Only for `apps/ai` (FastAPI worker). |

On Windows, prefer **PowerShell** or **cmd** from the repo root. Use **`127.0.0.1`** in connection strings if **`localhost`** misbehaves (some setups resolve IPv6 first).

---

## 1. Clone and install

```bash
git clone <repository-url>
cd Ai-Persona
npm install
```

`postinstall` runs Prisma `generate` for `packages/db`.

---

## 2. Docker: PostgreSQL and Redis

The **canonical** compose file for this project is **`infra/docker-compose.yml`**. It defines:

| Service | Container name | Host port | Purpose |
|---------|------------------|-----------|---------|
| PostgreSQL 16 + **pgvector** | `phase1-postgres` | **5433** → 5432 | App database |
| Redis 7 | `phase1-redis` | **6380** → 6379 | Cache / queues (API tolerates Redis being down for basic flows) |

**Credentials (dev):** user `persona`, password `persona_dev`, database `persona`.

Postgres is built from **`infra/Dockerfile.postgres`** (pgvector compiled on `postgres:16-alpine`). First start may take a few minutes while Docker builds the image.

### Start containers

From the **repository root**:

```bash
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps
```

Wait until `docker compose ps` shows **healthy** for Postgres before running Prisma.

### Enable pgvector in the database

Run once after Postgres is up:

```bash
docker exec -it phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Optional: Redis image override

If pulling the default Redis image fails, set **`PERSONA_REDIS_IMAGE`** (e.g. in repo-root `.env` or `infra/.env`) and pass it to Compose. See comments in `infra/docker-compose.yml`.

### Optional: root `docker-compose.yml`

There is also a **`docker-compose.yml` at the repo root** (similar services, may use the **`pgvector/pgvector:pg16`** image from Docker Hub). The team standard for scripts and docs is **`infra/docker-compose.yml`**. Use one stack consistently so ports and volumes do not conflict.

### Windows helpers

- **`infra/restart-db.cmd`** — Checks Docker is running, runs `docker compose -f infra\docker-compose.yml up -d`, waits briefly, runs the `vector` extension command, prints next steps (`migrate deploy`, `db:seed`, `dev:api`).
- **`dev-web.cmd`** — Repo-root shortcut: `npm run dev:web` (Next.js).

---

## 3. Environment files

Copy each **`.env.example`** to the filename your tooling expects:

| Location | Copy to | Purpose |
|----------|---------|---------|
| `packages/db/.env.example` | `packages/db/.env` | `DATABASE_URL` for Prisma CLI |
| `apps/api/.env.example` | `apps/api/.env` | API: DB, Redis, JWT, AI URL, Stripe, etc. |
| `apps/web/.env.example` | `apps/web/.env.local` | `NEXT_PUBLIC_API_URL` (browser → Nest API) |
| `apps/ai/.env.example` | `apps/ai/.env` | FastAPI worker (only if you run `apps/ai`) |
| `infra/.env.example` | `infra/.env` (optional) | Compose-related overrides |
| Root `.env.example` | `.env` (optional) | Quick reference / Compose env-file |

**Important:** `DATABASE_URL` and `REDIS_URL` must match Docker ports:

- Postgres: `postgresql://persona:persona_dev@127.0.0.1:5433/persona`
- Redis: `redis://127.0.0.1:6380`

---

## 4. Database schema and seed

Apply migrations and load seed data (staff/customer test accounts, permissions, etc.).

**Recommended — one-shot script (Windows, PowerShell):** from repo root:

```powershell
npm run dev:setup
```

This runs **`scripts/start-local.ps1`**, which:

1. Starts Docker Compose (`infra/docker-compose.yml`) if Docker is available  
2. Creates `packages/db/.env` from `.env.example` if missing  
3. Runs **`prisma migrate deploy`** (falls back to `db push` only if deploy fails — dev-only fallback)  
4. Runs **`npm run db:seed`**

**Manual (any OS):**

```bash
cd packages/db
# Ensure .env exists (copy from .env.example)
npx prisma migrate deploy
cd ../..
npm run db:seed
```

**Other useful commands (from repo root):**

- `npm run db:migrate` — `prisma migrate dev` (creates migrations during development)  
- `npm run db:migrate:deploy` — production-style deploy  
- `npm run db:studio` — Prisma Studio UI  

---

## 5. Run the applications

Use **separate terminals** for each long-running process.

### API (NestJS)

```bash
npm run dev:api
```

- Base URL: `http://localhost:3001/v1`  
- Health: `GET http://localhost:3001/v1/health`  

### Web (Next.js)

```bash
npm run dev:web
```

- App: `http://localhost:3002`  
- Health: `GET http://localhost:3002/api/health`  

### AI worker (FastAPI) — optional

Needed for embeddings/chat features that call the internal AI service:

```bash
cd apps/ai
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# Unix: source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8001
```

Ensure `apps/api/.env` has **`AI_SERVICE_URL`** and **`AI_INTERNAL_KEY`** aligned with `apps/ai/.env`.

---

## 6. Quick reference — ports

| Service | Port |
|---------|------|
| Next.js (`apps/web`) | 3002 |
| Nest API (`apps/api`) | 3001 |
| FastAPI (`apps/ai`) | 8001 |
| PostgreSQL (Docker) | 5433 |
| Redis (Docker) | 6380 |

---

## 7. Troubleshooting

- **Docker not running (Windows):** Start Docker Desktop and wait until the engine is ready; run `docker info` in a new terminal. Use **`infra/restart-db.cmd`** for guided steps.  
- **Prisma errors about unknown columns / schema drift:** Run **`npx prisma migrate deploy`** in `packages/db` (or `npm run db:migrate:deploy` from root), then restart the API.  
- **Port already in use:** Stop the other process or change the port in the relevant app config / `.env`.  
- **Redis optional:** The API can start without Redis for many flows; set `REDIS_URL` empty or omit features that require it until Redis is up.

---

## 8. Further reading

- **`README.md`** — Short overview, seed account table, lint commands.  
- **`docs/PHASE1_ARCHITECTURE.md`** — Service boundaries and schema overview.  
