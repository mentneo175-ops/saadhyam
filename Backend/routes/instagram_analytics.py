"""
Instagram Analytics Dashboard API Routes
Complete production-level API endpoints for Instagram Business Analytics
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from config.database import get_db_sync
from utils.dependencies import get_current_user
from models.user import User
from models.instagram_analytics import (
    InstagramBusinessAccount,
    AnalyticsSnapshot,
    PostAnalytics,
    ReelAnalytics,
    StoryAnalytics,
    AudienceInsights,
    AIRecommendation,
    GrowthPrediction,
    NotificationLog,
)
from services.instagram_analytics_service import instagram_analytics_service
from services.instagram_analytics_crud import instagram_analytics_crud
from services.instagram_ai_service import instagram_ai_service
from services.instagram_sync_orchestrator import instagram_sync_orchestrator
from schemas.instagram_analytics_schema import *

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/instagram-analytics", tags=["Instagram Analytics"])


# ======================== Account Connection ========================


@router.get(
    "/accounts/from-social",
    response_model=AccountListResponse,
    summary="Get or Create Analytics Accounts from Existing Social Accounts"
)
async def get_or_create_from_social(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """
    Get or create Instagram analytics accounts from existing social_accounts.
    This allows seamless integration with existing Instagram connections.
    """
    try:
        from models.instagram import SocialAccount
        
        # Get existing social accounts
        social_accounts = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == "instagram",
            SocialAccount.is_active == True
        ).all()
        
        analytics_accounts = []
        
        for social_account in social_accounts:
            # Check if already migrated
            existing = instagram_analytics_crud.get_account_by_ig_id(
                db, social_account.ig_user_id
            )
            
            if existing:
                analytics_accounts.append(existing)
            else:
                # Create new analytics account
                new_account = await instagram_analytics_crud.create_business_account(
                    db=db,
                    user_id=social_account.user_id,
                    ig_account_id=social_account.ig_user_id,
                    username=social_account.ig_username or "unknown",
                    access_token=social_account.access_token,
                    facebook_page_id=social_account.page_id,
                    facebook_page_name=social_account.page_name,
                )
                analytics_accounts.append(new_account)
                logger.info(f"✅ Created analytics account from social account: @{new_account.username}")
        
        return AccountListResponse(
            accounts=[InstagramAccountSchema.from_orm(acc) for acc in analytics_accounts],
            total=len(analytics_accounts)
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting/creating analytics accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analytics accounts"
        )


@router.get(
    "/oauth-url",
    summary="Get Instagram OAuth URL"
)
async def get_oauth_url(
    current_user: User = Depends(get_current_user),
):
    """Get Instagram OAuth authorization URL"""
    try:
        oauth_url = instagram_analytics_service.get_facebook_oauth_url()
        return {"oauth_url": oauth_url}
    except Exception as e:
        logger.error(f"❌ Error getting OAuth URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get OAuth URL"
        )


@router.post(
    "/connect",
    response_model=ConnectAccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Connect Instagram Business Account"
)
async def connect_instagram_account(
    request: ConnectAccountRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """
    Connect Instagram Business account via OAuth
    
    This endpoint:
    1. Validates the access token
    2. Fetches account information
    3. Stores account connection
    4. Triggers initial analytics sync in background
    """
    try:
        logger.info(f"🔗 User {current_user.id} connecting Instagram account")
        
        # Validate access token and get account info
        account_result = await instagram_analytics_service.get_account_info(
            ig_account_id=request.ig_account_id,
            access_token=request.access_token
        )
        
        if not account_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to validate Instagram account"
            )
        
        account_info = account_result.get("account", {})
        
        # Check if account already connected
        existing_account = instagram_analytics_crud.get_account_by_ig_id(
            db, request.ig_account_id
        )
        
        if existing_account:
            if existing_account.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This Instagram account is already connected to another user"
                )
            
            # Reactivate if disconnected
            if not existing_account.is_active:
                await instagram_analytics_crud.update_account(
                    db=db,
                    account_id=existing_account.id,
                    is_active=True,
                    access_token=request.access_token,
                    disconnected_at=None
                )
            
            account = existing_account
        else:
            # Create new account connection
            account = await instagram_analytics_crud.create_business_account(
                db=db,
                user_id=current_user.id,
                ig_account_id=request.ig_account_id,
                username=account_info.get("username", ""),
                name=account_info.get("name"),
                biography=account_info.get("biography"),
                profile_picture_url=account_info.get("profile_picture_url"),
                website=account_info.get("website"),
                access_token=request.access_token,
                facebook_page_id=request.facebook_page_id,
                facebook_page_name=request.facebook_page_name,
            )
        
        # Trigger initial sync in background
        background_tasks.add_task(
            instagram_sync_orchestrator.sync_account_analytics,
            db=db,
            account_id=account.id,
            sync_type="full"
        )
        
        logger.info(f"✅ Instagram account connected: @{account.username}")
        
        return ConnectAccountResponse(
            success=True,
            message="Instagram account connected successfully. Initial sync started.",
            account=InstagramAccountSchema.from_orm(account)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error connecting Instagram account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect Instagram account"
        )


@router.get(
    "/accounts",
    response_model=AccountListResponse,
    summary="Get Connected Accounts"
)
async def get_connected_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get all connected Instagram Business accounts for the current user"""
    try:
        accounts = instagram_analytics_crud.get_user_accounts(
            db=db,
            user_id=current_user.id,
            active_only=True
        )
        
        return AccountListResponse(
            accounts=[InstagramAccountSchema.from_orm(acc) for acc in accounts],
            total=len(accounts)
        )
        
    except Exception as e:
        logger.error(f"❌ Error fetching accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch accounts"
        )


