"""
Competitor Intelligence AI Router
API endpoints for managing and scanning competitor intelligence metrics.
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from utils.dependencies import get_current_user
from config.database import get_db
from models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from services.competitor_intelligence_service import competitor_intelligence_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/competitor-intelligence",
    tags=["Competitor Intelligence AI"]
)


class AddCompetitorRequest(BaseModel):
    name: str
    location: Optional[str] = None
    website_or_social: Optional[str] = None


@router.get(
    "/",
    summary="Get Tracked Competitors",
    description="Fetch list of all competitors currently monitored by the user"
)
async def get_competitors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get all tracked competitors.
    """
    try:
        competitors = await competitor_intelligence_service.get_competitors(
            user_id=current_user.id,
            db=db
        )
        return {
            "status": "success",
            "competitors": competitors,
            "total": len(competitors)
        }
    except Exception as e:
        logger.error(f"[CompetitorRouter] Error fetching competitors: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve monitored competitors"
        )


@router.get(
    "/suggestions/search",
    summary="Get Competitor Suggestions",
    description="Return autocomplete suggestions for competitor names based on user business type"
)
async def get_competitor_suggestions(
    q: str = "",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Return a list of suggested competitor names relevant to the user's business type.
    IMPORTANT: This route MUST be declared before /{competitor_id} so FastAPI doesn't
    try to cast 'suggestions' as an integer and return a 422.
    """
    try:
        business_type = getattr(current_user, "business_type", None) or "local business"
        suggestions = competitor_intelligence_service.suggest_competitors(
            business_type=business_type,
            query=q
        )
        return {
            "status": "success",
            "suggestions": suggestions,
            "business_type": business_type
        }
    except Exception as e:
        logger.error(f"[CompetitorRouter] Error fetching suggestions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get competitor suggestions"
        )


@router.get(
    "/{competitor_id}",
    summary="Get Competitor Details",
    description="Fetch detailed tracking metrics for a monitored competitor"
)
async def get_competitor_details(
    competitor_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Fetch specific competitor details.
    """
    try:
        details = await competitor_intelligence_service.get_competitor(
            user_id=current_user.id,
            competitor_id=competitor_id,
            db=db
        )
        if not details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Competitor not found or does not belong to user"
            )
        return {
            "status": "success",
            "competitor": details
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CompetitorRouter] Error fetching competitor details: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve competitor details"
        )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Add Competitor to Track",
    description="Add a competitor, triggering a real-time web scan using Gemini"
)
async def add_competitor(
    request: AddCompetitorRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Track a new competitor.
    """
    if not request.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Competitor name is required."
        )

    try:
        result = await competitor_intelligence_service.add_competitor(
            user=current_user,
            name=request.name.strip(),
            location=request.location,
            website_or_social=request.website_or_social,
            db=db
        )
        if result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("message", "Failed to add competitor")
            )
        return result
    except Exception as e:
        logger.error(f"[CompetitorRouter] Error adding competitor: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete(
    "/{competitor_id}",
    summary="Remove Competitor",
    description="Delete a competitor from tracking and remove their analysis records"
)
async def delete_competitor(
    competitor_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete a tracked competitor.
    """
    try:
        result = await competitor_intelligence_service.delete_competitor(
            user_id=current_user.id,
            competitor_id=competitor_id,
            db=db
        )
        if result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.get("message", "Competitor not found")
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CompetitorRouter] Error deleting competitor: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


