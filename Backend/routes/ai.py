from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from models.user import User
from utils.dependencies import get_current_user
from config.database import get_sync_db
from services.history_service import HistoryService
from sqlalchemy.orm import Session
import logging
import httpx

logger = logging.getLogger(__name__)

# Model server configuration
MODEL_SERVER_URL = "http://localhost:9000"
MODEL_SERVER_TIMEOUT = 1200  # 20 minutes timeout for generation (model inference takes time)

router = APIRouter(prefix="/ai", tags=["ai"])


# Request/Response Models
class BusinessAnalysisRequest(BaseModel):
    business_type: str
    location: str


class BusinessAnalysisResponse(BaseModel):
    success: bool
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    growth_plan: dict


class ContentGenerateRequest(BaseModel):
    content_type: str
    tone: str
    language: str
    prompt: str


class ContentGenerateResponse(BaseModel):
    success: bool
    content: str


class WhatsAppMessageRequest(BaseModel):
    message_type: str
    customer_name: str
    service: str
    language: str
    tone: str


class WhatsAppMessageResponse(BaseModel):
    success: bool
    message: str


class WebsiteContentRequest(BaseModel):
    section: str
    business_info: str


class WebsiteContentResponse(BaseModel):
    success: bool
    content: str


class PricingSuggestionRequest(BaseModel):
    service_type: str
    location: str
    experience: str


class PricingSuggestionResponse(BaseModel):
    success: bool
    suggested_price: str
    low: str
    optimal: str
    high: str
    insights: List[str]


class ReviewReplyRequest(BaseModel):
    """Request model for review reply generation (frontend compatibility)"""
    review_text: str
    rating: int
    business_type: str = "Restaurant"
    tone: str = "professional"


class ReviewReplyResponse(BaseModel):
    """Response model for review reply"""
    success: bool
    reply: str
    error: Optional[str] = None


class ReviewHistoryItem(BaseModel):
    """Response model for a single review reply history item"""
    id: int
    review: str
    reply: str
    rating: int
    business_type: str
    tone: str
    created_at: str
    
    class Config:
        from_attributes = True


class ReviewHistoryListResponse(BaseModel):
    """Response model for review reply history list"""
    success: bool
    history: List[ReviewHistoryItem]
    error: Optional[str] = None


