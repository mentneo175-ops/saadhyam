"""
Website management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ai_models.website_ai.app.db.session import get_db
from ai_models.website_ai.app.db.models.website import Website
from ai_models.website_ai.app.api.v1.schemas.responses import WebsiteResponse
from ai_models.website_ai.app.utils.logger import get_logger
from ai_models.website_ai.app.utils.uuid_helpers import validate_and_convert_uuid, uuid_to_string


logger = get_logger(__name__)
router = APIRouter(prefix="/websites", tags=["websites"])


@router.get(
    "/{website_id}",
    response_model=WebsiteResponse,
    summary="Get website by ID",
    description="Retrieve website details and metadata by website ID"
)
async def get_website(
    website_id: str,
    db: Session = Depends(get_db)
) -> WebsiteResponse:
    """
    Get website by ID

    - **website_id**: UUID of the website (string format)

    Returns website details including business info, theme, and file paths
    """
    logger.info(f"🔍 Fetching website: {website_id}")
    
    # Convert string to UUID object (validates format)
    try:
        website_uuid = validate_and_convert_uuid(website_id)
        logger.info(f"✅ Validated UUID: {website_uuid}")
    except HTTPException as e:
        logger.error(f"❌ Invalid UUID format: {website_id}")
        raise
    
    # Query using UUID object
    website = db.query(Website).filter(Website.id == website_uuid).first()

    if not website:
        logger.warning(f"❌ Website not found: {website_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Website {website_id} not found"
        )

    logger.info(f"✅ Website found: {website.business_name} ({website.theme})")
    
    return WebsiteResponse(
        website_id=uuid_to_string(website.id),
        business_name=website.business_name,
        business_type=website.business_type,
        description=website.description,
        services=website.services,
        theme=website.theme,
        html_file_path=website.html_file_path,
        s3_key=website.s3_key,
        preview_url=f"/website/{uuid_to_string(website.id)}",
        html_url=f"/website/{uuid_to_string(website.id)}",
        status=website.status,
        created_at=website.created_at,
        updated_at=website.updated_at
    )