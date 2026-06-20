"""
User Profile Routes
API endpoints for managing user profile and business information
WITH REDIS CACHING to reduce database load
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session
from config.database import get_db_sync
from models.user import User
from models.business_profile import BusinessProfile
from models.settings import UserSettings
from models.instagram_analytics import (
    InstagramBusinessAccount,
    AnalyticsSnapshot,
    PostAnalytics,
    ReelAnalytics,
    StoryAnalytics,
)
from models.task_tracking import DailyTask, GrowthMetric
from models.whatsapp_account import WhatsAppAccount
from models.whatsapp_message import WhatsAppMessage
from models.whatsapp_campaign import WhatsAppCampaign
from models.whatsapp_automation import WhatsAppAutomation
from models.voice_agent import VoiceCampaign, VoiceContact, VoiceCall, VoiceLead, VoiceFollowUp
from models.youtube import YouTubeChannel, YouTubeVideo, YouTubeAnalytics
from models.influencer import Influencer
from models.retention_campaign import RetentionCampaign
from db.models import BusinessAnalysis, ReviewHistory
from db.aeo_geo_models import AEOQuestion, AEOContent, AIVisibility
from utils.dependencies import get_current_user
from services.token_blacklist_service import token_blacklist_service
from services.comprehensive_cache_service import (
    generate_cache_key,
    get_cached,
    set_cached,
    delete_cached,
    delete_pattern,
    CACHE_PREFIX,
    CACHE_TTL
)

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


class PlanSelectionRequest(BaseModel):
    """Request model for saving the user's selected plan."""

    plan_key: str = Field(..., min_length=1, max_length=50)
    plan_name: str = Field(..., min_length=1, max_length=255)
    plan_price: str = Field(..., min_length=1, max_length=50)
    payment_id: str = Field(..., min_length=1, max_length=255)
    coupon_code: Optional[str] = Field(None, max_length=50)
    amount_paid: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="INR", max_length=10)
    status: str = Field(default="active", max_length=50)
    upgrade_from: Optional[str] = Field(None, max_length=50)


