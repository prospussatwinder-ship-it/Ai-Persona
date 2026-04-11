# Local infrastructure

From repo root:

```bash
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps
```

- PostgreSQL + pgvector: `127.0.0.1:5433` (mapped from container `5432`)
- Redis **7.4** (Alpine): `127.0.0.1:6380` (mapped from container `6379`), AOF persistence enabled
- Both services: `restart: unless-stopped`, healthchecks with `start_period` for slow first boot

**Connection strings** for `apps/api/.env` and `packages/db/.env`:

```env
DATABASE_URL=postgresql://persona:persona_dev@127.0.0.1:5433/persona
REDIS_URL=redis://127.0.0.1:6380
```

Enable pgvector once (if not already):

```bash
docker exec -it phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## Error: `http: server gave HTTP response to HTTPS client` (Docker Hub)

Docker expects **HTTPS** to `registry-1.docker.io`. Something on the path is answering with **plain HTTP** (wrong proxy, SSL inspection, or a bad mirror).

Try in order:

1. **Docker Desktop** → *Settings* → *Resources* → **Proxies** — turn **off** manual proxy unless your IT gave you an exact HTTPS proxy URL. Save & restart Docker.
2. **Windows** — search “environment variables” → *User* / *System* variables — remove or blank **`HTTP_PROXY`**, **`HTTPS_PROXY`**, **`ALL_PROXY`** if set for a test. Open a **new** terminal.
3. **Antivirus / “HTTPS scanning” / SSL inspection** — pause for a test or exclude Docker.
4. **VPN** — disconnect and retry, or try another network (e.g. phone hotspot).
5. **Docker Engine JSON** (*Settings* → *Docker Engine*) — if you added **`registry-mirrors`**, remove invalid mirrors (a bad mirror often causes this exact error). Apply & restart.

From repo root you can retry with proxies cleared:

```bat
infra\compose-up-clear-proxy.cmd
```

If pulls still fail, use **`docker load`** from another PC that can pull, or use **hosted Postgres** (see main README) and skip Docker for the database.
