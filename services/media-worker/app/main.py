"""
Optional Python sidecar for heavier media / diffusion workflows.
The Node API stays the source of truth for auth and chat; call this service from
a worker when you wire image or video generation (OpenAI Images, Replicate, ComfyUI, etc.).
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Persona Media Worker", version="0.1.0")


class ImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    persona_slug: str | None = None


class VideoRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    duration_sec: int | None = Field(default=5, ge=1, le=60)


@app.get("/health")
def health():
    return {"ok": True, "service": "persona-media-worker"}


@app.post("/v1/image")
def generate_image(req: ImageRequest):
    # Stub: replace with OpenAI images.generate, Replicate, or local SD / Flux.
    return {
        "status": "stub",
        "prompt": req.prompt,
        "message": "Implement provider here (Midjourney via API partner, OpenAI, Replicate).",
    }


@app.post("/v1/video")
def generate_video(req: VideoRequest):
    return {
        "status": "stub",
        "prompt": req.prompt,
        "duration_sec": req.duration_sec,
        "message": "Implement FFmpeg + TTS + avatar compositor or a video API (HeyGen/Tavus).",
    }
