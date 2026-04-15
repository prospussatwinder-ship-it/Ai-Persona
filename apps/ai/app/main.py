"""Phase 1 AI worker — embeddings + chat completion (OpenAI optional, deterministic fallback)."""

import hashlib
import math
import os

import httpx
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Persona AI Worker", version="0.1.0")

INTERNAL_KEY = os.getenv("AI_INTERNAL_KEY", "dev-internal")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
EMBED_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")


def _check_key(x_internal_key: str | None):
    if x_internal_key != INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")


class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)


class MemorySearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=8000)


class CompleteRequest(BaseModel):
    system: str
    messages: list[dict]
    model: str | None = CHAT_MODEL
    temperature: float = 0.7


class PersonaTestRequest(BaseModel):
    system: str = Field(..., min_length=1)
    user_message: str = Field(..., min_length=1, max_length=8000)
    model: str | None = CHAT_MODEL
    temperature: float = 0.7


class VoiceRespondRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=32000)
    voice_config: dict | None = None


def deterministic_embedding(text: str, dim: int = 1536) -> list[float]:
    """Cheap dev fallback: not semantically meaningful — use when no OpenAI key."""
    h = hashlib.sha256(text.encode("utf-8")).digest()
    vec = []
    for i in range(dim):
        b = h[i % len(h)]
        vec.append((b / 255.0) * 2 - 1)
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


async def openai_embed(text: str) -> list[float]:
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {OPENAI_KEY}"},
            json={"model": EMBED_MODEL, "input": text},
        )
        r.raise_for_status()
        data = r.json()
        return data["data"][0]["embedding"]


async def openai_complete(system: str, messages: list[dict], model: str, temperature: float) -> str:
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"},
            json={
                "model": model,
                "temperature": temperature,
                "messages": [{"role": "system", "content": system}, *messages],
            },
        )
        r.raise_for_status()
        data = r.json()
        return (data["choices"][0]["message"]["content"] or "").strip()


async def embed_text(text: str) -> list[float]:
    if OPENAI_KEY:
        try:
            return await openai_embed(text)
        except Exception:
            pass
    return deterministic_embedding(text)


async def complete_chat(system: str, messages: list[dict], model: str, temperature: float) -> str:
    if OPENAI_KEY:
        try:
            return await openai_complete(system, messages, model, temperature)
        except Exception:
            pass
    last = messages[-1]["content"] if messages else ""
    return local_fallback_reply(system, last)


def local_fallback_reply(system: str, user_text: str) -> str:
    """Better offline fallback when OpenAI API is unavailable/quota exhausted."""
    scope_name = "assistant"
    for line in system.splitlines():
        clean = line.strip()
        if clean.lower().startswith("- name:"):
            scope_name = clean.split(":", 1)[1].strip() or scope_name
            break

    text = user_text.strip() or "your request"
    compact = " ".join(text.split())
    if len(compact) > 220:
        compact = compact[:217] + "..."

    return (
        f"I am running in local fallback mode for **{scope_name}** right now.\n\n"
        f"Based on your message: \"{compact}\", here is a focused next step:\n"
        f"1) Clarify the exact outcome you want.\n"
        f"2) Share any constraints/preferences.\n"
        f"3) I will generate a scoped plan tailored to this persona."
    )


@app.get("/health")
def health():
    return {"ok": True, "service": "persona-ai", "openai": bool(OPENAI_KEY)}


@app.post("/memory/store")
async def memory_store(body: EmbedRequest, x_internal_key: str | None = Header(default=None)):
    _check_key(x_internal_key)
    emb = await embed_text(body.text)
    return {"embedding": emb}


@app.post("/memory/search")
async def memory_search(body: MemorySearchRequest, x_internal_key: str | None = Header(default=None)):
    _check_key(x_internal_key)
    emb = await embed_text(body.query)
    return {"embedding": emb, "model": EMBED_MODEL}


@app.post("/chat/respond")
async def chat_respond(body: CompleteRequest, x_internal_key: str | None = Header(default=None)):
    _check_key(x_internal_key)
    text = await complete_chat(
        body.system, body.messages, body.model or CHAT_MODEL, body.temperature
    )
    return {"text": text}


@app.post("/persona/test")
async def persona_test(body: PersonaTestRequest, x_internal_key: str | None = Header(default=None)):
    _check_key(x_internal_key)
    text = await complete_chat(
        body.system,
        [{"role": "user", "content": body.user_message}],
        body.model or CHAT_MODEL,
        body.temperature,
    )
    return {"text": text}


@app.post("/voice/respond")
async def voice_respond(body: VoiceRespondRequest, x_internal_key: str | None = Header(default=None)):
    _check_key(x_internal_key)
    return {
        "text": body.text,
        "voice": {
            "provider": "mock",
            "audio_url": None,
            "config": body.voice_config,
        },
    }


@app.post("/internal/embed")
async def internal_embed(body: EmbedRequest, x_internal_key: str | None = Header(default=None)):
    return await memory_store(body, x_internal_key)


@app.post("/internal/complete")
async def internal_complete(body: CompleteRequest, x_internal_key: str | None = Header(default=None)):
    return await chat_respond(body, x_internal_key)
