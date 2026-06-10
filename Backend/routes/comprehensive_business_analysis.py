"""
Comprehensive Business Analysis Routes
ONE API call populates ALL features - no rate limit issues
"""

import logging
import asyncio
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from utils.dependencies import get_current_user
from config.database import get_db_sync, SyncSessionLocal
from models.user import User
from utils.feature_gate import check_feature_access
from sqlalchemy.orm import Session
from services.comprehensive_business_analysis_service import (
    trigger_comprehensive_analysis,
    run_analysis_background_task,
    get_business_analysis_data,
    get_competitor_analysis_data,
    get_growth_plan_data,
    get_daily_suggestions_data,
    get_seo_google_maps_data,
    get_analysis_status
)
from fastapi.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)


def get_or_create_analyzing_record(
    user_id: int,
    db: Session,
    business_name: str,
    business_type: str,
    business_location: str,
    business_description: str
):
    from db.models import BusinessAnalysis
    existing = db.query(BusinessAnalysis).filter(
        BusinessAnalysis.user_id == user_id
    ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()

    if existing and existing.analysis_status == "analyzing":
        return "already_analyzing", existing.id

    if existing:
        existing.analysis_status = "analyzing"
        db.commit()
        analysis_id = existing.id
    else:
        new_analysis = BusinessAnalysis(
            user_id=user_id,
            analysis_status="analyzing",
            business_name=business_name or "",
            business_type=business_type or "",
            location=business_location or "",
            description=business_description or ""
        )
        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)
        analysis_id = new_analysis.id
    return "started", analysis_id

router = APIRouter(
    prefix="/api/comprehensive-analysis",
    tags=["Comprehensive Business Analysis"]
)


# ============ Response Models ============

class AnalysisStatusResponse(BaseModel):
    """Response model for analysis status"""
    status: str
    message: str
    last_analyzed_at: Optional[str] = None


class TriggerAnalysisResponse(BaseModel):
    """Response model for triggering analysis"""
    status: str
    message: str
    analysis_id: Optional[int] = None


class BusinessAnalysisResponse(BaseModel):
    """Response model for business analysis data"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


# ============ Routes ============

@router.get(
    "/latest",
    response_model=BusinessAnalysisResponse,
    summary="Get latest business analysis (compatibility endpoint)",
    description="Returns the latest comprehensive business analysis for the user"
)
def get_latest_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> BusinessAnalysisResponse:
    """
    Get latest business analysis - compatibility endpoint for frontend
    """
    try:
        # Get business analysis data
        analysis_data = get_business_analysis_data(current_user.id, db)
        
        if not analysis_data or "error" in analysis_data:
            return BusinessAnalysisResponse(
                success=False,
                message="No analysis available. Please trigger analysis first."
            )
        
        return BusinessAnalysisResponse(
            success=True,
            data=analysis_data
        )
    except Exception as e:
        logger.error(f"Error getting latest analysis: {e}")
        return BusinessAnalysisResponse(
            success=False,
            message=str(e)
        )


@router.post(
    "/trigger",
    response_model=TriggerAnalysisResponse,
    summary="Trigger comprehensive business analysis",
    description="Makes ONE Gemini API call and stores ALL results for all features"
)
async def trigger_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> TriggerAnalysisResponse:
    """
    Trigger comprehensive business analysis — RETURNS INSTANTLY.

    Sets status to 'analyzing' in DB immediately, then runs the actual Gemini
    + competitor search + Pinecone storage in a background asyncio task so that
    other requests (including voice call webhooks) are never blocked.
    """

    logger.info(f"[TriggerAnalysis] User {current_user.id} triggered comprehensive analysis")
    # Check feature access
    await check_feature_access(current_user, "business_analysis")

    # Quick validation — no external calls yet
    if not current_user.business_type or not current_user.business_location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your business profile before analyzing"
        )

    # Check for already-running analysis or create new record in thread pool
    status_action, analysis_id = await run_in_threadpool(
        get_or_create_analyzing_record,
        current_user.id,
        db,
        current_user.business_name,
        current_user.business_type,
        current_user.business_location,
        current_user.business_description
    )

    if status_action == "already_analyzing":
        return TriggerAnalysisResponse(
            status="analyzing",
            message="Analysis is already in progress. Please wait...",
            analysis_id=analysis_id
        )

    # Snapshot user data so the background task doesn't touch the
    # request-scoped SQLAlchemy session which will be closed after this request.
    user_snapshot = {
        "id": current_user.id,
        "business_name": current_user.business_name,
        "business_type": current_user.business_type,
        "business_location": current_user.business_location,
        "business_description": current_user.business_description,
    }

    # Spawn the real work as a background task — never blocks the caller
    asyncio.create_task(run_analysis_background_task(user_snapshot, analysis_id))

    logger.info(f"[TriggerAnalysis] Spawned background task for analysis_id={analysis_id}")

    return TriggerAnalysisResponse(
        status="analyzing",
        message="Analysis started! Results will be ready in 1–2 minutes. You can continue using the app.",
        analysis_id=analysis_id
    )


@router.get(
    "/status",
    response_model=AnalysisStatusResponse,
    summary="Get analysis status",
    description="Check if analysis is pending, analyzing, completed, or error"
)
def get_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> AnalysisStatusResponse:
    """
    Get current analysis status for the user
    """
    
    # Call synchronous function (no await)
    result = get_analysis_status(current_user.id, db)
    
    return AnalysisStatusResponse(**result)


@router.get(
    "/business-analysis",
    summary="Get Business Analysis data",
    description="Get strengths, weaknesses, opportunities, and local market insights"
)
def get_business_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Get Business Analysis data from database (no API call)
    
    Returns:
    - Business details
    - Strengths
    - Weaknesses
    - Growth opportunities
    - Local market insights
    - Health score
    """
    
    # Call synchronous function (no await)
    result = get_business_analysis_data(current_user.id, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis found. Please trigger analysis first."
        )
    
    return result


