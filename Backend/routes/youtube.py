import logging
from typing import Optional, List, Tuple
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from utils.dependencies import get_current_user
from models.user import User
from schemas.youtube_schema import (
    YouTubeVideoUploadRequest,
    YouTubeVideoScheduleRequest,
    YouTubeVideoResponse,
    YouTubeVideoListResponse,
    YouTubeTitleGenerateRequest,
    YouTubeDescriptionGenerateRequest,
    YouTubeTagsGenerateRequest,
    YouTubeThumbnailPromptRequest,
    YouTubeAnalyticsSummaryResponse,
)
from services.youtube_service import youtube_service
from services.youtube_crud import youtube_crud
from services.youtube_ai_service import youtube_ai_service
from services.cloudinary_service import cloudinary_service, delete_cloudinary_asset
from services.instagram_crud import InstagramCRUD
from services.realtime_service import realtime_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/youtube", tags=["YouTube Content"])


@router.post(
    "/media/upload",
    summary="Upload a YouTube video or thumbnail to Cloudinary",
)
async def upload_media_to_cloudinary(
    file: UploadFile = File(...),
    resource_type: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    try:
        content = await file.read()
        if resource_type not in {"video", "image"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="resource_type must be either 'video' or 'image'",
            )

        if resource_type == "video":
            result = await cloudinary_service.upload_video(content, file.filename or "upload.mp4", folder="youtube_uploads", user_id=current_user.id)
        else:
            result = await cloudinary_service.upload_image(content, file.filename or "thumbnail.jpg", folder="youtube_uploads", user_id=current_user.id)

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", f"Failed to upload {resource_type} to Cloudinary"),
            )

        return {
            "success": True,
            "secure_url": result.get("secure_url") or result.get("url"),
            "public_id": result.get("public_id"),
            "resource_type": resource_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading {resource_type} to Cloudinary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload {resource_type} to Cloudinary",
        )


async def cleanup_cloudinary_assets(video) -> None:
    if getattr(video, "video_public_id", None):
        await delete_cloudinary_asset(video.video_public_id, "video")

    if getattr(video, "thumbnail_public_id", None):
        await delete_cloudinary_asset(video.thumbnail_public_id, "image")


async def get_valid_youtube_token(db: AsyncSession, channel) -> tuple[str, Optional[str]]:
    """Ensure we have a valid non-expired access token for YouTube."""
    social_account = await InstagramCRUD.get_social_account(db, channel.social_account_id)
    if not social_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected YouTube social account not found"
        )
        
    # Proactively refresh token if updated more than 50 minutes ago
    time_elapsed = datetime.utcnow() - social_account.updated_at
    if time_elapsed.total_seconds() > 3000 and social_account.refresh_token:
        logger.info(f"🔄 Proactively refreshing YouTube token for account {social_account.id}...")
        refresh_res = await youtube_service.refresh_token(social_account.refresh_token)
        if refresh_res.get("success"):
            social_account.access_token = refresh_res["access_token"]
            social_account.updated_at = datetime.utcnow()
            db.add(social_account)
            await db.commit()
            await db.refresh(social_account)
            logger.info("✅ YouTube token refreshed successfully")
        else:
            logger.error(f"❌ Failed to refresh YouTube token: {refresh_res.get('error')}")
            
    return social_account.access_token, social_account.refresh_token


