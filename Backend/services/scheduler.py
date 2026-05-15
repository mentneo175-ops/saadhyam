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
from models.instagram import ScheduledPost
from services.instagram_service import InstagramGraphAPIService
from services.instagram_crud import InstagramCRUD

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
        logger.info("=" * 80)
        logger.info("🔄 SCHEDULER: Starting scheduled posts processing")
        logger.info("=" * 80)
        
        # Get current UTC time
        utc_now = datetime.utcnow()
        logger.info(f"🕐 Current UTC time: {utc_now.isoformat()}")
        
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
        
        logger.info(f"📊 Total scheduled posts in database: {db.query(ScheduledPost).filter(ScheduledPost.status == 'scheduled').count()}")
        logger.info(f"✅ Found {len(posts)} posts ready to post")
        
        if not posts:
            logger.info("ℹ️  No posts ready to post at this time")
            logger.info("=" * 80)
            return
        
        # Initialize services
        instagram_service = InstagramGraphAPIService()
        instagram_crud = InstagramCRUD()
        
        posted_count = 0
        failed_count = 0
        
        # Process each post
        for post in posts:
            try:
                logger.info("-" * 80)
                logger.info(f"📤 Processing post ID: {post.id}")
                logger.info(f"   Scheduled time (UTC): {post.scheduled_time}")
                logger.info(f"   Current time (UTC): {utc_now}")
                logger.info(f"   Time difference: {(utc_now - post.scheduled_time).total_seconds()} seconds")
                logger.info(f"   Caption: {post.caption[:50] if post.caption else 'No caption'}...")
                
                # Get social account
                account = post.social_account
                if not account:
                    logger.error(f"❌ Social account for post {post.id} not found")
                    failed_count += 1
                    continue
                
                logger.info(f"   Account: @{account.ig_username}")
                logger.info(f"   Image URL: {post.image_url[:60]}...")
                
                # Verify account is active
                if not account.is_active:
                    logger.error(f"❌ Account {account.ig_username} is not active")
                    failed_count += 1
                    continue
                
                logger.info(f"   Access token: {account.access_token[:20]}...")
                
                # Detect if media is video/reel or image based on URL
                media_type = "IMAGE"
                if post.image_url:
                    url_lower = post.image_url.lower()
                    if any(ext in url_lower for ext in ['.mp4', '.mov', '.avi', '/video/', 'resource_type/video']):
                        media_type = "REELS"
                        logger.info(f"   Media type: REELS (video detected)")
                    else:
                        logger.info(f"   Media type: IMAGE")
                
                # Post to Instagram
                logger.info(f"📸 Calling Instagram Graph API...")
                post_result = instagram_service.post_to_instagram_sync(
                    ig_user_id=account.ig_user_id,
                    image_url=post.image_url,
                    caption=post.caption or "",
                    access_token=account.access_token,
                    media_type=media_type
                )
                
                logger.info(f"📥 Instagram API response: {post_result}")
                
                if post_result.get("success"):
                    # Update post status to "posted"
                    logger.info(f"✅ Instagram posting succeeded")
                    
                    # Extract media ID from response
                    media_id = post_result.get("post_id")  # This is the Instagram media ID
                    creation_id = post_result.get("creation_id")
                    
                    logger.info(f"   Instagram Media ID: {media_id}")
                    logger.info(f"   Creation ID: {creation_id}")
                    
                    # Update in database - IMPORTANT: Save media_id for Meta Ads promotion
                    post.status = "posted"
                    post.posted_time = datetime.utcnow()
                    post.instagram_post_id = media_id  # Legacy field
                    post.instagram_media_id = media_id  # REQUIRED for Meta Ads boosted posts
                    db.commit()
                    
                    logger.info(f"✅ Database updated:")
                    logger.info(f"   status=posted")
                    logger.info(f"   posted_time={post.posted_time}")
                    logger.info(f"   instagram_post_id={media_id}")
                    logger.info(f"   instagram_media_id={media_id}")
                    
                    posted_count += 1
                    logger.info(f"✅ Post {post.id} successfully posted and saved to database!")
                    logger.info(f"✅ This post can now be promoted with Meta Ads!")
                    
                else:
                    # Posting failed
                    error_msg = post_result.get("error", "Unknown error")
                    logger.error(f"❌ Instagram posting failed: {error_msg}")
                    
                    # Update error message in database
                    post.error_message = error_msg
                    post.retry_count += 1
                    
                    if post.retry_count >= post.max_retries:
                        post.status = "failed"
                        logger.error(f"❌ Post {post.id} marked as failed (max retries exceeded)")
                    
                    db.commit()
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Exception processing post {post.id}: {type(e).__name__}: {e}", exc_info=True)
                
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
        
        logger.info("-" * 80)
        logger.info(f"🎉 Processing complete:")
        logger.info(f"   ✅ Posted: {posted_count}")
        logger.info(f"   ❌ Failed: {failed_count}")
        logger.info(f"   Total: {posted_count + failed_count}")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR in scheduler: {type(e).__name__}: {e}", exc_info=True)
    finally:
        db.close()


def start_scheduler():
    """
    Start the APScheduler background scheduler.
    This should be called when the FastAPI application starts.
    """
    global scheduler
    
    try:
        logger.info("=" * 80)
        logger.info("🚀 SCHEDULER: Initializing APScheduler")
        logger.info("=" * 80)
        
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
        
        logger.info("✅ Job added: process_scheduled_posts (every 1 minute)")
        
        # Start scheduler
        scheduler.start()
        logger.info("✅ APScheduler started successfully")
        logger.info("=" * 80)
        
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
            logger.info("=" * 80)
            logger.info("🛑 SCHEDULER: Stopping APScheduler")
            scheduler.shutdown()
            logger.info("✅ APScheduler stopped")
            logger.info("=" * 80)
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
