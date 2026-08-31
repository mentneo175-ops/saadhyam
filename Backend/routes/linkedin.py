"""
LinkedIn Store Solution Routes
Provides API endpoints for LinkedIn OAuth 2.0 connection, status tracking,
real post publishing via official Posts REST API, post history, AI post generation,
and database-backed plugin OAuth application configuration (zero .env dependency).
"""

import logging
import os
import urllib.parse
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from config.settings import settings
from models.user import User
from schemas.linkedin import (
    LinkedInConnectionStatusResponse,
    LinkedInAuthUrlResponse,
    LinkedInPublishPostRequest,
    LinkedInPublishPostResponse,
    LinkedInPostHistoryItem,
    LinkedInGeneratePostRequest,
    LinkedInGeneratePostResponse,
    LinkedInPluginConfigRequest,
    LinkedInPluginConfigResponse,
)
from services.linkedin_service import LinkedInService
from utils.dependencies import get_current_user, get_current_admin_user
from services.content_creator_service import generate_content


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/linkedin",
    tags=["LinkedIn Store Solution"],
)


def get_frontend_base_url() -> str:
    """Determine frontend URL for browser redirects."""
    app_url = os.getenv("APP_URL") or os.getenv("FRONTEND_URL") or "http://localhost:5173"
    return app_url.rstrip("/")


@router.get("/oauth/status", response_model=LinkedInConnectionStatusResponse)
async def get_linkedin_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve safe LinkedIn connection status for authenticated user."""
    status_data = await LinkedInService.get_connection_status(current_user.id, db)
    return status_data


@router.get("/oauth/authorize", response_model=LinkedInAuthUrlResponse)
async def get_linkedin_auth_url(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate official LinkedIn OAuth 2.0 authorization URL using database-backed plugin configuration."""
    auth_data = await LinkedInService.get_authorization_url(current_user.id, db)
    if not auth_data.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=auth_data.get("message", "LinkedIn OAuth Application is not configured for marketing_linkedin. Please configure Client ID and Client Secret."),
        )
    return auth_data


@router.get("/oauth/callback")
async def linkedin_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Official OAuth 2.0 redirect callback endpoint from LinkedIn.
    Validates state, exchanges authorization code, saves encrypted tokens,
    and redirects user back to the Saadhyam Store LinkedIn page.
    """
    frontend_base = get_frontend_base_url()
    target_store_url = f"{frontend_base}/dashboard/store/linkedin-marketing"

    if error:
        err_msg = error_description or error
        logger.warning(f"LinkedIn OAuth error callback: {error} - {err_msg}")
        redirect_url = f"{target_store_url}?error={urllib.parse.quote(err_msg)}"
        return RedirectResponse(url=redirect_url)

    if not code or not state:
        logger.error("Missing code or state parameter in LinkedIn callback")
        redirect_url = f"{target_store_url}?error={urllib.parse.quote('Missing authorization code or state parameter.')}"
        return RedirectResponse(url=redirect_url)

    result = await LinkedInService.handle_oauth_callback(code=code, state=state, db=db)

    if not result.get("success"):
        err_msg = result.get("message", "LinkedIn connection failed.")
        logger.error(f"Failed to complete LinkedIn OAuth: {err_msg}")
        redirect_url = f"{target_store_url}?error={urllib.parse.quote(err_msg)}"
        return RedirectResponse(url=redirect_url)

    logger.info(f"LinkedIn OAuth completed for user_id={result.get('user_id')}. Redirecting to store.")
    redirect_url = f"{target_store_url}?connected=true"
    return RedirectResponse(url=redirect_url)


@router.post("/oauth/disconnect")
async def disconnect_linkedin(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect LinkedIn account and revoke active tokens strictly for authenticated user."""
    return await LinkedInService.disconnect(current_user.id, db)


