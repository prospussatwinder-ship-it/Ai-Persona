"""Phase 1 AI worker — local model provider with safe fallback."""

import hashlib
import math
import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Persona AI Worker", version="0.2.0")

INTERNAL_KEY = os.getenv("AI_INTERNAL_KEY", "dev-internal")
EMBED_MODEL = os.getenv("AI_EMBED_MODEL", "local-deterministic-1536")
CHAT_MODEL = os.getenv("AI_CHAT_MODEL", "local-fallback-chat")
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").strip().lower()
AI_EMBED_PROVIDER = os.getenv("AI_EMBED_PROVIDER", AI_PROVIDER).strip().lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.1:8b-instruct-q4_K_M")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "90"))


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
    """Emergency deterministic embedding fallback."""
    h = hashlib.sha256(text.encode("utf-8")).digest()
    vec = []
    for i in range(dim):
        b = h[i % len(h)]
        vec.append((b / 255.0) * 2 - 1)
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def _trim_messages(messages: list[dict], limit: int = 24) -> list[dict]:
    if len(messages) <= limit:
        return messages
    return messages[-limit:]


async def ollama_embed(text: str) -> list[float]:
    payload = {"model": OLLAMA_EMBED_MODEL, "prompt": text}
    async with httpx.AsyncClient(timeout=AI_TIMEOUT_SECONDS) as client:
        res = await client.post(f"{OLLAMA_BASE_URL}/api/embeddings", json=payload)
        res.raise_for_status()
        data: dict[str, Any] = res.json()
    emb = data.get("embedding")
    if not isinstance(emb, list) or not emb:
        raise RuntimeError("ollama embeddings response missing vector")
    return [float(x) for x in emb]


async def ollama_chat(system: str, messages: list[dict], model: str | None, temperature: float) -> str:
    chat_model = (model or OLLAMA_CHAT_MODEL or CHAT_MODEL).strip() or OLLAMA_CHAT_MODEL
    normalized_msgs: list[dict[str, str]] = [
        {"role": "system", "content": system},
        *[
            {"role": str(item.get("role", "user")), "content": str(item.get("content", "")).strip()}
            for item in _trim_messages(messages, 24)
            if str(item.get("content", "")).strip()
        ],
    ]
    payload = {
        "model": chat_model,
        "stream": False,
        "messages": normalized_msgs,
        "options": {
            "temperature": float(max(0.0, min(temperature, 1.5))),
        },
    }
    async with httpx.AsyncClient(timeout=AI_TIMEOUT_SECONDS) as client:
        res = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
        res.raise_for_status()
        data: dict[str, Any] = res.json()
    msg = data.get("message", {})
    content = str(msg.get("content", "")).strip()
    if not content:
        raise RuntimeError("ollama chat response missing content")
    return content


async def embed_text(text: str) -> list[float]:
    if AI_EMBED_PROVIDER == "ollama":
        try:
            return await ollama_embed(text)
        except Exception:
            pass
    return deterministic_embedding(text)


async def complete_chat(system: str, messages: list[dict], model: str, temperature: float) -> str:
    if AI_PROVIDER == "ollama":
        try:
            return await ollama_chat(system, messages, model, temperature)
        except Exception:
            pass
    return local_fallback_reply(system, messages)


def local_fallback_reply(system: str, messages: list[dict]) -> str:
    """Emergency backup that still provides useful persona-aware guidance."""
    scope_name = "assistant"
    for line in system.splitlines():
        clean = line.strip()
        if clean.lower().startswith("- name:"):
            scope_name = clean.split(":", 1)[1].strip() or scope_name
            break

    user_messages = [
        str(item.get("content", "")).strip()
        for item in messages
        if str(item.get("role", "")).lower() == "user"
    ]
    assistant_messages = [
        str(item.get("content", "")).strip()
        for item in messages
        if str(item.get("role", "")).lower() == "assistant"
    ]
    user_text = user_messages[-1] if user_messages else ""
    compact = " ".join((user_text or "your request").split())
    if len(compact) > 220:
        compact = compact[:217] + "..."
    return _contextual_local_reply(scope_name, compact, user_messages, assistant_messages)


