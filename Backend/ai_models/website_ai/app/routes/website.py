from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import FileResponse
import os

from ai_models.website_ai.app.models.schema import WebsiteRequest, WebsiteResponse
from ai_models.website_ai.app.services.pipeline import run_website_pipeline
from ai_models.website_ai.app.services.template_service import generate_demo, list_themes


router = APIRouter(tags=["website"])
TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "templates"


@router.post(
    "/generate-website",
    response_model=WebsiteResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_website(payload: WebsiteRequest, request: Request, use_demo: bool = False) -> WebsiteResponse:
    try:
        # Optionally enable the safe fallback LLM for local/demo runs
        orig_flag = os.environ.get("WEBSITE_AI_USE_FAKE_LLM")
        if use_demo:
            os.environ["WEBSITE_AI_USE_FAKE_LLM"] = "true"
        try:
            result = run_website_pipeline(payload)
        finally:
            # restore original env var state
            if use_demo:
                if orig_flag is None:
                    os.environ.pop("WEBSITE_AI_USE_FAKE_LLM", None)
                else:
                    os.environ["WEBSITE_AI_USE_FAKE_LLM"] = orig_flag
        file_name = Path(result["file_path"]).name
        output_url = request.url_for("website_ai_output", path=file_name)
        return WebsiteResponse(theme=result["theme_used"], url=str(output_url))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Website generation failed.",
        ) from exc


@router.get(
    "/",
    include_in_schema=False,
)
def website_ai_index() -> FileResponse:
    """Serve the Website AI UI."""
    return FileResponse(TEMPLATES_DIR / "index.html", media_type="text/html")


@router.get(
    "/templates",
    include_in_schema=False,
)
def templates_gallery() -> FileResponse:
    """Serve the template gallery UI."""
    return FileResponse(TEMPLATES_DIR / "template-gallery.html", media_type="text/html")


@router.get(
    "/templates.json",
)
def templates(request: Request) -> dict:
    """Return available template demos and their preview URLs."""
    themes = list_themes()
    previews: list[dict] = []
    for theme in themes:
        try:
            file_path = generate_demo(theme)
            file_name = Path(file_path).name
            preview_url = request.url_for("website_ai_output", path=file_name)
            previews.append({"theme": theme, "preview_url": str(preview_url)})
        except Exception:
            # Skip a theme if demo generation fails
            continue
    return {"templates": previews}

