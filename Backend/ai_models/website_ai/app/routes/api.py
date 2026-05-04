"""Enhanced API routes for website management"""
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request, status, Body
from typing import Dict, Any
import os

from ai_models.website_ai.app.models.schema import (
    BusinessDetailsInput,
    WebsiteResponse,
    StoredWebsite,
    WebsiteListItem,
)
from ai_models.website_ai.app.services.pipeline import run_website_pipeline
from ai_models.website_ai.app.services.template_service import list_themes, generate_demo
from ai_models.website_ai.app.services.database import (
    save_website,
    get_all_websites,
    get_website,
    delete_website,
    update_website,
    save_content,
    get_content,
)


router = APIRouter(tags=["api"], prefix="/api")


@router.post(
    "/websites",
    response_model=StoredWebsite,
    status_code=status.HTTP_201_CREATED,
)
def create_website(
    business_details: BusinessDetailsInput,
    request: Request,
    theme: str = None,
) -> StoredWebsite:
    """Create a new website with detailed business information"""
    try:
        # Convert to WebsiteRequest format for pipeline
        from ai_models.website_ai.app.models.schema import WebsiteRequest

        website_request = WebsiteRequest(
            business_name=business_details.business_name,
            business_type=business_details.business_type,
            theme=theme,
        )

        # Enable fake LLM for generation
        orig_flag = os.environ.get("WEBSITE_AI_USE_FAKE_LLM")
        os.environ["WEBSITE_AI_USE_FAKE_LLM"] = "true"

        try:
            result = run_website_pipeline(website_request)
        finally:
            if orig_flag is None:
                os.environ.pop("WEBSITE_AI_USE_FAKE_LLM", None)
            else:
                os.environ["WEBSITE_AI_USE_FAKE_LLM"] = orig_flag

        # Save to database
        html_file = Path(result["file_path"]).name
        stored_website = save_website(
            business_details=business_details,
            theme=result["theme_used"],
            html_file=html_file,
        )

        return stored_website

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Website creation failed.",
        ) from exc


@router.get(
    "/websites",
    response_model=list[WebsiteListItem],
)
def list_websites() -> list[WebsiteListItem]:
    """Get all stored websites"""
    try:
        return get_all_websites()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve websites.",
        ) from exc


@router.get(
    "/websites/{website_id}",
    response_model=StoredWebsite,
)
def get_website_details(website_id: str) -> StoredWebsite:
    """Get details of a specific website"""
    try:
        website = get_website(website_id)
        if not website:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Website not found.",
            )
        return website
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve website.",
        ) from exc


@router.put(
    "/websites/{website_id}",
    response_model=StoredWebsite,
)
def update_website_details(
    website_id: str,
    business_details: BusinessDetailsInput,
    theme: str = None,
) -> StoredWebsite:
    """Update a website with new details"""
    try:
        # Generate new website with updated details
        from ai_models.website_ai.app.models.schema import WebsiteRequest

        website_request = WebsiteRequest(
            business_name=business_details.business_name,
            business_type=business_details.business_type,
            theme=theme,
        )

        orig_flag = os.environ.get("WEBSITE_AI_USE_FAKE_LLM")
        os.environ["WEBSITE_AI_USE_FAKE_LLM"] = "true"

        try:
            result = run_website_pipeline(website_request)
        finally:
            if orig_flag is None:
                os.environ.pop("WEBSITE_AI_USE_FAKE_LLM", None)
            else:
                os.environ["WEBSITE_AI_USE_FAKE_LLM"] = orig_flag

        # Update in database
        updated_website = update_website(
            website_id=website_id,
            business_details=business_details,
            theme=result["theme_used"],
        )

        if not updated_website:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Website not found.",
            )

        return updated_website

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Website update failed.",
        ) from exc


@router.delete(
    "/websites/{website_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_website_record(website_id: str) -> None:
    """Delete a website record"""
    try:
        if not delete_website(website_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Website not found.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete website.",
        ) from exc


@router.get("/themes")
def get_available_themes() -> dict:
    """Get list of available themes"""
    try:
        themes = list_themes()
        return {"themes": themes}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve themes.",
        ) from exc


@router.get("/templates")
def get_available_templates() -> dict:
    """Get list of available default templates with previews"""
    try:
        templates = []
        theme_list = list_themes()

        for theme in theme_list:
            try:
                # Generate demo for each theme
                file_path = generate_demo(theme)
                file_name = Path(file_path).name
                preview_url = f"/website-ai/output/{file_name}"

                templates.append({
                    "name": theme.capitalize(),
                    "theme": theme,
                    "preview_url": preview_url,
                    "description": get_template_description(theme)
                })
            except Exception:
                continue

        return {"templates": templates}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve templates.",
        ) from exc


def get_template_description(theme: str) -> str:
    """Get description for each template"""
    descriptions = {
        "hero-split": "Full-screen split layout with hero section - Perfect for SaaS and tech startups",
        "card-masonry": "Dark theme with masonry card grid - Ideal for creative agencies and portfolios",
        "timeline-vertical": "Elegant timeline layout with sidebar navigation - Great for storytelling and services",
        "magazine-grid": "Bold magazine-style grid layout - Perfect for media and content-heavy sites",
        "bento-box": "Apple-inspired bento box grid - Modern and clean for product showcases",
        "parallax-scroll": "Futuristic parallax scrolling experience - Eye-catching for tech companies",
    }
    return descriptions.get(theme, "Professional business template")


@router.post("/content/{website_id}")
async def update_content(
    website_id: str,
    payload: Dict[str, Any] = Body(...)
) -> dict:
    """Update website content via inline editor"""
    try:
        content = payload.get("content", {})
        theme = payload.get("theme")

        saved = save_content(website_id, content, theme)

        return {
            "success": True,
            "message": "Content updated successfully",
            "website_id": website_id,
            "updated_at": saved.get("updated_at")
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update content: {str(exc)}",
        ) from exc


@router.get("/content/{website_id}")
async def get_website_content(website_id: str) -> dict:
    """Get website content for inline editor"""
    try:
        content = get_content(website_id)

        if content is None:
            # Return empty structure if no content exists yet
            return {
                "website_id": website_id,
                "content": {},
                "theme": None
            }

        return content
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve content: {str(exc)}",
        ) from exc

