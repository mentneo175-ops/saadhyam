import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from utils.dependencies import get_current_user
from models.user import User
from schemas.youtube_schema import (
    YouTubeOAuthRequest,
    YouTubeChannelResponse,
    YouTubeChannelListResponse,
)
from services.youtube_service import youtube_service
from services.youtube_crud import youtube_crud
from services.instagram_crud import InstagramCRUD

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/youtube", tags=["YouTube OAuth"])


@router.get(
    "/auth/connect",
    summary="Get YouTube Google OAuth URL",
    responses={200: {"description": "Google OAuth URL for user to authorize YouTube Access"}},
)
async def get_oauth_url():
    """Get Google OAuth URL for YouTube API authorization."""
    try:
        oauth_url = await youtube_service.get_auth_url()
        return {"oauth_url": oauth_url}
    except Exception as e:
        logger.error(f"Error generating Google OAuth URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate YouTube OAuth URL",
        )


@router.post(
    "/auth/callback",
    summary="Handle Google OAuth callback for YouTube",
    response_model=YouTubeChannelResponse,
    status_code=status.HTTP_201_CREATED,
)
async def oauth_callback(
    request: YouTubeOAuthRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth authorization callback code.
    Exchange code for tokens, fetch channel profile, and store connection in database.
    """
    try:
        # Step 1: Exchange code for Google Access & Refresh tokens
        token_result = await youtube_service.exchange_code(request.code, request.state)
        if not token_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=token_result.get("error", "Failed to exchange authorization code"),
            )

        access_token = token_result["access_token"]
        refresh_token = token_result.get("refresh_token")
        expires_in = token_result.get("expires_in", 3600)

        # Step 2: Retrieve YouTube Channel snippet details
        channel_result = await youtube_service.get_channel_info(access_token)
        if not channel_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=channel_result.get("error", "Failed to retrieve channel info"),
            )

        # Step 3: Register channel in Database
        youtube_channel = await youtube_crud.create_youtube_account(
            db=db,
            user_id=current_user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            channel_data=channel_result
        )

        logger.info(
            f"User {current_user.id} successfully connected YouTube channel: {youtube_channel.channel_title}"
        )

        return YouTubeChannelResponse.model_validate(youtube_channel)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in YouTube OAuth Callback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete YouTube OAuth connection",
        )


@router.get(
    "/accounts",
    response_model=YouTubeChannelListResponse,
    summary="Get connected YouTube channels",
)
async def get_connected_channels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all YouTube channels currently connected to the user's account."""
    try:
        channels = await youtube_crud.get_user_channels(db, current_user.id)
        # Filter only active social accounts
        active_channels = []
        for channel in channels:
            # Fetch corresponding SocialAccount
            social_acc = await InstagramCRUD.get_social_account(db, channel.social_account_id)
            if social_acc and social_acc.is_active:
                active_channels.append(channel)
                
        return YouTubeChannelListResponse(
            channels=[YouTubeChannelResponse.model_validate(ch) for ch in active_channels],
            total=len(active_channels)
        )
    except Exception as e:
        logger.error(f"Error listing user YouTube channels: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve YouTube accounts"
        )


@router.delete(
    "/accounts/{channel_id}",
    summary="Disconnect YouTube channel",
)
async def disconnect_channel(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a YouTube channel by marking its base SocialAccount inactive."""
    try:
        channel = await youtube_crud.get_channel_by_id(db, channel_id)
        if not channel or channel.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="YouTube channel not found"
            )

        # Deactivate social account
        success = await InstagramCRUD.disconnect_account(db, channel.social_account_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to disconnect social account"
            )

        return {"message": f"Successfully disconnected channel: {channel.channel_title}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting channel {channel_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect YouTube account"
        )
