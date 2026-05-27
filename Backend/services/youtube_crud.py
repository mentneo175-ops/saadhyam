import logging
from typing import List, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from models.instagram import SocialAccount
from models.youtube import YouTubeChannel, YouTubeVideo, YouTubeAnalytics

logger = logging.getLogger(__name__)


class YouTubeCRUD:
    """CRUD operations for YouTube-related database models (async version)."""

    @staticmethod
    def _to_utc_naive(value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None

        if value.tzinfo is None:
            return value

        return value.astimezone(timezone.utc).replace(tzinfo=None)

    @staticmethod
    async def create_youtube_account(
        db: AsyncSession,
        user_id: int,
        access_token: str,
        refresh_token: Optional[str],
        expires_in: int,
        channel_data: dict,
    ) -> YouTubeChannel:
        """Create or update SocialAccount and YouTubeChannel records together."""
        try:
            # Calculate token expiry
            expiry_date = datetime.utcnow() + func.coalesce(expires_in, 3600)
            
            # Step 1: Create or update SocialAccount
            stmt = select(SocialAccount).where(
                and_(
                    SocialAccount.user_id == user_id,
                    SocialAccount.platform == "youtube",
                    SocialAccount.ig_user_id == channel_data["channel_id"]  # Store youtube channel_id in ig_user_id to reuse column
                )
            )
            result = await db.execute(stmt)
            existing_account = result.scalar_one_or_none()
            
            if existing_account:
                logger.info(f"Reactivating existing SocialAccount {existing_account.id} for YouTube")
                existing_account.access_token = access_token
                if refresh_token:
                    existing_account.refresh_token = refresh_token
                existing_account.ig_username = channel_data["channel_title"]  # Store title in ig_username
                existing_account.is_active = True
                existing_account.disconnected_at = None
                existing_account.connected_at = datetime.utcnow()
                db.add(existing_account)
                social_account = existing_account
            else:
                logger.info("Creating new SocialAccount for YouTube")
                social_account = SocialAccount(
                    user_id=user_id,
                    platform="youtube",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    ig_user_id=channel_data["channel_id"],
                    ig_username=channel_data["channel_title"],
                    is_active=True
                )
                db.add(social_account)
            
            await db.commit()
            await db.refresh(social_account)
            
            # Step 2: Create or update YouTubeChannel details
            stmt_chan = select(YouTubeChannel).where(
                and_(
                    YouTubeChannel.user_id == user_id,
                    YouTubeChannel.channel_id == channel_data["channel_id"]
                )
            )
            result_chan = await db.execute(stmt_chan)
            existing_channel = result_chan.scalar_one_or_none()
            
            if existing_channel:
                logger.info(f"Updating YouTubeChannel {existing_channel.id}")
                existing_channel.channel_title = channel_data["channel_title"]
                existing_channel.channel_description = channel_data["channel_description"]
                existing_channel.subscriber_count = channel_data["subscriber_count"]
                existing_channel.video_count = channel_data["video_count"]
                existing_channel.view_count = channel_data["view_count"]
                existing_channel.thumbnail_url = channel_data["thumbnail_url"]
                existing_channel.uploads_playlist_id = channel_data.get("uploads_playlist_id")
                existing_channel.social_account_id = social_account.id
                existing_channel.synced_at = datetime.utcnow()
                db.add(existing_channel)
                youtube_channel = existing_channel
            else:
                logger.info("Creating new YouTubeChannel")
                youtube_channel = YouTubeChannel(
                    user_id=user_id,
                    social_account_id=social_account.id,
                    channel_id=channel_data["channel_id"],
                    channel_title=channel_data["channel_title"],
                    channel_description=channel_data["channel_description"],
                    subscriber_count=channel_data["subscriber_count"],
                    video_count=channel_data["video_count"],
                    view_count=channel_data["view_count"],
                    thumbnail_url=channel_data["thumbnail_url"],
                    uploads_playlist_id=channel_data.get("uploads_playlist_id"),
                    synced_at=datetime.utcnow()
                )
                db.add(youtube_channel)
                
            await db.commit()
            await db.refresh(youtube_channel)
            return youtube_channel
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving YouTube account to DB: {e}")
            raise

    @staticmethod
    async def get_user_channels(db: AsyncSession, user_id: int) -> List[YouTubeChannel]:
        """Fetch all connected YouTube channels for a user."""
        try:
            stmt = select(YouTubeChannel).where(YouTubeChannel.user_id == user_id)
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error fetching YouTube channels for user {user_id}: {e}")
            raise

    @staticmethod
    async def get_channel_by_id(db: AsyncSession, channel_db_id: int) -> Optional[YouTubeChannel]:
        """Get YouTubeChannel by DB id."""
        try:
            stmt = select(YouTubeChannel).where(YouTubeChannel.id == channel_db_id)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching YouTubeChannel by ID {channel_db_id}: {e}")
            raise

    @staticmethod
    async def create_video(
        db: AsyncSession,
        user_id: int,
        channel_id: int,
        title: str,
        description: str,
        tags: Optional[List[str]],
        privacy_status: str,
        video_url: str,
        thumbnail_url: Optional[str] = None,
        video_public_id: Optional[str] = None,
        thumbnail_public_id: Optional[str] = None,
        scheduled_time: Optional[datetime] = None,
        ai_generated: bool = False
    ) -> YouTubeVideo:
        """Create a scheduled or immediate YouTubeVideo upload record."""
        try:
            channel = await YouTubeCRUD.get_channel_by_id(db, channel_id)
            status = "scheduled" if scheduled_time else "pending"
            video = YouTubeVideo(
                user_id=user_id,
                channel_id=channel_id,
                title=title,
                description=description,
                tags=tags,
                privacy_status=privacy_status,
                video_url=video_url,
                thumbnail_url=thumbnail_url,
                video_public_id=video_public_id,
                thumbnail_public_id=thumbnail_public_id,
                scheduled_time=YouTubeCRUD._to_utc_naive(scheduled_time),
                status=status,
                ai_generated=ai_generated
            )
            db.add(video)

            if channel:
                channel.video_count = (channel.video_count or 0) + 1
                db.add(channel)

            await db.commit()
            await db.refresh(video)
            return video
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating YouTubeVideo: {e}")
            raise

    @staticmethod
    async def get_video(db: AsyncSession, video_db_id: int) -> Optional[YouTubeVideo]:
        """Get YouTubeVideo by DB id."""
        try:
            stmt = select(YouTubeVideo).where(YouTubeVideo.id == video_db_id)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching YouTubeVideo {video_db_id}: {e}")
            raise

    @staticmethod
    async def get_user_videos(
        db: AsyncSession, user_id: int, skip: int = 0, limit: int = 20
    ) -> Tuple[List[YouTubeVideo], int]:
        """Get user's uploaded or scheduled YouTube videos with pagination."""
        try:
            # Count
            count_stmt = select(func.count(YouTubeVideo.id)).where(YouTubeVideo.user_id == user_id)
            count_res = await db.execute(count_stmt)
            total = count_res.scalar() or 0

            # List
            stmt = (
                select(YouTubeVideo)
                .where(YouTubeVideo.user_id == user_id)
                .order_by(desc(YouTubeVideo.created_at))
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            return list(result.scalars().all()), total
        except Exception as e:
            logger.error(f"Error fetching YouTubeVideos for user {user_id}: {e}")
            raise

    @staticmethod
    async def update_video_status(
        db: AsyncSession,
        video_db_id: int,
        status: str,
        error_message: Optional[str] = None,
        youtube_video_id: Optional[str] = None
    ) -> Optional[YouTubeVideo]:
        """Update the publishing/uploading status of a video."""
        try:
            video = await YouTubeCRUD.get_video(db, video_db_id)
            if not video:
                return None
                
            video.status = status
            if error_message:
                video.error_message = error_message
            if youtube_video_id:
                video.video_id = youtube_video_id
                video.posted_time = YouTubeCRUD._to_utc_naive(datetime.now(timezone.utc))
                
            db.add(video)
            await db.commit()
            await db.refresh(video)
            return video
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating YouTubeVideo status: {e}")
            raise

    @staticmethod
    async def delete_video(db: AsyncSession, video_db_id: int) -> bool:
        """Delete local record of a YouTube video."""
        try:
            video = await YouTubeCRUD.get_video(db, video_db_id)
            if not video:
                return False
            channel = await YouTubeCRUD.get_channel_by_id(db, video.channel_id)
            await db.delete(video)
            if channel and (channel.video_count or 0) > 0:
                channel.video_count -= 1
                db.add(channel)
            await db.commit()
            return True
        except Exception as e:
            await db.rollback()
            logger.error(f"Error deleting local YouTubeVideo: {e}")
            raise

    @staticmethod
    async def save_analytics(
        db: AsyncSession,
        channel_id: int,
        video_id: Optional[int],
        metrics: dict
    ) -> YouTubeAnalytics:
        """Create a new YouTubeAnalytics snapshot record."""
        try:
            analytics = YouTubeAnalytics(
                channel_id=channel_id,
                video_id=video_id,
                snapshot_date=datetime.utcnow(),
                views=metrics.get("views", 0),
                watch_time_minutes=metrics.get("watch_time_minutes", 0),
                subscribers_gained=metrics.get("subscribers_gained", 0),
                likes=metrics.get("likes", 0),
                comments=metrics.get("comments", 0),
                shares=metrics.get("shares", 0),
                traffic_sources=metrics.get("traffic_sources"),
                demographics=metrics.get("demographics")
            )
            db.add(analytics)
            await db.commit()
            await db.refresh(analytics)
            return analytics
        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving YouTubeAnalytics: {e}")
            raise


youtube_crud = YouTubeCRUD()
