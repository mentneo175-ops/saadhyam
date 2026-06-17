import logging
from celery import Celery
from config.settings import settings
from datetime import datetime
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# Create Celery app
celery = Celery(
    "saadhyam",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Configure Celery
celery.conf.update(
    task_serializer=settings.CELERY_TASK_SERIALIZER,
    accept_content=[settings.CELERY_ACCEPT_CONTENT],
    result_serializer=settings.CELERY_RESULT_SERIALIZER,
    timezone=settings.CELERY_TIMEZONE,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
)


# Create synchronous database session for Celery tasks
is_sqlite = "sqlite" in settings.DATABASE_URL
connect_args = {}
if not is_sqlite:
    connect_args = {
        "sslmode": "require",
        "connect_timeout": 30
    }

engine = create_engine(
    settings.DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")
                         .replace("postgresql+asyncpg://", "postgresql://"),
    echo=False,
    pool_pre_ping=True,
    pool_recycle=280,
    connect_args=connect_args
)
SessionLocal = sessionmaker(bind=engine)


def get_db_session():
    """Get synchronous database session."""
    db = SessionLocal()
    try:
        return db
    except Exception as e:
        logger.error(f"Error creating database session: {e}")
        raise


@celery.task(bind=True, max_retries=3)
def post_to_instagram_task(self, post_id: int):
    """
    Post a scheduled post to Instagram.
    Handles retries on failure.
    """
    from models.instagram import ScheduledPost, PostStatus
    from services.instagram_service import InstagramGraphAPIService
    from config.database import Base
    import asyncio

    db = get_db_session()
    try:
        logger.info(f"Processing post {post_id}")

        # Get the scheduled post
        post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()

        if not post:
            logger.error(f"Post {post_id} not found")
            return {"success": False, "error": "Post not found"}

        # Get social account
        account = post.social_account
        if not account:
            logger.error(f"Social account for post {post_id} not found")
            return {"success": False, "error": "Account not found"}

        # Get access token
        access_token = account.access_token

        # Post to Instagram using the service
        instagram_service = InstagramGraphAPIService()
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(
            instagram_service.post_to_instagram(
                ig_user_id=account.ig_user_id,
                image_url=post.image_url,
                caption=post.caption or "",
                access_token=access_token
            )
        )
        loop.close()

        if result.get("success"):
            post.status = PostStatus.POSTED.value
            post.instagram_post_id = result.get("post_id")
            post.posted_time = datetime.utcnow()
            post.updated_at = datetime.utcnow()
            db.commit()

            logger.info(f"Successfully posted to Instagram: {post.instagram_post_id}")
            return {
                "success": True,
                "post_id": post.id,
                "instagram_post_id": post.instagram_post_id,
            }
        else:
            raise Exception(result.get("error", "Unknown error"))

    except Exception as e:
        logger.error(f"Error posting to Instagram: {e}")

        # Update post with error
        try:
            post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()
            if post:
                post.retry_count += 1
                post.error_message = str(e)

                if post.retry_count >= post.max_retries:
                    post.status = PostStatus.FAILED.value
                else:
                    # Retry with exponential backoff
                    raise self.retry(exc=e, countdown=60 * (2**post.retry_count))

                db.commit()
        except Exception as retry_e:
            logger.error(f"Error updating post on retry: {retry_e}")

        return {"success": False, "error": str(e), "retry_count": post.retry_count}

    finally:
        db.close()


@celery.task()
def process_scheduled_posts():
    """
    Process all pending scheduled posts.
    This should be run periodically (e.g., every 5 minutes).
    """
    from models.instagram import ScheduledPost, PostStatus
    from sqlalchemy import and_

    db = get_db_session()
    try:
        logger.info("Starting scheduled posts processing")

        # Get posts that are scheduled and ready to post
        posts = (
            db.query(ScheduledPost)
            .filter(
                and_(
                    ScheduledPost.status == PostStatus.SCHEDULED.value,
                    ScheduledPost.scheduled_time <= datetime.utcnow(),
                )
            )
            .all()
        )

        logger.info(f"Found {len(posts)} posts ready to post")

        for post in posts:
            # Queue the posting task
            post_to_instagram_task.delay(post.id)
            logger.info(f"Queued post {post.id} for posting")

        return {"success": True, "processed_count": len(posts)}

    except Exception as e:
        logger.error(f"Error processing scheduled posts: {e}")
        return {"success": False, "error": str(e)}

    finally:
        db.close()


@celery.task()
def retry_failed_posts():
    """
    Retry failed posts that haven't exceeded max retries.
    This should be run periodically (e.g., every 30 minutes).
    """
    from models.instagram import ScheduledPost, PostStatus
    from sqlalchemy import and_

    db = get_db_session()
    try:
        logger.info("Starting failed posts retry")

        # Get failed posts that can be retried
        posts = (
            db.query(ScheduledPost)
            .filter(
                and_(
                    ScheduledPost.status == PostStatus.FAILED.value,
                    ScheduledPost.retry_count < ScheduledPost.max_retries,
                )
            )
            .all()
        )

        logger.info(f"Found {len(posts)} posts to retry")

        for post in posts:
            post_to_instagram_task.delay(post.id)
            logger.info(f"Queued post {post.id} for retry")

        return {"success": True, "retried_count": len(posts)}

    except Exception as e:
        logger.error(f"Error retrying failed posts: {e}")
        return {"success": False, "error": str(e)}

    finally:
        db.close()


@celery.task()
def fetch_analytics():
    """
    Fetch analytics for posted content.
    This should be run periodically (e.g., every hour).
    """
    logger.info("Fetching analytics for posted content")
    # TODO: Implement analytics fetching
    return {"success": True, "message": "Analytics fetch scheduled"}


def get_valid_google_token_sync(db, account) -> str:
    """Helper to verify and refresh Google access token if expired (synchronous)."""
    from models.instagram import SocialAccount
    from services.google_business_service import google_business_service
    import asyncio
    
    social_account = db.query(SocialAccount).filter(SocialAccount.id == account.social_account_id).first()
    if not social_account:
        raise Exception("Linked Google social account not found")
        
    # Check if token needs refresh (Google tokens expire in 3600 seconds)
    token_age = datetime.utcnow() - social_account.updated_at
    # If updated more than 50 minutes ago, refresh
    if token_age.total_seconds() > 3000:
        logger.info(f"Refreshing expired Google OAuth token for account: {account.account_name}")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            refresh_res = loop.run_until_complete(
                google_business_service.refresh_token(social_account.refresh_token)
            )
        finally:
            loop.close()
            
        if refresh_res.get("success"):
            social_account.access_token = refresh_res["access_token"]
            social_account.updated_at = datetime.utcnow()
            db.add(social_account)
            db.commit()
            return refresh_res["access_token"]
        else:
            logger.warning(f"Failed to refresh Google token: {refresh_res.get('error')}")
            
    return social_account.access_token


@celery.task()
def auto_reply_to_google_reviews():
    """
    Periodic task to fetch new reviews from Google Business Profile
    and automatically reply to reviews that don't have a reply yet.
    Supports official API posting if Google account is connected,
    otherwise falls back to public simulator mode.
    """
    from models.settings import UserSettings
    from services.google_business_service import google_business_service
    from services.maps_review_service import MapsReviewService
    from db.models import ReviewHistory
    from models.google_business import GoogleBusinessAccount, GoogleBusinessLocation, GoogleBusinessReview
    from models.instagram import SocialAccount
    import asyncio
    
    db = get_db_session()
    try:
        logger.info("🤖 Starting automated Google Reviews reply cron job...")
        
        # 1. Fetch user settings where gmaps_auto_reply is enabled in automation_rules JSON
        all_settings = db.query(UserSettings).all()
        for us in all_settings:
            rules = us.automation_rules or {}
            if not rules.get("gmaps_auto_reply", False):
                continue
                
            user_id = us.user_id
            tone = rules.get("gmaps_auto_reply_tone", "professional")
            gmaps_url = rules.get("gmaps_url")
            
            logger.info(f"🔄 Processing Google Maps auto-replies for user {user_id}")
            
            # Check if this user has any connected Google Business accounts & locations
            gb_accounts = db.query(GoogleBusinessAccount).filter(GoogleBusinessAccount.user_id == user_id).all()
            has_official_connection = False
            
            for acc in gb_accounts:
                social_acc = db.query(SocialAccount).filter(
                    SocialAccount.id == acc.social_account_id,
                    SocialAccount.is_active == True
                ).first()
                if not social_acc:
                    continue
                
                has_official_connection = True
                locations = db.query(GoogleBusinessLocation).filter(GoogleBusinessLocation.account_id == acc.id).all()
                for loc in locations:
                    logger.info(f"Syncing and auto-responding officially for location: {loc.location_name}")
                    
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        # Refresh & get valid access token
                        access_token = get_valid_google_token_sync(db, acc)
                        
                        # Fetch latest reviews from official API
                        reviews_res = loop.run_until_complete(
                            google_business_service.get_reviews(
                                access_token=access_token,
                                account_id=acc.account_id,
                                location_id=loc.location_id
                            )
                        )
                        
                        if reviews_res.get("success"):
                            reviews_data = reviews_res.get("reviews", [])
                            # Save reviews to the official DB table
                            for rev in reviews_data:
                                created_dt = rev.get("review_created_at")
                                if isinstance(created_dt, str):
                                    try:
                                        created_dt = datetime.fromisoformat(created_dt.replace("Z", "+00:00")).replace(tzinfo=None)
                                    except ValueError:
                                        created_dt = datetime.utcnow()
                                elif not isinstance(created_dt, datetime):
                                    created_dt = datetime.utcnow()
                                    
                                existing_rev = db.query(GoogleBusinessReview).filter(
                                    GoogleBusinessReview.location_id == loc.id,
                                    GoogleBusinessReview.review_id == rev["review_id"]
                                ).first()
                                
                                if existing_rev:
                                    existing_rev.reviewer_name = rev["reviewer_name"]
                                    existing_rev.reviewer_photo = rev.get("reviewer_photo")
                                    existing_rev.rating = rev["rating"]
                                    existing_rev.comment = rev.get("comment")
                                    if "reply_comment" in rev and rev["reply_comment"]:
                                        existing_rev.reply_comment = rev["reply_comment"]
                                        if rev.get("reply_submitted_at"):
                                            try:
                                                existing_rev.reply_submitted_at = datetime.fromisoformat(rev["reply_submitted_at"].replace("Z", "+00:00")).replace(tzinfo=None)
                                            except ValueError:
                                                existing_rev.reply_submitted_at = datetime.utcnow()
                                else:
                                    reply_sub_dt = None
                                    if rev.get("reply_submitted_at"):
                                        try:
                                            reply_sub_dt = datetime.fromisoformat(rev["reply_submitted_at"].replace("Z", "+00:00")).replace(tzinfo=None)
                                        except ValueError:
                                            reply_sub_dt = datetime.utcnow()
                                            
                                    new_rev = GoogleBusinessReview(
                                        location_id=loc.id,
                                        review_id=rev["review_id"],
                                        reviewer_name=rev["reviewer_name"],
                                        reviewer_photo=rev.get("reviewer_photo"),
                                        rating=rev["rating"],
                                        comment=rev.get("comment"),
                                        reply_comment=rev.get("reply_comment"),
                                        reply_submitted_at=reply_sub_dt,
                                        review_created_at=created_dt
                                    )
                                    db.add(new_rev)
                                    
                            db.commit()
                            
                            # Find all unreplied reviews in the official DB table for this location
                            unreplied = db.query(GoogleBusinessReview).filter(
                                GoogleBusinessReview.location_id == loc.id,
                                (GoogleBusinessReview.reply_comment == None) | (GoogleBusinessReview.reply_comment == "")
                            ).all()
                            
                            for review_item in unreplied:
                                logger.info(f"Generating auto-reply for official review from {review_item.reviewer_name}")
                                
                                # Generate AI reply
                                reply = loop.run_until_complete(
                                    google_business_service.generate_ai_reply(
                                        reviewer_name=review_item.reviewer_name,
                                        review_text=review_item.comment or "",
                                        rating=review_item.rating,
                                        tone=tone
                                    )
                                )
                                
                                # Publish via Google Business API
                                logger.info(f"Publishing reply to Google Maps API for review {review_item.review_id}")
                                publish_res = loop.run_until_complete(
                                    google_business_service.submit_review_reply(
                                        access_token=access_token,
                                        account_id=acc.account_id,
                                        location_id=loc.location_id,
                                        review_id=review_item.review_id,
                                        reply_comment=reply
                                    )
                                )
                                
                                if publish_res.get("success"):
                                    # Update DB review record
                                    review_item.reply_comment = reply
                                    review_item.reply_submitted_at = datetime.utcnow()
                                    db.add(review_item)
                                    
                                    # Save to General ReviewHistory DB table for dashboard visibility
                                    db_item = ReviewHistory(
                                        user_id=user_id,
                                        review=f"Reviewer: {review_item.reviewer_name}\nComment: {review_item.comment}",
                                        rating=review_item.rating,
                                        business_type=f"{loc.location_name} (Official Google Maps Auto-Reply)",
                                        tone=tone,
                                        reply=reply,
                                        created_at=datetime.utcnow()
                                    )
                                    db.add(db_item)
                                    db.commit()
                                    logger.info(f"✅ Successfully auto-replied & published for {review_item.reviewer_name}")
                                else:
                                    logger.error(f"Failed to publish auto-reply: {publish_res.get('error')}")
                                    
                        else:
                            logger.warning(f"Failed to fetch live reviews for {loc.location_name}: {reviews_res.get('error')}")
                            
                    except Exception as loc_err:
                        logger.error(f"Error processing official reviews for location {loc.location_name}: {loc_err}", exc_info=True)
                    finally:
                        loop.close()
            
            # If no official Google Business API connection is found, fallback to the public Maps URL flow
            if not has_official_connection:
                if not gmaps_url:
                    logger.info(f"No official connection and no public gmaps_url set for user {user_id}. Skipping.")
                    continue
                    
                logger.info(f"🔄 Falling back to public Google Maps crawler for user {user_id} on URL: {gmaps_url}")
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    # Resolve URL
                    resolved_url = loop.run_until_complete(MapsReviewService.resolve_url(gmaps_url))
                    business_name = MapsReviewService.extract_business_name(resolved_url)
                    
                    # Fetch reviews from Gemini listing sync (which mimics scraping real maps page reviews)
                    payload = loop.run_until_complete(MapsReviewService.fetch_and_analyze_via_ai(business_name, resolved_url))
                    reviews = payload.get("reviews", [])
                    
                    # For each review, generate a reply and save if not already in DB
                    for rev in reviews:
                        reviewer = rev.get("reviewer_name", "Valued Customer")
                        rating = int(rev.get("rating", 5))
                        comment = rev.get("comment", "")
                        
                        # Check if we already replied to this review comment in history
                        existing_reply = db.query(ReviewHistory).filter(
                            ReviewHistory.user_id == user_id,
                            ReviewHistory.review.like(f"%Comment: {comment}%")
                        ).first()
                        
                        if existing_reply:
                            logger.info(f"Already replied to review from {reviewer}. Skipping.")
                            continue
                            
                        # Generate AI reply using existing service
                        logger.info(f"Generating auto-reply for review from {reviewer}")
                        reply = loop.run_until_complete(
                            google_business_service.generate_ai_reply(
                                reviewer_name=reviewer,
                                review_text=comment,
                                rating=rating,
                                tone=tone
                            )
                        )
                        
                        # Save to DB history
                        db_item = ReviewHistory(
                            user_id=user_id,
                            review=f"Reviewer: {reviewer}\nComment: {comment}",
                            rating=rating,
                            business_type=f"{business_name} (Google Maps Auto-Reply)",
                            tone=tone,
                            reply=reply,
                            created_at=datetime.utcnow()
                        )
                        db.add(db_item)
                        db.commit()
                        logger.info(f"✅ Automatically responded to review from {reviewer}")
                        
                except Exception as crawler_err:
                    logger.error(f"Error processing public crawler auto-reply for user {user_id}: {crawler_err}", exc_info=True)
                finally:
                    loop.close()
                    
    except Exception as e:
        logger.error(f"Error in auto_reply_to_google_reviews: {e}", exc_info=True)
    finally:
        db.close()



# Import website generation tasks to register them with Celery
try:
    from ai_models.website_ai.app.workers.tasks.generation_tasks import (
        generate_website_task,
        regenerate_website_task
    )
    logger.info("✅ Website generation tasks imported successfully")
except ImportError as e:
    logger.warning(f"⚠️ Could not import website generation tasks: {e}")

# Import voice call tasks to register them with Celery
try:
    from tasks.voice_call_tasks import (
        start_campaign_calling,
        process_campaign_calls,
        process_single_call,
        pause_campaign,
        resume_campaign
    )
    logger.info("✅ Voice call tasks imported successfully")
except ImportError as e:
    logger.warning(f"⚠️ Could not import voice call tasks: {e}")

# Import WhatsApp tasks to register them with Celery beat and worker
try:
    from tasks.whatsapp_tasks import (
        process_scheduled_campaigns,
        process_follow_up_automations,
        process_auto_reply,
        sync_message_statuses,
    )
    logger.info("✅ WhatsApp tasks imported successfully")
except ImportError as e:
    logger.warning(f"⚠️ Could not import WhatsApp tasks: {e}")


# Periodic tasks configuration
from celery.schedules import crontab

celery.conf.beat_schedule = {
    "process-scheduled-posts-every-5-minutes": {
        "task": "celery_worker.process_scheduled_posts",
        "schedule": 5 * 60,  # 5 minutes
    },
    "retry-failed-posts-every-30-minutes": {
        "task": "celery_worker.retry_failed_posts",
        "schedule": 30 * 60,  # 30 minutes
    },
    "fetch-analytics-every-hour": {
        "task": "celery_worker.fetch_analytics",
        "schedule": crontab(minute=0),  # Every hour
    },
    # WhatsApp tasks
    "process-whatsapp-campaigns-every-5-minutes": {
        "task": "tasks.whatsapp_tasks.process_scheduled_campaigns",
        "schedule": 5 * 60,  # 5 minutes
    },
    "process-whatsapp-follow-ups-every-10-minutes": {
        "task": "tasks.whatsapp_tasks.process_follow_up_automations",
        "schedule": 10 * 60,  # 10 minutes
    },
    "sync-whatsapp-message-statuses-every-30-minutes": {
        "task": "tasks.whatsapp_tasks.sync_message_statuses",
        "schedule": 30 * 60,  # 30 minutes
    },
    "auto-reply-google-reviews-every-10-minutes": {
        "task": "celery_worker.auto_reply_to_google_reviews",
        "schedule": 10 * 60,  # 10 minutes
    },
}


if __name__ == "__main__":
    celery.start()
