import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from config.database import get_db
from utils.dependencies import get_current_user
from models.user import User
from models.google_business import GoogleBusinessLocation

from schemas.google_business_schema import (
    GoogleBusinessOAuthRequest,
    GoogleBusinessAccountResponse,
    GoogleBusinessAccountListResponse,
    GoogleBusinessLocationResponse,
    GoogleBusinessLocationListResponse,
    GoogleBusinessReviewResponse,
    GoogleBusinessReviewListResponse,
    GoogleBusinessReviewReplyRequest,
    GoogleBusinessPostCreateRequest,
    GoogleBusinessPostResponse,
    GoogleBusinessPostListResponse,
)

from services.google_business_service import google_business_service
from services.google_business_crud import google_business_crud
from services.instagram_crud import InstagramCRUD

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/google-business", tags=["Google Business Profile Sync"])


@router.get(
    "/auth/connect",
    summary="Get Google Business OAuth URL",
)
async def get_oauth_url(state: Optional[str] = None):
    """Get Google OAuth URL for Google Business API authorization."""
    try:
        oauth_url = await google_business_service.get_auth_url(state or "")
        return {"oauth_url": oauth_url}
    except Exception as e:
        logger.error(f"Error generating Google Business OAuth URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Google Business OAuth URL",
        )


