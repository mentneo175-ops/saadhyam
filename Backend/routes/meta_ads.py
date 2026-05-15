"""
Meta Ads Routes
Complete API for Meta Ads campaign management
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from config.database import get_db
from models.user import User
from models.instagram import ScheduledPost
from models.meta_ads import (
    MetaAccount, AdCampaign, CampaignObjective,
    CampaignStatus, AdSetStatus, AdStatus
)
from services.campaign_automation_service import campaign_automation_service
from services.ai_audience_service import ai_audience_service
from services.ai_budget_service import ai_budget_service
from services.meta_ads_service import meta_ads_service
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/meta-ads", tags=["Meta Ads"])


# ============ Request Models ============

class PromotePostRequest(BaseModel):
    post_id: Optional[int] = None  # scheduled_post_id (for posts created through system)
    instagram_media_id: Optional[str] = None  # Instagram media ID (for any Instagram post)
    campaign_name: Optional[str] = None
    objective: str = "OUTCOME_ENGAGEMENT"
    daily_budget: Optional[float] = None
    duration_days: Optional[int] = None
    call_to_action: Optional[str] = None
    whatsapp_number: Optional[str] = None


class AudienceRecommendationRequest(BaseModel):
    post_caption: Optional[str] = None
    post_hashtags: Optional[List[str]] = None
    campaign_objective: str = "OUTCOME_ENGAGEMENT"


class BudgetRecommendationRequest(BaseModel):
    campaign_objective: str = "OUTCOME_ENGAGEMENT"
    target_audience_size: Optional[int] = None


class UpdateCampaignStatusRequest(BaseModel):
    status: str  # ACTIVE, PAUSED, DELETED


# ============ Campaign Management ============

@router.post("/promote-post")
async def promote_post(
    request: PromotePostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Promote an Instagram post as a Meta Ad
    
    Supports TWO modes:
    1. Promote scheduled post (created through system) - use post_id
    2. Promote any Instagram post (from analytics) - use instagram_media_id
    
    Complete automation:
    1. Get AI audience recommendations
    2. Get AI budget recommendations
    3. Create campaign, ad set, creative, and ad
    4. Return campaign details
    """
    try:
        # Validate request
        if not request.post_id and not request.instagram_media_id:
            raise HTTPException(
                status_code=400,
                detail="Either post_id or instagram_media_id must be provided",
            )
        
        # DEBUG: Log what we received
        logger.info(f"📥 Promote post request received:")
        logger.info(f"   post_id: {request.post_id}")
        logger.info(f"   instagram_media_id: {request.instagram_media_id}")
        logger.info(f"   campaign_name: {request.campaign_name}")
        
        # Get Meta account
        meta_account = db.query(MetaAccount).filter(
            MetaAccount.user_id == current_user.id,
            MetaAccount.is_active == True,
        ).first()
        
        if not meta_account:
            raise HTTPException(
                status_code=400,
                detail="No Meta account connected. Please connect your Meta account first.",
            )
        
        # Get post - either from scheduled_posts or create a temporary post object
        post = None
        
        if request.post_id:
            # Mode 1: Promote scheduled post
            post = db.query(ScheduledPost).filter(
                ScheduledPost.id == request.post_id,
                ScheduledPost.user_id == current_user.id,
            ).first()
            
            if not post:
                raise HTTPException(status_code=404, detail="Scheduled post not found")
        
        elif request.instagram_media_id:
            # Mode 2: Promote any Instagram post using media_id
            from models.instagram_analytics import PostAnalytics
            
            # Try to find the post in analytics
            analytics_post = db.query(PostAnalytics).filter(
                PostAnalytics.media_id == request.instagram_media_id,
            ).first()
            
            if not analytics_post:
                raise HTTPException(
                    status_code=404,
                    detail=f"Instagram post with media_id {request.instagram_media_id} not found in analytics",
                )
            
            # Create a temporary ScheduledPost object for the promotion flow
            # This allows us to reuse the existing campaign automation service
            post = ScheduledPost(
                id=0,  # Temporary ID
                user_id=current_user.id,
                social_account_id=0,  # Not needed for promotion
                image_url=analytics_post.media_url or "",
                caption=analytics_post.caption or "",
                instagram_media_id=request.instagram_media_id,  # THIS IS THE KEY!
                status="posted",  # Mark as posted since it's from Instagram
            )
            
            logger.info(f"📊 Promoting Instagram Analytics post:")
            logger.info(f"   Media ID: {request.instagram_media_id}")
            logger.info(f"   Caption: {analytics_post.caption[:50] if analytics_post.caption else 'No caption'}...")
            logger.info(f"   Permalink: {analytics_post.permalink}")
        
        # Validate objective
        try:
            objective = CampaignObjective(request.objective)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid objective. Must be one of: {[o.value for o in CampaignObjective]}",
            )
        
        # Promote post
        result = await campaign_automation_service.promote_post(
            db=db,
            user=current_user,
            post=post,
            meta_account=meta_account,
            campaign_name=request.campaign_name,
            objective=objective,
            daily_budget=request.daily_budget,
            duration_days=request.duration_days,
            call_to_action=request.call_to_action,
            whatsapp_number=request.whatsapp_number,
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to promote post: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/campaigns")
async def get_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all campaigns for current user"""
    try:
        campaigns = db.query(AdCampaign).filter(
            AdCampaign.user_id == current_user.id,
        ).order_by(AdCampaign.created_at.desc()).all()
        
        return {
            "success": True,
            "campaigns": [
                {
                    "id": campaign.id,
                    "campaign_id": campaign.campaign_id,
                    "name": campaign.campaign_name,
                    "objective": campaign.objective.value,
                    "status": campaign.status.value,
                    "daily_budget": campaign.daily_budget,
                    "created_at": campaign.created_at.isoformat(),
                    "ai_recommendations": {
                        "audience": campaign.ai_audience_suggestion,
                        "budget": campaign.ai_budget_recommendation,
                    },
                }
                for campaign in campaigns
            ],
        }
        
    except Exception as e:
        logger.error(f"Failed to get campaigns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/campaigns/{campaign_id}")
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get campaign details"""
    try:
        campaign = db.query(AdCampaign).filter(
            AdCampaign.id == campaign_id,
            AdCampaign.user_id == current_user.id,
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return {
            "success": True,
            "campaign": {
                "id": campaign.id,
                "campaign_id": campaign.campaign_id,
                "name": campaign.campaign_name,
                "objective": campaign.objective.value,
                "status": campaign.status.value,
                "daily_budget": campaign.daily_budget,
                "lifetime_budget": campaign.lifetime_budget,
                "created_at": campaign.created_at.isoformat(),
                "updated_at": campaign.updated_at.isoformat(),
                "ai_recommendations": {
                    "audience": campaign.ai_audience_suggestion,
                    "budget": campaign.ai_budget_recommendation,
                    "performance": campaign.ai_performance_prediction,
                },
                "ad_sets": [
                    {
                        "id": ad_set.id,
                        "adset_id": ad_set.adset_id,
                        "name": ad_set.adset_name,
                        "status": ad_set.status.value,
                        "daily_budget": ad_set.daily_budget,
                        "targeting": ad_set.targeting,
                    }
                    for ad_set in campaign.ad_sets
                ],
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get campaign: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/campaigns/{campaign_id}/status")
async def update_campaign_status(
    campaign_id: int,
    request: UpdateCampaignStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update campaign status (pause/resume/delete)"""
    try:
        campaign = db.query(AdCampaign).filter(
            AdCampaign.id == campaign_id,
            AdCampaign.user_id == current_user.id,
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Get Meta account
        meta_account = db.query(MetaAccount).filter(
            MetaAccount.id == campaign.meta_account_id,
        ).first()
        
        if not meta_account:
            raise HTTPException(status_code=400, detail="Meta account not found")
        
        # Validate status
        try:
            new_status = CampaignStatus(request.status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {[s.value for s in CampaignStatus]}",
            )
        
        # Update status in Meta
        success = await meta_ads_service.update_campaign_status(
            meta_account=meta_account,
            campaign_id=campaign.campaign_id,
            status=new_status,
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update campaign status in Meta")
        
        # Update in database
        campaign.status = new_status
        db.commit()
        
        return {
            "success": True,
            "message": f"Campaign status updated to {new_status.value}",
            "campaign": {
                "id": campaign.id,
                "status": campaign.status.value,
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update campaign status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics(
    campaign_id: int,
    date_preset: str = "last_7d",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get campaign analytics"""
    try:
        campaign = db.query(AdCampaign).filter(
            AdCampaign.id == campaign_id,
            AdCampaign.user_id == current_user.id,
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Get Meta account
        meta_account = db.query(MetaAccount).filter(
            MetaAccount.id == campaign.meta_account_id,
        ).first()
        
        if not meta_account:
            raise HTTPException(status_code=400, detail="Meta account not found")
        
        # Get insights from Meta
        insights = await meta_ads_service.get_campaign_insights(
            meta_account=meta_account,
            campaign_id=campaign.campaign_id,
            date_preset=date_preset,
        )
        
        return {
            "success": True,
            "campaign_id": campaign.id,
            "analytics": insights,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get campaign analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ AI Recommendations ============

@router.post("/ai/audience-recommendations")
async def get_audience_recommendations(
    request: AudienceRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI-powered audience targeting recommendations"""
    try:
        result = await ai_audience_service.generate_audience_recommendations(
            db=db,
            user=current_user,
            post_caption=request.post_caption,
            post_hashtags=request.post_hashtags,
            campaign_objective=request.campaign_objective,
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get audience recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/budget-recommendations")
async def get_budget_recommendations(
    request: BudgetRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI-powered budget recommendations"""
    try:
        result = await ai_budget_service.generate_budget_recommendations(
            db=db,
            user=current_user,
            campaign_objective=request.campaign_objective,
            target_audience_size=request.target_audience_size,
            currency="INR",  # TODO: Make dynamic
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get budget recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Dashboard Analytics ============

@router.get("/dashboard/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get Meta Ads dashboard summary"""
    try:
        # Get all campaigns
        campaigns = db.query(AdCampaign).filter(
            AdCampaign.user_id == current_user.id,
        ).all()
        
        # Calculate summary
        total_campaigns = len(campaigns)
        active_campaigns = len([c for c in campaigns if c.status == CampaignStatus.ACTIVE])
        paused_campaigns = len([c for c in campaigns if c.status == CampaignStatus.PAUSED])
        total_spend = sum([c.daily_budget or 0 for c in campaigns if c.status == CampaignStatus.ACTIVE])
        
        return {
            "success": True,
            "summary": {
                "total_campaigns": total_campaigns,
                "active_campaigns": active_campaigns,
                "paused_campaigns": paused_campaigns,
                "total_daily_spend": total_spend,
            },
            "recent_campaigns": [
                {
                    "id": campaign.id,
                    "name": campaign.campaign_name,
                    "status": campaign.status.value,
                    "daily_budget": campaign.daily_budget,
                    "created_at": campaign.created_at.isoformat(),
                }
                for campaign in campaigns[:5]
            ],
        }
        
    except Exception as e:
        logger.error(f"Failed to get dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