@router.delete(
    "/accounts/{account_id}",
    summary="Disconnect Account"
)
async def disconnect_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Disconnect an Instagram Business account"""
    try:
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        await instagram_analytics_crud.disconnect_account(db, account_id)
        
        return {"success": True, "message": "Account disconnected successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error disconnecting account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect account"
        )


# ======================== Dashboard Overview ========================


@router.get(
    "/dashboard/{account_id}",
    response_model=DashboardOverviewResponse,
    summary="Get Dashboard Overview"
)
async def get_dashboard_overview(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """
    Get complete dashboard overview with all key metrics
    
    Returns:
    - Current follower count and growth
    - Engagement metrics
    - Recent posts performance
    - Top recommendations
    - Growth predictions
    """
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Get latest snapshot
        latest_snapshot = instagram_analytics_crud.get_latest_snapshot(db, account_id)
        
        # Get recent posts
        recent_posts, _ = instagram_analytics_crud.get_post_analytics(
            db, account_id, limit=10
        )
        
        # Get top recommendations
        recommendations = instagram_analytics_crud.get_active_recommendations(
            db, account_id
        )[:5]
        
        # Get latest prediction
        prediction = instagram_analytics_crud.get_latest_prediction(
            db, account_id, period="month"
        )
        
        # Calculate summary metrics
        if latest_snapshot:
            overview_data = {
                "followers_count": latest_snapshot.followers_count,
                "follower_growth": latest_snapshot.follower_growth,
                "follower_growth_rate": latest_snapshot.follower_growth_rate,
                "engagement_rate": latest_snapshot.engagement_rate,
                "impressions": latest_snapshot.impressions,
                "reach": latest_snapshot.reach,
                "profile_views": latest_snapshot.profile_views,
                "website_clicks": latest_snapshot.website_clicks,
            }
        else:
            overview_data = {
                "followers_count": 0,
                "follower_growth": 0,
                "follower_growth_rate": 0.0,
                "engagement_rate": 0.0,
                "impressions": 0,
                "reach": 0,
                "profile_views": 0,
                "website_clicks": 0,
            }
        
        return DashboardOverviewResponse(
            account=InstagramAccountSchema.from_orm(account),
            overview=overview_data,
            recent_posts=[PostAnalyticsSchema.from_orm(p) for p in recent_posts],
            recommendations=[AIRecommendationSchema.from_orm(r) for r in recommendations],
            prediction=GrowthPredictionSchema.from_orm(prediction) if prediction else None,
            last_synced=account.last_synced_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching dashboard overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard overview"
        )


# ======================== Analytics Endpoints ========================


@router.get(
    "/analytics/{account_id}/growth",
    response_model=GrowthAnalyticsResponse,
    summary="Get Follower Growth Analytics"
)
async def get_growth_analytics(
    account_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get follower growth analytics over time"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Get snapshots
        snapshots = instagram_analytics_crud.get_analytics_snapshots(
            db, account_id, days=days
        )
        
        # Calculate growth metrics
        if len(snapshots) >= 2:
            first_snapshot = snapshots[0]
            last_snapshot = snapshots[-1]
            
            total_growth = last_snapshot.followers_count - first_snapshot.followers_count
            growth_rate = (
                (total_growth / first_snapshot.followers_count * 100)
                if first_snapshot.followers_count > 0
                else 0
            )
        else:
            total_growth = 0
            growth_rate = 0.0
        
        return GrowthAnalyticsResponse(
            snapshots=[AnalyticsSnapshotSchema.from_orm(s) for s in snapshots],
            total_growth=total_growth,
            growth_rate=growth_rate,
            days_analyzed=days
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching growth analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch growth analytics"
        )


@router.get(
    "/analytics/{account_id}/engagement",
    response_model=EngagementAnalyticsResponse,
    summary="Get Engagement Analytics"
)
async def get_engagement_analytics(
    account_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get engagement analytics and trends"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Get posts
        posts, total = instagram_analytics_crud.get_post_analytics(
            db, account_id, limit=100
        )
        
        # Calculate engagement metrics
        if posts:
            engagement_rates = [p.engagement_rate for p in posts if p.engagement_rate > 0]
            avg_engagement = sum(engagement_rates) / len(engagement_rates) if engagement_rates else 0
            
            total_likes = sum(p.like_count for p in posts)
            total_comments = sum(p.comment_count for p in posts)
            total_shares = sum(p.share_count for p in posts)
            total_saves = sum(p.save_count for p in posts)
        else:
            avg_engagement = 0
            total_likes = 0
            total_comments = 0
            total_shares = 0
            total_saves = 0
        
        return EngagementAnalyticsResponse(
            avg_engagement_rate=round(avg_engagement, 2),
            total_likes=total_likes,
            total_comments=total_comments,
            total_shares=total_shares,
            total_saves=total_saves,
            posts_analyzed=len(posts)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching engagement analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch engagement analytics"
        )


# ======================== Content Performance ========================


@router.get(
    "/content/{account_id}/posts",
    response_model=PostListResponse,
    summary="Get Post Analytics"
)
async def get_post_analytics_list(
    account_id: int,
    limit: int = 50,
    skip: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get list of post analytics with pagination"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        posts, total = instagram_analytics_crud.get_post_analytics(
            db, account_id, limit=limit, skip=skip
        )
        
        return PostListResponse(
            posts=[PostAnalyticsSchema.from_orm(p) for p in posts],
            total=total,
            page=skip // limit + 1,
            page_size=limit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch posts"
        )


@router.get(
    "/content/{account_id}/top-posts",
    response_model=TopPostsResponse,
    summary="Get Top Performing Posts"
)
async def get_top_posts(
    account_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get top performing posts by engagement score"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        top_posts = instagram_analytics_crud.get_top_posts(db, account_id, limit=limit)
        
        return TopPostsResponse(
            posts=[PostAnalyticsSchema.from_orm(p) for p in top_posts]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching top posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch top posts"
        )


@router.get(
    "/content/{account_id}/reels",
    response_model=ReelListResponse,
    summary="Get Reel Analytics"
)
async def get_reel_analytics_list(
    account_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get reel analytics"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        reels = instagram_analytics_crud.get_reel_analytics(db, account_id, limit=limit)
        
        return ReelListResponse(
            reels=[ReelAnalyticsSchema.from_orm(r) for r in reels],
            total=len(reels)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching reels: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch reels"
        )


@router.get(
    "/content/{account_id}/stories",
    response_model=StoryListResponse,
    summary="Get Story Analytics"
)
async def get_story_analytics_list(
    account_id: int,
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get story analytics (last 7 days)"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        stories = instagram_analytics_crud.get_story_analytics(db, account_id, days=days)
        
        return StoryListResponse(
            stories=[StoryAnalyticsSchema.from_orm(s) for s in stories],
            total=len(stories)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching stories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch stories"
        )


# ======================== Audience Insights ========================


@router.get(
    "/audience/{account_id}",
    response_model=AudienceInsightsResponse,
    summary="Get Audience Insights"
)
async def get_audience_insights(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get audience demographics and behavior insights"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        insights = instagram_analytics_crud.get_latest_audience_insights(db, account_id)
        
        if not insights:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No audience insights available yet"
            )
        
        return AudienceInsightsResponse(
            insights=AudienceInsightsSchema.from_orm(insights)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching audience insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch audience insights"
        )


# ======================== AI Recommendations ========================


@router.get(
    "/recommendations/{account_id}",
    response_model=RecommendationsResponse,
    summary="Get AI Recommendations"
)
async def get_recommendations(
    account_id: int,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get AI-powered recommendations for improving Instagram performance"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        recommendations = instagram_analytics_crud.get_active_recommendations(
            db, account_id, category=category
        )
        
        return RecommendationsResponse(
            recommendations=[AIRecommendationSchema.from_orm(r) for r in recommendations],
            total=len(recommendations)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recommendations"
        )


# ======================== Growth Predictions ========================


@router.get(
    "/predictions/{account_id}",
    response_model=PredictionsResponse,
    summary="Get Growth Predictions"
)
async def get_growth_predictions(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get AI-powered growth predictions"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Get predictions for different periods
        week_prediction = instagram_analytics_crud.get_latest_prediction(
            db, account_id, period="week"
        )
        month_prediction = instagram_analytics_crud.get_latest_prediction(
            db, account_id, period="month"
        )
        
        predictions = []
        if week_prediction:
            predictions.append(week_prediction)
        if month_prediction:
            predictions.append(month_prediction)
        
        return PredictionsResponse(
            predictions=[GrowthPredictionSchema.from_orm(p) for p in predictions]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching predictions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch predictions"
        )


# ======================== Sync Operations ========================


@router.post(
    "/sync/{account_id}",
    summary="Trigger Manual Sync"
)
async def trigger_manual_sync(
    account_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Manually trigger analytics sync for an account"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Check if sync is already in progress
        if account.sync_status == "syncing":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sync already in progress"
            )
        
        # Trigger sync in background
        background_tasks.add_task(
            instagram_sync_orchestrator.sync_account_analytics,
            db=db,
            account_id=account_id,
            sync_type="manual"
        )
        
        return {
            "success": True,
            "message": "Sync started successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error triggering sync: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to trigger sync"
        )


@router.get(
    "/sync/{account_id}/status",
    response_model=SyncStatusResponse,
    summary="Get Sync Status"
)
async def get_sync_status(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get current sync status for an account"""
    try:
        # Verify account ownership
        account = instagram_analytics_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Get recent sync history
        sync_history = instagram_analytics_crud.get_sync_history(db, account_id, limit=5)
        
        return SyncStatusResponse(
            sync_status=account.sync_status,
            last_synced_at=account.last_synced_at,
            sync_error=account.sync_error,
            recent_syncs=[SyncHistorySchema.from_orm(s) for s in sync_history]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching sync status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch sync status"
        )


# ======================== Notifications ========================


@router.get(
    "/notifications",
    response_model=NotificationsResponse,
    summary="Get Notifications"
)
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get notifications for the current user"""
    try:
        notifications = instagram_analytics_crud.get_user_notifications(
            db, current_user.id, unread_only=unread_only, limit=limit
        )
        
        return NotificationsResponse(
            notifications=[NotificationSchema.from_orm(n) for n in notifications],
            total=len(notifications),
            unread_count=sum(1 for n in notifications if not n.is_read)
        )
        
    except Exception as e:
        logger.error(f"❌ Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notifications"
        )


@router.put(
    "/notifications/{notification_id}/read",
    summary="Mark Notification as Read"
)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Mark a notification as read"""
    try:
        success = await instagram_analytics_crud.mark_notification_read(db, notification_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {"success": True, "message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )
