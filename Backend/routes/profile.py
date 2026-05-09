"""
User Profile Routes
API endpoints for managing user profile and business information
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session
from config.database import get_sync_db
from models.user import User
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)


# ============ Pydantic Models ============

class BusinessProfileRequest(BaseModel):
    """Request model for updating business profile"""
    business_name: str = Field(..., min_length=1, max_length=255)
    business_type: str = Field(..., min_length=1, max_length=100)
    business_location: str = Field(..., min_length=1, max_length=255)
    business_description: str = Field(..., min_length=20, max_length=5000)  # Increased to 5000 for flexibility
    
    class Config:
        example = {
            "business_name": "Apple Store",
            "business_type": "E-commerce",
            "business_location": "Kakinada, Andhra Pradesh",
            "business_description": "We are an e-commerce business selling premium electronics and accessories. We focus on providing quality products with excellent customer service."
        }


class BusinessProfileResponse(BaseModel):
    """Response model for business profile"""
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    business_location: Optional[str] = None
    business_description: Optional[str] = None
    business_setup_completed: bool = False
    pdf_file_url: Optional[str] = None
    website_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    """Response model for complete user profile"""
    id: int
    email: str
    name: Optional[str] = None
    business_profile: BusinessProfileResponse
    last_generated_website_id: Optional[str] = None  # UUID of confirmed website
    
    class Config:
        from_attributes = True


# ============ Routes ============

@router.get(
    "/",
    response_model=UserProfileResponse,
    summary="Get user profile",
    responses={
        200: {"description": "Profile retrieved successfully"},
        401: {"description": "Not authenticated"}
    }
)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> UserProfileResponse:
    """
    Get complete user profile including business information
    """
    
    try:
        logger.info(f"📋 Getting profile for user: {current_user.email}")
        
        # Create business profile response
        business_profile = BusinessProfileResponse(
            business_name=current_user.business_name,
            business_type=current_user.business_type,
            business_location=current_user.business_location,
            business_description=current_user.business_description,
            business_setup_completed=current_user.business_setup_completed or False,
            pdf_file_url=current_user.pdf_file_url,
            website_url=current_user.website_url
        )
        
        # Create complete profile response
        profile = UserProfileResponse(
            id=current_user.id,
            email=current_user.email,
            name=current_user.name,
            business_profile=business_profile,
            last_generated_website_id=current_user.last_generated_website_id
        )
        
        logger.info(f"✅ Profile retrieved for user: {current_user.email}")
        return profile
        
    except Exception as e:
        logger.error(f"❌ Error getting profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.get(
    "/business",
    response_model=BusinessProfileResponse,
    summary="Get business profile",
    responses={
        200: {"description": "Business profile retrieved successfully"},
        401: {"description": "Not authenticated"}
    }
)
def get_business_profile(
    current_user: User = Depends(get_current_user)
) -> BusinessProfileResponse:
    """
    Get business profile information only
    """
    
    try:
        logger.info(f"🏢 Getting business profile for user: {current_user.email}")
        
        # Try to get coordinates from database columns (if they exist)
        latitude = getattr(current_user, 'latitude', None)
        longitude = getattr(current_user, 'longitude', None)
        
        # If no coordinates in DB, geocode from location text
        if (not latitude or not longitude) and current_user.business_location:
            logger.info(f"📍 Geocoding location: {current_user.business_location}")
            from services.geocoding_service import get_city_coordinates
            coords = get_city_coordinates(current_user.business_location)
            if coords:
                latitude, longitude = coords
                logger.info(f"✅ Geocoded to: {latitude}, {longitude}")
            else:
                # Fallback to Hyderabad if geocoding fails
                logger.warning(f"⚠️  Could not geocode '{current_user.business_location}', using Hyderabad")
                latitude, longitude = 17.3850, 78.4867
        
        # Final fallback if still no coordinates
        if not latitude or not longitude:
            logger.warning("⚠️  No location data, using Hyderabad as default")
            latitude, longitude = 17.3850, 78.4867
        
        business_profile = BusinessProfileResponse(
            business_name=current_user.business_name,
            business_type=current_user.business_type,
            business_location=current_user.business_location,
            business_description=current_user.business_description,
            business_setup_completed=current_user.business_setup_completed or False,
            pdf_file_url=current_user.pdf_file_url,
            website_url=current_user.website_url,
            latitude=latitude,
            longitude=longitude
        )
        
        logger.info(f"✅ Business profile retrieved for user: {current_user.email}")
        logger.info(f"📍 Final coordinates: {latitude}, {longitude}")
        return business_profile
        
    except Exception as e:
        logger.error(f"❌ Error getting business profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve business profile"
        )


@router.put(
    "/business",
    response_model=BusinessProfileResponse,
    summary="Update business profile",
    responses={
        200: {"description": "Business profile updated successfully"},
        400: {"description": "Invalid request data"},
        401: {"description": "Not authenticated"}
    }
)
def update_business_profile(
    request: BusinessProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> BusinessProfileResponse:
    """
    Update business profile information
    
    This endpoint:
    - Updates business details in the database
    - Marks business setup as completed
    - Triggers business analysis if description is provided
    """
    
    try:
        logger.info(f"🔄 Updating business profile for user: {current_user.email}")
        
        # Update user business fields
        current_user.business_name = request.business_name
        current_user.business_type = request.business_type
        current_user.business_location = request.business_location
        current_user.business_description = request.business_description
        current_user.business_setup_completed = True
        
        # Save to database
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"✅ Business profile updated for user: {current_user.email}")
        logger.info(f"   Business: {request.business_name}")
        logger.info(f"   Type: {request.business_type}")
        logger.info(f"   Location: {request.business_location}")
        
        # Return updated profile
        return BusinessProfileResponse(
            business_name=current_user.business_name,
            business_type=current_user.business_type,
            business_location=current_user.business_location,
            business_description=current_user.business_description,
            business_setup_completed=current_user.business_setup_completed,
            pdf_file_url=current_user.pdf_file_url,
            website_url=current_user.website_url
        )
        
    except Exception as e:
        logger.error(f"❌ Error updating business profile: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update business profile"
        )


@router.get(
    "/business/setup-status",
    summary="Check if business setup is completed",
    responses={
        200: {"description": "Setup status retrieved"},
        401: {"description": "Not authenticated"}
    }
)
def get_business_setup_status(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Check if user has completed business setup
    Used to determine if onboarding should be shown
    """
    
    try:
        setup_completed = current_user.business_setup_completed or False
        
        logger.info(f"📊 Business setup status for {current_user.email}: {setup_completed}")
        
        return {
            "setup_completed": setup_completed,
            "has_business_name": bool(current_user.business_name),
            "has_business_description": bool(current_user.business_description)
        }
        
    except Exception as e:
        logger.error(f"❌ Error checking setup status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check setup status"
        )


@router.post(
    "/confirm-website",
    summary="Confirm and save generated website",
    responses={
        200: {"description": "Website confirmed successfully"},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"}
    }
)
def confirm_website(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> dict:
    """
    Confirm and save user's generated website
    
    This endpoint is called when user confirms they want to use a generated website.
    The website_id is saved to the user profile and will be used for:
    - Showing the website on page reload
    - Integrating published blogs into the website
    """
    
    try:
        website_id = request.get("website_id")
        
        if not website_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="website_id is required"
            )
        
        logger.info(f"📝 User {current_user.email} confirming website {website_id}")
        
        # Update user's last_generated_website_id
        current_user.last_generated_website_id = website_id
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"✅ Website {website_id} confirmed for user {current_user.id}")
        
        return {
            "status": "success",
            "message": "Website confirmed successfully",
            "website_id": website_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error confirming website: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm website: {str(e)}"
        )
