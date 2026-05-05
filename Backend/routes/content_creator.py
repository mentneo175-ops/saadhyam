"""
Content Creator Routes
API endpoints for generating marketing content
"""

import logging
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.content_creator_service import generate_content

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/content",
    tags=["Content Creator"]
)


class ContentGenerationRequest(BaseModel):
    """Request model for content generation"""
    business_type: str = Field(..., min_length=1, description="Type of business (e.g., Salon, Restaurant)")
    platform: Literal["instagram", "facebook", "reels"] = Field(..., description="Social media platform")
    goal: Literal["promotion", "engagement", "branding"] = Field(..., description="Content goal")
    tone: Literal["professional", "friendly", "local"] = Field(..., description="Content tone")
    language: Literal["english", "hindi", "telugu"] = Field(..., description="Content language")
    user_input: str = Field(default="", description="Optional raw user description of what they want")


class ContentGenerationResponse(BaseModel):
    """Response model for content generation"""
    status: Literal["success", "error"]
    content: dict | None = None
    message: str | None = None


@router.post("/generate", response_model=ContentGenerationResponse)
async def generate_content_endpoint(request: ContentGenerationRequest):
    """
    Generate marketing content for social media using AI
    
    - **business_type**: Type of business (e.g., "Salon", "Restaurant")
    - **platform**: Social media platform (instagram, facebook, reels)
    - **goal**: Content goal (promotion, engagement, branding)
    - **tone**: Content tone (professional, friendly, local)
    - **language**: Content language (english, hindi, telugu)
    - **user_input**: Optional raw description (e.g., "bike showroom Diwali offer")
    
    Returns:
    - **status**: "success" or "error"
    - **content**: Generated content with headline, caption, subtext, cta, hashtags, and script
    
    The AI will generate context-aware, conversion-focused content that:
    - Understands business type and events (festivals, offers)
    - Creates specific, not generic content
    - Includes clear offers and CTAs
    - Uses real business language
    """
    try:
        logger.info(f"Content generation request: {request.business_type} on {request.platform}")
        if request.user_input:
            logger.info(f"User input: {request.user_input}")
        
        # Convert request to dict
        data = request.model_dump()
        
        # Generate content
        result = generate_content(data)
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result.get("message", "Content generation failed"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Content generation endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint for content creator service"""
    return {
        "service": "Content Creator",
        "status": "operational",
        "features": [
            "Generate social media captions",
            "Generate hashtags",
            "Generate content scripts",
            "Multi-language support",
            "Platform-specific content"
        ]
    }
