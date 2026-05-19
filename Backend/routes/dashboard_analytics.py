"""
Dashboard Analytics Routes
Provides real-time analytics data for the AI Insights panel
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta
from config.database import get_db_sync
from models.user import User
from utils.dependencies import get_current_user
from models.instagram import ScheduledPost
from models.whatsapp_message import WhatsAppMessage
from models.whatsapp_campaign import WhatsAppCampaign
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Analytics"])


@router.get("/analytics")
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Get real-time analytics for dashboard AI Insights panel
    
    Returns:
    - Instagram posting activity
    - WhatsApp message statistics
    - Review reply metrics
    """
    try:
        logger.info(f"📊 Fetching dashboard analytics for user {current_user.id}")
        
        # Calculate date ranges
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)
        month_ago = now - timedelta(days=30)
        
        # ===== INSTAGRAM POSTING ACTIVITY =====
        try:
            # Posts this week
            posts_this_week = db.query(ScheduledPost).filter(
                ScheduledPost.user_id == current_user.id,
                ScheduledPost.created_at >= week_ago
            ).count()
            
            # Posts last week
            posts_last_week = db.query(ScheduledPost).filter(
                ScheduledPost.user_id == current_user.id,
                ScheduledPost.created_at >= two_weeks_ago,
                ScheduledPost.created_at < week_ago
            ).count()
            
            # Calculate growth
            if posts_last_week > 0:
                growth_multiplier = round(posts_this_week / posts_last_week, 1)
                growth_text = f"{growth_multiplier}× more than last" if growth_multiplier > 1 else f"{growth_multiplier}× less than last"
            else:
                growth_text = "first posts this week" if posts_this_week > 0 else "no posts yet"
            
            instagram_data = {
                "metric": f"{posts_this_week} posts",
                "detail": f"this week — {growth_text}",
                "available": True
            }
        except Exception as e:
            logger.warning(f"⚠️ Instagram analytics error: {e}")
            instagram_data = {
                "metric": "0 posts",
                "detail": "Connect Instagram to see stats",
                "available": False
            }
        
        # ===== WHATSAPP MESSAGE STATISTICS =====
        try:
            # Messages this month
            messages_this_month = db.query(WhatsAppMessage).filter(
                WhatsAppMessage.user_id == current_user.id,
                WhatsAppMessage.created_at >= month_ago
            ).count()
            
            # Delivered messages
            delivered_messages = db.query(WhatsAppMessage).filter(
                WhatsAppMessage.user_id == current_user.id,
                WhatsAppMessage.status == "delivered",
                WhatsAppMessage.created_at >= month_ago
            ).count()
            
            # Calculate delivery rate
            if messages_this_month > 0:
                delivery_rate = round((delivered_messages / messages_this_month) * 100)
                detail_text = f"{delivery_rate}% delivery rate this month"
            else:
                detail_text = "no messages sent yet"
            
            whatsapp_data = {
                "metric": f"{messages_this_month} messages",
                "detail": detail_text,
                "available": True
            }
        except Exception as e:
            logger.warning(f"⚠️ WhatsApp analytics error: {e}")
            whatsapp_data = {
                "metric": "0 messages",
                "detail": "Connect WhatsApp to see stats",
                "available": False
            }
        
        # ===== WHATSAPP CAMPAIGN PERFORMANCE =====
        try:
            # Active campaigns
            active_campaigns = db.query(WhatsAppCampaign).filter(
                WhatsAppCampaign.user_id == current_user.id,
                WhatsAppCampaign.campaign_status == "running"
            ).count()
            
            # Total campaigns this month
            campaigns_this_month = db.query(WhatsAppCampaign).filter(
                WhatsAppCampaign.user_id == current_user.id,
                WhatsAppCampaign.created_at >= month_ago
            ).count()
            
            if active_campaigns > 0:
                detail_text = f"{active_campaigns} active campaigns"
            elif campaigns_this_month > 0:
                detail_text = f"{campaigns_this_month} campaigns this month"
            else:
                detail_text = "create your first campaign"
            
            campaign_data = {
                "metric": f"{campaigns_this_month} campaigns",
                "detail": detail_text,
                "available": True
            }
        except Exception as e:
            logger.warning(f"⚠️ Campaign analytics error: {e}")
            campaign_data = {
                "metric": "0 campaigns",
                "detail": "Create WhatsApp campaigns",
                "available": False
            }
        
        # Return analytics (only existing models)
        analytics = {
            "success": True,
            "updated_at": now.isoformat(),
            "insights": {
                "posting_activity": instagram_data,
                "whatsapp_messages": whatsapp_data,
                "campaign_performance": campaign_data
            }
        }
        
        logger.info(f"✅ Dashboard analytics fetched successfully")
        return analytics
        
    except Exception as e:
        logger.error(f"❌ Error fetching dashboard analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.get("/analytics/summary")
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Get quick summary of key metrics
    """
    try:
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        
        # Quick counts
        total_posts = db.query(ScheduledPost).filter(
            ScheduledPost.user_id == current_user.id
        ).count()
        
        total_messages = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.user_id == current_user.id
        ).count()
        
        total_campaigns = db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.user_id == current_user.id
        ).count()
        
        return {
            "success": True,
            "summary": {
                "total_posts": total_posts,
                "total_messages": total_messages,
                "total_campaigns": total_campaigns,
                "total_replies": 0,  # Future feature
                "updated_at": now.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching analytics summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
