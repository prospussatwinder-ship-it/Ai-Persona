# Phase 1 — AI worker (FastAPI)

```bash
cd apps/ai
python -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -r requirements.txt -r requirements-dev.txt
copy .env.example .env
set AI_INTERNAL_KEY=dev-internal
set OPENAI_API_KEY=   # optional
uvicorn app.main:app --reload --port 8001
```

- Health: `http://127.0.0.1:8001/health`
- Internal endpoints require header `X-Internal-Key` matching `AI_INTERNAL_KEY` (must match `apps/api` env).

Canonical routes (used by Nest `AiClientService`): `POST /memory/store`, `POST /memory/search`, `POST /chat/respond`, `POST /persona/test`, `POST /voice/respond`. Legacy aliases: `POST /internal/embed`, `POST /internal/complete`.

Without `OPENAI_API_KEY`, embeddings are deterministic noise (dev only) and chat returns a simple fallback.

`python-dotenv` loads `apps/ai/.env` on startup. Lint/format: `ruff check app`, `ruff format app`.