def _contextual_local_reply(
    scope_name: str, current_user_text: str, user_messages: list[str], assistant_messages: list[str]
) -> str:
    scope = scope_name.lower()
    text = current_user_text.lower()
    turn_count = len(user_messages)
    repeat_count = _count_recent_same_user_message(user_messages, current_user_text)
    last_assistant = assistant_messages[-1] if assistant_messages else ""

    if "gym" in scope or "fitness" in scope or "workout" in scope:
        if "fat loss" in text or "lose" in text or "weight" in text:
            if repeat_count >= 2:
                return (
                    "Great, here is a practical gym fat-loss setup for this week:\n"
                    "- Training: 4 days (Upper, Lower, Rest, Upper, Lower)\n"
                    "- Cardio: 20-30 min incline walk after 3 sessions\n"
                    "- Steps: 8k-10k/day\n"
                    "- Protein target: 1.8-2.2g per kg bodyweight\n\n"
                    "Send your weight and available gym days and I will convert this into a day-by-day routine."
                )
            return (
                "Strong goal. For gym-based fat loss, focus on:\n"
                "1) Keep lifting heavy enough to preserve muscle\n"
                "2) Add moderate cardio, not excessive cardio\n"
                "3) Keep protein high and sleep consistent\n"
                "4) Track bodyweight trend weekly, not daily fluctuations\n\n"
                "If you want, I can give a 4-day beginner/intermediate fat-loss split now."
            )
        if "suggestion" in text or "plan" in text or "program" in text:
            if turn_count <= 2:
                return (
                    "Here are good gym suggestions to start:\n"
                    "- Pick 4 core lifts: squat/leg press, row, press, hinge\n"
                    "- Use progressive overload (small weight or rep increase weekly)\n"
                    "- Train each muscle group 2x/week\n"
                    "- Keep sessions 45-70 minutes\n\n"
                    "Tell me beginner/intermediate and I will build your exact weekly program."
                )
            return (
                "Let’s make it realistic. Weekly gym template:\n"
                "Day 1: Upper strength\n"
                "Day 2: Lower strength\n"
                "Day 3: Rest + mobility\n"
                "Day 4: Upper hypertrophy\n"
                "Day 5: Lower hypertrophy\n\n"
                "If any movement hurts, I can swap exercises based on your equipment."
            )
        return (
            "Gym focus works best with structure: train consistently, track progression, recover well.\n"
            "Share your goal (fat loss / muscle gain / strength), level, and available days and I will create a personalized plan."
        )

    if "food" in scope or "meal" in scope or "recipe" in scope:
        if "fat loss" in text:
            return (
                "For food + fat loss: prioritize protein each meal, build plates around vegetables, and keep portions consistent.\n"
                "If you share veg/non-veg preference and budget, I’ll give a realistic 7-day meal plan."
            )
        return (
            "Food strategy: simple repeatable meals beat complicated diets.\n"
            "Tell me your goal and constraints, and I’ll design a practical plan."
        )

    if "fashion" in scope or "style" in scope:
        return (
            "Style guidance: start with fit, neutral base pieces, then add one accent layer/accessory.\n"
            "Tell me occasion and budget; I’ll suggest complete outfit combinations."
        )

    if "business" in scope:
        return (
            "Business focus: one clear offer, one clear audience, and weekly metrics (leads, conversion, retention).\n"
            "Share your current bottleneck and I’ll give a prioritized action plan."
        )

    if repeat_count >= 2 and last_assistant:
        return (
            "I hear you — let’s move forward instead of repeating. "
            "Share one specific outcome and constraints, and I’ll provide a concrete step-by-step plan."
        )

    return (
        f"I can help in {scope_name}. Based on \"{current_user_text}\", "
        "share your target outcome and constraints so I can give a focused answer."
    )


def _count_recent_same_user_message(user_messages: list[str], current_text: str) -> int:
    if not user_messages:
        return 0
    target = " ".join(current_text.lower().split())
    count = 0
    for message in reversed(user_messages[-6:]):
        normalized = " ".join(message.lower().split())
        if normalized == target:
            count += 1
        else:
            break
    return count


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "persona-ai",
        "provider": AI_PROVIDER,
        "embedProvider": AI_EMBED_PROVIDER,
        "chatModel": OLLAMA_CHAT_MODEL,
        "embedModel": OLLAMA_EMBED_MODEL,
    }


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
    text = await complete_chat(body.system, body.messages, body.model or CHAT_MODEL, body.temperature)
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
            "provider": "passthrough",
            "audio_url": None,
            "status": "not-configured",
            "config": body.voice_config,
        },
    }


@app.post("/internal/embed")
async def internal_embed(body: EmbedRequest, x_internal_key: str | None = Header(default=None)):
    return await memory_store(body, x_internal_key)


@app.post("/internal/complete")
async def internal_complete(body: CompleteRequest, x_internal_key: str | None = Header(default=None)):
    return await chat_respond(body, x_internal_key)