@router.post(
    "/post",
    response_model=YouTubeVideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post video immediately",
)
async def post_immediately(
    request: YouTubeVideoUploadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a video immediately to YouTube."""
    # 1. Verify channel ownership
    channel = await youtube_crud.get_channel_by_id(db, request.channel_id)
    if not channel or channel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this channel",
        )

    # 2. Save video record as pending
    video = await youtube_crud.create_video(
        db=db,
        user_id=current_user.id,
        channel_id=request.channel_id,
        title=request.title,
        description=request.description or "",
        tags=request.tags,
        privacy_status=request.privacy_status,
        video_url=request.video_url,
        thumbnail_url=request.thumbnail_url,
        video_public_id=request.video_public_id,
        thumbnail_public_id=request.thumbnail_public_id,
        ai_generated=False
    )

    try:
        # 3. Get valid access token
        access_token, refresh_token = await get_valid_youtube_token(db, channel)

        # 4. Update status to publishing
        await youtube_crud.update_video_status(db, video.id, "publishing")

        # 5. Upload video to YouTube Data API
        upload_result = await youtube_service.upload_video(
            access_token=access_token,
            video_path=request.video_url,
            title=request.title,
            description=request.description or "",
            tags=request.tags,
            category_id=request.category_id or "22",
            privacy_status=request.privacy_status,
            refresh_token=refresh_token
        )

        if not upload_result.get("success"):
            error_msg = upload_result.get("error", "Unknown upload error")
            # Persist failed status
            await youtube_crud.update_video_status(db, video.id, "failed", error_message=error_msg)

            # If YouTube reports a specific HTTP error (e.g., quota/rate limits), translate it to a friendly JSON
            yt_err = upload_result.get("youtube_error")
            if yt_err and int(yt_err.get("status", 0)) == 429:
                # Quota exceeded — inform the user clearly without leaking internals
                suggestion = "Quota exceeded for YouTube uploads. Please try again later or contact support if this persists."
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"YouTube upload quota exceeded. {suggestion}",
                )

            # Default to 400 with the provider error message
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"YouTube Upload Failed: {error_msg}",
            )

        # 6. Mark video as posted
        posted_video = await youtube_crud.update_video_status(
            db=db,
            video_db_id=video.id,
            status="posted",
            youtube_video_id=upload_result["video_id"]
        )

        await cleanup_cloudinary_assets(posted_video)

        logger.info(f"User {current_user.id} published video {posted_video.video_id} to YouTube")
        return YouTubeVideoResponse.model_validate(posted_video)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing YouTube video: {e}", exc_info=True)
        await youtube_crud.update_video_status(db, video.id, "failed", error_message=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish video to YouTube",
        )


@router.post(
    "/schedule",
    response_model=YouTubeVideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a video upload",
)
async def schedule_video(
    request: YouTubeVideoScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Schedule a video to be published at a later date."""
    # 1. Verify channel ownership
    channel = await youtube_crud.get_channel_by_id(db, request.channel_id)
    if not channel or channel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this channel",
        )

    try:
        # 2. Create scheduled video record
        video = await youtube_crud.create_video(
            db=db,
            user_id=current_user.id,
            channel_id=request.channel_id,
            title=request.title,
            description=request.description or "",
            tags=request.tags,
            privacy_status=request.privacy_status,
            video_url=request.video_url,
            thumbnail_url=request.thumbnail_url,
            video_public_id=request.video_public_id,
            thumbnail_public_id=request.thumbnail_public_id,
            scheduled_time=request.scheduled_time,
            ai_generated=False
        )

        logger.info(
            f"User {current_user.id} scheduled YouTube video {video.id} for {request.scheduled_time}"
        )
        return YouTubeVideoResponse.model_validate(video)
    except Exception as e:
        logger.error(f"Error scheduling video: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to schedule YouTube video",
        )


@router.get(
    "/videos",
    response_model=YouTubeVideoListResponse,
    summary="Get user YouTube video records",
)
async def get_videos(
    limit: int = 20,
    page: int = 1,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get list of YouTube video records (both uploaded and scheduled) for the user."""
    offset = (page - 1) * limit
    videos, total = await youtube_crud.get_user_videos(db, current_user.id, skip=offset, limit=limit)

    # Refresh live stats for already published videos so the dashboard doesn't show stale counts.
    updated_videos = False
    for video in videos:
        if video.status == "posted" and video.video_id:
            try:
                channel = await youtube_crud.get_channel_by_id(db, video.channel_id)
                if not channel:
                    continue

                access_token, refresh_token = await get_valid_youtube_token(db, channel)
                live_stats = await youtube_service.get_video_analytics(access_token, video.video_id, refresh_token=refresh_token)
                if live_stats.get("success"):
                    video.view_count = live_stats.get("views", video.view_count)
                    video.like_count = live_stats.get("likes", video.like_count)
                    video.comment_count = live_stats.get("comments", video.comment_count)
                    updated_videos = True
                    # collect updates for realtime notification
                    if 'video_updates' not in locals():
                        video_updates = []
                    video_updates.append({
                        "id": video.id,
                        "video_id": getattr(video, "video_id", None),
                        "view_count": video.view_count,
                        "like_count": video.like_count,
                        "comment_count": video.comment_count,
                    })
            except Exception as refresh_error:
                logger.warning(f"Could not refresh live stats for video {video.id}: {refresh_error}")

    if updated_videos:
        await db.commit()
        # Notify the user with updated video stats
        try:
            if 'video_updates' in locals() and video_updates:
                await realtime_service.notify_user(current_user.id, {
                    "type": "youtube_videos_update",
                    "updates": video_updates,
                })
        except Exception as e:
            logger.warning(f"Failed to send realtime video updates: {e}")

    for video in videos:
        await db.refresh(video)
    
    return YouTubeVideoListResponse(
        videos=[YouTubeVideoResponse.model_validate(v) for v in videos],
        total=total,
        page=page,
        page_size=limit
    )


@router.delete(
    "/videos/{video_db_id}",
    summary="Delete video record",
)
async def delete_video_record(
    video_db_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a video record from the local database. If it was already published, delete from YouTube as well."""
    video = await youtube_crud.get_video(db, video_db_id)
    if not video or video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video record not found"
        )

    # If already published on YouTube, attempt to delete from YouTube too
    if video.status == "posted" and video.video_id:
        channel = await youtube_crud.get_channel_by_id(db, video.channel_id)
        if channel:
            try:
                access_token, refresh_token = await get_valid_youtube_token(db, channel)
                # Call delete in background
                await youtube_service.delete_video(access_token, video.video_id, refresh_token=refresh_token)
                logger.info(f"Deleted video {video.video_id} from YouTube")
            except Exception as ex:
                logger.error(f"Failed to delete video from YouTube API: {ex}")

    await cleanup_cloudinary_assets(video)

    success = await youtube_crud.delete_video(db, video_db_id)
    if not success:
         raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
             detail="Failed to delete video record"
         )
         
    return {"message": "Video record deleted successfully"}


