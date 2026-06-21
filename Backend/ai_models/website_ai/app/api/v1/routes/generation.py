"""
Website generation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from ai_models.website_ai.app.db.session import get_db
from ai_models.website_ai.app.db.models.job import Job
from ai_models.website_ai.app.api.v1.schemas.requests import GenerateWebsiteRequest
from ai_models.website_ai.app.api.v1.schemas.responses import GenerateWebsiteResponse
from ai_models.website_ai.app.workers.tasks.generation_tasks import generate_website_task
from ai_models.website_ai.app.config import settings
from ai_models.website_ai.app.utils.logger import get_logger
from ai_models.website_ai.app.utils.uuid_helpers import uuid_to_string

# Import authentication and User models from main app
from utils.dependencies import get_current_user
from models.user import User


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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> GenerateWebsiteResponse:
    """
    Generate a new website asynchronously

    - **business_name**: Name of the business (falls back to onboarding data)
    - **business_type**: Type/industry of business (falls back to onboarding data)
    - **theme**: Template theme to use
    - **theme_config**: Optional theme configuration from main app

    Returns job_id for tracking generation progress
    """
    try:
        # Fallback to current_user onboarding details if fields are empty
        business_name = request.business_name or current_user.business_name
        business_type = request.business_type or current_user.business_type
        description = request.description or current_user.business_description
        contact_email = request.contact_email or current_user.email
        contact_phone = request.contact_phone
        website_url = request.website_url or current_user.website_url

        if not business_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Business name is required (not provided in request and missing from user profile)"
            )
        if not business_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Business type is required (not provided in request and missing from user profile)"
            )

        logger.info(f"Received generation request for: {business_name}")

        # Validate theme
        if request.theme not in settings.AVAILABLE_THEMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid theme. Available themes: {settings.AVAILABLE_THEMES}"
            )

        # Prepare business data dictionary with fallback values
        business_data = {
            "business_name": business_name,
            "business_type": business_type,
            "description": description,
            "services": request.services or [],
            "target_audience": request.target_audience,
            "tone": request.tone,
            "branding_style": request.branding_style,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "website_url": website_url
        }

        # Create job record with UUID
        job = Job(
            job_type="website_generation",
            status="pending",
            input_data=business_data,
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
        try:
            logger.info(f"📤 Queueing Celery task for job {job_id_str}")
            task = generate_website_task.delay(
                job_id=job_id_str,
                business_data=business_data,
                theme=request.theme,
                theme_config=request.theme_config
            )
            logger.info(f"✅ Task queued with ID: {task.id}")
        except Exception as celery_err:
            logger.warning(f"⚠️ Celery enqueue failed: {celery_err}. Falling back to in-process BackgroundTasks.")
            background_tasks.add_task(
                generate_website_task,
                None,  # self (bound task parameter, pass None when running in-process)
                job_id_str,
                business_data,
                request.theme,
                request.theme_config
            )
            logger.info("✅ Enqueued generation task via FastAPI BackgroundTasks in-process")

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


