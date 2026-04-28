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

Quality tuning (Ollama):

- `OLLAMA_NUM_CTX` (context window)
- `OLLAMA_NUM_PREDICT` (max output tokens)
- `OLLAMA_TOP_P`, `OLLAMA_TOP_K`, `OLLAMA_REPEAT_PENALTY`
- `AI_RESPONSE_STYLE` (`balanced`, `creative`, `precise`, `coach`)
- `AI_ENABLE_PROMPT_BOOST` (`true`/`false`)
- `OLLAMA_CHAT_FALLBACK_MODELS` (comma-separated model fallback order)

If Ollama/local-compatible providers are unavailable, worker uses deterministic embed + local text fallback.

`python-dotenv` loads `apps/ai/.env` on startup. Lint/format: `ruff check app`, `ruff format app`.
