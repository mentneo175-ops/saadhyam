"""
Instagram CRUD operations for managing social accounts and scheduled posts (Async version).
"""

import logging
from typing import List, Tuple, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from models.instagram import SocialAccount, ScheduledPost, PostAnalytics, PostStatus
from schemas.instagram_schema import (
    SocialAccountResponse,
    ScheduledPostResponse,
)

logger = logging.getLogger(__name__)


class InstagramCRUD:
    """CRUD operations for Instagram-related database models (async version)."""

    @staticmethod
    async def create_social_account(
        db: AsyncSession,
        user_id: int,
        platform: str,
        access_token: str,
        ig_user_id: str,
        ig_username: str,
        page_id: Optional[str] = None,
        page_name: Optional[str] = None,
        access_token_expires_at: Optional[datetime] = None,
    ) -> SocialAccount:
        """Create a new social account record or reactivate existing one."""
        try:
            # Check if account already exists (even if disconnected)
            stmt = select(SocialAccount).where(
                and_(
                    SocialAccount.user_id == user_id,
                    SocialAccount.platform == platform,
                    SocialAccount.ig_user_id == ig_user_id,
                )
            )
            result = await db.execute(stmt)
            existing_account = result.scalar_one_or_none()
            
            if existing_account:
                # Reactivate and update existing account
                logger.info(f"Reactivating existing social account {existing_account.id} for user {user_id}")
                existing_account.access_token = access_token
                existing_account.ig_username = ig_username
                existing_account.page_id = page_id
                existing_account.page_name = page_name
                existing_account.access_token_expires_at = access_token_expires_at
                existing_account.is_active = True
                existing_account.disconnected_at = None
                existing_account.connected_at = datetime.utcnow()
                db.add(existing_account)
                await db.commit()
                await db.refresh(existing_account)
                logger.info(f"Reactivated social account {existing_account.id} for user {user_id}")
                return existing_account
            else:
                # Create new account
                account = SocialAccount(
                    user_id=user_id,
                    platform=platform,
                    access_token=access_token,
                    ig_user_id=ig_user_id,
                    ig_username=ig_username,
                    page_id=page_id,
                    page_name=page_name,
                    access_token_expires_at=access_token_expires_at,
                    is_active=True,
                )
                db.add(account)
                await db.commit()
                await db.refresh(account)
                logger.info(f"Created new social account {account.id} for user {user_id}")
                return account
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating/reactivating social account: {e}")
            raise

    @staticmethod
    async def get_user_social_accounts(
        db: AsyncSession, user_id: int
    ) -> List[SocialAccount]:
        """Get all social accounts for a user."""
        try:
            stmt = select(SocialAccount).where(
                and_(
                    SocialAccount.user_id == user_id,
                    SocialAccount.is_active == True,
                )
            )
            result = await db.execute(stmt)
            accounts = result.scalars().all()
            return list(accounts)
        except Exception as e:
            logger.error(f"Error fetching user social accounts: {e}")
            raise

    @staticmethod
    async def get_social_account(
        db: AsyncSession, account_id: int
    ) -> Optional[SocialAccount]:
        """Get a specific social account by ID."""
        try:
            stmt = select(SocialAccount).where(SocialAccount.id == account_id)
            result = await db.execute(stmt)
            account = result.scalar_one_or_none()
            return account
        except Exception as e:
            logger.error(f"Error fetching social account {account_id}: {e}")
            raise

    @staticmethod
    async def disconnect_account(db: AsyncSession, account_id: int) -> bool:
        """Disconnect (deactivate) a social account."""
        try:
            account = await InstagramCRUD.get_social_account(db, account_id)
            if not account:
                logger.warning(f"Social account {account_id} not found")
                return False

            account.is_active = False
            account.disconnected_at = datetime.utcnow()
            db.add(account)
            await db.commit()
            logger.info(f"Disconnected social account {account_id}")
            return True
        except Exception as e:
            await db.rollback()
            logger.error(f"Error disconnecting account {account_id}: {e}")
            raise

    @staticmethod
    async def create_scheduled_post(
        db: AsyncSession,
        user_id: int,
        social_account_id: int,
        image_url: str,
        caption: Optional[str] = None,
        scheduled_time: Optional[datetime] = None,
        ai_generated: bool = False,
    ) -> ScheduledPost:
        """Create a scheduled post."""
        try:
            status = (
                PostStatus.SCHEDULED.value
                if scheduled_time
                else PostStatus.PENDING.value
            )
            post = ScheduledPost(
                user_id=user_id,
                social_account_id=social_account_id,
                image_url=image_url,
                caption=caption,
                scheduled_time=scheduled_time,
                ai_generated=ai_generated,
                status=status,
            )
            db.add(post)
            await db.commit()
            await db.refresh(post)
            logger.info(f"Created scheduled post {post.id} for user {user_id}")
            return post
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating scheduled post: {e}")
            raise

    @staticmethod
    async def get_scheduled_post(
        db: AsyncSession, post_id: int
    ) -> Optional[ScheduledPost]:
        """Get a scheduled post by ID."""
        try:
            stmt = select(ScheduledPost).where(ScheduledPost.id == post_id)
            result = await db.execute(stmt)
            post = result.scalar_one_or_none()
            return post
        except Exception as e:
            logger.error(f"Error fetching scheduled post {post_id}: {e}")
            raise

    @staticmethod
    async def get_user_posts(
        db: AsyncSession, user_id: int, skip: int = 0, limit: int = 10
    ) -> Tuple[List[ScheduledPost], int]:
        """Get user's scheduled posts with pagination."""
        try:
            # Get total count
            count_stmt = select(func.count(ScheduledPost.id)).where(
                ScheduledPost.user_id == user_id
            )
            count_result = await db.execute(count_stmt)
            total = count_result.scalar()

            # Get paginated results
            stmt = (
                select(ScheduledPost)
                .where(ScheduledPost.user_id == user_id)
                .order_by(desc(ScheduledPost.created_at))
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            posts = result.scalars().all()
            return list(posts), total
        except Exception as e:
            logger.error(f"Error fetching user posts: {e}")
            raise

    @staticmethod
    async def update_post_status(
        db: AsyncSession,
        post_id: int,
        status: str,
        error_message: Optional[str] = None,
        instagram_post_id: Optional[str] = None,
    ) -> ScheduledPost:
        """Update a post's status."""
        try:
            post = await InstagramCRUD.get_scheduled_post(db, post_id)
            if not post:
                logger.warning(f"Scheduled post {post_id} not found")
                return None

            post.status = status
            if error_message:
                post.error_message = error_message
            if instagram_post_id:
                post.instagram_post_id = instagram_post_id
                post.posted_time = datetime.utcnow()

            db.add(post)
            await db.commit()
            await db.refresh(post)
            logger.info(f"Updated post {post_id} status to {status}")
            return post
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating post status: {e}")
            raise

    @staticmethod
    async def update_post_caption(
        db: AsyncSession, post_id: int, caption: str
    ) -> Optional[ScheduledPost]:
        """Update a post's caption."""
        try:
            post = await InstagramCRUD.get_scheduled_post(db, post_id)
            if not post:
                logger.warning(f"Scheduled post {post_id} not found")
                return None

            post.caption = caption
            db.add(post)
            await db.commit()
            await db.refresh(post)
            logger.info(f"Updated post {post_id} caption")
            return post
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating post caption: {e}")
            raise

    @staticmethod
    async def bulk_create_posts(
        db: AsyncSession,
        user_id: int,
        social_account_id: int,
        posts: List[dict],
    ) -> List[ScheduledPost]:
        """Create multiple scheduled posts at once."""
        try:
            created_posts = []
            for post_data in posts:
                post = ScheduledPost(
                    user_id=user_id,
                    social_account_id=social_account_id,
                    image_url=post_data.get("image_url"),
                    caption=post_data.get("caption"),
                    scheduled_time=post_data.get("scheduled_time"),
                    ai_generated=post_data.get("ai_generated", False),
                    status=(
                        PostStatus.SCHEDULED.value
                        if post_data.get("scheduled_time")
                        else PostStatus.PENDING.value
                    ),
                )
                created_posts.append(post)
                db.add(post)

            await db.commit()
            for post in created_posts:
                await db.refresh(post)
            logger.info(f"Created {len(created_posts)} scheduled posts for user {user_id}")
            return created_posts
        except Exception as e:
            await db.rollback()
            logger.error(f"Error bulk creating posts: {e}")
            raise

    @staticmethod
    async def get_analytics(
        db: AsyncSession, post_id: int
    ) -> Optional[dict]:
        """Get analytics for a specific post."""
        try:
            post = await InstagramCRUD.get_scheduled_post(db, post_id)
            if not post:
                logger.warning(f"Scheduled post {post_id} not found")
                return None

            # Fetch analytics from PostAnalytics table
            stmt = select(PostAnalytics).where(
                PostAnalytics.scheduled_post_id == post_id
            )
            result = await db.execute(stmt)
            analytics = result.scalar_one_or_none()

            if not analytics:
                return {
                    "post_id": post_id,
                    "likes": 0,
                    "comments": 0,
                    "shares": 0,
                    "impressions": 0,
                    "reach": 0,
                }

            return {
                "post_id": post_id,
                "likes": analytics.likes,
                "comments": analytics.comments,
                "shares": analytics.shares,
                "impressions": analytics.impressions,
                "reach": analytics.reach,
            }
        except Exception as e:
            logger.error(f"Error fetching analytics for post {post_id}: {e}")
            raise

    @staticmethod
    async def check_instagram_connection(
        db: AsyncSession, user_id: int
    ) -> dict:
        """
        Check if user has Instagram account connected and automation enabled.
        
        Returns:
            Dict with connection status, automation settings, and account info
        """
        try:
            # Get active Instagram accounts
            stmt = select(SocialAccount).where(
                and_(
                    SocialAccount.user_id == user_id,
                    SocialAccount.is_active == True,
                    SocialAccount.platform == "instagram",
                )
            )
            result = await db.execute(stmt)
            accounts = result.scalars().all()
            accounts = list(accounts)

            has_connected = len(accounts) > 0
            account_username = accounts[0].ig_username if accounts else None

            # Get user settings
            from models.settings import UserSettings

            settings_stmt = select(UserSettings).where(
                UserSettings.user_id == user_id
            )
            settings_result = await db.execute(settings_stmt)
            user_settings = settings_result.scalar_one_or_none()

            automation_enabled = (
                user_settings.instagram_enabled if user_settings else False
            )
            auto_publish = (
                user_settings.instagram_auto_publish if user_settings else False
            )

            # Get last posted time
            last_post_stmt = (
                select(ScheduledPost)
                .where(
                    and_(
                        ScheduledPost.user_id == user_id,
                        ScheduledPost.status == PostStatus.POSTED.value,
                    )
                )
                .order_by(desc(ScheduledPost.posted_time))
                .limit(1)
            )
            last_post_result = await db.execute(last_post_stmt)
            last_post = last_post_result.scalar_one_or_none()
            last_post_time = last_post.posted_time if last_post else None

            return {
                "is_connected": has_connected,
                "account_username": account_username,
                "automation_enabled": automation_enabled,
                "auto_publish_enabled": auto_publish,
                "last_post_time": last_post_time,
                "total_accounts": len(accounts),
            }
        except Exception as e:
            logger.error(f"Error checking Instagram connection for user {user_id}: {e}")
            raise


# Export singleton instance
instagram_crud = InstagramCRUD()
