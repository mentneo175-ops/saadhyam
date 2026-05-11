"""
Celery tasks for website generation
"""
from datetime import datetime
from typing import Dict, Any
import traceback
import uuid

from celery import Task
from sqlalchemy.orm import Session

from ai_models.website_ai.app.workers.celery_app import celery_app
from ai_models.website_ai.app.db.session import get_db_context
from ai_models.website_ai.app.db.models.job import Job
from ai_models.website_ai.app.db.models.website import Website
from ai_models.website_ai.app.db.models.content import ContentEdit  # Import to register with SQLAlchemy
from ai_models.website_ai.app.core.services.generation_service import GenerationService
from ai_models.website_ai.app.core.services.storage_service import StorageService
from ai_models.website_ai.app.utils.logger import get_logger
from ai_models.website_ai.app.utils.uuid_helpers import validate_and_convert_uuid, uuid_to_string
from utils.slug import generate_unique_slug


logger = get_logger(__name__)


class CallbackTask(Task):
    """Base task with callbacks for progress tracking"""

    def on_success(self, retval, task_id, args, kwargs):
        """Called when task succeeds"""
        logger.info(f"Task {task_id} succeeded with result: {retval}")

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called when task fails"""
        logger.error(f"Task {task_id} failed: {exc}")

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Called when task is retried"""
        logger.warning(f"Task {task_id} retrying: {exc}")


