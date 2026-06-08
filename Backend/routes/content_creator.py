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
    platform: str = Field(..., description="Social media platform")
    goal: str = Field(..., description="Content goal")
    tone: str = Field(..., description="Content tone")
    language: str = Field(..., description="Content language (english, hindi, telugu)")
    user_input: str = Field(default="", description="Optional raw user description of what they want")
    
    def __init__(self, **data):
        # Normalize platform
        if 'platform' in data:
            platform = data['platform'].lower()
            platform_map = {
                'instagram': 'instagram',
                'facebook': 'facebook', 
                'reels': 'reels',
                'insta': 'instagram',
                'fb': 'facebook'
            }
            data['platform'] = platform_map.get(platform, 'instagram')
        
        # Normalize goal
        if 'goal' in data:
            goal = data['goal'].lower()
            goal_map = {
                'promotion': 'promotion',
                'engagement': 'engagement',
                'branding': 'branding',
                'promo': 'promotion',
                'brand': 'branding'
            }
            data['goal'] = goal_map.get(goal, 'promotion')
        
        # Normalize language to lowercase and map variants
        if 'language' in data:
            lang = data['language'].lower()
            # Map common variants
            lang_map = {
                'english': 'english',
                'hindi': 'hindi', 
                'telugu': 'telugu',
                'tamil': 'english'  # Fallback Tamil to English for now
            }
            data['language'] = lang_map.get(lang, 'english')
        
        # Normalize tone to lowercase
        if 'tone' in data:
            tone = data['tone'].lower()
            tone_map = {
                'professional': 'professional',
                'friendly': 'friendly',
                'local': 'local',
                'playful': 'playful',
                'bold': 'bold',
                'casual': 'friendly',
                'formal': 'professional'
            }
            data['tone'] = tone_map.get(tone, 'friendly')
            
        super().__init__(**data)


class ContentGenerationResponse(BaseModel):
    """Response model for content generation"""
    status: Literal["success", "error"]
    content: dict | None = None
    message: str | None = None


@router.post("/generate", response_model=ContentGenerationResponse)
def generate_content_endpoint(request: ContentGenerationRequest):
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
        logger.info(f"🚀 Content generation request received")
        logger.info(f"   Business: {request.business_type}")
        logger.info(f"   Platform: {request.platform}")
        logger.info(f"   Goal: {request.goal}")
        logger.info(f"   Tone: {request.tone}")
        logger.info(f"   Language: {request.language}")
        if request.user_input:
            logger.info(f"   User input: {request.user_input}")
        
        # Convert request to dict
        data = request.model_dump()
        logger.info(f"   Normalized data: {data}")
        
        # Generate content
        result = generate_content(data)
        
        if result["status"] == "error":
            logger.error(f"❌ Content generation failed: {result.get('message', 'Unknown error')}")
            raise HTTPException(status_code=500, detail=result.get("message", "Content generation failed"))
        
        logger.info(f"✅ Content generated successfully")
        logger.info(f"   Headline: {result['content']['headline']}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Content generation endpoint error: {e}", exc_info=True)
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
