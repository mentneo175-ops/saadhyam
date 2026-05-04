"""
Celery tasks for cleanup and maintenance
"""
from datetime import datetime, timedelta
from pathlib import Path

from ai_models.website_ai.app.workers.celery_app import celery_app
from ai_models.website_ai.app.db.session import get_db_context
from ai_models.website_ai.app.db.models.job import Job
from ai_models.website_ai.app.db.models.website import Website
from ai_models.website_ai.app.config import settings
from ai_models.website_ai.app.utils.logger import get_logger


logger = get_logger(__name__)


@celery_app.task(name="cleanup_old_jobs")
def cleanup_old_jobs():
    """
    Clean up old completed/failed jobs
    Runs daily via Celery Beat
    """
    logger.info("Starting cleanup of old jobs")

    cutoff_date = datetime.utcnow() - timedelta(days=settings.JOB_RETENTION_DAYS)

    with get_db_context() as db:
        # Delete old completed/failed jobs
        deleted_count = db.query(Job).filter(
            Job.status.in_(["completed", "failed"]),
            Job.created_at < cutoff_date
        ).delete()

        db.commit()

        logger.info(f"Cleaned up {deleted_count} old jobs")
        return {"deleted_count": deleted_count}


@celery_app.task(name="cleanup_orphaned_files")
def cleanup_orphaned_files():
    """
    Clean up orphaned HTML files that don't have database records
    Runs hourly via Celery Beat
    """
    logger.info("Starting cleanup of orphaned files")

    if settings.STORAGE_TYPE != "local":
        logger.info("Skipping orphaned file cleanup for non-local storage")
        return {"message": "Skipped for non-local storage"}

    output_dir = Path(settings.LOCAL_STORAGE_PATH)
    if not output_dir.exists():
        return {"message": "Output directory does not exist"}

    with get_db_context() as db:
        # Get all file paths from database
        db_files = set()
        websites = db.query(Website).filter(Website.html_file_path.isnot(None)).all()
        for website in websites:
            if website.html_file_path:
                db_files.add(Path(website.html_file_path).name)

        # Check files in output directory
        deleted_count = 0
        for file_path in output_dir.glob("*.html"):
            if file_path.name not in db_files:
                # Orphaned file - delete it
                file_path.unlink()
                deleted_count += 1
                logger.info(f"Deleted orphaned file: {file_path.name}")

        logger.info(f"Cleaned up {deleted_count} orphaned files")
        return {"deleted_count": deleted_count}


@celery_app.task(name="archive_old_websites")
def archive_old_websites(days: int = 90):
    """
    Archive websites that haven't been accessed in X days

    Args:
        days: Number of days of inactivity before archiving
    """
    logger.info(f"Starting archival of websites inactive for {days} days")

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    with get_db_context() as db:
        # Find websites to archive
        websites_to_archive = db.query(Website).filter(
            Website.status == "active",
            Website.updated_at < cutoff_date
        ).all()

        archived_count = 0
        for website in websites_to_archive:
            website.status = "archived"
            archived_count += 1

        db.commit()

        logger.info(f"Archived {archived_count} inactive websites")
        return {"archived_count": archived_count}

