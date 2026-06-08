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
}


if __name__ == "__main__":
    celery.start()
