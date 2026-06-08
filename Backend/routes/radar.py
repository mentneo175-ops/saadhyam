"""
Radar AI (Opportunity Radar) Router
API endpoints for proactive business growth opportunities.
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from utils.dependencies import get_current_user
from config.database import get_db
from models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from services.radar_service import radar_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/radar",
    tags=["Radar AI"]
)


class OpportunityActionRequest(BaseModel):
    opportunity_id: int
    status: str  # 'contacted' or 'dismissed' or 'active'


class RadarOpportunityResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    estimated_value: Optional[str] = None
    urgency: str
    distance: Optional[str] = None
    action_label: str
    action_link: Optional[str] = None
    status: str
    created_at: Optional[str] = None


@router.get(
    "/",
    summary="Get Opportunities",
    description="Fetch active opportunities for the business owner"
)
async def get_opportunities(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get active opportunities for the logged-in user.
    """
    try:
        opportunities = await radar_service.get_opportunities(
            user_id=current_user.id,
            db=db,
            category=category,
            status="active"
        )
        return {
            "status": "success",
            "opportunities": opportunities,
            "total": len(opportunities)
        }
    except Exception as e:
        logger.error(f"[RadarRouter] Error fetching opportunities: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve opportunities"
        )


@router.post(
    "/scan",
    summary="Scan for Growth Opportunities",
    description="Trigger a real-time proactive opportunity scan using Google Search / Gemini"
)
async def scan_opportunities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Trigger a scan to identify new opportunities.
    """
    try:
        result = await radar_service.scan_opportunities(user=current_user, db=db)
        if result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("message", "Failed to scan opportunities")
            )
        return result
    except Exception as e:
        logger.error(f"[RadarRouter] Error scanning opportunities: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/action",
    summary="Update Opportunity Status",
    description="Mark an opportunity as contacted or dismissed"
)
async def update_opportunity(
    request: OpportunityActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Perform an action on an opportunity (e.g. contacted or dismissed).
    """
    if request.status not in ["contacted", "dismissed", "active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be 'contacted', 'dismissed', or 'active'."
        )

    try:
        result = await radar_service.update_opportunity_status(
            opportunity_id=request.opportunity_id,
            status=request.status,
            user_id=current_user.id,
            db=db
        )
        if result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.get("message", "Opportunity not found")
            )
        return result
    except Exception as e:
        logger.error(f"[RadarRouter] Error updating opportunity: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
