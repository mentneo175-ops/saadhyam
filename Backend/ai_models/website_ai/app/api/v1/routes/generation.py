"""
Website generation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ai_models.website_ai.app.db.session import get_db
from ai_models.website_ai.app.db.models.job import Job
from ai_models.website_ai.app.api.v1.schemas.requests import GenerateWebsiteRequest
from ai_models.website_ai.app.api.v1.schemas.responses import GenerateWebsiteResponse
from ai_models.website_ai.app.workers.tasks.generation_tasks import generate_website_task
from ai_models.website_ai.app.config import settings
from ai_models.website_ai.app.utils.logger import get_logger
from ai_models.website_ai.app.utils.uuid_helpers import uuid_to_string


logger = get_logger(__name__)
router = APIRouter(prefix="/generate", tags=["generation"])


@router.post(
    "",
    response_model=GenerateWebsiteResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Generate a new website",
    description="Start async website generation and return job ID for tracking"
)
async def generate_website(
    request: GenerateWebsiteRequest,
    db: Session = Depends(get_db)
) -> GenerateWebsiteResponse:
    """
    Generate a new website asynchronously

    - **business_name**: Name of the business
    - **business_type**: Type/industry of business
    - **theme**: Template theme to use
    - **theme_config**: Optional theme configuration from main app

    Returns job_id for tracking generation progress
    """
    try:
        logger.info(f"Received generation request for: {request.business_name}")

        # Validate theme
        if request.theme not in settings.AVAILABLE_THEMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid theme. Available themes: {settings.AVAILABLE_THEMES}"
            )

        # Create job record with UUID
        job = Job(
            job_type="website_generation",
            status="pending",
            input_data=request.model_dump(),
            progress=0
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Convert UUID to string for API response and task
        job_id_str = uuid_to_string(job.id)
        logger.info(f"✅ Created job {job_id_str} for website generation")
        logger.info(f"📝 Job details: status={job.status}, progress={job.progress}%")

        # Enqueue Celery task with string job_id
        logger.info(f"📤 Queueing Celery task for job {job_id_str}")
        task = generate_website_task.delay(
            job_id=job_id_str,
            business_data=request.model_dump(exclude={"theme", "theme_config"}),
            theme=request.theme,
            theme_config=request.theme_config
        )
        logger.info(f"✅ Task queued with ID: {task.id}")

        return GenerateWebsiteResponse(
            job_id=job_id_str,
            status="pending",
            message="Website generation started. Use job_id to check status."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start website generation"
        )

