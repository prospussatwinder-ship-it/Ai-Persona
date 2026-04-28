# Production Requirements (Current + 50+ Persona Growth)

This document defines what is required to run this project in production today, and what to prepare for the next stage (50+ personas with memory-heavy chat traffic).

## 1) Scope and assumptions

- Monorepo services:
  - `apps/web` (Next.js frontend)
  - `apps/api` (NestJS backend)
  - `apps/ai` (FastAPI AI worker)
  - `services/media-worker` (media processing worker)
  - `packages/db` (Prisma schema/migrations)
- Core dependencies:
  - PostgreSQL + `pgvector`
  - Redis
  - Optional external systems: Ollama/local LLM, Stripe/CCBill/Crypto, Cloudflare R2

## 2) Mandatory runtime requirements

### Application runtime

- Node.js `20+` for web/api.
- Python `3.12+` for AI and media workers.
- Process supervisor for each service (`systemd`, `pm2`, container orchestrator, or Kubernetes).
- Reverse proxy/load balancer with TLS termination (`Nginx`, `Traefik`, cloud LB).

### Database and cache

- PostgreSQL `16+` with `pgvector` extension enabled.
- Redis `7+` for cache/queue/session-like workloads.
- Dedicated persistent volumes (do not use ephemeral disk for DB).

### Network and domain

- Public HTTPS domain for web.
- Private/internal network for service-to-service traffic where possible.
- Firewall rules:
  - Public: 80/443 only
  - Private/internal only: API, AI worker, media worker, Postgres, Redis

## 3) Environment and secret requirements

Create environment files/secrets per service. At minimum:

- `apps/api`
  - `DATABASE_URL`
  - `REDIS_URL`
  - `API_PORT`
  - `JWT_SECRET` (strong random value, not default)
  - `AI_SERVICE_URL`
  - `AI_INTERNAL_KEY`
  - `MEDIA_SERVICE_URL`
  - Optional billing/storage keys (`STRIPE_*`, `CCBILL_*`, `CRYPTO_*`, `R2_*`)
- `apps/web`
  - `NEXT_PUBLIC_API_URL`
- `apps/ai`
  - `AI_INTERNAL_KEY` (must match API)
  - provider/model variables (`AI_PROVIDER`, `AI_EMBED_PROVIDER`, `OLLAMA_*`, etc.)
- `packages/db`
  - `DATABASE_URL`

Secret management requirements:

- Store production secrets in a vault or platform secret manager (not git files).
- Rotate secrets on schedule (JWT, API keys, webhook secrets).
- Separate environments (`dev`, `staging`, `prod`) with isolated credentials.

## 4) Minimum production architecture (current simple phase)

For low to moderate traffic:

- 1x `web` instance
- 1x `api` instance
- 1x `ai` worker
- 1x `media-worker`
- 1x PostgreSQL instance
- 1x Redis instance

Recommended baseline sizing:

- `web`: 2 vCPU, 2-4 GB RAM
- `api`: 2-4 vCPU, 4-8 GB RAM
- `ai`: 4-8 vCPU, 8-16 GB RAM (more if local model is heavy)
- `media-worker`: 2-4 vCPU, 4-8 GB RAM
- `postgres`: 4 vCPU, 8-16 GB RAM, SSD storage
- `redis`: 2 vCPU, 2-4 GB RAM

## 5) Target architecture for 50+ personas with memory

As persona count and memory usage grow, CPU is not the only bottleneck. Embeddings, vector search, and background extraction load become critical.

### Required scaling model

- Horizontal scale:
  - `api`: at least 2 instances behind load balancer
  - `ai`: 2+ workers, isolated from web/api hosts
  - `media-worker`: scale independently by queue depth
- Stateful tier hardening:
  - PostgreSQL: managed HA or primary + standby
  - Redis: managed Redis with persistence and failover

### Suggested starting point (50+ personas, active chat + memory)

