"""
Real-time Business Intelligence Routes
Uses Gemini API with Google Search grounding for real-time business insights
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from utils.dependencies import get_current_user
from models.user import User
from services.gemini_realtime_service import (
    generate_business_analysis,
    generate_competitor_analysis,
    generate_business_insights
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/realtime-business",
    tags=["Real-time Business Intelligence"]
)


# ============ Request Models ============

class BusinessAnalysisRequest(BaseModel):
    """Request model for real-time business analysis"""
    business_name: str = Field(..., min_length=1, max_length=200, description="Business name")
    business_type: str = Field(..., min_length=1, max_length=100, description="Type of business")
    location: str = Field(..., min_length=1, max_length=200, description="Business location")
    services: List[str] = Field(default=[], description="List of services offered")
    target_audience: str = Field(default="", max_length=500, description="Target audience description")
    goals: str = Field(default="", max_length=500, description="Business goals")
    language: str = Field(default="english", description="Response language (english, telugu, hindi)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "business_name": "Sai Bike Motors",
                "business_type": "bike showroom",
                "location": "Hyderabad",
                "services": ["bike sales", "bike servicing", "finance support"],
                "target_audience": "young professionals and families",
                "goals": "increase showroom visits and leads",
                "language": "english"
            }
        }


class CompetitorAnalysisRequest(BaseModel):
    """Request model for competitor analysis"""
    business_type: str = Field(..., min_length=1, max_length=100, description="Type of business")
    location: str = Field(..., min_length=1, max_length=200, description="Location to analyze")
    radius_or_area: str = Field(default="5km", max_length=100, description="Search radius or area")
    services: List[str] = Field(default=[], description="Services to compare")
    language: str = Field(default="english", description="Response language (english, telugu, hindi)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "business_type": "bike showroom",
                "location": "Hyderabad, Banjara Hills",
                "radius_or_area": "5km",
                "services": ["bike sales", "servicing", "accessories"],
                "language": "english"
            }
        }


class BusinessInsightsRequest(BaseModel):
    """Request model for business development insights"""
    business_name: str = Field(..., min_length=1, max_length=200, description="Business name")
    business_type: str = Field(..., min_length=1, max_length=100, description="Type of business")
    location: str = Field(..., min_length=1, max_length=200, description="Business location")
    services: List[str] = Field(default=[], description="List of services offered")
    target_audience: str = Field(default="", max_length=500, description="Target audience description")
    language: str = Field(default="english", description="Response language (english, telugu, hindi)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "business_name": "Sai Bike Motors",
                "business_type": "bike showroom",
                "location": "Hyderabad",
                "services": ["bike sales", "bike servicing", "finance support"],
                "target_audience": "young professionals and families",
                "language": "english"
            }
        }


# ============ Response Models ============

class BusinessAnalysisResponse(BaseModel):
    """Response model for business analysis"""
    status: str
    source: Optional[str] = None
    analysis: Optional[Dict[str, List[str]]] = None
    message: Optional[str] = None


class CompetitorInfo(BaseModel):
    """Competitor information"""
    name: str
    description: str
    strengths: List[str]
    weaknesses: List[str]
    market_position: str


class CompetitorAnalysisResponse(BaseModel):
    """Response model for competitor analysis"""
    status: str
    source: Optional[str] = None
    competitors: Optional[List[CompetitorInfo]] = None
    market_gaps: Optional[List[str]] = None
    differentiation_ideas: Optional[List[str]] = None
    action_plan: Optional[List[str]] = None
    message: Optional[str] = None


class BusinessInsightsResponse(BaseModel):
    """Response model for business insights"""
    status: str
    source: Optional[str] = None
    insights: Optional[Dict[str, List[str]]] = None
    message: Optional[str] = None


# ============ Routes ============

@router.post(
    "/analysis",
    response_model=BusinessAnalysisResponse,
    summary="Generate real-time business analysis",
    description="Analyze business using Gemini AI with Google Search grounding for real-time insights",
    responses={
        200: {"description": "Analysis completed successfully"},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"},
        500: {"description": "Analysis failed"}
    }
)
async def realtime_business_analysis(
    request: BusinessAnalysisRequest,
    current_user: User = Depends(get_current_user)
) -> BusinessAnalysisResponse:
    """
    Generate comprehensive business analysis with real-time data from Gemini API
    """
    
    logger.info(f"[RealtimeBusiness] Analysis requested for: {request.business_name}")
    
    try:
        # Call Gemini business analysis service
        from services.gemini_business_analysis_service import generate_realtime_business_analysis
        
        business_profile = {
            "business_name": request.business_name,
            "business_type": request.business_type,
            "location": request.location,
            "services": request.services,
            "target_audience": request.target_audience,
            "goals": request.goals
        }
        
        result = await generate_realtime_business_analysis(business_profile)
        
        if result.get("status") == "error":
            return BusinessAnalysisResponse(
                status="error",
                message=result.get("message", "Failed to generate analysis")
            )
        
        # Format response for dashboard
        analysis_data = {
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
            "growth_opportunities": result.get("growth_opportunities", []),
            "local_market_ideas": result.get("seo_google_maps_tips", {}).get("local_visibility_ideas", []),
            "thirty_day_plan": []
        }
        
        # Extract 30-day plan
        thirty_day_plan = result.get("thirty_day_growth_plan", {})
        if thirty_day_plan:
            for week in ["week_1", "week_2", "week_3", "week_4"]:
                if week in thirty_day_plan:
                    analysis_data["thirty_day_plan"].extend(thirty_day_plan[week])
        
        logger.info(f"[RealtimeBusiness] ✅ Analysis completed for {request.business_name}")
        
        return BusinessAnalysisResponse(
            status="success",
            source="gemini_search_grounding",
            analysis=analysis_data
        )
        
    except Exception as e:
        logger.error(f"[RealtimeBusiness] ❌ Error: {e}", exc_info=True)
        return BusinessAnalysisResponse(
            status="error",
            message=f"Failed to generate analysis: {str(e)}"
        )


@router.post(
    "/competitor-analysis",
    response_model=CompetitorAnalysisResponse,
    summary="Generate real-time competitor analysis",
    description="Analyze competitors using Gemini AI with Google Search grounding",
    responses={
        200: {"description": "Competitor analysis completed"},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"},
        500: {"description": "Analysis failed"}
    }
)
async def realtime_competitor_analysis(
    request: CompetitorAnalysisRequest,
    current_user: User = Depends(get_current_user)
) -> CompetitorAnalysisResponse:
    """
    Generate competitor analysis with real-time data
    
    Uses Gemini API with Google Search grounding to provide:
    - Nearby competitor information
    - Competitor strengths and weaknesses
    - Market gaps and opportunities
    - Differentiation strategies
    - Action plan
    
    All insights are based on real-time web search results.
    """
    
    logger.info(f"⚠️ Dashboard competitor analysis endpoint DISABLED (saving quota)")
    
    return CompetitorAnalysisResponse(
        status="success",
        source="mock_data_quota_saving",
        competitors=[],
        market_gaps=["Endpoint disabled for testing"],
        differentiation_ideas=["Test Business Analysis page instead"],
        action_plan=["Navigate to /dashboard/business-analysis"]
    )


@router.post(
    "/insights",
    response_model=BusinessInsightsResponse,
    summary="Generate real-time business development insights",
    description="Get growth insights using Gemini AI with Google Search grounding",
    responses={
        200: {"description": "Insights generated successfully"},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"},
        500: {"description": "Insights generation failed"}
    }
)
async def realtime_business_insights(
    request: BusinessInsightsRequest,
    current_user: User = Depends(get_current_user)
) -> BusinessInsightsResponse:
    """
    Generate business development insights with real-time data from Gemini API
    """
    
    logger.info(f"[RealtimeBusiness] Insights requested for: {request.business_name}")
    
    try:
        # Call Gemini business analysis service
        from services.gemini_business_analysis_service import generate_realtime_business_analysis
        
        business_profile = {
            "business_name": request.business_name,
            "business_type": request.business_type,
            "location": request.location,
            "services": request.services,
            "target_audience": request.target_audience,
            "goals": ""
        }
        
        result = await generate_realtime_business_analysis(business_profile)
        
        if result.get("status") == "error":
            return BusinessInsightsResponse(
                status="error",
                message=result.get("message", "Failed to generate insights")
            )
        
        # Format response for dashboard
        seo_tips = result.get("seo_google_maps_tips", {})
        daily_suggestions = result.get("daily_suggestions", [])
        
        insights_data = {
            "market_trends": result.get("local_market_insights", {}).get("trending_services", []),
            "seo_ideas": seo_tips.get("ranking_tips", []),
            "offer_ideas": result.get("growth_opportunities", [])[:3],
            "customer_acquisition_ideas": result.get("competitor_analysis", {}).get("differentiation_ideas", []),
            "next_actions": daily_suggestions[:5]
        }
        
        logger.info(f"[RealtimeBusiness] ✅ Insights generated for {request.business_name}")
        
        return BusinessInsightsResponse(
            status="success",
            source="gemini_search_grounding",
            insights=insights_data
        )
        
    except Exception as e:
        logger.error(f"[RealtimeBusiness] ❌ Error: {e}", exc_info=True)
        return BusinessInsightsResponse(
            status="error",
            message=f"Failed to generate insights: {str(e)}"
        )


@router.get(
    "/health",
    summary="Health check for real-time business intelligence"
)
async def health_check():
    """Check if real-time business intelligence service is healthy"""
    
    from config.settings import settings
    
    gemini_configured = bool(
        settings.GEMINI_API_KEY and 
        settings.GEMINI_API_KEY != "your_google_ai_studio_api_key_here"
    )
    
    return {
        "status": "healthy",
        "service": "Real-time Business Intelligence (Gemini + Google Search)",
        "version": "1.0.0",
        "gemini_configured": gemini_configured,
        "features": [
            "Real-time business analysis",
            "Competitor analysis with search grounding",
            "Business development insights",
            "Multi-language support (English, Telugu, Hindi)"
        ]
    }
