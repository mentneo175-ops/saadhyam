"""
Job tracking API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ai_models.website_ai.app.db.session import get_db
from ai_models.website_ai.app.db.models.job import Job
from ai_models.website_ai.app.api.v1.schemas.responses import JobStatusResponse, JobResultResponse
from ai_models.website_ai.app.utils.logger import get_logger
from ai_models.website_ai.app.utils.uuid_helpers import validate_and_convert_uuid, uuid_to_string


logger = get_logger(__name__)
router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get(
    "/{job_id}",
    response_model=JobStatusResponse,
    summary="Get job status",
    description="Check the status and progress of a generation job"
)
async def get_job(
    job_id: str,
    db: Session = Depends(get_db)
) -> JobStatusResponse:
    """
    Get job status and progress (main endpoint)

    - **job_id**: UUID of the job (string format)

    Returns current status, progress percentage, and timestamps
    """
    logger.info(f"📊 Fetching job status for: {job_id}")
    
    # Convert string to UUID object (validates format)
    try:
        job_uuid = validate_and_convert_uuid(job_id)
        logger.info(f"✅ Validated UUID: {job_uuid}")
    except HTTPException as e:
        logger.error(f"❌ Invalid UUID format: {job_id}")
        raise
    
    # Query using UUID object
    job = db.query(Job).filter(Job.id == job_uuid).first()

    if not job:
        logger.warning(f"❌ Job not found: {job_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )

    logger.info(f"✅ Job {job_id}: status={job.status}, progress={job.progress}%")
    
    return JobStatusResponse(
        job_id=uuid_to_string(job.id),
        status=job.status,
        progress=job.progress,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        error_message=job.error_message
    )


@router.get(
    "/{job_id}/status",
    response_model=JobStatusResponse,
    summary="Get job status (legacy)",
    description="Check the status and progress of a generation job"
)
async def get_job_status(
    job_id: str,
    db: Session = Depends(get_db)
) -> JobStatusResponse:
    """
    Get job status and progress (legacy endpoint)

    - **job_id**: UUID of the job (string format)

    Returns current status, progress percentage, and timestamps
    """
    logger.info(f"📊 Fetching job status (legacy) for: {job_id}")
    
    # Convert string to UUID object
    try:
        job_uuid = validate_and_convert_uuid(job_id)
    except HTTPException as e:
        logger.error(f"❌ Invalid UUID format: {job_id}")
        raise
    
    # Query using UUID object
    job = db.query(Job).filter(Job.id == job_uuid).first()

    if not job:
        logger.warning(f"❌ Job not found: {job_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )

    return JobStatusResponse(
        job_id=uuid_to_string(job.id),
        status=job.status,
        progress=job.progress,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        error_message=job.error_message
    )


@router.get(
    "/{job_id}/result",
    response_model=JobResultResponse,
    summary="Get job result",
    description="Get the result of a completed generation job"
)
async def get_job_result(
    job_id: str,
    db: Session = Depends(get_db)
) -> JobResultResponse:
    """
    Get job result (only for completed jobs)

    - **job_id**: UUID of the job (string format)

    Returns website details and URLs
    """
    # Convert string to UUID object
    try:
        job_uuid = validate_and_convert_uuid(job_id)
    except HTTPException as e:
        logger.error(f"❌ Invalid UUID format: {job_id}")
        raise
    
    # Query using UUID object
    job = db.query(Job).filter(Job.id == job_uuid).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job is not completed. Current status: {job.status}"
        )

    if not job.result_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Job completed but result data is missing"
        )

    return JobResultResponse(
        job_id=uuid_to_string(job.id),
        website_id=job.result_data.get("website_id"),
        html_url=job.result_data.get("preview_url"),
        preview_url=job.result_data.get("preview_url"),
        theme=job.result_data.get("theme"),
        completed_at=job.completed_at
    )