- `web`: 2 instances (2 vCPU, 2-4 GB each)
- `api`: 2-3 instances (4 vCPU, 8 GB each)
- `ai`: 2 instances (8 vCPU, 16 GB each, tune by model)
- `media-worker`: 1-2 instances (4 vCPU, 8 GB each)
- `postgres`: 8 vCPU, 32 GB RAM, fast SSD IOPS, daily backups + WAL archiving
- `redis`: 2-4 vCPU, 8 GB RAM (or managed equivalent)

If you run local LLM inference at scale, add GPU nodes or move to external inference infrastructure. CPU-only inference can become the first hard limit.

## 6) Database and memory-specific requirements

### Postgres + pgvector

- `pgvector` extension must exist in production DB.
- Use Prisma migrations in deployment pipeline:
  - `prisma migrate deploy`
- Add indexes for memory retrieval paths and vector lookup strategy.
- Define retention policy for old conversation/memory rows.
- Run regular `VACUUM`/`ANALYZE` and monitor bloat.

### Data growth planning

- Estimate storage:
  - message text
  - embedding vectors
  - metadata/audit records
- Plan partitioning or archival when large history accumulates.
- Keep backups encrypted and regularly restore-test them.

## 7) Queue and async processing requirements

Current env indicates deferred memory extraction (`MEMORY_DEFERRED_EXTRACTION=true`). For scale, move heavy post-chat work off request path:

- Use Redis-backed job queue (for example BullMQ from roadmap).
- Separate worker pool for memory extraction/embedding tasks.
- Configure retries, dead-letter handling, and visibility timeout.

## 8) Security requirements

- Enforce HTTPS for all public endpoints.
- Restrict internal endpoints (`AI_INTERNAL_KEY` validation and private networking).
- Apply CORS allow-list for frontend domain(s).
- Add rate limiting and abuse controls on auth/chat endpoints.
- Validate webhook signatures for billing providers.
- Run dependency vulnerability scanning in CI.
- Ensure logs do not leak secrets or personal data.

## 9) Reliability and operations requirements

### Health and readiness

- Keep health endpoints monitored:
  - API: `/v1/health`
  - Web: `/api/health`
  - AI worker: `/health`
  - Media worker: `/health` (if implemented)

### Observability

- Centralized logs for all services.
- Metrics + dashboards:
  - API latency/error rate
  - DB query latency / connection usage
  - Redis memory/evictions
  - queue depth and worker failures
  - AI worker latency and timeout rates
- Alerting for:
  - service down
  - high error rate
  - DB disk/CPU saturation
  - queue backlog growth

### Backup and disaster recovery

- Automated DB backups (daily full + frequent incremental/WAL).
- Defined restore RTO/RPO targets.
- Quarterly restore drill.

## 10) CI/CD and release requirements

- Build and test each deploy (web/api/ai/media-worker as applicable).
- Run database migration as controlled deploy step.
- Use rolling or blue/green deployment for API/web.
- Keep staging environment close to production topology.
- Tag releases and maintain rollback instructions.

## 11) Go-live checklist

- Infrastructure provisioned and monitored.
- TLS and domain configured.
- Production secrets configured and validated.
- `pgvector` enabled in production DB.
- Migrations applied successfully.
- Seed only required admin users (no default weak/dev credentials).
- API/web/ai/media health checks green.
- Billing webhooks tested (if enabled).
- Backup + restore test completed.
- Alerting and on-call contacts defined.

## 12) Future upgrades to plan now

- Managed Postgres + managed Redis (if self-hosted today).
- Queue-first architecture for all non-critical synchronous tasks.
- Streaming transport (SSE/WebSocket) for chat UX at higher concurrency.
- Object storage integration for media assets (R2/S3-compatible) with signed URLs.
- Persona-level quotas and per-model routing/cost controls.

---

Use this file as the source of truth for production readiness and update sizing after load tests with realistic persona/memory traffic.
