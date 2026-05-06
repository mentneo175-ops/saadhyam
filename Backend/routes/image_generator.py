"""
Image Generator Routes
API endpoints for generating marketing images
"""

import logging
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.image_generator_service import generate_image

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/image",
    tags=["Image Generator"]
)


class ImageGenerationRequest(BaseModel):
    """Request model for image generation"""
    business_type: str = Field(..., min_length=1, description="Type of business (e.g., Salon, Restaurant)")
    use_case: Literal["poster", "product", "banner"] = Field(..., description="Image use case")
    offer: str = Field(default="", description="Special offer or message (e.g., '20% discount')")
    style: Literal["modern", "premium", "vibrant"] = Field(..., description="Image style")
    model: Literal["flux", "sd"] = Field(..., description="Image generation model (flux or sd)")


class ImageGenerationResponse(BaseModel):
    """Response model for image generation"""
    status: Literal["success", "error"]
    raw_image_url: str | None = None
    final_image_url: str | None = None
    image_url: str | None = None  # Backward compatibility
    model_used: str | None = None
    enhanced_prompt: str | None = None
    negative_prompt: str | None = None
    headline: str | None = None
    subheadline: str | None = None
    cta: str | None = None
    message: str | None = None


@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image_endpoint(request: ImageGenerationRequest):
    """
    Generate marketing images using AI with text overlay
    
    - **business_type**: Type of business (e.g., "Salon", "Restaurant")
    - **use_case**: Image use case (poster, product, banner)
    - **offer**: Special offer or message (optional)
    - **style**: Image style (modern, premium, vibrant)
    - **model**: Image generation model (flux or sd)
    
    Returns:
    - **status**: "success" or "error"
    - **raw_image_url**: URL to background image (without text)
    - **final_image_url**: URL to final poster (with text overlay)
    - **image_url**: Same as final_image_url (backward compatibility)
    - **model_used**: Model used for generation
    - **enhanced_prompt**: Enhanced image prompt used
    - **negative_prompt**: Negative prompt used
    - **headline**: Marketing headline
    - **subheadline**: Supporting text
    - **cta**: Call-to-action text
    """
    try:
        logger.info(f"Image generation request: {request.business_type} using {request.model}")
        
        # Convert request to dict
        data = request.model_dump()
        
        # Generate image with text overlay
        result = generate_image(data)
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result.get("message", "Image generation failed"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image generation endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint for image generator service"""
    return {
        "service": "Image Generator",
        "status": "operational",
        "models": ["flux", "sd"],
        "features": [
            "Generate marketing posters",
            "Generate product images",
            "Generate banners",
            "Multiple style options",
            "FLUX and Stable Diffusion support"
        ]
    }
