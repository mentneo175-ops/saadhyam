from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routes.image import router as image_router
from app.services.pipeline import OUTPUT_IMAGE_DIR

load_dotenv()


FRONTEND_DIR = Path(__file__).resolve().parent / "frontend"


app = FastAPI(
    title="Image Generation Microservice",
    version="1.0.0",
    description="Production-ready image generation service for Stable Diffusion and FLUX.1 Schnell.",
)


@app.on_event("startup")
def startup_event() -> None:
    OUTPUT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)


app.mount("/assets", StaticFiles(directory=FRONTEND_DIR), name="assets")
app.include_router(image_router)


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")