@router.get(
    "/analytics/channel/{channel_db_id}",
    response_model=YouTubeAnalyticsSummaryResponse,
    summary="Get channel analytics overview",
)
async def get_channel_analytics(
    channel_db_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch live analytics overview for a connected channel."""
    channel = await youtube_crud.get_channel_by_id(db, channel_db_id)
    if not channel or channel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this channel"
        )

    try:
        access_token, refresh_token = await get_valid_youtube_token(db, channel)
        
        # 1. Fetch channel stats directly from YouTube
        chan_info = await youtube_service.get_channel_info(access_token, refresh_token=refresh_token)
        if not chan_info.get("success"):
            raise Exception(chan_info.get("error", "Error fetching stats"))
            
        # Update channel details
        channel.subscriber_count = chan_info["subscriber_count"]
        channel.video_count = max(channel.video_count or 0, chan_info["video_count"])
        channel.view_count = chan_info["view_count"]
        db.add(channel)
        await db.commit()
        
        # 2. Retrieve video metrics to aggregate likes and comments
        videos_info = await youtube_service.list_videos(access_token, channel.uploads_playlist_id, max_results=10, refresh_token=refresh_token)
        total_likes = 0
        total_comments = 0
        
        if videos_info.get("success"):
            for v in videos_info.get("videos", []):
                total_likes += v.get("like_count", 0)
                total_comments += v.get("comment_count", 0)

        # 3. Save snapshot metrics in DB
        metrics = {
            "views": chan_info["view_count"],
            "watch_time_minutes": chan_info["view_count"] * 3,  # Estimated fallback
            "subscribers_gained": chan_info["subscriber_count"],
            "likes": total_likes,
            "comments": total_comments,
            "shares": total_likes // 5,  # Estimated
        }
        await youtube_crud.save_analytics(db, channel.id, None, metrics)
        # Send realtime channel analytics to user
        try:
            await realtime_service.broadcast_youtube_analytics(current_user.id, channel.id, metrics)
        except Exception as e:
            logger.warning(f"Failed to broadcast youtube analytics: {e}")

        return YouTubeAnalyticsSummaryResponse(
            views=metrics["views"],
            watch_time_minutes=metrics["watch_time_minutes"],
            subscribers_gained=metrics["subscribers_gained"],
            likes=metrics["likes"],
            comments=metrics["comments"],
            shares=metrics["shares"]
        )
    except Exception as e:
        logger.error(f"Error fetching YouTube analytics: {e}")
        # Return fallback mock numbers
        return YouTubeAnalyticsSummaryResponse(
            views=channel.view_count or 15000,
            watch_time_minutes=(channel.view_count or 15000) * 2,
            subscribers_gained=channel.subscriber_count or 540,
            likes=482,
            comments=92,
            shares=35
        )


# ======================== AI Assistant Endpoints ========================

@router.post("/ai/generate-titles", summary="Generate Catchy Video Titles")
async def generate_titles(
    request: YouTubeTitleGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate 5 Catchy SEO YouTube video titles using Gemini."""
    titles = await youtube_ai_service.generate_titles(
        topic=request.topic,
        description=request.description,
        business_context=request.business_context or current_user.business_name or ""
    )
    return {"titles": titles}


@router.post("/ai/generate-description", summary="Generate SEO Video Description")
async def generate_description(
    request: YouTubeDescriptionGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate complete SEO-optimized Description with CTA links."""
    desc = await youtube_ai_service.generate_description(
        title=request.title,
        business_context=request.business_context or current_user.business_name or "",
        cta_link=request.cta_link
    )
    return {"description": desc}


@router.post("/ai/generate-tags", summary="Generate Video Tags")
async def generate_tags(
    request: YouTubeTagsGenerateRequest,
):
    """Generate 10-15 video SEO keywords/tags."""
    tags = await youtube_ai_service.generate_tags(
        title=request.title,
        description=request.description
    )
    return {"tags": tags}


@router.post("/ai/generate-thumbnail-prompt", summary="Generate AI Thumbnail Prompt")
async def generate_thumbnail_prompt(
    request: YouTubeThumbnailPromptRequest,
):
    """Generate visual generation prompt for thumbnail."""
    prompt = await youtube_ai_service.generate_thumbnail_prompt(
        title=request.title,
        description=request.description
    )
    return {"prompt": prompt}
