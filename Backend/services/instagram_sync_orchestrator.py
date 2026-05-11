"""
Instagram Sync Orchestrator
Coordinates complete analytics syncing and processing
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from services.instagram_analytics_service import instagram_analytics_service
from services.instagram_analytics_crud import instagram_analytics_crud
from services.instagram_ai_service import instagram_ai_service

logger = logging.getLogger(__name__)


def parse_instagram_timestamp(timestamp_str: str) -> datetime:
    """
    Parse Instagram timestamp which can be in formats:
    - 2026-05-11T05:26:19Z
    - 2026-05-11T05:26:19+0000
    - 2026-05-11T05:26:19+00:00
    """
    if not timestamp_str:
        return datetime.utcnow()
    
    # Replace Z with +00:00
    timestamp_str = timestamp_str.replace("Z", "+00:00")
    
    # Fix timezone format: +0000 -> +00:00
    if timestamp_str.endswith("+0000") or timestamp_str.endswith("-0000"):
        timestamp_str = timestamp_str[:-5] + "+00:00"
    elif "+" in timestamp_str and ":" not in timestamp_str.split("+")[-1]:
        # Handle formats like +0530 -> +05:30
        parts = timestamp_str.rsplit("+", 1)
        tz = parts[1]
        if len(tz) == 4:
            timestamp_str = f"{parts[0]}+{tz[:2]}:{tz[2:]}"
    
    return datetime.fromisoformat(timestamp_str)


class InstagramSyncOrchestrator:
    """Orchestrates complete Instagram analytics syncing and AI analysis"""
    
    def __init__(self):
        self.analytics_service = instagram_analytics_service
        self.crud = instagram_analytics_crud
        self.ai_service = instagram_ai_service
    
    async def _migrate_social_account(self, db: Session, social_account: Any) -> Any:
        """
        Migrate existing social_account to instagram_business_accounts
        
        Args:
            db: Database session
            social_account: SocialAccount instance
        
        Returns:
            InstagramBusinessAccount instance
        """
        try:
            logger.info(f"🔄 Migrating social account {social_account.id} to analytics system")
            
            # Check if already migrated
            existing = self.crud.get_account_by_ig_id(db, social_account.ig_user_id)
            if existing:
                logger.info(f"✅ Account already migrated: {existing.id}")
                return existing
            
            # Create new instagram_business_account from social_account
            account = await self.crud.create_business_account(
                db=db,
                user_id=social_account.user_id,
                ig_account_id=social_account.ig_user_id,
                username=social_account.ig_username or "unknown",
                access_token=social_account.access_token,
                facebook_page_id=social_account.page_id,
                facebook_page_name=social_account.page_name,
            )
            
            logger.info(f"✅ Migrated social account to analytics account: {account.id}")
            return account
            
        except Exception as e:
            logger.error(f"❌ Error migrating social account: {e}")
            raise
    
    async def sync_account_analytics(
        self,
        db: Session,
        account_id: int,
        sync_type: str = "full"
    ) -> Dict[str, Any]:
        """
        Complete sync orchestration for an Instagram account
        
        Args:
            db: Database session
            account_id: Instagram Business Account ID (from instagram_business_accounts table)
                       OR social_account_id (from social_accounts table - for backward compatibility)
            sync_type: Type of sync (full, incremental, manual)
        
        Returns:
            Sync result summary
        """
        try:
            # Try to get from instagram_business_accounts first
            account = self.crud.get_account_by_id(db, account_id)
            
            # If not found, try to get from social_accounts (existing Instagram connection)
            if not account:
                from models.instagram import SocialAccount
                social_account = db.query(SocialAccount).filter(
                    SocialAccount.id == account_id,
                    SocialAccount.platform == "instagram"
                ).first()
                
                if social_account:
                    # Migrate from social_accounts to instagram_business_accounts
                    account = await self._migrate_social_account(db, social_account)
                else:
                    return {"success": False, "error": "Account not found"}
            
            logger.info(f"🔄 Starting {sync_type} sync for @{account.username}")
            
            # Create sync history record
            sync_start = datetime.utcnow()
            sync_record = await self.crud.create_sync_history(
                db=db,
                account_id=account_id,
                sync_data={
                    "sync_type": sync_type,
                    "sync_status": "started",
                    "started_at": sync_start
                }
            )
            
            # Update account sync status
            await self.crud.update_account(
                db=db,
                account_id=account_id,
                sync_status="syncing"
            )
            
            result = {
                "success": True,
                "account_id": account_id,
                "username": account.username,
                "sync_type": sync_type,
                "items_synced": 0,
                "errors": []
            }
            
            try:
                # Step 1: Fetch complete analytics from Instagram API
                logger.info("📊 Step 1: Fetching analytics from Instagram API...")
                analytics_package = await self.analytics_service.fetch_complete_analytics(
                    ig_account_id=account.ig_account_id,
                    access_token=account.access_token,
                    days_back=30
                )
                
                if not analytics_package.get("success"):
                    raise Exception("Failed to fetch analytics from Instagram")
                
                # Step 2: Store account-level analytics
                logger.info("💾 Step 2: Storing account analytics...")
                await self._store_account_analytics(
                    db=db,
                    account_id=account_id,
                    analytics_package=analytics_package
                )
                result["items_synced"] += 1
                
                # Step 3: Store media analytics
                logger.info("💾 Step 3: Storing media analytics...")
                media_count = await self._store_media_analytics(
                    db=db,
                    account_id=account_id,
                    analytics_package=analytics_package
                )
                result["items_synced"] += media_count
                
                # Step 4: Store story analytics
                logger.info("💾 Step 4: Storing story analytics...")
                story_count = await self._store_story_analytics(
                    db=db,
                    account_id=account_id,
                    analytics_package=analytics_package
                )
                result["items_synced"] += story_count
                
                # Step 5: Store audience insights
                logger.info("💾 Step 5: Storing audience insights...")
                await self._store_audience_insights(
                    db=db,
                    account_id=account_id,
                    analytics_package=analytics_package
                )
                result["items_synced"] += 1
                
                # Step 6: Generate AI recommendations
                logger.info("🤖 Step 6: Generating AI recommendations...")
                recommendations_count = await self._generate_recommendations(
                    db=db,
                    account_id=account_id
                )
                result["recommendations_generated"] = recommendations_count
                
                # Step 7: Generate growth predictions
                logger.info("🔮 Step 7: Generating growth predictions...")
                predictions_count = await self._generate_predictions(
                    db=db,
                    account_id=account_id
                )
                result["predictions_generated"] = predictions_count
                
                # Step 8: Detect trends and generate notifications
                logger.info("🔍 Step 8: Detecting trends...")
                notifications_count = await self._detect_trends_and_notify(
                    db=db,
                    account_id=account_id,
                    account=account
                )
                result["notifications_created"] = notifications_count
                
                # Update sync record as completed
                sync_end = datetime.utcnow()
                duration = (sync_end - sync_start).total_seconds()
                
                sync_record.sync_status = "completed"
                sync_record.completed_at = sync_end
                sync_record.items_synced = result["items_synced"]
                sync_record.duration_seconds = duration
                db.commit()
                
                # Update account sync status
                await self.crud.update_account(
                    db=db,
                    account_id=account_id,
                    sync_status="completed",
                    last_synced_at=sync_end
                )
                
                logger.info(f"✅ Sync completed successfully in {duration:.2f}s")
                logger.info(f"   Items synced: {result['items_synced']}")
                logger.info(f"   Recommendations: {recommendations_count}")
                logger.info(f"   Predictions: {predictions_count}")
                
                result["duration_seconds"] = duration
                return result
                
            except Exception as e:
                # Update sync record as failed
                sync_record.sync_status = "failed"
                sync_record.error_message = str(e)
                sync_record.completed_at = datetime.utcnow()
                db.commit()
                
                # Update account sync status
                await self.crud.update_account(
                    db=db,
                    account_id=account_id,
                    sync_status="failed",
                    sync_error=str(e)
                )
                
                raise
            
        except Exception as e:
            logger.error(f"❌ Sync failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "account_id": account_id
            }
    
    async def _store_account_analytics(
        self,
        db: Session,
        account_id: int,
        analytics_package: Dict[str, Any]
    ) -> None:
        """Store account-level analytics snapshot"""
        try:
            account_info = analytics_package.get("account_info", {})
            account_insights = analytics_package.get("account_insights", {})
            
            snapshot_data = {
                "snapshot_date": datetime.utcnow(),
                "period": "day",
                "followers_count": account_info.get("followers_count", 0),
                "impressions": account_insights.get("impressions", 0),
                "reach": account_insights.get("reach", 0),
                "profile_views": account_insights.get("profile_views", 0),
                "website_clicks": account_insights.get("website_clicks", 0),
                "email_contacts": account_insights.get("email_contacts", 0),
                "phone_call_clicks": account_insights.get("phone_call_clicks", 0),
                "get_directions_clicks": account_insights.get("get_directions_clicks", 0),
            }
            
            # Calculate follower growth
            latest_snapshot = self.crud.get_latest_snapshot(db, account_id)
            if latest_snapshot:
                prev_followers = latest_snapshot.followers_count
                current_followers = snapshot_data["followers_count"]
                snapshot_data["follower_growth"] = current_followers - prev_followers
                
                if prev_followers > 0:
                    snapshot_data["follower_growth_rate"] = (
                        (current_followers - prev_followers) / prev_followers * 100
                    )
            
            await self.crud.create_analytics_snapshot(db, account_id, snapshot_data)
            
        except Exception as e:
            logger.error(f"❌ Error storing account analytics: {e}")
            raise
    
    async def _store_media_analytics(
        self,
        db: Session,
        account_id: int,
        analytics_package: Dict[str, Any]
    ) -> int:
        """Store media (posts/reels) analytics"""
        try:
            media_list = analytics_package.get("media_list", [])
            media_insights = analytics_package.get("media_insights", [])
            
            # Create insights lookup
            insights_map = {
                item["media_id"]: item["insights"]
                for item in media_insights
            }
            
            count = 0
            for media in media_list:
                media_id = media.get("id")
                media_type = media.get("media_type", "IMAGE")
                insights = insights_map.get(media_id, {})
                
                # Calculate engagement metrics
                likes = media.get("like_count", 0)
                comments = media.get("comments_count", 0)
                shares = insights.get("shares", 0)
                saves = insights.get("saved", 0)
                reach = insights.get("reach", 0)
                impressions = insights.get("impressions", 0)
                
                engagement_rate = 0.0
                if reach > 0:
                    total_engagement = likes + comments + shares + saves
                    engagement_rate = (total_engagement / reach) * 100
                
                # Calculate AI engagement score
                engagement_score = self.ai_service.calculate_engagement_score(
                    likes=likes,
                    comments=comments,
                    shares=shares,
                    saves=saves,
                    reach=reach
                )
                
                # Determine if it's a reel
                is_reel = media_type == "VIDEO" and "REELS" in media.get("permalink", "").upper()
                
                if is_reel:
                    # Store as reel analytics
                    reel_data = {
                        "media_id": media_id,
                        "permalink": media.get("permalink"),
                        "caption": media.get("caption"),
                        "video_url": media.get("media_url"),
                        "thumbnail_url": media.get("thumbnail_url"),
                        "plays": insights.get("plays", insights.get("video_views", 0)),
                        "like_count": likes,
                        "comment_count": comments,
                        "share_count": shares,
                        "save_count": saves,
                        "impressions": impressions,
                        "reach": reach,
                        "engagement_rate": engagement_rate,
                        "viral_score": engagement_score,
                        "published_at": parse_instagram_timestamp(media.get("timestamp"))
                    }
                    await self.crud.create_reel_analytics(db, account_id, reel_data)
                else:
                    # Store as post analytics
                    post_data = {
                        "media_id": media_id,
                        "media_type": media_type,
                        "permalink": media.get("permalink"),
                        "caption": media.get("caption"),
                        "media_url": media.get("media_url"),
                        "thumbnail_url": media.get("thumbnail_url"),
                        "like_count": likes,
                        "comment_count": comments,
                        "share_count": shares,
                        "save_count": saves,
                        "impressions": impressions,
                        "reach": reach,
                        "engagement_rate": engagement_rate,
                        "engagement_score": engagement_score,
                        "published_at": parse_instagram_timestamp(media.get("timestamp"))
                    }
                    await self.crud.create_post_analytics(db, account_id, post_data)
                
                count += 1
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Error storing media analytics: {e}")
            return 0
    
    async def _store_story_analytics(
        self,
        db: Session,
        account_id: int,
        analytics_package: Dict[str, Any]
    ) -> int:
        """Store story analytics"""
        try:
            stories = analytics_package.get("stories", [])
            story_insights = analytics_package.get("story_insights", [])
            
            # Create insights lookup
            insights_map = {
                item["story_id"]: item["insights"]
                for item in story_insights
            }
            
            count = 0
            for story in stories:
                story_id = story.get("id")
                insights = insights_map.get(story_id, {})
                
                impressions = insights.get("impressions", 0)
                reach = insights.get("reach", 0)
                exits = insights.get("exits", 0)
                
                # Calculate completion rate
                completion_rate = 0.0
                if impressions > 0:
                    completion_rate = ((impressions - exits) / impressions) * 100
                
                story_data = {
                    "media_id": story_id,
                    "media_type": story.get("media_type", "IMAGE"),
                    "media_url": story.get("media_url"),
                    "impressions": impressions,
                    "reach": reach,
                    "exits": exits,
                    "taps_forward": insights.get("taps_forward", 0),
                    "taps_back": insights.get("taps_back", 0),
                    "replies": insights.get("replies", 0),
                    "completion_rate": completion_rate,
                    "published_at": parse_instagram_timestamp(story.get("timestamp")),
                    "expires_at": parse_instagram_timestamp(story.get("timestamp")) + timedelta(hours=24)
                }
                
                await self.crud.create_story_analytics(db, account_id, story_data)
                count += 1
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Error storing story analytics: {e}")
            return 0
    
    async def _store_audience_insights(
        self,
        db: Session,
        account_id: int,
        analytics_package: Dict[str, Any]
    ) -> None:
        """Store audience insights"""
        try:
            audience_insights = analytics_package.get("audience_insights", {})
            
            insights_data = {
                "snapshot_date": datetime.utcnow(),
                "age_gender_breakdown": audience_insights.get("audience_gender_age"),
                "top_cities": audience_insights.get("audience_city"),
                "top_countries": audience_insights.get("audience_country"),
                "online_followers": audience_insights.get("online_followers"),
            }
            
            # Analyze audience behavior
            audience_analysis = self.ai_service.analyze_audience_behavior(audience_insights)
            if audience_analysis.get("success"):
                if audience_analysis.get("peak_activity_hours"):
                    insights_data["peak_activity_hour"] = audience_analysis["peak_activity_hours"][0]
            
            await self.crud.create_audience_insights(db, account_id, insights_data)
            
        except Exception as e:
            logger.error(f"❌ Error storing audience insights: {e}")
            raise
    
    async def _generate_recommendations(
        self,
        db: Session,
        account_id: int
    ) -> int:
        """Generate AI recommendations"""
        try:
            # Get recent analytics data
            posts, _ = self.crud.get_post_analytics(db, account_id, limit=50)
            snapshots = self.crud.get_analytics_snapshots(db, account_id, days=30)
            audience_insights = self.crud.get_latest_audience_insights(db, account_id)
            
            # Convert to dict format for AI service
            posts_data = [
                {
                    "media_id": p.media_id,
                    "media_type": p.media_type,
                    "engagement_rate": p.engagement_rate,
                    "like_count": p.like_count,
                    "comment_count": p.comment_count,
                    "save_count": p.save_count,
                    "published_at": p.published_at
                }
                for p in posts
            ]
            
            snapshots_data = [
                {
                    "snapshot_date": s.snapshot_date,
                    "followers_count": s.followers_count,
                    "follower_growth": s.follower_growth,
                    "engagement_rate": s.engagement_rate
                }
                for s in snapshots
            ]
            
            audience_data = {}
            if audience_insights:
                audience_data = {
                    "audience_gender_age": audience_insights.age_gender_breakdown,
                    "audience_city": audience_insights.top_cities,
                    "audience_country": audience_insights.top_countries,
                    "online_followers": audience_insights.follower_activity_hours
                }
            
            # Analyze data
            content_analysis = self.ai_service.analyze_content_performance(posts_data)
            growth_analysis = self.ai_service.analyze_growth_trends(snapshots_data)
            audience_analysis = self.ai_service.analyze_audience_behavior(audience_data)
            
            # Generate recommendations
            recommendations = self.ai_service.generate_recommendations(
                content_analysis=content_analysis,
                growth_analysis=growth_analysis,
                audience_analysis=audience_analysis
            )
            
            # Store recommendations
            count = 0
            for rec in recommendations:
                await self.crud.create_recommendation(db, account_id, rec)
                count += 1
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Error generating recommendations: {e}")
            return 0
    
    async def _generate_predictions(
        self,
        db: Session,
        account_id: int
    ) -> int:
        """Generate growth predictions"""
        try:
            # Get historical snapshots
            snapshots = self.crud.get_analytics_snapshots(db, account_id, days=30)
            
            if len(snapshots) < 5:
                logger.info("⚠️ Insufficient data for predictions")
                return 0
            
            snapshots_data = [
                {
                    "snapshot_date": s.snapshot_date,
                    "followers_count": s.followers_count
                }
                for s in snapshots
            ]
            
            # Generate predictions for different periods
            periods = ["week", "month"]
            count = 0
            
            for period in periods:
                prediction = self.ai_service.predict_growth(snapshots_data, period)
                
                if prediction.get("success"):
                    prediction_data = {
                        "prediction_date": datetime.utcnow(),
                        "prediction_period": period,
                        "predicted_followers": prediction["predicted_followers"],
                        "predicted_follower_growth": prediction["predicted_growth"],
                        "predicted_growth_rate": prediction["predicted_growth_rate"],
                        "confidence_score": prediction["confidence_score"],
                        "factors": {
                            "avg_daily_growth": prediction["avg_daily_growth"],
                            "data_points": prediction["data_points_used"]
                        }
                    }
                    
                    await self.crud.create_growth_prediction(db, account_id, prediction_data)
                    count += 1
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Error generating predictions: {e}")
            return 0
    
    async def _detect_trends_and_notify(
        self,
        db: Session,
        account_id: int,
        account: Any
    ) -> int:
        """Detect trends and create notifications"""
        try:
            # Get recent data
            posts, _ = self.crud.get_post_analytics(db, account_id, limit=50)
            snapshots = self.crud.get_analytics_snapshots(db, account_id, days=30)
            
            posts_data = [
                {
                    "media_id": p.media_id,
                    "engagement_rate": p.engagement_rate,
                    "published_at": p.published_at
                }
                for p in posts
            ]
            
            snapshots_data = [
                {
                    "snapshot_date": s.snapshot_date,
                    "followers_count": s.followers_count
                }
                for s in snapshots
            ]
            
            # Detect trends
            trends = self.ai_service.detect_trends(posts_data, snapshots_data)
            
            if not trends.get("success"):
                return 0
            
            count = 0
            
            # Notify about viral posts
            for viral_post in trends.get("viral_posts", []):
                notification_data = {
                    "account_id": account_id,
                    "notification_type": "viral_post",
                    "title": "🔥 Viral Post Alert!",
                    "message": f"Your post is going viral with {viral_post['engagement_rate']:.1f}% engagement rate!",
                    "priority": "high",
                    "is_actionable": True,
                    "action_data": {"media_id": viral_post["media_id"]}
                }
                await self.crud.create_notification(db, account.user_id, notification_data)
                count += 1
            
            # Notify about growth spikes
            for spike in trends.get("growth_spikes", []):
                notification_data = {
                    "account_id": account_id,
                    "notification_type": "growth_spike",
                    "title": "📈 Follower Growth Spike!",
                    "message": f"You gained {spike['followers_gained']} followers! Growth rate: {spike['growth_rate']:.1f}%",
                    "priority": "high",
                    "is_actionable": False
                }
                await self.crud.create_notification(db, account.user_id, notification_data)
                count += 1
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Error detecting trends: {e}")
            return 0


# Create singleton instance
instagram_sync_orchestrator = InstagramSyncOrchestrator()
