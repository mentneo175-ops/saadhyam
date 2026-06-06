"""
Business Analysis Routes (Gemini-powered)
Uses Google AI Studio Gemini API with Google Search grounding
REPLACES the old TinyLlama local model for Business Analysis
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from config.database import get_db_sync
from utils.dependencies import get_current_user
from models.user import User
from services.gemini_business_analysis_service import generate_realtime_business_analysis
from services.business_pinecone_service import store_business_analysis_in_pinecone
from utils.feature_gate import check_feature_access

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/business/analysis",
    tags=["Business Analysis (Gemini)"]
)


# ============ Response Models ============

class BusinessAnalysisResponse(BaseModel):
    """Response model for Gemini business analysis"""
    status: str
    source: str
    business_details: Optional[Dict[str, Any]] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    growth_opportunities: Optional[List[str]] = None
    local_market_insights: Optional[Dict[str, Any]] = None
    competitor_analysis: Optional[Dict[str, Any]] = None
    seo_google_maps_tips: Optional[Dict[str, Any]] = None
    thirty_day_growth_plan: Optional[Dict[str, Any]] = None
    daily_suggestions: Optional[List[str]] = None
    health_score: Optional[int] = None
    last_updated: Optional[str] = None
    message: Optional[str] = None


# ============ Routes ============

@router.get(
    "/realtime",
    response_model=BusinessAnalysisResponse,
    summary="Get real-time business analysis using Gemini AI",
    description="Analyzes logged-in user's business using Google AI Studio Gemini with Google Search grounding",
    responses={
        200: {"description": "Analysis completed successfully"},
        401: {"description": "Not authenticated"},
        404: {"description": "Business profile not found"},
        500: {"description": "Analysis failed"}
    }
)
async def get_realtime_business_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> BusinessAnalysisResponse:
    """
    Get real-time business analysis for logged-in user
    
    Uses:
    - Google AI Studio Gemini API
    - Google Search grounding for real-time data
    - Logged-in user's business profile
    
    Returns comprehensive business analysis with:
    - Business details and summary
    - Strengths and weaknesses
    - Growth opportunities
    - Local market insights
    - Competitor analysis
    - SEO and Google Maps tips
    - 30-day growth plan
    - Daily suggestions
    - Health score (0-100)
    """
    
    try:
        logger.info(f"[BusinessAnalysis] Real-time analysis requested by: {current_user.email}")
        
        # Check feature access
        await check_feature_access(current_user, "business_analysis")
        
        # Check if user has business profile
        if not current_user.business_name or not current_user.business_type or not current_user.business_location:
            logger.warning(f"[BusinessAnalysis] User {current_user.email} has incomplete business profile")
            return BusinessAnalysisResponse(
                status="needs_onboarding",
                source="google_ai_studio_gemini_search_grounding",
                message="Business profile required. Please complete your business setup first."
            )
        
        # Build business profile from user data
        business_profile = {
            "business_name": current_user.business_name,
            "business_type": current_user.business_type,
            "location": current_user.business_location,
            "services": [],  # Can be extended if stored
            "target_audience": "",  # Can be extended if stored
            "goals": "",  # Can be extended if stored
            "website_or_instagram": ""  # Can be extended if stored
        }
        
        # Add description if available
        if current_user.business_description:
            business_profile["description"] = current_user.business_description
        
        logger.info(f"[BusinessAnalysis] Analyzing: {business_profile['business_name']} ({business_profile['business_type']}) in {business_profile['location']}")
        logger.info("[BusinessAnalysis] Using Google AI Studio Gemini Search Grounding")
        
        # Generate analysis using Gemini
        result = await generate_realtime_business_analysis(business_profile)
        
        if result.get("status") == "error":
            logger.error(f"[BusinessAnalysis] ❌ Analysis failed: {result.get('message')}")
            return BusinessAnalysisResponse(
                status="error",
                source=result.get("source", "google_ai_studio_gemini_search_grounding"),
                message=result.get("message")
            )
        
        logger.info(f"[BusinessAnalysis] ✅ Analysis completed successfully for {current_user.email}")
        logger.info(f"[BusinessAnalysis] Source: {result.get('source')}")
        logger.info(f"[BusinessAnalysis] Health Score: {result.get('health_score')}")
        
        # Store business analysis in Pinecone for fast retrieval
        await store_business_analysis_in_pinecone(current_user.id, result)
        
        return BusinessAnalysisResponse(
            status=result.get("status"),
            source=result.get("source"),
            business_details=result.get("business_details"),
            strengths=result.get("strengths"),
            weaknesses=result.get("weaknesses"),
            growth_opportunities=result.get("growth_opportunities"),
            local_market_insights=result.get("local_market_insights"),
            competitor_analysis=result.get("competitor_analysis"),
            seo_google_maps_tips=result.get("seo_google_maps_tips"),
            thirty_day_growth_plan=result.get("thirty_day_growth_plan"),
            daily_suggestions=result.get("daily_suggestions"),
            health_score=result.get("health_score"),
            last_updated=result.get("last_updated")
        )
        
    except Exception as e:
        logger.error(f"[BusinessAnalysis] ❌ Error in real-time business analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate business analysis"
        )


@router.get(
    "/health",
    summary="Health check for Gemini business analysis service"
)
async def health_check():
    """Check if Gemini business analysis service is healthy"""
    
    from config.settings import settings
    
    gemini_configured = bool(
        settings.GEMINI_API_KEY and 
        settings.GEMINI_API_KEY != "your_google_ai_studio_api_key_here"
    )
    
    return {
        "status": "healthy",
        "service": "Business Analysis (Gemini AI with Google Search)",
        "version": "2.0.0",
        "gemini_configured": gemini_configured,
        "model": "gemini-2.5-flash",
        "features": [
            "Real-time business analysis",
            "Google Search grounding",
            "Local market insights",
            "Competitor analysis",
            "SEO optimization tips",
            "30-day growth plan"
        ]
    }
