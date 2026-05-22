"""
Comprehensive Business Analysis Routes
ONE API call populates ALL features - no rate limit issues
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from utils.dependencies import get_current_user
from config.database import get_db_sync
from models.user import User
from sqlalchemy.orm import Session
from services.comprehensive_business_analysis_service import (
    trigger_comprehensive_analysis,
    get_business_analysis_data,
    get_competitor_analysis_data,
    get_growth_plan_data,
    get_daily_suggestions_data,
    get_seo_google_maps_data,
    get_analysis_status
)

logger = logging.getLogger(__name__)

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
async def get_latest_analysis(
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
    Trigger comprehensive business analysis
    
    This makes ONE Gemini API call with Google Search grounding and stores:
    - Business Analysis data (strengths, weaknesses, opportunities, local insights)
    - Competitor Analysis data
    - 30-Day Growth Plan (for Dashboard)
    - Daily Suggestions (for Daily Ask)
    - SEO & Google Maps Tips
    
    Takes 2-3 minutes but avoids all rate limit issues
    """
    
    logger.info(f"[TriggerAnalysis] User {current_user.id} triggered comprehensive analysis")
    
    # Call async function (with await)
    result = await trigger_comprehensive_analysis(current_user, db)
    
    if result["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )
    
    return TriggerAnalysisResponse(**result)


@router.get(
    "/status",
    response_model=AnalysisStatusResponse,
    summary="Get analysis status",
    description="Check if analysis is pending, analyzing, completed, or error"
)
async def get_status(
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
async def get_business_analysis(
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
async def get_growth_plan(
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
