"""
Instagram Analytics CRUD Service
Database operations for Instagram analytics data
"""

import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, func
from models.instagram_analytics import (
    InstagramBusinessAccount,
    AnalyticsSnapshot,
    PostAnalytics,
    ReelAnalytics,
    StoryAnalytics,
    AudienceInsights,
    AIRecommendation,
    GrowthPrediction,
    SyncHistory,
    NotificationLog,
)

logger = logging.getLogger(__name__)


class InstagramAnalyticsCRUD:
    """CRUD operations for Instagram analytics"""
    
    # ======================== Account Operations ========================
    
    @staticmethod
    async def create_business_account(
        db: Session,
        user_id: int,
        ig_account_id: str,
        username: str,
        access_token: str,
        **kwargs
    ) -> InstagramBusinessAccount:
        """Create a new Instagram Business account connection"""
        try:
            account = InstagramBusinessAccount(
                user_id=user_id,
                ig_account_id=ig_account_id,
                username=username,
                access_token=access_token,
                **kwargs
            )
            
            db.add(account)
            db.commit()
            db.refresh(account)
            
            logger.info(f"✅ Created Instagram account: @{username} for user {user_id}")
            return account
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating Instagram account: {e}")
            raise
    
    @staticmethod
    def get_user_accounts(
        db: Session,
        user_id: int,
        active_only: bool = True
    ) -> List[InstagramBusinessAccount]:
        """Get all Instagram accounts for a user"""
        try:
            query = db.query(InstagramBusinessAccount).filter(
                InstagramBusinessAccount.user_id == user_id
            )
            
            if active_only:
                query = query.filter(InstagramBusinessAccount.is_active == True)
            
            accounts = query.order_by(desc(InstagramBusinessAccount.connected_at)).all()
            return accounts
            
        except Exception as e:
            logger.error(f"❌ Error fetching user accounts: {e}")
            return []
    
    @staticmethod
    def get_account_by_id(
        db: Session,
        account_id: int
    ) -> Optional[InstagramBusinessAccount]:
        """Get Instagram account by ID"""
        try:
            return db.query(InstagramBusinessAccount).filter(
                InstagramBusinessAccount.id == account_id
            ).first()
        except Exception as e:
            logger.error(f"❌ Error fetching account: {e}")
            return None
    
    @staticmethod
    def get_account_by_ig_id(
        db: Session,
        ig_account_id: str
    ) -> Optional[InstagramBusinessAccount]:
        """Get Instagram account by Instagram account ID"""
        try:
            return db.query(InstagramBusinessAccount).filter(
                InstagramBusinessAccount.ig_account_id == ig_account_id
            ).first()
        except Exception as e:
            logger.error(f"❌ Error fetching account by IG ID: {e}")
            return None
    
    @staticmethod
    async def update_account(
        db: Session,
        account_id: int,
        **kwargs
    ) -> Optional[InstagramBusinessAccount]:
        """Update Instagram account"""
        try:
            account = db.query(InstagramBusinessAccount).filter(
                InstagramBusinessAccount.id == account_id
            ).first()
            
            if not account:
                return None
            
            for key, value in kwargs.items():
                if hasattr(account, key):
                    setattr(account, key, value)
            
            db.commit()
            db.refresh(account)
            
            logger.info(f"✅ Updated Instagram account {account_id}")
            return account
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error updating account: {e}")
            raise
    
    @staticmethod
    async def disconnect_account(
        db: Session,
        account_id: int
    ) -> bool:
        """Disconnect Instagram account"""
        try:
            account = db.query(InstagramBusinessAccount).filter(
                InstagramBusinessAccount.id == account_id
            ).first()
            
            if not account:
                return False
            
            account.is_active = False
            account.disconnected_at = datetime.utcnow()
            
            db.commit()
            
            logger.info(f"✅ Disconnected Instagram account {account_id}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error disconnecting account: {e}")
            return False
    
    # ======================== Analytics Snapshot Operations ========================
    
    @staticmethod
    async def create_analytics_snapshot(
        db: Session,
        account_id: int,
        snapshot_data: Dict[str, Any]
    ) -> AnalyticsSnapshot:
        """Create analytics snapshot"""
        try:
            snapshot = AnalyticsSnapshot(
                account_id=account_id,
                **snapshot_data
            )
            
            db.add(snapshot)
            db.commit()
            db.refresh(snapshot)
            
            logger.info(f"✅ Created analytics snapshot for account {account_id}")
            return snapshot
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating analytics snapshot: {e}")
            raise
    
    @staticmethod
    def get_analytics_snapshots(
        db: Session,
        account_id: int,
        days: int = 30,
        period: str = None
    ) -> List[AnalyticsSnapshot]:
        """Get analytics snapshots for an account"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            query = db.query(AnalyticsSnapshot).filter(
                and_(
                    AnalyticsSnapshot.account_id == account_id,
                    AnalyticsSnapshot.snapshot_date >= cutoff_date
                )
            )
            
            if period:
                query = query.filter(AnalyticsSnapshot.period == period)
            
            snapshots = query.order_by(AnalyticsSnapshot.snapshot_date).all()
            return snapshots
            
        except Exception as e:
            logger.error(f"❌ Error fetching analytics snapshots: {e}")
            return []
    
    @staticmethod
    def get_latest_snapshot(
        db: Session,
        account_id: int
    ) -> Optional[AnalyticsSnapshot]:
        """Get the most recent analytics snapshot"""
        try:
            return db.query(AnalyticsSnapshot).filter(
                AnalyticsSnapshot.account_id == account_id
            ).order_by(desc(AnalyticsSnapshot.snapshot_date)).first()
        except Exception as e:
            logger.error(f"❌ Error fetching latest snapshot: {e}")
            return None
    
    # ======================== Post Analytics Operations ========================
    
    @staticmethod
    async def create_post_analytics(
        db: Session,
        account_id: int,
        post_data: Dict[str, Any]
    ) -> PostAnalytics:
        """Create or update post analytics"""
        try:
            media_id = post_data.get("media_id")
            
            # Check if post already exists
            existing_post = db.query(PostAnalytics).filter(
                PostAnalytics.media_id == media_id
            ).first()
            
            if existing_post:
                # Update existing post
                for key, value in post_data.items():
                    if hasattr(existing_post, key):
                        setattr(existing_post, key, value)
                
                db.commit()
                db.refresh(existing_post)
                logger.info(f"✅ Updated post analytics: {media_id}")
                return existing_post
            else:
                # Create new post
                post = PostAnalytics(
                    account_id=account_id,
                    **post_data
                )
                
                db.add(post)
                db.commit()
                db.refresh(post)
                logger.info(f"✅ Created post analytics: {media_id}")
                return post
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating post analytics: {e}")
            raise
    
    @staticmethod
    def get_post_analytics(
        db: Session,
        account_id: int,
        limit: int = 50,
        skip: int = 0
    ) -> Tuple[List[PostAnalytics], int]:
        """Get post analytics for an account"""
        try:
            query = db.query(PostAnalytics).filter(
                PostAnalytics.account_id == account_id
            )
            
            total = query.count()
            
            posts = query.order_by(desc(PostAnalytics.published_at)).offset(skip).limit(limit).all()
            
            return posts, total
            
        except Exception as e:
            logger.error(f"❌ Error fetching post analytics: {e}")
            return [], 0
    
    @staticmethod
    def get_top_posts(
        db: Session,
        account_id: int,
        limit: int = 10
    ) -> List[PostAnalytics]:
        """Get top performing posts"""
        try:
            posts = db.query(PostAnalytics).filter(
                PostAnalytics.account_id == account_id
            ).order_by(desc(PostAnalytics.engagement_score)).limit(limit).all()
            
            return posts
            
        except Exception as e:
            logger.error(f"❌ Error fetching top posts: {e}")
            return []
    
    @staticmethod
    def get_viral_posts(
        db: Session,
        account_id: int
    ) -> List[PostAnalytics]:
        """Get viral posts"""
        try:
            posts = db.query(PostAnalytics).filter(
                and_(
                    PostAnalytics.account_id == account_id,
                    PostAnalytics.is_viral == True
                )
            ).order_by(desc(PostAnalytics.engagement_rate)).all()
            
            return posts
            
        except Exception as e:
            logger.error(f"❌ Error fetching viral posts: {e}")
            return []
    
    # ======================== Reel Analytics Operations ========================
    
    @staticmethod
    async def create_reel_analytics(
        db: Session,
        account_id: int,
        reel_data: Dict[str, Any]
    ) -> ReelAnalytics:
        """Create or update reel analytics"""
        try:
            media_id = reel_data.get("media_id")
            
            # Check if reel already exists
            existing_reel = db.query(ReelAnalytics).filter(
                ReelAnalytics.media_id == media_id
            ).first()
            
            if existing_reel:
                # Update existing reel
                for key, value in reel_data.items():
                    if hasattr(existing_reel, key):
                        setattr(existing_reel, key, value)
                
                db.commit()
                db.refresh(existing_reel)
                logger.info(f"✅ Updated reel analytics: {media_id}")
                return existing_reel
            else:
                # Create new reel
                reel = ReelAnalytics(
                    account_id=account_id,
                    **reel_data
                )
                
                db.add(reel)
                db.commit()
                db.refresh(reel)
                logger.info(f"✅ Created reel analytics: {media_id}")
                return reel
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating reel analytics: {e}")
            raise
    
    @staticmethod
    def get_reel_analytics(
        db: Session,
        account_id: int,
        limit: int = 50
    ) -> List[ReelAnalytics]:
        """Get reel analytics for an account"""
        try:
            reels = db.query(ReelAnalytics).filter(
                ReelAnalytics.account_id == account_id
            ).order_by(desc(ReelAnalytics.published_at)).limit(limit).all()
            
            return reels
            
        except Exception as e:
            logger.error(f"❌ Error fetching reel analytics: {e}")
            return []
    
    # ======================== Story Analytics Operations ========================
    
    @staticmethod
    async def create_story_analytics(
        db: Session,
        account_id: int,
        story_data: Dict[str, Any]
    ) -> StoryAnalytics:
        """Create or update story analytics"""
        try:
            media_id = story_data.get("media_id")
            
            # Check if story already exists
            existing_story = db.query(StoryAnalytics).filter(
                StoryAnalytics.media_id == media_id
            ).first()
            
            if existing_story:
                # Update existing story
                for key, value in story_data.items():
                    if hasattr(existing_story, key):
                        setattr(existing_story, key, value)
                
                db.commit()
                db.refresh(existing_story)
                return existing_story
            else:
                # Create new story
                story = StoryAnalytics(
                    account_id=account_id,
                    **story_data
                )
                
                db.add(story)
                db.commit()
                db.refresh(story)
                return story
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating story analytics: {e}")
            raise
    
    @staticmethod
    def get_story_analytics(
        db: Session,
        account_id: int,
        days: int = 7
    ) -> List[StoryAnalytics]:
        """Get story analytics (stories expire after 24 hours)"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            stories = db.query(StoryAnalytics).filter(
                and_(
                    StoryAnalytics.account_id == account_id,
                    StoryAnalytics.published_at >= cutoff_date
                )
            ).order_by(desc(StoryAnalytics.published_at)).all()
            
            return stories
            
        except Exception as e:
            logger.error(f"❌ Error fetching story analytics: {e}")
            return []
    
    # ======================== Audience Insights Operations ========================
    
    @staticmethod
    async def create_audience_insights(
        db: Session,
        account_id: int,
        insights_data: Dict[str, Any]
    ) -> AudienceInsights:
        """Create audience insights snapshot"""
        try:
            insights = AudienceInsights(
                account_id=account_id,
                **insights_data
            )
            
            db.add(insights)
            db.commit()
            db.refresh(insights)
            
            logger.info(f"✅ Created audience insights for account {account_id}")
            return insights
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating audience insights: {e}")
            raise
    
    @staticmethod
    def get_latest_audience_insights(
        db: Session,
        account_id: int
    ) -> Optional[AudienceInsights]:
        """Get the most recent audience insights"""
        try:
            return db.query(AudienceInsights).filter(
                AudienceInsights.account_id == account_id
            ).order_by(desc(AudienceInsights.snapshot_date)).first()
        except Exception as e:
            logger.error(f"❌ Error fetching audience insights: {e}")
            return None
    
    # ======================== AI Recommendations Operations ========================
    
    @staticmethod
    async def create_recommendation(
        db: Session,
        account_id: int,
        recommendation_data: Dict[str, Any]
    ) -> AIRecommendation:
        """Create AI recommendation"""
        try:
            recommendation = AIRecommendation(
                account_id=account_id,
                **recommendation_data
            )
            
            db.add(recommendation)
            db.commit()
            db.refresh(recommendation)
            
            logger.info(f"✅ Created AI recommendation for account {account_id}")
            return recommendation
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating recommendation: {e}")
            raise
    
    @staticmethod
    def get_active_recommendations(
        db: Session,
        account_id: int,
        category: str = None
    ) -> List[AIRecommendation]:
        """Get active recommendations for an account"""
        try:
            query = db.query(AIRecommendation).filter(
                and_(
                    AIRecommendation.account_id == account_id,
                    AIRecommendation.is_active == True
                )
            )
            
            if category:
                query = query.filter(AIRecommendation.category == category)
            
            recommendations = query.order_by(
                desc(AIRecommendation.priority),
                desc(AIRecommendation.confidence_score)
            ).all()
            
            return recommendations
            
        except Exception as e:
            logger.error(f"❌ Error fetching recommendations: {e}")
            return []
    
    # ======================== Growth Predictions Operations ========================
    
    @staticmethod
    async def create_growth_prediction(
        db: Session,
        account_id: int,
        prediction_data: Dict[str, Any]
    ) -> GrowthPrediction:
        """Create growth prediction"""
        try:
            prediction = GrowthPrediction(
                account_id=account_id,
                **prediction_data
            )
            
            db.add(prediction)
            db.commit()
            db.refresh(prediction)
            
            logger.info(f"✅ Created growth prediction for account {account_id}")
            return prediction
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating growth prediction: {e}")
            raise
    
    @staticmethod
    def get_latest_prediction(
        db: Session,
        account_id: int,
        period: str = None
    ) -> Optional[GrowthPrediction]:
        """Get the most recent growth prediction"""
        try:
            query = db.query(GrowthPrediction).filter(
                GrowthPrediction.account_id == account_id
            )
            
            if period:
                query = query.filter(GrowthPrediction.prediction_period == period)
            
            return query.order_by(desc(GrowthPrediction.prediction_date)).first()
        except Exception as e:
            logger.error(f"❌ Error fetching growth prediction: {e}")
            return None
    
    # ======================== Sync History Operations ========================
    
    @staticmethod
    async def create_sync_history(
        db: Session,
        account_id: int,
        sync_data: Dict[str, Any]
    ) -> SyncHistory:
        """Create sync history record"""
        try:
            sync = SyncHistory(
                account_id=account_id,
                **sync_data
            )
            
            db.add(sync)
            db.commit()
            db.refresh(sync)
            
            return sync
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating sync history: {e}")
            raise
    
    @staticmethod
    def get_sync_history(
        db: Session,
        account_id: int,
        limit: int = 20
    ) -> List[SyncHistory]:
        """Get sync history for an account"""
        try:
            syncs = db.query(SyncHistory).filter(
                SyncHistory.account_id == account_id
            ).order_by(desc(SyncHistory.started_at)).limit(limit).all()
            
            return syncs
            
        except Exception as e:
            logger.error(f"❌ Error fetching sync history: {e}")
            return []
    
    # ======================== Notification Operations ========================
    
    @staticmethod
    async def create_notification(
        db: Session,
        user_id: int,
        notification_data: Dict[str, Any]
    ) -> NotificationLog:
        """Create notification"""
        try:
            notification = NotificationLog(
                user_id=user_id,
                **notification_data
            )
            
            db.add(notification)
            db.commit()
            db.refresh(notification)
            
            logger.info(f"✅ Created notification for user {user_id}")
            return notification
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating notification: {e}")
            raise
    
    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[NotificationLog]:
        """Get notifications for a user"""
        try:
            query = db.query(NotificationLog).filter(
                NotificationLog.user_id == user_id
            )
            
            if unread_only:
                query = query.filter(NotificationLog.is_read == False)
            
            notifications = query.order_by(desc(NotificationLog.created_at)).limit(limit).all()
            
            return notifications
            
        except Exception as e:
            logger.error(f"❌ Error fetching notifications: {e}")
            return []
    
    @staticmethod
    async def mark_notification_read(
        db: Session,
        notification_id: int
    ) -> bool:
        """Mark notification as read"""
        try:
            notification = db.query(NotificationLog).filter(
                NotificationLog.id == notification_id
            ).first()
            
            if not notification:
                return False
            
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error marking notification as read: {e}")
            return False


# Create singleton instance
instagram_analytics_crud = InstagramAnalyticsCRUD()
