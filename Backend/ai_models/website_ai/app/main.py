from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import logging

from ai_models.website_ai.app.routes.website import router as website_router
from ai_models.website_ai.app.routes.api import router as api_router
from ai_models.website_ai.app.services.template_service import OUTPUT_DIR, generate_demo, list_themes

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Website AI Microservice",
    description="Generate structured, template-rendered business websites with an LLM.",
    version="1.0.0",
)


@app.on_event("startup")
async def startup_event():
    """Generate demo files for all templates on startup"""
    logger.info("Generating demo files for all templates...")
    themes = list_themes()
    for theme in themes:
        try:
            demo_path = generate_demo(theme)
            logger.info(f"Generated demo for {theme}: {demo_path}")
        except Exception as e:
            logger.error(f"Failed to generate demo for {theme}: {e}")
    logger.info("Demo generation complete!")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output_files")

# Mount static files for editor
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static_files")

# Get the templates directory
TEMPLATES_DIR = Path(__file__).parent / "templates"


@app.get("/", tags=["root"])
async def root():
    """Serve the frontend UI"""
    return FileResponse(TEMPLATES_DIR / "index.html", media_type="text/html")


@app.get("/templates", tags=["root"])
async def templates_gallery():
    """Serve the template gallery page"""
    return FileResponse(TEMPLATES_DIR / "template-gallery.html", media_type="text/html")


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate-demos", tags=["admin"])
async def generate_all_demos():
    """Generate demo files for all templates"""
    from ai_models.website_ai.app.services.template_service import generate_demo, list_themes

    themes = list_themes()
    results = []

    for theme in themes:
        try:
            demo_path = generate_demo(theme)
            results.append({
                "theme": theme,
                "status": "success",
                "path": demo_path
            })
        except Exception as e:
            results.append({
                "theme": theme,
                "status": "error",
                "error": str(e)
            })

    return {
        "message": "Demo generation complete",
        "results": results
    }


app.include_router(website_router)
app.include_router(api_router)