@celery_app.task(
    bind=True,
    base=CallbackTask,
    name="generate_website",
    max_retries=3,
    default_retry_delay=60
)
def generate_website_task(
    self,
    job_id: str,
    business_data: Dict[str, Any],
    theme: str,
    theme_config: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Async task to generate a website

    Args:
        job_id: UUID of the job
        business_data: Business information
        theme: Theme name
        theme_config: Optional theme configuration from main app

    Returns:
        Dict with website_id and file paths
    """
    logger.info(f"🚀 Starting website generation for job {job_id}")
    logger.info(f"📊 Business: {business_data.get('business_name')}, Theme: {theme}")

    with get_db_context() as db:
        try:
            # Convert string job_id to UUID object
            logger.info(f"🔍 Converting job_id to UUID: {job_id}")
            try:
                job_uuid = validate_and_convert_uuid(job_id)
                logger.info(f"✅ Converted to UUID: {job_uuid}")
            except Exception as e:
                error_msg = f"Invalid job_id format: {job_id} - {e}"
                logger.error(f"❌ {error_msg}")
                raise ValueError(error_msg)
            
            # Query using UUID object
            logger.info(f"🔍 Looking up job in database")
            job = db.query(Job).filter(Job.id == job_uuid).first()
            
            if not job:
                error_msg = f"Job {job_id} not found in database"
                logger.error(f"❌ {error_msg}")
                raise ValueError(error_msg)

            logger.info(f"✅ Found job {job_id}, updating status to processing")
            job.status = "processing"
            job.started_at = datetime.utcnow()
            job.progress = 10
            db.commit()
            logger.info(f"📝 Job {job_id}: status=processing, progress=10%")

            # Initialize services
            generation_service = GenerationService(db)
            storage_service = StorageService()

            # Step 1: Generate AI content (30% progress)
            logger.info(f"Job {job_id}: Generating AI content")
            job.progress = 30
            db.commit()

            content = generation_service.generate_content(business_data)

            # Step 2: Render template (60% progress)
            logger.info(f"Job {job_id}: Rendering template")
            job.progress = 60
            db.commit()

            html = generation_service.render_template(
                theme=theme,
                content=content,
                business_data=business_data,
                theme_config=theme_config
            )

            # Step 3: Save to storage using new website ID system (80% progress)
            logger.info(f"Job {job_id}: Saving to storage with website ID")
            job.progress = 80
            db.commit()

            # Create website record first to get the ID
            website = Website(
                business_name=business_data["business_name"],
                business_type=business_data["business_type"],
                description=business_data.get("description"),
                services=business_data.get("services", []),
                target_audience=business_data.get("target_audience"),
                tone=business_data.get("tone"),
                branding_style=business_data.get("branding_style"),
                contact_email=business_data.get("contact_email"),
                contact_phone=business_data.get("contact_phone"),
                website_url=business_data.get("website_url"),
                theme=theme,
                status="active"
            )
            db.add(website)
            db.flush()  # Get the ID without committing
            
            # Generate unique slug from business name
            website.slug = generate_unique_slug(db, Website, business_data["business_name"])
            
            website_id_str = uuid_to_string(website.id)
            logger.info(f"✅ Created website record with ID: {website_id_str}, slug: {website.slug}")

            # Save files using the new website ID-based system
            file_path, s3_key = storage_service.save_website_files(
                website_id=website_id_str,
                html=html
            )

            # Step 4: Update database with file paths (90% progress)
            logger.info(f"Job {job_id}: Updating database with file paths")
            job.progress = 90
            db.commit()

            # Update website record with file paths
            website.html_file_path = file_path
            website.s3_key = s3_key

            # Update job with result using new URL system
            job.status = "completed"
            job.progress = 100
            job.completed_at = datetime.utcnow()
            job.website_id = website.id
            job.result_data = {
                "website_id": website_id_str,
                "html_file_path": file_path,
                "s3_key": s3_key,
                "theme": theme,
                "preview_url": storage_service.get_website_url(website_id_str),
                "html_url": storage_service.get_website_url(website_id_str)
            }
            db.commit()

            logger.info(f"✅ Job {job_id} completed successfully. Website ID: {website_id_str}")
            logger.info(f"🌐 Website URL: {storage_service.get_website_url(website_id_str)}")

            return job.result_data

        except Exception as exc:
            logger.error(f"Job {job_id} failed: {exc}")
            logger.error(traceback.format_exc())

            # Update job status to failed
            try:
                job_uuid = validate_and_convert_uuid(job_id)
                job = db.query(Job).filter(Job.id == job_uuid).first()
                if job:
                    job.status = "failed"
                    job.error_message = str(exc)
                    job.completed_at = datetime.utcnow()
                    db.commit()
                    logger.info(f"📝 Job {job_id} marked as failed")
            except Exception as update_error:
                logger.error(f"Failed to update job status: {update_error}")

            # Retry if possible
            if self.request.retries < self.max_retries:
                raise self.retry(exc=exc)

            raise


@celery_app.task(name="regenerate_website")
def regenerate_website_task(website_id: str, theme: str = None) -> Dict[str, Any]:
    """
    Regenerate an existing website with new theme or updated content

    Args:
        website_id: UUID of the website
        theme: Optional new theme

    Returns:
        Dict with updated file paths
    """
    logger.info(f"Regenerating website {website_id}")

    with get_db_context() as db:
        website = db.query(Website).filter(Website.id == website_id).first()
        if not website:
            raise ValueError(f"Website {website_id} not found")

        # Use existing data
        business_data = {
            "business_name": website.business_name,
            "business_type": website.business_type,
            "description": website.description,
            "services": website.services,
            "target_audience": website.target_audience,
            "tone": website.tone,
            "branding_style": website.branding_style,
        }

        # Use new theme or existing
        new_theme = theme or website.theme

        # Generate new website using new storage system
        generation_service = GenerationService(db)
        storage_service = StorageService()

        content = generation_service.generate_content(business_data)
        html = generation_service.render_template(
            theme=new_theme,
            content=content,
            business_data=business_data
        )

        website_id_str = uuid_to_string(website.id)
        file_path, s3_key = storage_service.save_website_files(
            website_id=website_id_str,
            html=html
        )

        # Update website record
        website.theme = new_theme
        website.html_file_path = file_path
        website.s3_key = s3_key
        website.updated_at = datetime.utcnow()
        db.commit()

        logger.info(f"✅ Website {website_id_str} regenerated successfully")

        return {
            "website_id": website_id_str,
            "html_file_path": file_path,
            "s3_key": s3_key,
            "theme": new_theme,
            "preview_url": storage_service.get_website_url(website_id_str),
            "html_url": storage_service.get_website_url(website_id_str)
        }