class UserProfileResponse(BaseModel):
    """Response model for complete user profile"""
    id: int
    email: str
    name: Optional[str] = None
    selected_plan_key: Optional[str] = None
    selected_plan_name: Optional[str] = None
    selected_plan_price: Optional[str] = None
    selected_plan_payment_id: Optional[str] = None
    selected_plan_coupon_code: Optional[str] = None
    selected_plan_amount_paid: Optional[float] = None
    selected_plan_currency: Optional[str] = None
    selected_plan_status: Optional[str] = None
    selected_plan_purchased_at: Optional[datetime] = None
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
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> UserProfileResponse:
    """
    Get complete user profile including business information
    WITH REDIS CACHING
    """
    
    try:
        # Generate cache key
        cache_key = generate_cache_key(CACHE_PREFIX["profile"], "full_profile", user_id=current_user.id)
        
        # Try cache first
        cached = await get_cached(cache_key)
        if cached:
            logger.info(f"📋 [Cache HIT] Profile for user: {current_user.email}")
            return UserProfileResponse(**cached["data"])
        
        logger.info(f"📋 [Cache MISS] Getting profile for user: {current_user.email}")
        
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
            selected_plan_key=current_user.selected_plan_key,
            selected_plan_name=current_user.selected_plan_name,
            selected_plan_price=current_user.selected_plan_price,
            selected_plan_payment_id=current_user.selected_plan_payment_id,
            selected_plan_coupon_code=current_user.selected_plan_coupon_code,
            selected_plan_amount_paid=current_user.selected_plan_amount_paid,
            selected_plan_currency=current_user.selected_plan_currency,
            selected_plan_status=current_user.selected_plan_status,
            selected_plan_purchased_at=current_user.selected_plan_purchased_at,
            business_profile=business_profile,
            last_generated_website_id=current_user.last_generated_website_id
        )
        
        # Cache the result
        await set_cached(cache_key, profile.dict(), CACHE_TTL["user_profile"])
        
        logger.info(f"✅ Profile retrieved and cached for user: {current_user.email}")
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
async def get_business_profile(
    current_user: User = Depends(get_current_user)
) -> BusinessProfileResponse:
    """
    Get business profile information only
    WITH REDIS CACHING
    """
    
    try:
        # Generate cache key
        cache_key = generate_cache_key(CACHE_PREFIX["profile"], "business_profile", user_id=current_user.id)
        
        # Try cache first
        cached = await get_cached(cache_key)
        if cached:
            logger.info(f"🏢 [Cache HIT] Business profile for user: {current_user.email}")
            return BusinessProfileResponse(**cached["data"])
        
        logger.info(f"🏢 [Cache MISS] Getting business profile for user: {current_user.email}")
        
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
        
        # Cache the result
        await set_cached(cache_key, business_profile.dict(), CACHE_TTL["business_profile"])
        
        logger.info(f"✅ Business profile retrieved and cached for user: {current_user.email}")
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
async def update_business_profile(
    request: BusinessProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> BusinessProfileResponse:
    """
    Update business profile information
    Invalidates cache after update
    
    This endpoint:
    - Updates business details in the database
    - Marks business setup as completed
    - Triggers business analysis if description is provided
    - Clears cached profile data
    """
    
    try:
        logger.info(f"🔄 Updating business profile for user: {current_user.email}")
        
        # Update user business fields
        current_user.business_name = request.business_name
        current_user.business_type = request.business_type
        current_user.business_location = request.business_location
        current_user.business_description = request.business_description
        current_user.business_setup_completed = True
        
        # Geocode the location and save coordinates
        if request.business_location:
            logger.info(f"📍 Geocoding location during onboarding: {request.business_location}")
            from services.geocoding_service import get_city_coordinates
            
            coords = get_city_coordinates(request.business_location)
            if coords:
                current_user.latitude, current_user.longitude = coords
                logger.info(f"✅ Saved coordinates: {current_user.latitude}, {current_user.longitude}")
            else:
                logger.warning(f"⚠️ Could not geocode '{request.business_location}'")
        
        # Save to database
        db.commit()
        db.refresh(current_user)
        
        # Invalidate cache
        full_profile_key = generate_cache_key(CACHE_PREFIX["profile"], "full_profile", user_id=current_user.id)
        biz_profile_key = generate_cache_key(CACHE_PREFIX["profile"], "business_profile", user_id=current_user.id)
        await delete_cached(full_profile_key)
        await delete_cached(biz_profile_key)
        await delete_pattern(f"{CACHE_PREFIX['profile']}{current_user.id}*")
        await delete_pattern(f"{CACHE_PREFIX['dashboard']}user_{current_user.id}")
        logger.info(f"🗑️ Cleared cache for user {current_user.id}")
        
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
    "/selected-plan",
    summary="Confirm and save selected plan",
    responses={
        200: {"description": "Selected plan saved successfully"},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"}
    }
)
async def confirm_selected_plan(
    request: PlanSelectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> dict:
    """Persist the user's selected plan after checkout."""

    try:
        logger.info(f"📝 User {current_user.email} confirming plan {request.plan_key}")

        # Enforce no-downgrades policy on the server-side
        PLAN_RANKS = {
            "starter": 1,
            "growth": 2,
            "education": 3,
            "business": 4
        }

        def get_plan_rank(key: str) -> int:
            if not key:
                return 0
            k = key.lower()
            if k in ["premium", "pro"]:
                k = "business"
            return PLAN_RANKS.get(k, 0)

        if current_user.selected_plan_key:
            current_rank = get_plan_rank(current_user.selected_plan_key)
            target_rank = get_plan_rank(request.plan_key)
            if target_rank < current_rank:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Plan downgrade is not permitted. You can only upgrade your active plan."
                )

        current_user.selected_plan_key = request.plan_key
        current_user.selected_plan_name = request.plan_name
        current_user.selected_plan_price = request.plan_price
        current_user.selected_plan_payment_id = request.payment_id
        current_user.selected_plan_coupon_code = request.coupon_code
        current_user.selected_plan_amount_paid = request.amount_paid
        current_user.selected_plan_currency = request.currency
        current_user.selected_plan_status = request.status

        current_user.selected_plan_purchased_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(current_user)

        full_profile_key = generate_cache_key(CACHE_PREFIX["profile"], "full_profile", user_id=current_user.id)
        biz_profile_key = generate_cache_key(CACHE_PREFIX["profile"], "business_profile", user_id=current_user.id)
        await delete_cached(full_profile_key)
        await delete_cached(biz_profile_key)
        await delete_pattern(f"{CACHE_PREFIX['profile']}{current_user.id}*")
        await delete_pattern(f"{CACHE_PREFIX['dashboard']}user_{current_user.id}")

        logger.info(f"✅ Selected plan {request.plan_key} saved for user {current_user.id}")

        # Send internal notification to admin service
        try:
            import httpx
            admin_url = os.getenv("ADMIN_SERVICE_URL", "http://127.0.0.1:8082")
            headers = {
                "X-Internal-Token": os.getenv("ADMIN_INTERNAL_NOTIFICATION_TOKEN", "dev-admin-notification-token"),
                "Content-Type": "application/json"
            }
            noti_payload = {
                "title": "Subscription Purchased",
                "message": f"User {current_user.email} purchased {request.plan_name} ({request.plan_key}) for {request.plan_price}!",
                "target_type": "subscription",
                "target_user_id": current_user.id,
                "created_by": current_user.id
            }
            # Perform async POST request to admin service
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(f"{admin_url}/api/notifications/internal", json=noti_payload, headers=headers)
            logger.info("Sent purchase notification to admin service")
        except Exception as admin_err:
            logger.error(f"Failed to send purchase notification to admin service: {admin_err}")

        return {
            "status": "success",
            "message": "Selected plan saved successfully",
            "selected_plan_key": current_user.selected_plan_key,
            "selected_plan_name": current_user.selected_plan_name,
            "selected_plan_price": current_user.selected_plan_price,
            "selected_plan_payment_id": current_user.selected_plan_payment_id,
            "selected_plan_coupon_code": current_user.selected_plan_coupon_code,
            "selected_plan_amount_paid": current_user.selected_plan_amount_paid,
            "selected_plan_currency": current_user.selected_plan_currency,
            "selected_plan_status": current_user.selected_plan_status,
            "selected_plan_purchased_at": current_user.selected_plan_purchased_at,
        }

    except Exception as e:
        logger.error(f"❌ Error confirming selected plan: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm selected plan: {str(e)}"
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
async def confirm_website(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
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

        # Invalidate cached profile responses so the dashboard loads the newest website id
        cache_key = generate_cache_key(CACHE_PREFIX["profile"], "full_profile", user_id=current_user.id)
        await delete_cached(cache_key)
        
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


@router.delete(
    "/account",
    summary="Delete user account and all associated data",
    responses={
        200: {"description": "Account deleted successfully"},
        401: {"description": "Not authenticated"},
    },
)
def delete_account(
    authorization: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
) -> dict:
    """Delete the signed-in user and all user-owned data."""

    try:
        user_id = current_user.id

        voice_campaign_ids = [row[0] for row in db.query(VoiceCampaign.id).filter(VoiceCampaign.user_id == user_id).all()]
        youtube_channel_ids = [row[0] for row in db.query(YouTubeChannel.id).filter(YouTubeChannel.user_id == user_id).all()]
        youtube_video_ids = [row[0] for row in db.query(YouTubeVideo.id).filter(YouTubeVideo.user_id == user_id).all()]
        instagram_account_ids = [row[0] for row in db.query(InstagramBusinessAccount.id).filter(InstagramBusinessAccount.user_id == user_id).all()]
        whatsapp_account_ids = [row[0] for row in db.query(WhatsAppAccount.id).filter(WhatsAppAccount.user_id == user_id).all()]

        if voice_campaign_ids:
            db.query(VoiceFollowUp).filter(VoiceFollowUp.user_id == user_id).delete(synchronize_session=False)
            db.query(VoiceLead).filter(VoiceLead.user_id == user_id).delete(synchronize_session=False)
            db.query(VoiceCall).filter(VoiceCall.campaign_id.in_(voice_campaign_ids)).delete(synchronize_session=False)
            db.query(VoiceContact).filter(VoiceContact.campaign_id.in_(voice_campaign_ids)).delete(synchronize_session=False)
            db.query(VoiceCampaign).filter(VoiceCampaign.id.in_(voice_campaign_ids)).delete(synchronize_session=False)

        if youtube_channel_ids:
            db.query(YouTubeAnalytics).filter(YouTubeAnalytics.channel_id.in_(youtube_channel_ids)).delete(synchronize_session=False)
            if youtube_video_ids:
                db.query(YouTubeAnalytics).filter(YouTubeAnalytics.video_id.in_(youtube_video_ids)).delete(synchronize_session=False)
            db.query(YouTubeVideo).filter(YouTubeVideo.user_id == user_id).delete(synchronize_session=False)
            db.query(YouTubeChannel).filter(YouTubeChannel.id.in_(youtube_channel_ids)).delete(synchronize_session=False)

        if instagram_account_ids:
            db.query(PostAnalytics).filter(PostAnalytics.account_id.in_(instagram_account_ids)).delete(synchronize_session=False)
            db.query(StoryAnalytics).filter(StoryAnalytics.account_id.in_(instagram_account_ids)).delete(synchronize_session=False)
            db.query(ReelAnalytics).filter(ReelAnalytics.account_id.in_(instagram_account_ids)).delete(synchronize_session=False)
            db.query(AnalyticsSnapshot).filter(AnalyticsSnapshot.account_id.in_(instagram_account_ids)).delete(synchronize_session=False)
            db.query(InstagramBusinessAccount).filter(InstagramBusinessAccount.id.in_(instagram_account_ids)).delete(synchronize_session=False)

        if whatsapp_account_ids:
            db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id.in_(whatsapp_account_ids)).delete(synchronize_session=False)
            db.query(WhatsAppCampaign).filter(WhatsAppCampaign.account_id.in_(whatsapp_account_ids)).delete(synchronize_session=False)
            db.query(WhatsAppAutomation).filter(WhatsAppAutomation.account_id.in_(whatsapp_account_ids)).delete(synchronize_session=False)
            db.query(WhatsAppAccount).filter(WhatsAppAccount.id.in_(whatsapp_account_ids)).delete(synchronize_session=False)

        db.query(BusinessAnalysis).filter(BusinessAnalysis.user_id == user_id).delete(synchronize_session=False)
        db.query(ReviewHistory).filter(ReviewHistory.user_id == user_id).delete(synchronize_session=False)
        db.query(AEOQuestion).filter(AEOQuestion.user_id == user_id).delete(synchronize_session=False)
        db.query(AEOContent).filter(AEOContent.user_id == user_id).delete(synchronize_session=False)
        db.query(AIVisibility).filter(AIVisibility.user_id == user_id).delete(synchronize_session=False)
        db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).delete(synchronize_session=False)
        db.query(UserSettings).filter(UserSettings.user_id == user_id).delete(synchronize_session=False)
        db.query(DailyTask).filter(DailyTask.user_id == user_id).delete(synchronize_session=False)
        db.query(GrowthMetric).filter(GrowthMetric.user_id == user_id).delete(synchronize_session=False)
        db.query(Influencer).filter(Influencer.user_id == user_id).delete(synchronize_session=False)
        db.query(RetentionCampaign).filter(RetentionCampaign.customer_email == current_user.email).delete(synchronize_session=False)

        # These models are linked to the user through ORM relationships and will be removed on user delete.
        current_user.active_session_token = None
        current_user.session_created_at = None
        current_user.session_ip_address = None
        current_user.session_user_agent = None

        token = authorization.split()[1] if len(authorization.split()) == 2 else None
        if token:
            token_blacklist_service.blacklist_token(token)
        token_blacklist_service.blacklist_user_tokens(user_id)

        db.delete(current_user)
        db.commit()

        return {
            "status": "success",
            "message": "Account deleted successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting account for {current_user.email}: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account",
        )