@router.get(
    "/competitor-analysis",
    summary="Get Competitor Analysis data",
    description="Get competitor patterns, market gaps, and differentiation ideas"
)
async def get_competitor_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Get Competitor Analysis data from database (no API call)
    WITH REDIS CACHING for ultra-fast retrieval
    
    Returns:
    - Competitor patterns
    - Market gaps
    - Differentiation ideas
    """
    
    # Call async function (with await)
    result = await get_competitor_analysis_data(current_user.id, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No competitor analysis found. Please trigger analysis first."
        )
    
    return result


@router.get(
    "/growth-plan",
    summary="Get 30-Day Growth Plan",
    description="Get week-by-week growth plan for Dashboard"
)
def get_growth_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Get 30-Day Growth Plan data from database (no API call)
    
    Returns:
    - Week 1-4 action plans
    """
    
    # Call synchronous function (no await)
    result = get_growth_plan_data(current_user.id, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No growth plan found. Please trigger analysis first."
        )
    
    return result


@router.get(
    "/daily-suggestions",
    summary="Get Daily Suggestions",
    description="Get daily action suggestions for Daily Ask feature"
)
async def get_daily_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Get Daily Suggestions data from database (no API call)
    WITH REDIS CACHING for ultra-fast retrieval
    
    Returns:
    - Array of daily action suggestions
    """
    
    # Call async function (with await)
    result = await get_daily_suggestions_data(current_user.id, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No daily suggestions found. Please trigger analysis first."
        )
    
    return result


@router.get(
    "/seo-google-maps",
    summary="Get SEO & Google Maps Tips",
    description="Get keywords, ranking tips, and local visibility ideas"
)
async def get_seo_google_maps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Get SEO & Google Maps Tips data from database (no API call)
    WITH REDIS CACHING for ultra-fast retrieval
    
    Returns:
    - Keywords
    - Ranking tips
    - Local visibility ideas
    """
    
    # Call async function (with await)
    result = await get_seo_google_maps_data(current_user.id, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No SEO tips found. Please trigger analysis first."
        )
    
    return result


@router.get(
    "/health",
    summary="Health check for comprehensive analysis service"
)
async def health_check():
    """Check if comprehensive analysis service is healthy"""
    
    from config.settings import settings
    
    gemini_configured = bool(
        settings.GEMINI_API_KEY and 
        settings.GEMINI_API_KEY != "your_google_ai_studio_api_key_here"
    )
    
    return {
        "status": "healthy",
        "service": "Comprehensive Business Analysis",
        "version": "1.0.0",
        "gemini_configured": gemini_configured,
        "features": [
            "Business Analysis (strengths, weaknesses, opportunities, local insights)",
            "Competitor Analysis (patterns, gaps, differentiation)",
            "30-Day Growth Plan (week-by-week actions)",
            "Daily Suggestions (daily actions)",
            "SEO & Google Maps Tips (keywords, ranking, visibility)"
        ],
        "rate_limit_solution": "ONE API call stores ALL data - no rate limit issues on page loads"
    }
