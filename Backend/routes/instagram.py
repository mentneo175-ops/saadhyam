import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db_sync
from utils.dependencies import get_current_user
from models.user import User
from schemas.instagram_schema import (
    InstagramOAuthRequest,
    SocialAccountResponse,
    SocialAccountListResponse,
    InstantPostRequest,
    ScheduledPostRequest,
    BulkScheduleRequest,
    ScheduledPostResponse,
    UpdatePostCaptionRequest,
    UpdatePostResponse,
    GenerateCaptionRequest,
    GenerateCaptionResponse,
    PostAnalyticsResponse,
    AccountAnalyticsResponse,
    PostStatusResponse,
    PostListResponse,
)
from services.instagram_service import instagram_service, InstagramGraphAPIService
from services.instagram_crud import InstagramCRUD

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/instagram", tags=["Instagram"])


# ======================== OAuth Endpoints ========================


@router.get(
    "/auth/connect",
    summary="Get Instagram OAuth URL",
    responses={200: {"description": "OAuth URL for user to authorize"}},
)
async def get_oauth_url():
    """Get Instagram OAuth authorization URL (Facebook OAuth)."""
    oauth_url = instagram_service.get_facebook_oauth_url()
    return {"oauth_url": oauth_url}


@router.post(
    "/auth/callback",
    summary="Handle Instagram OAuth callback",
    responses={
        201: {"description": "Account connected successfully"},
        400: {"description": "Invalid authorization code"},
    },
)
async def oauth_callback(
    request: InstagramOAuthRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """
    Handle OAuth callback from Instagram.
    Exchange authorization code for access token and store account info.
    """
    try:
        # Exchange code for token
        token_result = await instagram_service.exchange_code_for_token(request.code)

        if not token_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=token_result.get("error", "Failed to exchange code for token"),
            )

        # Encrypt token before storing (Note: encryption removed in new service)
        # encrypted_token = InstagramGraphAPIService.encrypt_token(token_result["access_token"])
        access_token = token_result["access_token"]

        # Create social account record
        account = await InstagramCRUD.create_social_account(
            db=db,
            user_id=current_user.id,
            platform="instagram",
            access_token=access_token,
            ig_user_id=token_result.get("ig_user_id", ""),
            ig_username=token_result.get("ig_username", ""),
            page_id=token_result.get("page_id", ""),
            page_name=token_result.get("page_name", ""),
        )

        logger.info(
            f"User {current_user.id} connected Instagram account: {account.ig_username}"
        )

        return {
            "message": "Instagram account connected successfully",
            "account": SocialAccountResponse.model_validate(account),
        }
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect Instagram account",
        )


# ======================== Account Management ========================


@router.get(
    "/accounts",
    response_model=SocialAccountListResponse,
    summary="Get connected social accounts",
)
async def get_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get all connected social accounts for the current user."""
    accounts = await InstagramCRUD.get_user_social_accounts(db, current_user.id)
    return SocialAccountListResponse(
        accounts=[SocialAccountResponse.model_validate(acc) for acc in accounts],
        total=len(accounts),
    )


@router.delete(
    "/accounts/{account_id}",
    summary="Disconnect social account",
    responses={200: {"description": "Account disconnected"}},
)
async def disconnect_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Disconnect a social media account."""
    account = await InstagramCRUD.get_social_account(db, account_id)

    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    await InstagramCRUD.disconnect_account(db, account_id)
    return {"message": "Account disconnected successfully"}


# ======================== Posting Endpoints ========================


@router.post(
    "/post",
    response_model=ScheduledPostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post immediately",
)
async def post_immediately(
    request: InstantPostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """
    Post image immediately to Instagram.
    """
    # Verify account ownership
    account = await InstagramCRUD.get_social_account(db, request.social_account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this account",
        )

    try:
        # Get access token (no decryption needed in new service)
        access_token = account.access_token

        # Post to Instagram using new service
        result = await instagram_service.post_to_instagram(
            ig_user_id=account.ig_user_id,
            image_url=request.image_url,
            caption=request.caption or "",
            access_token=access_token,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to post to Instagram"),
            )

        # Create post record with status=POSTED
        post = await InstagramCRUD.create_scheduled_post(
            db=db,
            user_id=current_user.id,
            social_account_id=request.social_account_id,
            image_url=request.image_url,
            caption=request.caption,
        )

        # Update with posted status
        post = await InstagramCRUD.update_post_status(
            db=db,
            post_id=post.id,
            status="posted",
            instagram_post_id=result["post_id"],
        )

        logger.info(f"User {current_user.id} posted to Instagram: {result['post_id']}")

        return ScheduledPostResponse.model_validate(post)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error posting to Instagram: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to post to Instagram",
        )


