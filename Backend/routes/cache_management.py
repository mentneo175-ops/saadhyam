"""
Cache Management Routes
Provides endpoints to manage Redis cache
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from models.user import User
from utils.dependencies import get_current_user
from utils.cache_utils import (
    clear_user_analytics_cache,
    clear_business_analysis_cache,
    clear_all_cache,
    get_cache_stats
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cache", tags=["Cache Management"])


@router.get("/stats")
async def get_cache_statistics(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get Redis cache statistics
    """
    try:
        stats = await get_cache_stats()
        return {
            "success": True,
            "cache_stats": stats
        }
    except Exception as e:
        logger.error(f"❌ Error getting cache stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear/analytics")
async def clear_my_analytics_cache(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Clear cached analytics for current user
    Use this to force refresh dashboard data
    """
    try:
        cleared = await clear_user_analytics_cache(current_user.id)
        return {
            "success": True,
            "message": "Analytics cache cleared" if cleared else "No cache found",
            "cleared": cleared
        }
    except Exception as e:
        logger.error(f"❌ Error clearing analytics cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear/business-analysis")
async def clear_business_cache(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Clear all business analysis cache
    Use this to force fresh analysis from Gemini API
    """
    try:
        cleared = await clear_business_analysis_cache("", "")
        return {
            "success": True,
            "message": "Business analysis cache cleared",
            "cleared": cleared
        }
    except Exception as e:
        logger.error(f"❌ Error clearing business analysis cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear/all")
async def clear_entire_cache(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Clear ALL cache entries (use with caution!)
    This will force all data to be fetched fresh
    """
    try:
        cleared = await clear_all_cache()
        return {
            "success": True,
            "message": "All cache cleared",
            "cleared": cleared
        }
    except Exception as e:
        logger.error(f"❌ Error clearing all cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))
