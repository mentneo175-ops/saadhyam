"""
Review Reply Routes
API endpoints for generating and managing review replies
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Path
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from config.database import get_sync_db
from services.history_service import HistoryService
import httpx

logger = logging.getLogger(__name__)

# Model server configuration
MODEL_SERVER_URL = "http://localhost:9000"
MODEL_SERVER_TIMEOUT = 1200  # 20 minutes timeout (model inference takes time)

router = APIRouter(
    prefix="/api/review-reply",
    tags=["Review Reply"]
)


# ============ Pydantic Models ============

class GenerateReplyRequest(BaseModel):
    """Request model for generating reply"""
    review: str = Field(..., min_length=10, max_length=2000, description="Customer review text")
    rating: int = Field(..., ge=1, le=5, description="Review rating (1-5)")
    business_type: str = Field(..., min_length=2, max_length=100, description="Type of business")
    tone: str = Field(default="professional", description="Tone of reply")
    
    class Config:
        example = {
            "review": "Great service but a bit slow",
            "rating": 4,
            "business_type": "Restaurant",
            "tone": "grateful"
        }


class GenerateReplyResponse(BaseModel):
    """Response model for generated reply"""
    success: bool
    reply: Optional[str]
    business_type: str
    rating: int
    tone: str
    error: Optional[str] = None
    
    class Config:
        example = {
            "success": True,
            "reply": "Thank you for your feedback! We appreciate your kind words...",
            "business_type": "Restaurant",
            "rating": 4,
            "tone": "grateful",
            "error": None
        }


class HistoryItem(BaseModel):
    """History item model"""
    id: int
    review: str
    reply: str
    rating: int
    business_type: str
    tone: str
    created_at: str
    is_helpful: Optional[bool] = None
    
    class Config:
        from_attributes = True


class FeedbackRequest(BaseModel):
    """Request model for saving feedback"""
    is_helpful: bool
    feedback: Optional[str] = None


class StatsResponse(BaseModel):
    """Statistics response model"""
    total_replies: int
    helpful_replies: int
    helpful_percentage: float
    by_rating: dict


# ============ Routes ============

@router.post(
    "/generate-reply",
    response_model=GenerateReplyResponse,
    summary="Generate a reply to a customer review",
    responses={
        200: {"description": "Reply generated successfully"},
        400: {"description": "Invalid request"},
        500: {"description": "Server error"}
    }
)
async def generate_reply_endpoint(
    request: GenerateReplyRequest,
    db: Session = Depends(get_sync_db)
) -> GenerateReplyResponse:
    """
    Generate a professional reply to a customer review
    
    - **review**: Customer review text (10-2000 characters)
    - **rating**: Review rating from 1 to 5
    - **business_type**: Type of business (e.g., Restaurant, Hotel, E-commerce)
    - **tone**: Tone of reply (professional, friendly, calm, grateful, apologetic)
    """
    
    try:
        logger.info(f"📝 Generating reply for {request.business_type} review")
        logger.info(f"   Review: {request.review[:50]}...")
        logger.info(f"   Rating: {request.rating}/5")
        logger.info(f"   Tone: {request.tone}")
        
        # Build prompt for model
        prompt = f"""Generate a professional {request.tone} reply to this {request.business_type} review ({request.rating}/5 stars):

Review: {request.review}

