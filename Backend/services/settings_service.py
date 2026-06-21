"""
User settings CRUD operations (Async version).
"""

import logging
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from models.settings import UserSettings
from models.instagram import SocialAccount, PostStatus, ScheduledPost

logger = logging.getLogger(__name__)


class SettingsService:
    """Service for managing user settings and preferences (async version)."""

    @staticmethod
    async def get_user_settings(
        db: AsyncSession, user_id: int
    ) -> Optional[UserSettings]:
        """Get user settings, create default if not exists."""
        try:
            stmt = select(UserSettings).where(UserSettings.user_id == user_id)
            result = await db.execute(stmt)
            settings = result.scalar_one_or_none()

            # Create default settings if not exists
            if not settings:
                settings = UserSettings(user_id=user_id)
                db.add(settings)
                await db.commit()
                await db.refresh(settings)
                logger.info(f"Created default settings for user {user_id}")

            return settings
        except Exception as e:
            await db.rollback()
            logger.error(f"Error getting user settings: {e}")
            raise

    @staticmethod
    async def update_instagram_automation(
        db: AsyncSession,
        user_id: int,
        instagram_enabled: Optional[bool] = None,
        instagram_auto_publish: Optional[bool] = None,
        instagram_auto_reply: Optional[bool] = None,
        instagram_save_drafts: Optional[bool] = None,
    ) -> UserSettings:
        """Update Instagram automation settings."""
        try:
            settings = await SettingsService.get_user_settings(db, user_id)

            if instagram_enabled is not None:
                settings.instagram_enabled = instagram_enabled
            if instagram_auto_publish is not None:
                settings.instagram_auto_publish = instagram_auto_publish
            if instagram_auto_reply is not None:
                settings.instagram_auto_reply = instagram_auto_reply
            if instagram_save_drafts is not None:
                settings.instagram_save_drafts = instagram_save_drafts

            db.add(settings)
            await db.commit()
            await db.refresh(settings)
            logger.info(f"Updated Instagram automation settings for user {user_id}")
            return settings
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating Instagram automation settings: {e}")
            raise

    @staticmethod
    async def update_posting_preferences(
        db: AsyncSession,
        user_id: int,
        preferred_posting_time: Optional[str] = None,
        posting_frequency: Optional[str] = None,
        auto_generate_captions: Optional[bool] = None,
    ) -> UserSettings:
        """Update posting preferences."""
        try:
            settings = await SettingsService.get_user_settings(db, user_id)

            if preferred_posting_time is not None:
                settings.preferred_posting_time = preferred_posting_time
            if posting_frequency is not None:
                settings.posting_frequency = posting_frequency
            if auto_generate_captions is not None:
                settings.auto_generate_captions = auto_generate_captions

            db.add(settings)
            await db.commit()
            await db.refresh(settings)
            logger.info(f"Updated posting preferences for user {user_id}")
            return settings
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating posting preferences: {e}")
            raise

    @staticmethod
    async def update_notification_settings(
        db: AsyncSession,
        user_id: int,
        notify_on_post: Optional[bool] = None,
        notify_on_engagement: Optional[bool] = None,
        notify_on_error: Optional[bool] = None,
    ) -> UserSettings:
        """Update notification settings."""
        try:
            settings = await SettingsService.get_user_settings(db, user_id)

            if notify_on_post is not None:
                settings.notify_on_post = notify_on_post
            if notify_on_engagement is not None:
                settings.notify_on_engagement = notify_on_engagement
            if notify_on_error is not None:
                settings.notify_on_error = notify_on_error

            db.add(settings)
            await db.commit()
            await db.refresh(settings)
            logger.info(f"Updated notification settings for user {user_id}")
            return settings
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating notification settings: {e}")
            raise

    @staticmethod
    async def check_instagram_connection_status(
        db: AsyncSession, user_id: int
    ) -> dict:
        """
        Check Instagram connection and automation status.
        
        Returns comprehensive status including:
        - Is Instagram account connected
        - Is automation enabled
        - Account username
        - Auto-publish status
        - Last post time
        """
        try:
            # Get user settings
            settings = await SettingsService.get_user_settings(db, user_id)

            # First check new Instagram Analytics accounts (priority)
            from models.instagram_analytics import InstagramBusinessAccount
            
            analytics_stmt = select(InstagramBusinessAccount).where(
                InstagramBusinessAccount.user_id == user_id,
                InstagramBusinessAccount.is_active == True,
            )
            analytics_result = await db.execute(analytics_stmt)
            analytics_accounts = analytics_result.scalars().all()
            analytics_accounts = list(analytics_accounts)
            
            # If analytics accounts exist, use them
            if analytics_accounts:
                account = analytics_accounts[0]
                is_connected = True
                account_username = account.username
                page_name = account.facebook_page_name
                
                status = {
                    "is_connected": is_connected,
                    "automation_enabled": settings.instagram_enabled,
                    "auto_publish_enabled": settings.instagram_auto_publish,
                    "auto_reply_enabled": settings.instagram_auto_reply,
                    "save_drafts": settings.instagram_save_drafts,
                    "account_username": account_username,
                    "page_name": page_name,
                    "total_accounts": len(analytics_accounts),
                    "last_post_time": None,  # Can be enhanced later
                    "posting_frequency": settings.posting_frequency,
                    "preferred_posting_time": settings.preferred_posting_time,
                }
                
                return status

            # Fallback to legacy SocialAccount table
            stmt = select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.is_active == True,
                SocialAccount.platform == "instagram",
            )
            result = await db.execute(stmt)
            accounts = result.scalars().all()
            accounts = list(accounts)

            is_connected = len(accounts) > 0
            account_username = accounts[0].ig_username if accounts else None
            page_name = accounts[0].page_name if accounts else None

            # Get last posted time
            last_post_stmt = (
                select(ScheduledPost)
                .where(
                    ScheduledPost.user_id == user_id,
                    ScheduledPost.status == PostStatus.POSTED.value,
                )
                .order_by(desc(ScheduledPost.posted_time))
                .limit(1)
            )
            last_post_result = await db.execute(last_post_stmt)
            last_post = last_post_result.scalar_one_or_none()

            status = {
                "is_connected": is_connected,
                "automation_enabled": settings.instagram_enabled,
                "auto_publish_enabled": settings.instagram_auto_publish,
                "auto_reply_enabled": settings.instagram_auto_reply,
                "save_drafts": settings.instagram_save_drafts,
                "account_username": account_username,
                "page_name": page_name,
                "total_accounts": len(accounts),
                "last_post_time": last_post.posted_time if last_post else None,
                "posting_frequency": settings.posting_frequency,
                "preferred_posting_time": settings.preferred_posting_time,
            }

            return status
        except Exception as e:
            logger.error(f"Error checking Instagram connection status: {e}")
            raise

    @staticmethod
    async def update_automation_rules(
        db: AsyncSession, user_id: int, rules: dict
    ) -> UserSettings:
        """Update complex automation rules."""
        try:
            settings = await SettingsService.get_user_settings(db, user_id)
            settings.automation_rules = rules
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
            logger.info(f"Updated automation rules for user {user_id}")
            return settings
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating automation rules: {e}")
            raise

    @staticmethod
    async def update_blocked_keywords(
        db: AsyncSession, user_id: int, keywords: list
    ) -> UserSettings:
        """Update list of blocked keywords for captions."""
        try:
            settings = await SettingsService.get_user_settings(db, user_id)
            settings.blocked_keywords = keywords
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
            logger.info(f"Updated blocked keywords for user {user_id}")
            return settings
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating blocked keywords: {e}")
            raise

    @staticmethod
    async def disconnect_instagram_account(db: AsyncSession, user_id: int) -> bool:
        """
        Disconnect Instagram account and clean up all related data.
        
        This will:
        - Deactivate all Instagram social accounts (legacy & analytics)
        - Disable Instagram automation
        - Cancel all scheduled posts
        - Clear Instagram-related settings
        
        Returns True if disconnection was successful, False if no account was connected.
        """
        try:
            # Check if user has any Instagram accounts (active or inactive)
            stmt = select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == "instagram",
            )
            result = await db.execute(stmt)
            accounts = list(result.scalars().all())
            
            # Also check Instagram Business Accounts (analytics)
            from models.instagram_analytics import InstagramBusinessAccount
            analytics_stmt = select(InstagramBusinessAccount).where(
                InstagramBusinessAccount.user_id == user_id,
            )
            analytics_result = await db.execute(analytics_stmt)
            analytics_accounts = list(analytics_result.scalars().all())
            
            if not accounts and not analytics_accounts:
                logger.info(f"No Instagram accounts found for user {user_id}")
                # Still check and reset settings in case of orphaned data
                settings = await SettingsService.get_user_settings(db, user_id)
                if settings.instagram_enabled:
                    settings.instagram_enabled = False
                    settings.instagram_auto_publish = False
                    settings.instagram_auto_reply = False
                    settings.instagram_save_drafts = False
                    db.add(settings)
                    await db.commit()
                    logger.info(f"Reset orphaned Instagram settings for user {user_id}")
                    return True
                return False
            
            # Deactivate all Instagram SocialAccounts
            disconnected_any = False
            for account in accounts:
                if account.is_active:
                    account.is_active = False
                    account.disconnected_at = datetime.utcnow()
                    # Clear sensitive tokens (use empty string as it's NOT NULL in DB)
                    account.access_token = ""
                    account.refresh_token = None
                    db.add(account)
                    disconnected_any = True
                    logger.info(f"Deactivated Instagram SocialAccount {account.ig_username} for user {user_id}")
            
            # Deactivate all Instagram Business Accounts (analytics)
            for acc in analytics_accounts:
                if acc.is_active:
                    acc.is_active = False
                    # Clear sensitive tokens (use empty string as it's NOT NULL in DB)
                    acc.access_token = ""
                    acc.refresh_token = None
                    db.add(acc)
                    disconnected_any = True
                    logger.info(f"Deactivated InstagramBusinessAccount {acc.username} for user {user_id}")
            
            # Cancel all scheduled posts
            from models.instagram import ScheduledPost
            scheduled_posts_stmt = select(ScheduledPost).where(
                ScheduledPost.user_id == user_id,
                ScheduledPost.status.in_(["scheduled", "pending"]),
            )
            scheduled_result = await db.execute(scheduled_posts_stmt)
            scheduled_posts = list(scheduled_result.scalars().all())
            
            for post in scheduled_posts:
                post.status = "failed"
                post.error_message = "Account disconnected by user"
                db.add(post)
                logger.info(f"Cancelled scheduled post {post.id} for user {user_id}")
            
            # Disable Instagram automation in settings
            settings = await SettingsService.get_user_settings(db, user_id)
            settings.instagram_enabled = False
            settings.instagram_auto_publish = False
            settings.instagram_auto_reply = False
            db.add(settings)
            
            # Commit all changes
            await db.commit()
            
            logger.info(f"Successfully disconnected Instagram account for user {user_id}")
            logger.info(f"- Deactivated {len(accounts)} SocialAccount(s) and {len(analytics_accounts)} InstagramBusinessAccount(s)")
            logger.info(f"- Cancelled {len(scheduled_posts)} scheduled post(s)")
            logger.info(f"- Disabled Instagram automation")
            
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error disconnecting Instagram account for user {user_id}: {e}")
            raise
