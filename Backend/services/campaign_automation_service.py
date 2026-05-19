"""
Campaign Automation Service
Orchestrates complete campaign creation from post to live ad
"""

import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from models.user import User
from models.instagram import ScheduledPost
from models.meta_ads import (
    MetaAccount, AdCampaign, AdSet, AdCreative, Ad,
    CampaignObjective, CampaignStatus, AdSetStatus, AdStatus,
    CampaignLog
)
from services.meta_ads_service import meta_ads_service
from services.ai_audience_service import ai_audience_service
from services.ai_budget_service import ai_budget_service

logger = logging.getLogger(__name__)


class CampaignAutomationService:
    """Automates complete campaign creation workflow"""
    
    async def promote_post(
        self,
        db: Session,
        user: User,
        post: ScheduledPost,
        meta_account: MetaAccount,
        campaign_name: Optional[str] = None,
        objective: CampaignObjective = CampaignObjective.OUTCOME_ENGAGEMENT,
        daily_budget: Optional[float] = None,
        duration_days: Optional[int] = None,
        custom_targeting: Optional[Dict[str, Any]] = None,
        call_to_action: Optional[str] = None,
        whatsapp_number: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Complete automation: Post → Campaign → Ad Set → Creative → Ad
        
        Steps:
        1. Generate AI audience recommendations
        2. Generate AI budget recommendations
        3. Create Campaign
        4. Create Ad Set with targeting
        5. Upload media and create Creative
        6. Create Ad
        7. Log everything
        
        Returns campaign details and status
        """
        try:
            logger.info(f"🚀 Starting campaign automation for post {post.id}")
            
            # Step 1: AI Audience Recommendations
            logger.info("🤖 Generating AI audience recommendations...")
            audience_result = await ai_audience_service.generate_audience_recommendations(
                db=db,
                user=user,
                post_caption=post.caption,
                post_hashtags=self._extract_hashtags(post.caption),
                campaign_objective=objective.value,
            )
            
            if not audience_result.get("success"):
                raise Exception(f"AI audience generation failed: {audience_result.get('error')}")
            
            audience_recommendations = audience_result["recommendations"]
            
            # Step 2: AI Budget Recommendations
            logger.info("💰 Generating AI budget recommendations...")
            budget_result = await ai_budget_service.generate_budget_recommendations(
                db=db,
                user=user,
                campaign_objective=objective.value,
                target_audience_size=audience_recommendations.get("estimated_reach_max"),
                currency="INR",  # TODO: Make dynamic based on user location
            )
            
            if not budget_result.get("success"):
                raise Exception(f"AI budget generation failed: {budget_result.get('error')}")
            
            budget_recommendations = budget_result["recommendations"]
            
            # Use custom budget if provided, otherwise use AI recommendation
            final_daily_budget = daily_budget or budget_recommendations["recommended_daily_budget"]
            final_duration = duration_days or budget_recommendations["recommended_duration_days"]
            
            # Convert to cents for Meta API
            daily_budget_cents = ai_budget_service.convert_to_cents(final_daily_budget)
            
            # Step 3: Create Campaign
            logger.info("📊 Creating Meta campaign...")
            if not campaign_name:
                campaign_name = f"{user.business_name or 'Business'} - {post.caption[:30]}... - {datetime.now().strftime('%Y-%m-%d')}"
            
            meta_campaign = await meta_ads_service.create_campaign(
                db=db,
                meta_account=meta_account,
                campaign_name=campaign_name,
                objective=objective,
                status=CampaignStatus.PAUSED,  # Start paused for safety
            )
            
            # Save campaign to database
            campaign = AdCampaign(
                user_id=user.id,
                meta_account_id=meta_account.id,
                campaign_id=meta_campaign["id"],
                campaign_name=campaign_name,
                objective=objective,
                status=CampaignStatus.PAUSED,
                daily_budget=final_daily_budget,
                instagram_post_id=post.id if post.id > 0 else None,  # Only set if real post, not temporary
                ai_audience_suggestion=audience_recommendations,
                ai_budget_recommendation=budget_recommendations,
            )
            db.add(campaign)
            db.commit()
            db.refresh(campaign)
            
            # Log campaign creation
            self._log_action(db, campaign.id, "campaign_created", "success", f"Campaign created: {meta_campaign['id']}")
            
            # Step 4: Create Ad Set with AI targeting
            logger.info("🎯 Creating ad set with AI targeting...")
            
            # Use custom targeting if provided, otherwise use AI recommendations
            if custom_targeting:
                targeting = custom_targeting
            else:
                targeting = ai_audience_service.convert_to_meta_targeting(audience_recommendations)
            
            adset_name = f"{campaign_name} - Ad Set 1"
            
            meta_adset = await meta_ads_service.create_ad_set(
                db=db,
                meta_account=meta_account,
                campaign_id=meta_campaign["id"],
                adset_name=adset_name,
                targeting=targeting,
                daily_budget=daily_budget_cents,
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(days=final_duration),
                optimization_goal="REACH",
                billing_event="IMPRESSIONS",
                status=AdSetStatus.PAUSED,
            )
            
            # Save ad set to database
            ad_set = AdSet(
                campaign_id=campaign.id,
                adset_id=meta_adset["id"],
                adset_name=adset_name,
                status=AdSetStatus.PAUSED,
                daily_budget=final_daily_budget,
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(days=final_duration),
                targeting=targeting,
                optimization_goal="REACH",
                billing_event="IMPRESSIONS",
                bid_strategy="LOWEST_COST_WITHOUT_CAP",
            )
            db.add(ad_set)
            db.commit()
            db.refresh(ad_set)
            
            self._log_action(db, campaign.id, "adset_created", "success", f"Ad Set created: {meta_adset['id']}")
            
            # Step 5: Create Ad Creative from existing post
            logger.info("🎨 Creating ad creative from existing post...")
            
            creative_name = f"{campaign_name} - Creative 1"
            
            # Check if we have Instagram media ID from the post
            instagram_media_id = post.instagram_media_id if hasattr(post, 'instagram_media_id') and post.instagram_media_id else None
            
            # Fallback: Try instagram_post_id if instagram_media_id is not set
            if not instagram_media_id and hasattr(post, 'instagram_post_id') and post.instagram_post_id:
                instagram_media_id = post.instagram_post_id
                logger.info(f"ℹ️ Using instagram_post_id as media_id: {instagram_media_id}")
            
            if instagram_media_id:
                logger.info(f"✅ Found Instagram media ID: {instagram_media_id}")
                try:
                    # Create creative using existing Instagram media
                    meta_creative = await meta_ads_service.create_ad_creative_from_post(
                        meta_account=meta_account,
                        creative_name=creative_name,
                        instagram_media_id=instagram_media_id,
                        facebook_post_id=None,
                    )
                    logger.info(f"✅ Creative created from Instagram media")
                    
                except Exception as e:
                    logger.warning(f"⚠️ Could not create creative from Instagram media: {e}")
                    logger.info("ℹ️ Falling back to simple creative")
                    # For MVP: Skip creative and ad creation, just create campaign + ad set
                    logger.info(f"✅ Campaign and Ad Set created successfully (Creative step skipped for MVP)")
                    
                    return {
                        "success": True,
                        "campaign": {
                            "id": campaign.id,
                            "campaign_id": campaign.campaign_id,
                            "name": campaign.campaign_name,
                            "status": campaign.status.value,
                            "objective": campaign.objective.value,
                            "daily_budget": final_daily_budget,
                            "duration_days": final_duration,
                        },
                        "ad_set": {
                            "id": ad_set.id,
                            "adset_id": ad_set.adset_id,
                            "name": ad_set.adset_name,
                        },
                        "ai_recommendations": {
                            "audience": audience_recommendations,
                            "budget": budget_recommendations,
                        },
                        "message": "Campaign and Ad Set created successfully! Creative and Ad creation skipped (requires published Instagram post). You can complete this in Meta Ads Manager.",
                        "mvp_mode": True,
                    }
            else:
                logger.warning("⚠️ No Instagram media ID found for this post")
                logger.info("ℹ️ This post may not have been published to Instagram yet")
                logger.info("ℹ️ For MVP, we'll create Campaign + Ad Set only")
                
                # For MVP: Just create campaign + ad set, skip creative/ad
                logger.info(f"✅ Campaign and Ad Set created successfully (Creative requires published post)")
                
                return {
                    "success": True,
                    "campaign": {
                        "id": campaign.id,
                        "campaign_id": campaign.campaign_id,
                        "name": campaign.campaign_name,
                        "status": campaign.status.value,
                        "objective": campaign.objective.value,
                        "daily_budget": final_daily_budget,
                        "duration_days": final_duration,
                    },
                    "ad_set": {
                        "id": ad_set.id,
                        "adset_id": ad_set.adset_id,
                        "name": ad_set.adset_name,
                    },
                    "ai_recommendations": {
                        "audience": audience_recommendations,
                        "budget": budget_recommendations,
                    },
                    "message": "Campaign and Ad Set created successfully! To complete: Publish post to Instagram first, then create creative and ad in Meta Ads Manager.",
                    "mvp_mode": True,
                    "next_steps": [
                        "1. Publish this post to Instagram",
                        "2. Go to Meta Ads Manager",
                        "3. Add creative and ad to this campaign",
                        "4. Activate campaign"
                    ],
                }
            
            # Save creative to database
            creative = AdCreative(
                user_id=user.id,
                creative_id=meta_creative["id"],
                creative_name=creative_name,
                image_url=post.image_url,
                image_hash=None,  # Not using image upload anymore
                video_id=None,  # Not using video upload anymore
                caption=post.caption,
                call_to_action=call_to_action,
                whatsapp_number=whatsapp_number,
                ai_generated=post.ai_generated,
            )
            db.add(creative)
            db.commit()
            db.refresh(creative)
            
            self._log_action(db, campaign.id, "creative_created", "success", f"Creative created: {meta_creative['id']}")
            
            # Step 6: Create Ad
            logger.info("📢 Creating ad...")
            
            ad_name = f"{campaign_name} - Ad 1"
            
            meta_ad = await meta_ads_service.create_ad(
                meta_account=meta_account,
                ad_name=ad_name,
                adset_id=meta_adset["id"],
                creative_id=meta_creative["id"],
                status=AdStatus.PAUSED,
            )
            
            # Save ad to database
            ad = Ad(
                adset_id=ad_set.id,
                creative_id=creative.id,
                ad_id=meta_ad["id"],
                ad_name=ad_name,
                status=AdStatus.PAUSED,
            )
            db.add(ad)
            db.commit()
            db.refresh(ad)
            
            self._log_action(db, campaign.id, "ad_created", "success", f"Ad created: {meta_ad['id']}")
            
            logger.info(f"✅ Campaign automation completed successfully!")
            
            return {
                "success": True,
                "campaign": {
                    "id": campaign.id,
                    "campaign_id": campaign.campaign_id,
                    "name": campaign.campaign_name,
                    "status": campaign.status.value,
                    "objective": campaign.objective.value,
                    "daily_budget": final_daily_budget,
                    "duration_days": final_duration,
                },
                "ad_set": {
                    "id": ad_set.id,
                    "adset_id": ad_set.adset_id,
                    "name": ad_set.adset_name,
                },
                "creative": {
                    "id": creative.id,
                    "creative_id": creative.creative_id,
                    "name": creative.creative_name,
                },
                "ad": {
                    "id": ad.id,
                    "ad_id": ad.ad_id,
                    "name": ad.ad_name,
                },
                "ai_recommendations": {
                    "audience": audience_recommendations,
                    "budget": budget_recommendations,
                },
                "message": "Campaign created successfully! It's currently paused. Review and activate when ready.",
            }
            
        except Exception as e:
            logger.error(f"❌ Campaign automation failed: {e}")
            
            # Log error if campaign was created
            if 'campaign' in locals():
                self._log_action(db, campaign.id, "automation_failed", "error", str(e), {"error": str(e)})
            
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create campaign. Please try again.",
            }
    
    def _extract_hashtags(self, caption: Optional[str]) -> list:
        """Extract hashtags from caption"""
        if not caption:
            return []
        
        import re
        hashtags = re.findall(r'#(\w+)', caption)
        return hashtags
    
    def _log_action(
        self,
        db: Session,
        campaign_id: int,
        action: str,
        status: str,
        message: str,
        error_details: Optional[Dict[str, Any]] = None,
    ):
        """Log campaign action"""
        try:
            log = CampaignLog(
                campaign_id=campaign_id,
                action=action,
                status=status,
                message=message,
                error_details=error_details,
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log action: {e}")


# Singleton instance
campaign_automation_service = CampaignAutomationService()
