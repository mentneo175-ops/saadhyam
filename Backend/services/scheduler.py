"""
APScheduler-based job scheduler for processing scheduled Instagram posts.
This handles automatic posting of scheduled content at the right time.
"""

import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import create_engine, select, and_
from sqlalchemy.orm import sessionmaker
from config.settings import settings
import asyncio
import requests
from models.instagram import ScheduledPost, SocialAccount
from models.youtube import YouTubeVideo, YouTubeChannel
from services.instagram_service import InstagramGraphAPIService
from services.instagram_crud import InstagramCRUD
from services.youtube_service import youtube_service
from services.cloudinary_service import delete_cloudinary_asset_sync

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

# Create synchronous database engine for scheduler
engine = create_engine(
    settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql"),
    echo=False
)
SessionLocal = sessionmaker(bind=engine)


def process_scheduled_posts():
    """
    Process all scheduled posts that are ready to post.
    This function runs periodically (every 1 minute by default).
    
    IMPORTANT: All times are stored and compared in UTC.
    - scheduled_time in database is UTC
    - current time is UTC
    - Comparison: scheduled_time <= current_utc_time
    """
    db = SessionLocal()
    try:
        # Get current UTC time
        utc_now = datetime.utcnow()
        
        # Query for posts that are scheduled and ready to post
        # IMPORTANT: Both scheduled_time and utc_now are UTC, so comparison is correct
        stmt = select(ScheduledPost).where(
            and_(
                ScheduledPost.status == "scheduled",
                ScheduledPost.scheduled_time <= utc_now,
            )
        )
        result = db.execute(stmt)
        posts = result.scalars().all()
        
        # Only log when there are posts to process (reduce noise)
        if not posts:
            logger.debug(f"ℹ️  No posts ready to post at {utc_now.isoformat()}")
            return
        
        logger.info(f"📤 Processing {len(posts)} scheduled posts")
        
        # Initialize services
        instagram_service = InstagramGraphAPIService()
        instagram_crud = InstagramCRUD()
        
        posted_count = 0
        failed_count = 0
        
        # Process each post
        for post in posts:
            try:
                logger.info(f"📤 Posting ID {post.id} to @{post.social_account.ig_username if post.social_account else 'unknown'}")
                
                # Get social account
                account = post.social_account
                if not account:
                    logger.error(f"❌ Social account for post {post.id} not found")
                    failed_count += 1
                    continue
                
                # Verify account is active
                if not account.is_active:
                    logger.error(f"❌ Account {account.ig_username} is not active")
                    failed_count += 1
                    continue
                
                # Detect if media is video/reel or image based on URL
                media_type = "IMAGE"
                if post.image_url:
                    url_lower = post.image_url.lower()
                    if any(ext in url_lower for ext in ['.mp4', '.mov', '.avi', '/video/', 'resource_type/video']):
                        media_type = "REELS"
                
                # Post to Instagram
                post_result = instagram_service.post_to_instagram_sync(
                    ig_user_id=account.ig_user_id,
                    image_url=post.image_url,
                    caption=post.caption or "",
                    access_token=account.access_token,
                    media_type=media_type
                )
                
                if post_result.get("success"):
                    # Update post status to "posted"
                    media_id = post_result.get("post_id")
                    
                    # Update in database - IMPORTANT: Save media_id for Meta Ads promotion
                    post.status = "posted"
                    post.posted_time = datetime.utcnow()
                    post.instagram_post_id = media_id
                    post.instagram_media_id = media_id
                    db.commit()
                    
                    posted_count += 1
                    logger.info(f"✅ Post {post.id} successfully posted (media_id: {media_id})")
                    
                else:
                    # Posting failed
                    error_msg = post_result.get("error", "Unknown error")
                    logger.error(f"❌ Post {post.id} failed: {error_msg}")
                    
                    # Update error message in database
                    post.error_message = error_msg
                    post.retry_count += 1
                    
                    if post.retry_count >= post.max_retries:
                        post.status = "failed"
                    
                    db.commit()
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Exception processing post {post.id}: {e}")
                
                # Update error in database
                try:
                    post.error_message = str(e)
                    post.retry_count += 1
                    
                    if post.retry_count >= post.max_retries:
                        post.status = "failed"
                    
                    db.commit()
                except Exception as db_error:
                    logger.error(f"❌ Failed to update database: {db_error}")
                
                failed_count += 1
        
        # Only log summary if there were posts processed
        if posted_count > 0 or failed_count > 0:
            logger.info(f"🎉 Processed {posted_count + failed_count} posts: ✅ {posted_count} posted, ❌ {failed_count} failed")
        
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR in scheduler: {type(e).__name__}: {e}", exc_info=True)
    finally:
        db.close()