@router.post(
    "/schedule",
    response_model=ScheduledPostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a post",
)
async def schedule_post(
    request: ScheduledPostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """
    Schedule a post to be published at a specific time.
    The post will be queued and published by the worker at the scheduled time.
    """
    # Verify account ownership
    account = await InstagramCRUD.get_social_account(db, request.social_account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this account",
        )

    try:
        post = await InstagramCRUD.create_scheduled_post(
            db=db,
            user_id=current_user.id,
            social_account_id=request.social_account_id,
            image_url=request.image_url,
            caption=request.caption,
            scheduled_time=request.scheduled_time,
        )

        logger.info(
            f"User {current_user.id} scheduled post {post.id} for {request.scheduled_time}"
        )

        return ScheduledPostResponse.model_validate(post)
    except Exception as e:
        logger.error(f"Error scheduling post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to schedule post",
        )


@router.post(
    "/bulk-schedule",
    summary="Schedule multiple posts",
    responses={201: {"description": "Posts scheduled successfully"}},
)
async def bulk_schedule(
    request: BulkScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Schedule multiple posts at once."""
    # Verify account ownership
    account = await InstagramCRUD.get_social_account(db, request.social_account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this account",
        )

    try:
        posts_data = [
            {
                "image_url": post.image_url,
                "caption": post.caption,
                "scheduled_time": post.scheduled_time,
            }
            for post in request.posts
        ]

        posts = await InstagramCRUD.bulk_create_posts(
            db=db,
            user_id=current_user.id,
            social_account_id=request.social_account_id,
            posts=posts_data,
        )

        logger.info(f"User {current_user.id} bulk scheduled {len(posts)} posts")

        return {
            "message": f"Successfully scheduled {len(posts)} posts",
            "posts": [ScheduledPostResponse.model_validate(post) for post in posts],
        }
    except Exception as e:
        logger.error(f"Error bulk scheduling posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to schedule posts",
        )


# ======================== Post Management ========================


@router.get(
    "/posts",
    response_model=PostListResponse,
    summary="Get scheduled posts",
)
async def get_posts(
    status: str = None,
    limit: int = 50,
    page: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get user's scheduled posts with pagination."""
    offset = (page - 1) * limit
    posts, total = InstagramCRUD.get_user_posts(
        db=db,
        user_id=current_user.id,
        skip=offset,
        limit=limit,
    )

    # Filter by status if provided
    if status:
        posts = [post for post in posts if post.status == status]
        total = len(posts)

    return PostListResponse(
        posts=[ScheduledPostResponse.model_validate(post) for post in posts],
        total=total,
        page=page,
        page_size=limit,
    )


@router.put(
    "/post/{post_id}",
    response_model=UpdatePostResponse,
    summary="Update post caption",
)
async def update_post_caption(
    post_id: int,
    request: UpdatePostCaptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Update caption of a scheduled post (before posting)."""
    post = await InstagramCRUD.get_scheduled_post(db, post_id)

    if not post or post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    if post.status == "posted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit caption of posted content",
        )

    post = await InstagramCRUD.update_post_caption(db, post_id, request.caption)

    return UpdatePostResponse.model_validate(post)


@router.delete(
    "/post/{post_id}",
    summary="Delete scheduled post",
    responses={200: {"description": "Post deleted"}},
)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Delete a scheduled post."""
    post = await InstagramCRUD.get_scheduled_post(db, post_id)

    if not post or post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    if post.status == "posted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete posted content",
        )

    # Mark as deleted by setting to failed with appropriate message
    await InstagramCRUD.update_post_status(
        db=db,
        post_id=post_id,
        status="failed",
        error_message="Deleted by user",
    )

    return {"message": "Post deleted successfully"}


# ======================== AI Caption Generation ========================


@router.post(
    "/generate-caption",
    response_model=GenerateCaptionResponse,
    summary="Generate AI caption",
)
async def generate_caption(
    request: GenerateCaptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """
    Generate caption using AI with smart content generator.
    
    Uses Groq API for high-quality, context-aware caption generation.
    """
    try:
        from services.smart_content_generator import generate_smart_content
        
        logger.info(f"🤖 Generating AI caption for user {current_user.id}")
        logger.info(f"   Topic: {request.topic}")
        logger.info(f"   Tone: {request.tone}")
        
        # Get user's business info for better context
        business_type = current_user.business_type or "Business"
        business_name = current_user.business_name or business_type
        
        # Create user input combining topic and business context
        user_input = f"{business_name} {request.topic}"
        
        logger.info(f"   Business context: {business_type}")
        logger.info(f"   User input: {user_input}")
        
        # Generate smart content using Groq API
        result = generate_smart_content(
            user_input=user_input,
            business_type=business_type,
            platform="instagram",
            goal="promotion",
            tone=request.tone.lower(),
            language="english"
        )
        
        # Combine headline, caption, and subtext for a complete Instagram caption
        full_caption = f"{result['headline']}\n\n{result['caption']}"
        
        # Add subtext if it's different and adds value
        if result['subtext'] and result['subtext'] not in result['caption']:
            full_caption += f"\n\n{result['subtext']}"
        
        # Add CTA if it's different
        if result['cta'] and result['cta'] not in full_caption:
            full_caption += f"\n\n{result['cta']}"
        
        # Add hashtags
        if result['hashtags']:
            hashtags_str = " ".join(result['hashtags'])
            full_caption += f"\n\n{hashtags_str}"
        
        logger.info(f"✅ AI caption generated successfully")
        logger.info(f"   Length: {len(full_caption)} characters")
        
        return GenerateCaptionResponse(
            caption=full_caption,
            topic=request.topic,
            tone=request.tone,
        )
        
    except Exception as e:
        logger.error(f"❌ AI caption generation failed: {e}", exc_info=True)
        
        # Fallback to simple template-based generation
        logger.info("🔄 Using fallback template generation")
        
        tone_map = {
            "casual": "chilled out",
            "professional": "professional and polished", 
            "funny": "hilarious",
            "inspirational": "motivational and uplifting",
        }

        tone_desc = tone_map.get(request.tone.lower(), request.tone)
        business_name = current_user.business_name or "our business"
        
        caption = f"Check out this {tone_desc} {request.topic} at {business_name}! 🚀\n\n#business #socialmedia #quality"

        logger.info(f"📝 Fallback caption generated for user {current_user.id}")

        return GenerateCaptionResponse(
            caption=caption,
            topic=request.topic,
            tone=request.tone,
        )


# ======================== Analytics Endpoints ========================


@router.get(
    "/analytics/{post_id}",
    response_model=PostAnalyticsResponse,
    summary="Get post analytics",
)
async def get_post_analytics(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get analytics for a specific post."""
    post = await InstagramCRUD.get_scheduled_post(db, post_id)

    if not post or post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    analytics = await InstagramCRUD.get_analytics(db, post_id)

    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analytics data available",
        )

    return PostAnalyticsResponse.model_validate(analytics)


@router.get(
    "/account-analytics/{account_id}",
    response_model=AccountAnalyticsResponse,
    summary="Get account analytics",
)
async def get_account_analytics(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """Get aggregated analytics for an account."""
    account = await InstagramCRUD.get_social_account(db, account_id)

    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this account",
        )

    posts, total = await InstagramCRUD.get_user_posts(db, current_user.id)

    total_likes = 0
    total_reach = 0
    total_impressions = 0
    analytics_list = []

    for post in posts:
        analytics = await InstagramCRUD.get_analytics(db, post.id)
        if analytics:
            total_likes += analytics.likes
            total_reach += analytics.reach
            total_impressions += analytics.impressions
            analytics_list.append(PostAnalyticsResponse.model_validate(analytics))

    return AccountAnalyticsResponse(
        total_posts=total,
        total_likes=total_likes,
        total_reach=total_reach,
        total_impressions=total_impressions,
        average_engagement_rate=0.0,  # TODO: Calculate properly
        posts=analytics_list,
    )

