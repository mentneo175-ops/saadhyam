"""
Business API Compatibility Routes
Provides backward compatibility for frontend calling old endpoints
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from config.database import get_db_sync
from models.user import User
from utils.dependencies import get_current_user
from services.comprehensive_business_analysis_service import get_business_analysis_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/business", tags=["Business Compatibility"])


@router.get("/latest")
async def get_latest_business_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Compatibility endpoint for /api/business/latest
    Redirects to comprehensive analysis data
    """
    try:
        logger.info(f"📊 Compatibility endpoint called: /api/business/latest for user {current_user.id}")
        
        # Get comprehensive business analysis data
        analysis_data = await get_business_analysis_data(current_user, db)
        
        if not analysis_data or "error" in analysis_data:
            return {
                "success": False,
                "message": "No analysis available. Please trigger comprehensive analysis first.",
                "data": None
            }
        
        return {
            "success": True,
            "data": analysis_data,
            "message": "Analysis retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Error in compatibility endpoint: {e}")
        return {
            "success": False,
            "message": str(e),
            "data": None
        }