def process_scheduled_youtube_videos():
    """
    Process scheduled YouTube video uploads.
    Runs every 1 minute.
    """
    db = SessionLocal()
    try:
        utc_now = datetime.utcnow()
        
        # Query for videos that are scheduled and ready to publish
        stmt = select(YouTubeVideo).where(
            and_(
                YouTubeVideo.status == "scheduled",
                YouTubeVideo.scheduled_time <= utc_now,
            )
        )
        result = db.execute(stmt)
        videos = result.scalars().all()
        
        if not videos:
            return
            
        logger.info(f"🎥 YouTube Scheduler: Processing {len(videos)} scheduled uploads")
        
        for video in videos:
            try:
                logger.info(f"🎥 YouTube Scheduler: Uploading Video ID {video.id} - '{video.title}'")
                
                # Fetch YouTubeChannel
                channel_stmt = select(YouTubeChannel).where(YouTubeChannel.id == video.channel_id)
                channel = db.execute(channel_stmt).scalar_one_or_none()
                if not channel:
                    logger.error(f"❌ YouTube Scheduler: Channel for video {video.id} not found")
                    video.status = "failed"
                    video.error_message = "YouTube Channel not found"
                    db.commit()
                    continue
                    
                # Fetch SocialAccount
                account_stmt = select(SocialAccount).where(SocialAccount.id == channel.social_account_id)
                account = db.execute(account_stmt).scalar_one_or_none()
                if not account or not account.is_active:
                    logger.error(f"❌ YouTube Scheduler: SocialAccount for channel {channel.id} is missing or inactive")
                    video.status = "failed"
                    video.error_message = "Connected social account is missing or disconnected"
                    db.commit()
                    continue

                # Ensure active token (refresh if older than 50 minutes)
                access_token = account.access_token
                time_elapsed = datetime.utcnow() - account.updated_at
                if time_elapsed.total_seconds() > 3000 and account.refresh_token:
                    logger.info(f"🔄 YouTube Scheduler: Refreshing token for SocialAccount {account.id}...")
                    
                    # Call refresh token synchronously
                    loop = asyncio.new_event_loop()
                    try:
                        refresh_res = loop.run_until_complete(youtube_service.refresh_token(account.refresh_token))
                        if refresh_res.get("success"):
                            account.access_token = refresh_res["access_token"]
                            account.updated_at = datetime.utcnow()
                            db.commit()
                            access_token = refresh_res["access_token"]
                            logger.info("✅ YouTube Scheduler: Token refreshed successfully")
                        else:
                            logger.error(f"❌ YouTube Scheduler: Token refresh failed: {refresh_res.get('error')}")
                    finally:
                        loop.close()

                # Set status to publishing
                video.status = "publishing"
                db.commit()

                # Call upload_video synchronously via asyncio loop
                loop = asyncio.new_event_loop()
                try:
                    upload_res = loop.run_until_complete(youtube_service.upload_video(
                        access_token=access_token,
                        video_path=video.video_url,
                        title=video.title,
                        description=video.description or "",
                        tags=video.tags,
                        category_id=video.category_id or "22",
                        privacy_status=video.privacy_status or "public"
                    ))
                    
                    if upload_res.get("success"):
                        video.status = "posted"
                        video.video_id = upload_res["video_id"]
                        video.posted_time = datetime.utcnow()
                        if video.video_public_id:
                            delete_cloudinary_asset_sync(video.video_public_id, "video")
                        if video.thumbnail_public_id:
                            delete_cloudinary_asset_sync(video.thumbnail_public_id, "image")
                        logger.info(f"✅ YouTube Scheduler: Video {video.id} posted successfully to YouTube (ID: {upload_res['video_id']})")
                    else:
                        video.status = "failed"
                        video.error_message = upload_res.get("error", "Failed to upload video")
                        logger.error(f"❌ YouTube Scheduler: Upload failed for video {video.id}: {video.error_message}")
                finally:
                    loop.close()

                db.commit()

            except Exception as item_ex:
                logger.error(f"❌ YouTube Scheduler: Error processing video {video.id}: {item_ex}")
                try:
                    video.status = "failed"
                    video.error_message = str(item_ex)
                    db.commit()
                except Exception as db_ex:
                    logger.error(f"❌ YouTube Scheduler: Failed to save error status to DB: {db_ex}")
                    
    except Exception as e:
        logger.error(f"❌ YouTube Scheduler: CRITICAL ERROR: {e}", exc_info=True)
    finally:
        db.close()


def start_scheduler():
    """
    Start the APScheduler background scheduler.
    This should be called when the FastAPI application starts.
    """
    global scheduler
    
    try:
        # Create scheduler
        scheduler = BackgroundScheduler()
        
        # Add job to process scheduled posts every 1 minute
        scheduler.add_job(
            func=process_scheduled_posts,
            trigger=IntervalTrigger(minutes=1),
            id="process_scheduled_posts",
            name="Process Scheduled Instagram Posts",
            replace_existing=True,
            max_instances=1,  # Prevent concurrent execution
        )

        # Add job to process scheduled YouTube videos every 1 minute
        scheduler.add_job(
            func=process_scheduled_youtube_videos,
            trigger=IntervalTrigger(minutes=1),
            id="process_scheduled_youtube_videos",
            name="Process Scheduled YouTube Videos",
            replace_existing=True,
            max_instances=1,
        )
        
        # Start scheduler
        scheduler.start()
        logger.info("✅ Instagram and YouTube post scheduler started (checks every 1 minute)")
        
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}", exc_info=True)
        raise


def stop_scheduler():
    """
    Stop the APScheduler background scheduler.
    This should be called when the FastAPI application shuts down.
    """
    global scheduler
    
    try:
        if scheduler and scheduler.running:
            scheduler.shutdown()
            logger.info("✅ Scheduler stopped")
    except Exception as e:
        logger.error(f"❌ Error stopping scheduler: {e}", exc_info=True)


def get_scheduler_status():
    """
    Get the current status of the scheduler.
    """
    global scheduler
    
    if not scheduler:
        return {
            "running": False,
            "message": "Scheduler not initialized"
        }
    
    return {
        "running": scheduler.running,
        "jobs": len(scheduler.get_jobs()),
        "jobs_list": [
            {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            }
            for job in scheduler.get_jobs()
        ]
    }
