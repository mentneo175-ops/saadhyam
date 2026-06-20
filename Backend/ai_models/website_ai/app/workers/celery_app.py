"""
Celery application configuration
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the Backend directory
backend_dir = Path(__file__).resolve().parents[4]
load_dotenv(backend_dir / ".env", override=True)

from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure

from ai_models.website_ai.app.config import settings
from ai_models.website_ai.app.utils.logger import get_logger


logger = get_logger(__name__)

# Create Celery app
celery_app = Celery(
    "website_generator",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "ai_models.website_ai.app.workers.tasks.generation_tasks",
        "ai_models.website_ai.app.workers.tasks.cleanup_tasks",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=settings.CELERY_TASK_TRACK_STARTED,
    task_time_limit=settings.CELERY_TASK_TIME_LIMIT,
    task_soft_time_limit=settings.CELERY_TASK_TIME_LIMIT - 60,
    worker_prefetch_multiplier=1,  # One task at a time per worker
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
    task_acks_late=True,  # Acknowledge task after completion
    task_reject_on_worker_lost=True,
    result_expires=3600,  # Results expire after 1 hour
    # Windows-specific configurations
    worker_pool="solo",  # Use solo pool for Windows compatibility
    worker_concurrency=1,  # Single worker process
    worker_disable_rate_limits=True,  # Disable rate limits for Windows
)

# Periodic tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    "cleanup-old-jobs": {
        "task": "ai_models.website_ai.app.workers.tasks.cleanup_tasks.cleanup_old_jobs",
        "schedule": 86400.0,  # Run daily
    },
    "cleanup-orphaned-files": {
        "task": "ai_models.website_ai.app.workers.tasks.cleanup_tasks.cleanup_orphaned_files",
        "schedule": 3600.0,  # Run hourly
    },
}


@task_prerun.connect
def task_prerun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, **extra):
    """Log task start"""
    logger.info(f"Task started: {task.name} [{task_id}]")


@task_postrun.connect
def task_postrun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, retval=None, state=None, **extra):
    """Log task completion"""
    logger.info(f"Task completed: {task.name} [{task_id}] - State: {state}")


@task_failure.connect
def task_failure_handler(sender=None, task_id=None, exception=None, args=None, kwargs=None, traceback=None, einfo=None, **extra):
    """Log task failure"""
    logger.error(f"Task failed: {sender.name} [{task_id}] - Error: {exception}")