@router.post(
    "/auth/callback",
    summary="Handle Google OAuth callback for Google Business",
    response_model=GoogleBusinessAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def oauth_callback(
    request: GoogleBusinessOAuthRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth authorization callback code.
    Exchange code for tokens, fetch business account profile, and store connection in database.
    Also triggers initial location sync.
    """
    try:
        # Step 1: Exchange code for Google Access & Refresh tokens
        token_result = await google_business_service.exchange_code(request.code, request.state)
        if not token_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=token_result.get("error", "Failed to exchange authorization code"),
            )

        access_token = token_result["access_token"]
        refresh_token = token_result.get("refresh_token")
        expires_in = int(token_result.get("expires_in", 3600))

        # Step 2: Retrieve Google Business Account profile details
        account_result = await google_business_service.get_account_info(access_token)
        if not account_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=account_result.get("error", "Failed to retrieve Google Business account info"),
            )

        # Step 3: Register account in Database
        gb_account = await google_business_crud.create_google_business_account(
            db=db,
            user_id=current_user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            account_data=account_result
        )

        # Step 4: Perform initial locations sync
        locations_result = await google_business_service.get_locations(
            access_token=access_token,
            account_id=gb_account.account_id
        )
        if locations_result.get("success"):
            await google_business_crud.save_locations(
                db=db,
                user_id=current_user.id,
                account_db_id=gb_account.id,
                locations_data=locations_result["locations"]
            )

        logger.info(
            f"User {current_user.id} successfully connected Google Business: {gb_account.account_name}"
        )

        return gb_account

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Google Business OAuth Callback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete Google Business connection",
        )


@router.get(
    "/accounts",
    response_model=GoogleBusinessAccountListResponse,
    summary="Get connected Google Business accounts",
)
async def get_connected_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all Google Business accounts currently connected to the user's account."""
    try:
        accounts = await google_business_crud.get_user_accounts(db, current_user.id)
        # Filter only active social accounts
        active_accounts = []
        for account in accounts:
            social_acc = await InstagramCRUD.get_social_account(db, account.social_account_id)
            if social_acc and social_acc.is_active:
                active_accounts.append(account)
                
        return GoogleBusinessAccountListResponse(
            accounts=[GoogleBusinessAccountResponse.model_validate(acc) for acc in active_accounts],
            total=len(active_accounts)
        )
    except Exception as e:
        logger.error(f"Error listing user Google Business accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Google Business accounts"
        )


@router.delete(
    "/accounts/{account_id}",
    summary="Disconnect Google Business account",
)
async def disconnect_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a Google Business account by marking its base SocialAccount inactive."""
    try:
        account = await google_business_crud.get_account_by_id(db, account_id)
        if not account or account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Google Business account not found"
            )

        # Deactivate social account
        success = await InstagramCRUD.disconnect_account(db, account.social_account_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to disconnect social account"
            )

        return {"message": f"Successfully disconnected account: {account.account_name}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting Google Business account {account_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect Google Business account"
        )


@router.get(
    "/locations",
    response_model=GoogleBusinessLocationListResponse,
    summary="Get connected business locations",
)
async def get_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all business locations connected to the user."""
    try:
        locations = await google_business_crud.get_locations(db, current_user.id)
        # Filter locations to ensure their parent account is active
        active_locations = []
        for loc in locations:
            account = await google_business_crud.get_account_by_id(db, loc.account_id)
            if account:
                social_acc = await InstagramCRUD.get_social_account(db, account.social_account_id)
                if social_acc and social_acc.is_active:
                    active_locations.append(loc)

        return GoogleBusinessLocationListResponse(
            locations=[GoogleBusinessLocationResponse.model_validate(loc) for loc in active_locations],
            total=len(active_locations)
        )
    except Exception as e:
        logger.error(f"Error listing user locations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve locations"
        )


async def get_valid_google_token(db: AsyncSession, account) -> str:
    """Helper to verify and refresh Google access token if expired."""
    social_account = await InstagramCRUD.get_social_account(db, account.social_account_id)
    if not social_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked Google social account not found"
        )
    
    # Check if token needs refresh (Google tokens expire in 3600 seconds)
    token_age = datetime.utcnow() - social_account.updated_at
    # If updated more than 50 minutes ago, refresh
    if token_age.total_seconds() > 3000:
        logger.info(f"Refreshing expired Google OAuth token for account: {account.account_name}")
        refresh_res = await google_business_service.refresh_token(social_account.refresh_token)
        if refresh_res.get("success"):
            social_account.access_token = refresh_res["access_token"]
            social_account.updated_at = datetime.utcnow()
            db.add(social_account)
            await db.commit()
            return refresh_res["access_token"]
        else:
            logger.warning(f"Failed to refresh Google token: {refresh_res.get('error')}")
            
    return social_account.access_token


@router.post(
    "/locations/{location_id}/sync",
    response_model=GoogleBusinessReviewListResponse,
    summary="Synchronize reviews for a location",
)
async def sync_reviews(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch latest reviews from Google API and save to database, then return them."""
    try:
        location = await google_business_crud.get_location_by_id(db, location_id)
        if not location or location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )

        account = await google_business_crud.get_account_by_id(db, location.account_id)
        access_token = await get_valid_google_token(db, account)

        # Call Google API
        reviews_res = await google_business_service.get_reviews(
            access_token=access_token,
            account_id=account.account_id,
            location_id=location.location_id
        )

        if not reviews_res.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=reviews_res.get("error", "Failed to fetch reviews from Google My Business API")
            )

        # Save to DB
        saved_reviews = await google_business_crud.save_reviews(
            db=db,
            location_db_id=location.id,
            reviews_data=reviews_res["reviews"]
        )

        return GoogleBusinessReviewListResponse(
            reviews=[GoogleBusinessReviewResponse.model_validate(rev) for rev in saved_reviews],
            total=len(saved_reviews)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing reviews for location {location_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync reviews"
        )


@router.get(
    "/locations/{location_id}/reviews",
    response_model=GoogleBusinessReviewListResponse,
    summary="Get stored reviews for a location",
)
async def get_stored_reviews(
    location_id: int,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve already saved reviews for a location from database."""
    try:
        location = await google_business_crud.get_location_by_id(db, location_id)
        if not location or location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )

        reviews, total = await google_business_crud.get_reviews(db, location.id, skip=skip, limit=limit)
        return GoogleBusinessReviewListResponse(
            reviews=[GoogleBusinessReviewResponse.model_validate(rev) for rev in reviews],
            total=total
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving reviews: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve stored reviews"
        )


@router.post(
    "/reviews/generate-reply",
    summary="Generate AI reply to review comment",
)
async def generate_ai_reply(
    reviewer_name: str,
    comment: str,
    rating: int,
    tone: str = "friendly",
    current_user: User = Depends(get_current_user)
):
    """
    Generate review reply suggestions with configurable tones.
    Tone can be 'friendly', 'professional', 'thankful', 'apologetic'.
    Does not submit to Google.
    """
    try:
        reply = await google_business_service.generate_ai_reply(
            reviewer_name=reviewer_name,
            review_text=comment,
            rating=rating,
            tone=tone
        )
        return {"reply": reply}
    except Exception as e:
        logger.error(f"Error generating AI reply: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI response"
        )


@router.post(
    "/reviews/{review_id}/reply",
    response_model=GoogleBusinessReviewResponse,
    summary="Submit review reply to Google Maps",
)
async def submit_review_reply(
    review_id: int,
    request: GoogleBusinessReviewReplyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish a reply to Google Business review and save response details to DB."""
    try:
        # Load review from DB
        from models.google_business import GoogleBusinessReview
        stmt_model = select(GoogleBusinessReview).where(GoogleBusinessReview.id == review_id)
        result = await db.execute(stmt_model)
        review = result.scalar_one_or_none()

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )

        location = await google_business_crud.get_location_by_id(db, review.location_id)
        if not location or location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this review location"
            )

        account = await google_business_crud.get_account_by_id(db, location.account_id)
        access_token = await get_valid_google_token(db, account)

        # Publish reply via Google My Business API
        reply_res = await google_business_service.submit_review_reply(
            access_token=access_token,
            account_id=account.account_id,
            location_id=location.location_id,
            review_id=review.review_id,
            reply_comment=request.reply_comment
        )

        if not reply_res.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=reply_res.get("error", "Failed to publish review reply to Google Maps")
            )

        # Update DB review record
        updated_review = await google_business_crud.update_review_reply(
            db=db,
            review_db_id=review.id,
            reply_comment=reply_res["reply_comment"],
            reply_submitted_at=datetime.fromisoformat(reply_res["reply_submitted_at"].replace("Z", "+00:00")) if isinstance(reply_res["reply_submitted_at"], str) else datetime.utcnow()
        )

        return GoogleBusinessReviewResponse.model_validate(updated_review)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing review reply: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit reply"
        )


@router.post(
    "/posts/publish",
    response_model=GoogleBusinessPostResponse,
    summary="Publish local post directly onto Google Business maps page",
)
async def publish_local_post(
    request: GoogleBusinessPostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create local post entry in DB and publish it instantly to Google Maps."""
    try:
        # Load location from DB
        location = await google_business_crud.get_location_by_id(db, request.location_id)
        if not location or location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found or access denied"
            )

        # 1. Create a pending post record in DB
        post = await google_business_crud.create_post(
            db=db,
            location_db_id=location.id,
            summary=request.summary,
            media_url=request.media_url,
            action_type=request.action_type,
            action_url=request.action_url
        )

        account = await google_business_crud.get_account_by_id(db, location.account_id)
        access_token = await get_valid_google_token(db, account)

        # 2. Submit to Google maps API
        publish_res = await google_business_service.publish_post(
            access_token=access_token,
            account_id=account.account_id,
            location_id=location.location_id,
            summary=request.summary,
            media_url=request.media_url,
            action_type=request.action_type,
            action_url=request.action_url
        )

        # 3. Update status in DB
        if publish_res.get("success"):
            updated_post = await google_business_crud.update_post_status(
                db=db,
                post_db_id=post.id,
                status="published",
                post_id=publish_res["post_id"]
            )
        else:
            updated_post = await google_business_crud.update_post_status(
                db=db,
                post_db_id=post.id,
                status="failed",
                error_message=publish_res.get("error", "Unknown publishing error")
            )

        return GoogleBusinessPostResponse.model_validate(updated_post)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing Google Post: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish Google Business post"
        )


@router.get(
    "/locations/{location_id}/posts",
    response_model=GoogleBusinessPostListResponse,
    summary="Get previously published Google Posts",
)
async def get_published_posts(
    location_id: int,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of posts created/published on Google maps via Sadhyam."""
    try:
        location = await google_business_crud.get_location_by_id(db, location_id)
        if not location or location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )

        posts, total = await google_business_crud.get_posts(db, location.id, skip=skip, limit=limit)
        return GoogleBusinessPostListResponse(
            posts=[GoogleBusinessPostResponse.model_validate(p) for p in posts],
            total=total
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Google posts from DB: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Google posts"
        )