@router.post("/generate-review-reply", response_model=ReviewReplyResponse, tags=["Review Reply"])
async def generate_review_reply(
    request: ReviewReplyRequest,
    db: Session = Depends(get_sync_db),
):
    """
    Generate a reply to a customer review using the AI model server
    
    This endpoint is called by the frontend for the review reply feature.
    It forwards requests to the model_server.py running on port 9000.
    
    NO AUTHENTICATION REQUIRED - Anyone can use this endpoint
    
    Args:
        review_text: The customer review text
        rating: Review rating (1-5 stars)
        business_type: Type of business
        tone: Tone of reply (professional, friendly, grateful, apologetic, calm)
        
    Returns:
        Generated reply text
    """
    try:
        logger.info(f"📝 Review Reply Request")
        logger.info(f"   Review: {request.review_text[:50]}...")
        logger.info(f"   Rating: {request.rating}/5")
        logger.info(f"   Business: {request.business_type}")
        logger.info(f"   Tone: {request.tone}")
        
        # Validate inputs
        if not request.review_text or not request.review_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review text cannot be empty"
            )
        
        if request.rating < 1 or request.rating > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be between 1 and 5"
            )
        
        # Build prompt for model
        prompt = f"""Generate a professional {request.tone} reply to this {request.business_type} review ({request.rating}/5 stars):

Review: {request.review_text}

Reply:"""
        
        logger.info(f"🔄 Calling model server at {MODEL_SERVER_URL}/generate")
        
        # Call model server
        async with httpx.AsyncClient(timeout=MODEL_SERVER_TIMEOUT) as client:
            response = await client.post(
                f"{MODEL_SERVER_URL}/generate",
                params={
                    "prompt": prompt,
                    "max_new_tokens": 150
                }
            )
            
            if response.status_code != 200:
                logger.error(f"❌ Model server error ({response.status_code}): {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI model server is not available. Ensure model_server.py is running on port 9000."
                )
            
            result = response.json()
            generated_text = result.get("generated_text", "")
            
            # Clean up the generated reply
            if "Reply:" in generated_text:
                generated_text = generated_text.split("Reply:")[-1].strip()
            
            reply_text = generated_text.strip()
            
            if not reply_text:
                logger.error("❌ Empty reply generated")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Model generated empty reply"
                )
            
            # Save to database
            try:
                HistoryService.save_reply(
                    db=db,
                    user_id=None,  # No user for unauthenticated requests
                    review=request.review_text,
                    rating=request.rating,
                    business_type=request.business_type,
                    reply=reply_text,
                    tone=request.tone
                )
                logger.info(f"✅ Reply saved to database")
            except Exception as e:
                logger.warning(f"⚠️  Failed to save reply to database: {e}")
                # Don't fail the request if we can't save to DB
            
            logger.info(f"✅ Reply generated successfully: {reply_text[:50]}...")
            
            return ReviewReplyResponse(
                success=True,
                reply=reply_text,
                error=None
            )
            
    except httpx.ConnectError:
        logger.error(f"❌ Cannot connect to model server at {MODEL_SERVER_URL}")
        logger.error("   Make sure to run: python model_server.py on port 9000")
        return ReviewReplyResponse(
            success=False,
            reply="",
            error="AI model server is not running. Please start model_server.py on port 9000."
        )
    except httpx.TimeoutException:
        logger.error(f"❌ Model server request timeout after {MODEL_SERVER_TIMEOUT} seconds")
        return ReviewReplyResponse(
            success=False,
            reply="",
            error="Model server request timed out. Please try again."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating review reply: {e}", exc_info=True)
        return ReviewReplyResponse(
            success=False,
            reply="",
            error=f"Failed to generate reply: {str(e)}"
        )


@router.get("/review-reply-history", response_model=ReviewHistoryListResponse, tags=["Review Reply"])
async def get_review_reply_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
    limit: int = 4,
):
    """
    Get review reply history for the current user
    
    Args:
        limit: Number of recent items to return (default 4, max 20)
        
    Returns:
        List of recent review replies for the user
    """
    try:
        if limit > 20:
            limit = 20
            
        logger.info(f"📖 Fetching review reply history for user {current_user.id} (limit: {limit})")
        
        history = HistoryService.get_history(
            db=db,
            user_id=current_user.id,
            limit=limit,
            offset=0
        )
        
        # Convert to response format
        history_items = [
            ReviewHistoryItem(
                id=item.id,
                review=item.review,
                reply=item.reply,
                rating=item.rating,
                business_type=item.business_type,
                tone=item.tone,
                created_at=item.created_at.isoformat() if item.created_at else ""
            )
            for item in history
        ]
        
        logger.info(f"✅ Retrieved {len(history_items)} history items")
        
        return ReviewHistoryListResponse(
            success=True,
            history=history_items,
            error=None
        )
        
    except Exception as e:
        logger.error(f"❌ Error fetching history: {e}", exc_info=True)
        return ReviewHistoryListResponse(
            success=False,
            history=[],
            error=f"Failed to fetch history: {str(e)}"
        )


class SEOKeywordsRequest(BaseModel):
    business_type: str
    location: str


class SEOKeywordsResponse(BaseModel):
    success: bool
    keywords: List[str]
    tips: List[str]
    post_ideas: List[dict]


