"""
Influencer Management API Routes
Admin endpoints for collecting and managing influencer data
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.influencer_collector_service import InfluencerCollectorService
from services.influencer_search_service import InfluencerSearchService

router = APIRouter(prefix="/api/influencers", tags=["Influencer Management"])


class CollectRequest(BaseModel):
    """Request model for collecting influencers"""
    industry: str
    limit: int = 50


@router.post("/collect/{industry}")
async def collect_influencers(industry: str, limit: int = 50):
    """
    Collect and store influencers for a specific industry
    Admin endpoint for populating the database
    """
    try:
        # Validate industry
        valid_industries = ["food", "travel", "fitness", "fashion", "beauty", "real-estate", "tech", "lifestyle"]
        if industry.lower() not in valid_industries:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid industry. Must be one of: {', '.join(valid_industries)}"
            )
        
        # Collect and store
        stored_count = InfluencerCollectorService.collect_and_store_industry(
            industry.lower(), limit
        )
        
        return {
            "success": True,
            "industry": industry,
            "collected": stored_count,
            "message": f"Successfully collected and stored {stored_count} {industry} influencers"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error collecting influencers: {str(e)}"
        )


@router.get("/stats")
async def get_database_stats():
    """
    Get statistics about the influencer database
    """
    try:
        stats = InfluencerSearchService.get_database_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching stats: {str(e)}"
        )


@router.get("/search/{industry}")
async def search_influencers(
    industry: str,
    location: Optional[str] = None,
    min_followers: int = 10000,
    limit: int = 10
):
    """
    Search influencers from database
    """
    try:
        influencers = InfluencerSearchService.search_by_industry(
            industry=industry.lower(),
            location=location,
            min_followers=min_followers,
            limit=limit
        )
        
        return {
            "success": True,
            "industry": industry,
            "total": len(influencers),
            "influencers": influencers
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching influencers: {str(e)}"
        )


@router.get("/{username}")
async def get_influencer(username: str):
    """
    Get specific influencer by username
    """
    try:
        influencer = InfluencerSearchService.get_influencer_by_username(username)
        
        if not influencer:
            raise HTTPException(
                status_code=404,
                detail=f"Influencer @{username} not found"
            )
        
        return {
            "success": True,
            "influencer": influencer
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching influencer: {str(e)}"
        )