@router.post("/posts", response_model=LinkedInPublishPostResponse)
async def publish_linkedin_post(
    request: LinkedInPublishPostRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Publish content directly to authenticated member's LinkedIn feed.
    Enforces per-user credentials and REST Posts API.
    """
    content = request.content
    if request.hashtags:
        tag_str = " ".join(
            tag if tag.startswith("#") else f"#{tag}"
            for tag in request.hashtags
            if tag.strip()
        )
        if tag_str and tag_str not in content:
            content = f"{content}\n\n{tag_str}"

    result = await LinkedInService.publish_text_post(
        user_id=current_user.id,
        content=content,
        db=db,
        topic=request.topic,
    )

    if not result.get("success"):
        err_code = result.get("error", "PUBLISH_FAILED")
        status_code = status.HTTP_400_BAD_REQUEST
        if err_code == "UNAUTHORIZED":
            status_code = status.HTTP_401_UNAUTHORIZED
        elif err_code == "FORBIDDEN":
            status_code = status.HTTP_403_FORBIDDEN
        elif err_code == "NOT_CONNECTED":
            status_code = status.HTTP_400_BAD_REQUEST

        raise HTTPException(
            status_code=status_code,
            detail=result.get("message", "Failed to publish post to LinkedIn."),
        )

    return LinkedInPublishPostResponse(
        success=True,
        message=result.get("message", "Post published successfully!"),
        post_urn=result.get("post_urn"),
        post_id=result.get("post_id"),
        published_at=result.get("published_at"),
    )


@router.get("/posts/history", response_model=List[LinkedInPostHistoryItem])
async def get_linkedin_post_history(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve post publishing audit history for authenticated user."""
    return await LinkedInService.get_post_history(current_user.id, db, limit=limit)


@router.get("/config", response_model=LinkedInPluginConfigResponse)
async def get_linkedin_plugin_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve safe status of the LinkedIn OAuth application configuration for marketing_linkedin."""
    return await LinkedInService.get_plugin_config_status(db)


@router.post("/config", response_model=LinkedInPluginConfigResponse)
async def save_linkedin_plugin_config(
    config_req: LinkedInPluginConfigRequest,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Save or update LinkedIn OAuth application credentials for marketing_linkedin (Admin Only)."""

    if not config_req.client_id or not config_req.client_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both client_id and client_secret are required.",
        )
    result = await LinkedInService.set_plugin_config(
        client_id=config_req.client_id,
        client_secret=config_req.client_secret,
        db=db,
        redirect_uri=config_req.redirect_uri,
        is_active=config_req.is_active if config_req.is_active is not None else True,
    )
    return LinkedInPluginConfigResponse(
        configured=result.get("configured", True),
        plugin_key="marketing_linkedin",
        client_id=result.get("client_id"),
        redirect_uri=result.get("redirect_uri"),
        is_active=result.get("is_active", True),
        is_secret_set=True,
        message="LinkedIn OAuth application configuration saved successfully.",
    )


@router.post("/generate", response_model=LinkedInGeneratePostResponse)
async def generate_linkedin_post_endpoint(
    request: LinkedInGeneratePostRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate professional LinkedIn post content using existing Saadhyam text-generation service.
    Direct API call without chatbot dependency.
    """
    try:
        raw_output = await generate_content(
            topic=request.topic,
            platform="LinkedIn",
            tone=request.tone or "Professional",
            goal=request.goal or "Brand Awareness",
            company_name=request.company_name,
            brand_name=request.brand_name,
            industry=request.industry,
            target_audience=request.target_audience,
            key_points=request.key_points,
            call_to_action=request.call_to_action,
            desired_length=request.desired_length or "Medium",
            template=request.template or "Thought Leadership",
            hashtag_count=request.hashtag_count or 5,
        )

        formatted_post = ""
        headline = None
        body = None
        hashtags = []

        if isinstance(raw_output, dict):
            formatted_post = raw_output.get("formatted_post") or raw_output.get("content") or raw_output.get("post", "")
            headline = raw_output.get("headline")
            body = raw_output.get("body")
            hashtags = raw_output.get("hashtags", [])
        elif isinstance(raw_output, str):
            formatted_post = raw_output

        if not formatted_post:
            brand = request.brand_name or request.company_name or "Our Team"
            headline = f"Driving Growth & Innovation: Reflections on {request.topic}"
            body = (
                f"How is your organization navigating {request.topic}?\n\n"
                f"At {brand}, we focus on:\n"
                f"1. Clarity of mission\n"
                f"2. Velocity of execution\n"
                f"3. Delivering value to our customers\n\n"
                f"What strategies are working best for you? Let's discuss."
            )
            hashtags = ["#Leadership", "#Innovation", "#Growth", "#Strategy", "#LinkedIn"]
            formatted_post = f"{headline}\n\n{body}\n\n{' '.join(hashtags)}"

        return LinkedInGeneratePostResponse(
            success=True,
            formatted_post=formatted_post.strip(),
            headline=headline,
            body=body,
            hashtags=hashtags or [],
            message="LinkedIn post generated successfully.",
        )
    except Exception as e:
        logger.error(f"Error generating LinkedIn post with AI: {e}", exc_info=True)
        brand = request.brand_name or request.company_name or "Our Team"
        headline = f"Strategic Insights on {request.topic}"
        body = (
            f"Delivering consistent results requires focused execution and constant adaptation.\n\n"
            f"Key priorities for {brand}:\n"
            f"ΓÇó Accelerating delivery\n"
            f"ΓÇó Building scalable processes\n"
            f"ΓÇó Fostering team excellence\n\n"
            f"How does your team approach this?"
        )
        hashtags = ["#Leadership", "#Management", "#Innovation", "#BusinessStrategy"]
        formatted_post = f"≡ƒÆ╝ {headline}\n\n{body}\n\n{' '.join(hashtags)}"

        return LinkedInGeneratePostResponse(
            success=True,
            formatted_post=formatted_post.strip(),
            headline=headline,
            body=body,
            hashtags=hashtags,
            message="Generated using fallback template.",
        )