# Business Analysis AI
@router.post("/business-analysis", response_model=BusinessAnalysisResponse)
async def analyze_business(
    request: BusinessAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """Analyze business and provide insights"""
    try:
        # AI logic here - for now returning mock data
        return BusinessAnalysisResponse(
            success=True,
            strengths=[
                "Strong local presence with 4.8★ rating",
                "Experienced team with 5+ years in business",
                "Good customer retention rate (68%)",
            ],
            weaknesses=[
                "Low online visibility - not ranking on Google Maps",
                "Inconsistent social media posting",
                "No WhatsApp automation for follow-ups",
            ],
            opportunities=[
                "Launch referral program - competitors seeing 30% growth",
                "Start Instagram Reels - high engagement in your area",
                "Optimize Google Maps listing for local searches",
            ],
            growth_plan={
                "week1": {
                    "progress": 100,
                    "tasks": [
                        "Connect accounts",
                        "Import customers",
                        "Set brand voice",
                    ],
                },
                "week2": {
                    "progress": 75,
                    "tasks": ["Launch campaign", "Run offer", "A/B test ads"],
                },
                "week3": {
                    "progress": 25,
                    "tasks": ["Scale ads", "Build email sequence", "Launch loyalty"],
                },
            },
        )
    except Exception as e:
        logger.error(f"Business analysis error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")


# Content Generation
@router.post("/generate-content", response_model=ContentGenerateResponse)
async def generate_content(
    request: ContentGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate AI content"""
    try:
        # AI logic here
        content = f"✨ {request.prompt}\n\nGenerated in {request.language} with {request.tone} tone.\n\n#AI #Content #SaadhyamAI"

        return ContentGenerateResponse(success=True, content=content)
    except Exception as e:
        logger.error(f"Content generation error: {e}")
        raise HTTPException(status_code=500, detail="Content generation failed")


# WhatsApp Message Generation
@router.post("/generate-whatsapp", response_model=WhatsAppMessageResponse)
async def generate_whatsapp_message(
    request: WhatsAppMessageRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate WhatsApp sales message"""
    try:
        message = f"Hi {request.customer_name}! 👋\n\nThank you for your interest in our {request.service} service. I wanted to follow up and see if you have any questions.\n\nWe have slots available this week. Would you like to book an appointment?\n\nBest regards,\nYour Business Team"

        return WhatsAppMessageResponse(success=True, message=message)
    except Exception as e:
        logger.error(f"WhatsApp generation error: {e}")
        raise HTTPException(status_code=500, detail="Message generation failed")


# Website Content Generation
@router.post("/generate-website", response_model=WebsiteContentResponse)
async def generate_website_content(
    request: WebsiteContentRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate website content"""
    try:
        content = f"Generated {request.section} content based on: {request.business_info}\n\nThis is professional, SEO-optimized content for your website."

        return WebsiteContentResponse(success=True, content=content)
    except Exception as e:
        logger.error(f"Website content generation error: {e}")
        raise HTTPException(status_code=500, detail="Website content generation failed")


# Pricing Suggestion
@router.post("/pricing-suggestion", response_model=PricingSuggestionResponse)
async def get_pricing_suggestion(
    request: PricingSuggestionRequest,
    current_user: User = Depends(get_current_user),
):
    """Get AI pricing suggestions"""
    try:
        return PricingSuggestionResponse(
            success=True,
            suggested_price="₹2,500 - ₹3,500",
            low="₹2,000",
            optimal="₹3,000",
            high="₹4,000",
            insights=[
                "Competitors charge ₹2,500-₹3,800",
                "Premium locations can charge 20% more",
                "Offer packages for better value",
            ],
        )
    except Exception as e:
        logger.error(f"Pricing suggestion error: {e}")
        raise HTTPException(status_code=500, detail="Pricing suggestion failed")


# SEO Keywords
@router.post("/seo-keywords", response_model=SEOKeywordsResponse)
async def get_seo_keywords(
    request: SEOKeywordsRequest,
    current_user: User = Depends(get_current_user),
):
    """Get SEO keywords and tips"""
    try:
        return SEOKeywordsResponse(
            success=True,
            keywords=[
                f"best {request.business_type} {request.location}",
                f"{request.business_type} near me",
                f"top {request.business_type} {request.location}",
                f"affordable {request.business_type}",
                f"{request.business_type} services",
            ],
            tips=[
                "Complete your Google Business Profile 100%",
                "Get at least 50+ positive reviews",
                "Post weekly updates with photos",
                "Respond to all reviews within 24 hours",
            ],
            post_ideas=[
                {"title": "Special Offer", "desc": "30% off this week"},
                {"title": "New Service", "desc": "Introducing new services"},
                {"title": "Customer Success", "desc": "See our latest transformations"},
                {"title": "Health Tip", "desc": "Expert tips for you"},
            ],
        )
    except Exception as e:
        logger.error(f"SEO keywords error: {e}")
        raise HTTPException(status_code=500, detail="SEO keywords generation failed")


# ============ Model Server Integration ============

class GenerateRequest(BaseModel):
    """Request model for text generation"""
    prompt: str
    max_new_tokens: int = 128


class GenerateResponse(BaseModel):
    """Response model for text generation"""
    success: bool
    prompt: str
    generated_text: str
    tokens_generated: int
    max_new_tokens: int


async def call_model_server(
    prompt: str,
    max_new_tokens: int = 128,
    timeout: int = MODEL_SERVER_TIMEOUT
) -> Dict[str, Any]:
    """
    Call the model server for text generation
    
    Args:
        prompt: Input prompt for generation
        max_new_tokens: Maximum tokens to generate
        timeout: Request timeout in seconds
        
    Returns:
        Dictionary with generation result
        
    Raises:
        HTTPException: If model server is unavailable or request fails
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            logger.info(f"🔄 Calling model server at {MODEL_SERVER_URL}/generate")
            logger.info(f"   Prompt: {prompt[:100]}...")
            logger.info(f"   Max tokens: {max_new_tokens}")
            
            response = await client.post(
                f"{MODEL_SERVER_URL}/generate",
                params={
                    "prompt": prompt,
                    "max_new_tokens": max_new_tokens
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Model server returned successfully")
                logger.info(f"   Generated tokens: {result.get('tokens_generated', 'unknown')}")
                return result
            elif response.status_code == 503:
                logger.error(f"❌ Model server not ready (503): {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI model server is not ready. Please try again in a moment."
                )
            else:
                logger.error(f"❌ Model server error ({response.status_code}): {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Model server error: {response.text}"
                )
    except httpx.ConnectError as e:
        logger.error(f"❌ Cannot connect to model server at {MODEL_SERVER_URL}")
        logger.error(f"   Make sure to run: python model_server.py")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model server is not available. Please ensure model_server.py is running."
        )
    except httpx.TimeoutException as e:
        logger.error(f"❌ Model server request timeout after {timeout} seconds")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"AI model server request timed out after {timeout} seconds"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error calling model server: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error communicating with AI model server"
        )


async def check_model_server_health() -> bool:
    """
    Check if model server is healthy and model is loaded
    
    Returns:
        True if model server is ready, False otherwise
    """
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{MODEL_SERVER_URL}/")
            if response.status_code == 200:
                data = response.json()
                return data.get("ready", False)
    except Exception as e:
        logger.warning(f"⚠️  Model server health check failed: {e}")
    return False


@router.post("/generate", response_model=GenerateResponse, tags=["AI Model"])
async def generate(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate text using the AI model server
    
    This endpoint forwards the request to the separate model_server.py
    which runs the ML model in an isolated process.
    
    Args:
        request: GenerateRequest with prompt and max_new_tokens
        current_user: Authenticated user (required)
        
    Returns:
        GenerateResponse with generated text
        
    Example:
        ```bash
        curl -X POST http://localhost:8000/ai/generate \\
          -H "Authorization: Bearer YOUR_TOKEN" \\
          -H "Content-Type: application/json" \\
          -d '{
            "prompt": "Write a review reply: Customer said Great service!",
            "max_new_tokens": 100
          }'
        ```
    """
    try:
        logger.info(f"📝 Generate request from user {current_user.id}")
        logger.info(f"   Prompt: {request.prompt[:80]}...")
        
        # Validate prompt
        if not request.prompt or not request.prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prompt cannot be empty"
            )
        
        if len(request.prompt) > 2000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prompt is too long (max 2000 characters)"
            )
        
        # Validate max_new_tokens
        if request.max_new_tokens < 1 or request.max_new_tokens > 512:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="max_new_tokens must be between 1 and 512"
            )
        
        # Call model server
        result = await call_model_server(
            prompt=request.prompt,
            max_new_tokens=request.max_new_tokens
        )
        
        logger.info(f"✅ Generation successful for user {current_user.id}")
        
        return GenerateResponse(
            success=True,
            prompt=request.prompt,
            generated_text=result.get("generated_text", ""),
            tokens_generated=result.get("tokens_generated", 0),
            max_new_tokens=request.max_new_tokens
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"❌ Generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Text generation failed"
        )


@router.get("/model-status", tags=["AI Model"])
async def model_status(
    current_user: User = Depends(get_current_user),
):
    """
    Get AI model server status
    
    Returns:
        Model server health and readiness status
    """
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{MODEL_SERVER_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "status": "healthy",
                    "model_loaded": data.get("model_loaded", False),
                    "model_device": data.get("model_device", "unknown"),
                    "server_url": MODEL_SERVER_URL
                }
            else:
                return {
                    "success": False,
                    "status": "unhealthy",
                    "error": "Model server returned error",
                    "server_url": MODEL_SERVER_URL
                }
    except Exception as e:
        logger.warning(f"⚠️  Cannot reach model server: {e}")
        return {
            "success": False,
            "status": "unreachable",
            "error": f"Cannot connect to model server at {MODEL_SERVER_URL}. Is model_server.py running?",
            "server_url": MODEL_SERVER_URL
        }
