"""
Partnership Agent API Routes
Simple influencer discovery using SerpAPI + RapidAPI + Tavily
Works like Google - finds and shows results
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.simple_partnership_service import SimplePartnershipService

router = APIRouter(prefix="/api/partnership", tags=["Partnership Agent"])


class PartnershipRequest(BaseModel):
    """Request model for partnership agent"""
    businessName: str = Field(..., min_length=1, description="Business name")
    industry: str = Field(..., description="Business industry")
    targetAudience: str = Field(..., description="Target audience description")
    collaborationGoal: str = Field(..., description="Collaboration goal")
    partnershipType: str = Field(..., description="Type of partnership")
    budget: str = Field(..., description="Budget range")
    timeline: str = Field(..., description="Timeline for partnership")
    location: str = Field(..., description="Business location")


class PartnershipResponse(BaseModel):
    """Response model for partnership agent"""
    success: bool
    results: list
    total: int
    message: str


@router.post("/agent", response_model=PartnershipResponse)
async def find_partnerships(request: PartnershipRequest):
    """
    Find influencer partnership opportunities using multiple sources
    
    This endpoint:
    1. Searches Instagram directly (RapidAPI)
    2. Searches Google for influencers (SerpAPI)
    3. Searches web (Tavily)
    4. Combines and ranks results
    5. AI analysis for top matches
    
    Simple and effective - works like Google search
    """
    try:
        # Convert request to dict
        request_data = request.dict()
        
        # Call simple partnership service
        result = await SimplePartnershipService.discover_influencers(request_data)
        
        return result
        
    except Exception as e:
        print(f"❌ Partnership agent error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to find partnerships: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Partnership Agent (Simple Multi-Source)",
        "serpapi_configured": bool(os.getenv("SERPAPI_KEY")),
        "rapidapi_configured": bool(os.getenv("RAPIDAPI_KEY")),
        "tavily_configured": bool(os.getenv("TAVILY_API_KEY")),
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "mode": "simple_multi_source"
    }