Reply:"""
        
        # Call model server
        logger.info(f"🔄 Calling model server at {MODEL_SERVER_URL}/generate")
        try:
            async with httpx.AsyncClient(timeout=MODEL_SERVER_TIMEOUT) as client:
                response = await client.post(
                    f"{MODEL_SERVER_URL}/generate",
                    params={
                        "prompt": prompt,
                        "max_new_tokens": 150
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"❌ Model server error ({response.status_code})")
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
                
                logger.info(f"✅ Reply generated successfully")
                
                # Save to database
                logger.info("💾 Saving to database...")
                HistoryService.save_reply(
                    db=db,
                    user_id=None,
                    review=request.review,
                    rating=request.rating,
                    business_type=request.business_type,
                    reply=reply_text,
                    tone=request.tone
                )
                
                logger.info("✅ Reply saved to database")
                
                return GenerateReplyResponse(
                    success=True,
                    reply=reply_text,
                    business_type=request.business_type,
                    rating=request.rating,
                    tone=request.tone,
                    error=None
                )
                
        except httpx.ConnectError:
            logger.error(f"❌ Cannot connect to model server at {MODEL_SERVER_URL}")
            logger.error("   Make sure to run: python model_server.py on port 9000")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI model server is not running. Please start model_server.py on port 9000."
            )
        except httpx.TimeoutException:
            logger.error(f"❌ Model server request timeout after {MODEL_SERVER_TIMEOUT} seconds")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Model server request timed out. Please try again."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating reply: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate reply"
        )


@router.get(
    "/history",
    response_model=List[HistoryItem],
    summary="Get reply history",
    responses={
        200: {"description": "History retrieved successfully"},
        500: {"description": "Server error"}
    }
)
async def get_history(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_sync_db)
) -> List[HistoryItem]:
    """
    Get the last generated replies
    
    - **limit**: Number of records to return (default: 20)
    - **offset**: Offset for pagination (default: 0)
    """
    
    try:
        logger.info(f"📖 Fetching history (limit: {limit}, offset: {offset})")
        
        history = HistoryService.get_history(
            db=db,
            user_id=None,
            limit=limit,
            offset=offset
        )
        
        return [
            HistoryItem(
                id=h.id,
                review=h.review,
                reply=h.reply,
                rating=h.rating,
                business_type=h.business_type,
                tone=h.tone,
                created_at=h.created_at.isoformat(),
                is_helpful=h.is_helpful
            )
            for h in history
        ]
        
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch history"
        )


@router.get(
    "/history/business/{business_type}",
    response_model=List[HistoryItem],
    summary="Get history for specific business type"
)
async def get_history_by_business(
    business_type: str = Path(...),
    limit: int = 20,
    db: Session = Depends(get_sync_db)
) -> List[HistoryItem]:
    """
    Get replies for a specific business type
    
    - **business_type**: Type of business (e.g., Restaurant, Hotel)
    - **limit**: Number of records to return (default: 20)
    """
    
    try:
        logger.info(f"📖 Fetching history for {business_type}")
        
        history = HistoryService.get_history_by_business(
            db=db,
            business_type=business_type,
            limit=limit
        )
        
        return [
            HistoryItem(
                id=h.id,
                review=h.review,
                reply=h.reply,
                rating=h.rating,
                business_type=h.business_type,
                tone=h.tone,
                created_at=h.created_at.isoformat(),
                is_helpful=h.is_helpful
            )
            for h in history
        ]
        
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch history"
        )


@router.get(
    "/history/rating/{rating}",
    response_model=List[HistoryItem],
    summary="Get history for specific rating"
)
async def get_history_by_rating(
    rating: int = Path(..., ge=1, le=5),
    limit: int = 20,
    db: Session = Depends(get_sync_db)
) -> List[HistoryItem]:
    """
    Get replies for a specific rating
    
    - **rating**: Review rating (1-5)
    - **limit**: Number of records to return (default: 20)
    """
    
    try:
        logger.info(f"📖 Fetching history for rating {rating}")
        
        history = HistoryService.get_history_by_rating(
            db=db,
            rating=rating,
            limit=limit
        )
        
        return [
            HistoryItem(
                id=h.id,
                review=h.review,
                reply=h.reply,
                rating=h.rating,
                business_type=h.business_type,
                tone=h.tone,
                created_at=h.created_at.isoformat(),
                is_helpful=h.is_helpful
            )
            for h in history
        ]
        
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch history"
        )


@router.post(
    "/feedback/{history_id}",
    response_model=dict,
    summary="Save feedback on generated reply"
)
async def save_feedback(
    history_id: int = Path(...),
    feedback: FeedbackRequest = None,
    db: Session = Depends(get_sync_db)
) -> dict:
    """
    Save user feedback on a generated reply
    
    - **history_id**: ID of the history record
    - **is_helpful**: Whether the reply was helpful
    - **feedback**: Optional feedback text
    """
    
    try:
        logger.info(f"💬 Saving feedback for history {history_id}")
        
        HistoryService.save_feedback(
            db=db,
            history_id=history_id,
            is_helpful=feedback.is_helpful,
            feedback=feedback.feedback
        )
        
        return {
            "success": True,
            "message": "Feedback saved successfully"
        }
        
    except ValueError as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save feedback"
        )


@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="Get statistics"
)
async def get_stats(db: Session = Depends(get_sync_db)) -> StatsResponse:
    """Get statistics about generated replies"""
    
    try:
        logger.info("📊 Fetching statistics")
        
        stats = HistoryService.get_stats(db=db)
        
        return StatsResponse(**stats)
        
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch statistics"
        )


@router.get(
    "/health",
    summary="Health check"
)
async def health_check() -> dict:
    """Check if Review Reply AI is healthy"""
    
    return {
        "status": "healthy",
        "service": "Review Reply AI",
        "version": "1.0.0"
    }
