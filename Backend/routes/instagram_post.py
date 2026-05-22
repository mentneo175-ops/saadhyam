"""
Instagram posting routes with Cloudinary integration.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from config.database import get_db
from utils.dependencies import get_current_user
from models.user import User
from models.instagram import ScheduledPost
from services.instagram_crud import InstagramCRUD, instagram_crud
from services.instagram_service import InstagramGraphAPIService
from services.cloudinary_service import CloudinaryService
from typing import Optional
import json
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/instagram", tags=["Instagram Posting"])

# Services
instagram_service = InstagramGraphAPIService()
cloudinary_service = CloudinaryService()


@router.post(
    "/upload-and-post",
    summary="Upload media (image/video) and post to Instagram",
    responses={
        201: {"description": "Successfully posted to Instagram"},
        400: {"description": "Invalid request or upload failed"},
        403: {"description": "No Instagram account connected"},
    },
)
async def upload_and_post(
    media: UploadFile = File(..., description="Image or video file to upload and post"),
    caption: str = Form("", description="Caption for the Instagram post"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload image or video to Cloudinary and post immediately to Instagram.
    
    Supported formats:
    - Images: JPEG, PNG, GIF (max 10MB)
    - Videos: MP4, MOV (max 100MB, 3-60 seconds duration)
    
    This endpoint:
    1. Validates the uploaded media
    2. Uploads media to Cloudinary with Instagram-optimized settings
    3. Posts the media to Instagram using the Cloudinary URL
    4. Saves the post record in database
    """
    try:
        # Check if user has connected Instagram account
        accounts = await instagram_crud.get_user_social_accounts(db, current_user.id)
        instagram_accounts = [acc for acc in accounts if acc.platform == "instagram"]
        
        logger.info(f"🔍 Instagram posting attempt by User ID: {current_user.id} ({current_user.email})")
        logger.info(f"🔍 Found {len(instagram_accounts)} Instagram accounts for this user")
        
        if not instagram_accounts:
            logger.warning(f"❌ User {current_user.id} ({current_user.email}) has no Instagram account connected")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No Instagram account connected. Please connect your Instagram account first."
            )
        
        # Use the first Instagram account
        account = instagram_accounts[0]
        logger.info(f"📱 Using Instagram account: @{account.ig_username} (IG User ID: {account.ig_user_id})")
        
        # Detect media type
        is_video = False
        media_type = "IMAGE"
        
        if media.content_type:
            if media.content_type.startswith("video/"):
                is_video = True
                media_type = "REELS"  # Instagram now requires REELS for videos
                logger.info(f"🎥 Video detected: {media.content_type} - will post as REELS")
            elif media.content_type.startswith("image/"):
                is_video = False
                media_type = "IMAGE"
                logger.info(f"🖼️ Image detected: {media.content_type}")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File must be an image (JPEG, PNG) or video (MP4, MOV)"
                )
        
        # Check file size
        max_size = 100 * 1024 * 1024 if is_video else 10 * 1024 * 1024  # 100MB for video, 10MB for image
        if media.size and media.size > max_size:
            max_size_mb = 100 if is_video else 10
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{'Video' if is_video else 'Image'} file too large. Maximum size is {max_size_mb}MB."
            )
        
        # Read media data
        media_data = await media.read()
        
        # Upload to Cloudinary
        logger.info(f"Uploading {'video' if is_video else 'image'} to Cloudinary for user {current_user.id}")
        
        if is_video:
            # Upload video
            upload_result = await cloudinary_service.upload_video(
                file_data=media_data,
                filename=media.filename or "instagram_video.mp4",
                folder="instagram_posts",
                user_id=current_user.id
            )
        else:
            # Upload image
            upload_result = await cloudinary_service.upload_image(
                file_data=media_data,
                filename=media.filename or "instagram_post.jpg",
                folder="instagram_posts",
                user_id=current_user.id
            )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to upload {'video' if is_video else 'image'}: {upload_result.get('error', 'Unknown error')}"
            )
        
        
        # Get the Cloudinary URL
        media_url = upload_result["secure_url"]
        cloudinary_public_id = upload_result["public_id"]
        
        logger.info(f"{'Video' if is_video else 'Image'} uploaded to Cloudinary: {media_url}")
        
        # Post to Instagram
        logger.info(f"Posting {'video' if is_video else 'image'} to Instagram for user {current_user.id}")
        post_result = instagram_service.post_to_instagram_sync(
            ig_user_id=account.ig_user_id,
            image_url=media_url,
            caption=caption,
            access_token=account.access_token,
            media_type=media_type
        )
        
        if not post_result.get("success"):
            # If Instagram posting fails, optionally delete the Cloudinary media
            # cloudinary_service.delete_image(cloudinary_public_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to post to Instagram: {post_result.get('error', 'Unknown error')}"
            )
        
        # Save post record in database
        post = await instagram_crud.create_scheduled_post(
            db=db,
            user_id=current_user.id,
            social_account_id=account.id,
            image_url=media_url,
            caption=caption,
            scheduled_time=None,  # Posted immediately
            ai_generated=False
        )
        
        # Update post status to posted
        await instagram_crud.update_post_status(
            db=db,
            post_id=post.id,
            status="posted",
            instagram_post_id=post_result["post_id"]
        )
        
        logger.info(f"Successfully posted {'video' if is_video else 'image'} to Instagram: {post_result['post_id']}")
        
        # Enhanced success response with more details
        instagram_url = f"https://www.instagram.com/p/{post_result['post_id']}/" if post_result.get('post_id') else None
        
        return {
            "success": True,
            "message": f"🎉 Successfully posted {'video' if is_video else 'image'} to Instagram! Your post is now live on @{account.ig_username}",
            "post": {
                "id": post.id,
                "instagram_post_id": post_result["post_id"],
                "media_url": media_url,
                "media_type": media_type,
                "caption": caption,
                "cloudinary_public_id": cloudinary_public_id,
                "account_username": account.ig_username,
                "status": "posted",
                "posted_time": datetime.utcnow().isoformat(),
                "instagram_url": instagram_url,
                "created_at": post.created_at.isoformat() if post.created_at else None
            },
            "details": {
                "post_id": post_result["post_id"],
                "account": f"@{account.ig_username}",
                "media_type": media_type,
                "media_size": f"{upload_result.get('width', 'unknown')}x{upload_result.get('height', 'unknown')}" if not is_video else f"{upload_result.get('duration', 'unknown')}s",
                "media_format": upload_result.get('format', 'unknown'),
                "posted_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in upload and post: {e}", exc_info=True)
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Stack trace: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload and post media: {str(e)}"
        )


@router.post(
    "/schedule-post",
    summary="Upload media (image/video) and schedule Instagram post",
    responses={
        201: {"description": "Successfully scheduled Instagram post"},
        400: {"description": "Invalid request or upload failed"},
        403: {"description": "No Instagram account connected"},
    },
)
async def schedule_post(
    media: UploadFile = File(..., description="Image or video file to upload and schedule"),
    caption: str = Form("", description="Caption for the Instagram post"),
    scheduled_time: str = Form(..., description="Scheduled time in ISO format (YYYY-MM-DDTHH:MM:SS)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload image or video to Cloudinary and schedule Instagram post.
    
    Supported formats:
    - Images: JPEG, PNG, GIF (max 10MB)
    - Videos: MP4, MOV (max 100MB, 3-60 seconds duration)
    
    This endpoint:
    1. Validates the uploaded media
    2. Uploads media to Cloudinary
    3. Schedules the post for later publishing
    4. Saves the scheduled post in database
    """
    try:
        logger.info(f"📨 Received schedule-post request")
        logger.info(f"   User ID: {current_user.id}")
        logger.info(f"   Media: {media.filename} ({media.size} bytes)")
        logger.info(f"   Caption length: {len(caption)}")
        logger.info(f"   Scheduled time: '{scheduled_time}' (type: {type(scheduled_time).__name__}, len: {len(scheduled_time)})")
        
        # Validate scheduled_time is not empty
        if not scheduled_time or scheduled_time.strip() == "":
            logger.error(f"❌ Scheduled time is empty!")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scheduled time is required"
            )
        
        # Check if user has connected Instagram account
        accounts = await instagram_crud.get_user_social_accounts(db, current_user.id)
        instagram_accounts = [acc for acc in accounts if acc.platform == "instagram"]
        
        if not instagram_accounts:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No Instagram account connected. Please connect your Instagram account first."
            )
        
        # Use the first Instagram account
        account = instagram_accounts[0]
        
        # Detect media type
        is_video = False
        if media.content_type:
            if media.content_type.startswith("video/"):
                is_video = True
                logger.info(f"🎥 Video detected: {media.content_type} - will schedule as REELS")
            elif media.content_type.startswith("image/"):
                is_video = False
                logger.info(f"🖼️ Image detected: {media.content_type}")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File must be an image (JPEG, PNG) or video (MP4, MOV)"
                )
        
        # Check file size
        max_size = 100 * 1024 * 1024 if is_video else 10 * 1024 * 1024  # 100MB for video, 10MB for image
        if media.size and media.size > max_size:
            max_size_mb = 100 if is_video else 10
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{'Video' if is_video else 'Image'} file too large. Maximum size is {max_size_mb}MB."
            )
        
        # Parse scheduled time
        from datetime import datetime
        
        try:
            # Frontend sends UTC ISO string (e.g., "2026-04-29T10:00:00.000Z")
            # This is the CORRECT UTC time (already converted from IST)
            logger.info(f"📨 Received scheduled_time: {scheduled_time}")
            
            if scheduled_time.endswith('Z'):
                scheduled_datetime = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
            else:
                scheduled_datetime = datetime.fromisoformat(scheduled_time)
            
            # Convert to naive UTC datetime (remove timezone info)
            if scheduled_datetime.tzinfo is not None:
                scheduled_datetime = scheduled_datetime.replace(tzinfo=None)
            
            logger.info(f"✅ Parsed scheduled_time (UTC): {scheduled_datetime}")
                
        except ValueError as e:
            logger.error(f"❌ Failed to parse scheduled time: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid scheduled time format. Expected ISO format: YYYY-MM-DDTHH:MM:SS.sssZ. Received: {scheduled_time}"
            )
        
        # Validate scheduled time is in the future
        # Compare using UTC times
        utc_now = datetime.utcnow()
        
        logger.info(f"🕐 Current UTC time: {utc_now}")
        logger.info(f"📅 Scheduled UTC time: {scheduled_datetime}")
        logger.info(f"⏱️ Time difference: {(scheduled_datetime - utc_now).total_seconds()} seconds")
        logger.info(f"✓ Is future: {scheduled_datetime > utc_now}")
        
        if scheduled_datetime <= utc_now:
            logger.warning(f"⚠️ Scheduled time is in the past or now")
            logger.warning(f"   Scheduled: {scheduled_datetime}")
            logger.warning(f"   Current: {utc_now}")
            logger.warning(f"   Difference: {(utc_now - scheduled_datetime).total_seconds()} seconds in the past")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Scheduled time must be in the future. Current UTC: {utc_now.isoformat()}, Scheduled UTC: {scheduled_datetime.isoformat()}"
            )
        
        # Read media data
        media_data = await media.read()
        
        # Upload to Cloudinary
        logger.info(f"Uploading {'video' if is_video else 'image'} to Cloudinary for scheduled post by user {current_user.id}")
        
        if is_video:
            # Upload video
            upload_result = await cloudinary_service.upload_video(
                file_data=media_data,
                filename=media.filename or "scheduled_video.mp4",
                folder="instagram_scheduled",
                user_id=current_user.id
            )
        else:
            # Upload image
            upload_result = await cloudinary_service.upload_image(
                file_data=media_data,
                filename=media.filename or "scheduled_post.jpg",
                folder="instagram_scheduled",
                user_id=current_user.id
            )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to upload {'video' if is_video else 'image'}: {upload_result.get('error', 'Unknown error')}"
            )
        
        # Get the Cloudinary URL
        media_url = upload_result["secure_url"]
        cloudinary_public_id = upload_result["public_id"]
        
        # Save scheduled post in database
        post = await instagram_crud.create_scheduled_post(
            db=db,
            user_id=current_user.id,
            social_account_id=account.id,
            image_url=media_url,
            caption=caption,
            scheduled_time=scheduled_datetime,
            ai_generated=False
        )
        
        logger.info(f"Successfully scheduled Instagram {'video' if is_video else 'image'} post for {scheduled_datetime}")
        
        return {
            "success": True,
            "message": f"Successfully scheduled Instagram {'reel' if is_video else 'image'} post!",
            "post": {
                "id": post.id,
                "media_url": media_url,
                "media_type": "REELS" if is_video else "IMAGE",
                "caption": caption,
                "scheduled_time": scheduled_datetime.isoformat(),
                "cloudinary_public_id": cloudinary_public_id,
                "account_username": account.ig_username,
                "status": "scheduled"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in schedule post: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule post: {str(e)}"
        )


@router.get(
    "/posts",
    summary="Get user's Instagram posts",
    responses={
        200: {"description": "List of user's Instagram posts"},
    },
)
async def get_posts(
    status: Optional[str] = None,
    limit: int = 20,
    page: int = 1,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user's Instagram posts with pagination.
    
    Args:
        status: Filter by post status (posted, scheduled, failed)
        limit: Number of posts per page
        page: Page number
    """
    try:
        logger.info(f"Getting posts for user {current_user.id}, status: {status}, limit: {limit}, page: {page}")
        
        offset = (page - 1) * limit
        posts, total = await instagram_crud.get_user_posts(
            db=db,
            user_id=current_user.id,
            skip=offset,
            limit=limit
        )
        
        logger.info(f"Found {len(posts)} posts (total: {total})")
        
        # Filter by status if provided
        if status:
            posts = [post for post in posts if post.status == status]
            total = len(posts)
            logger.info(f"After status filter '{status}': {len(posts)} posts")
        
        # Convert posts to response format
        posts_data = []
        for post in posts:
            try:
                post_data = {
                    "id": post.id,
                    "image_url": post.image_url,
                    "caption": post.caption or "",
                    "status": post.status,
                    "scheduled_time": post.scheduled_time.isoformat() if post.scheduled_time else None,
                    "posted_time": post.posted_time.isoformat() if post.posted_time else None,
                    "instagram_post_id": post.instagram_post_id,
                    "created_at": post.created_at.isoformat() if post.created_at else None,
                    "ai_generated": post.ai_generated or False
                }
                posts_data.append(post_data)
            except Exception as e:
                logger.error(f"Error processing post {post.id}: {e}")
                continue
        
        response = {
            "success": True,
            "posts": posts_data,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "pages": (total + limit - 1) // limit if total > 0 else 0
            }
        }
        
        logger.info(f"Returning {len(posts_data)} posts to frontend")
        return response
        
    except Exception as e:
        logger.error(f"Error getting posts for user {current_user.id}: {e}")
        # Return empty result instead of error to prevent frontend issues
        return {
            "success": True,
            "posts": [],
            "pagination": {
                "total": 0,
                "page": page,
                "limit": limit,
                "pages": 0
            },
            "error": f"Failed to load posts: {str(e)}"
        }


@router.get(
    "/upload-signature",
    summary="Get Cloudinary upload signature for client-side uploads",
    responses={
        200: {"description": "Upload signature for client-side uploads"},
    },
)
async def get_upload_signature(
    current_user: User = Depends(get_current_user),
):
    """
    Generate Cloudinary upload signature for client-side uploads.
    This allows the frontend to upload images directly to Cloudinary.
    """
    try:
        params = {
            "folder": f"instagram_posts/{current_user.id}",
            "transformation": "w_1080,h_1080,c_fill,q_auto:good",
            "format": "jpg"
        }
        
        signature_result = await cloudinary_service.generate_upload_signature(params)
        
        if not signature_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate upload signature"
            )
        
        return {
            "success": True,
            "signature": signature_result["signature"],
            "timestamp": signature_result["timestamp"],
            "api_key": signature_result["api_key"],
            "cloud_name": signature_result["cloud_name"],
            "folder": params["folder"],
            "transformation": params["transformation"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating upload signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload signature"
        )


@router.post(
    "/process-scheduled",
    summary="Manually process scheduled posts",
    responses={
        200: {"description": "Scheduled posts processed"},
    },
)
async def process_scheduled_posts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger processing of scheduled posts for the current user.
    This checks for any scheduled posts that are ready to post and posts them.
    
    IMPORTANT: All times are stored and compared in UTC.
    - Frontend converts IST to UTC before sending
    - Backend stores as UTC in database
    - Scheduler compares using UTC times
    - Frontend converts UTC back to IST for display
    """
    try:
        from datetime import datetime
        from sqlalchemy import and_
        
        logger.info(f"🔄 Manually processing scheduled posts for user {current_user.id}")
        
        # Get ALL scheduled posts for debugging
        stmt_all = select(ScheduledPost).where(
            ScheduledPost.user_id == current_user.id
        )
        result_all = await db.execute(stmt_all)
        all_posts = result_all.scalars().all()
        
        logger.info(f"📊 Total posts for user: {len(all_posts)}")
        
        # Current time in UTC
        utc_now = datetime.utcnow()
        logger.info(f"🕐 Current UTC time: {utc_now}")
        
        # Log all posts with their scheduled times
        for p in all_posts:
            if p.scheduled_time:
                logger.info(f"   Post {p.id}: status={p.status}, scheduled_time={p.scheduled_time} (UTC)")
            else:
                logger.info(f"   Post {p.id}: status={p.status}, scheduled_time=None")
        
        # Get posts that are scheduled and ready to post
        # Compare using UTC times (both are UTC naive datetimes)
        stmt = select(ScheduledPost).where(
            and_(
                ScheduledPost.user_id == current_user.id,
                ScheduledPost.status == "scheduled",
                ScheduledPost.scheduled_time <= utc_now,  # UTC <= UTC ✓
            )
        )
        result = await db.execute(stmt)
        posts = result.scalars().all()
        
        logger.info(f"✅ Found {len(posts)} posts ready to post")
        
        posted_count = 0
        failed_count = 0
        
        for post in posts:
            try:
                logger.info(f"📤 Processing post {post.id}")
                logger.info(f"   Scheduled: {post.scheduled_time} (UTC)")
                logger.info(f"   Current UTC: {utc_now}")
                logger.info(f"   Ready to post: {post.scheduled_time <= utc_now}")
                
                # Get social account
                account = post.social_account
                if not account:
                    logger.error(f"❌ Social account for post {post.id} not found")
                    failed_count += 1
                    continue
                
                logger.info(f"✅ Found account: {account.ig_username}")
                
                # Detect if media is video or image based on URL
                is_video = False
                media_type = "IMAGE"
                if post.image_url:
                    # Check file extension or content type
                    url_lower = post.image_url.lower()
                    if any(ext in url_lower for ext in ['.mp4', '.mov', '.avi', '/video/', 'resource_type/video']):
                        is_video = True
                        media_type = "REELS"  # Instagram now requires REELS for videos
                        logger.info(f"🎥 Detected video post - will post as REELS")
                    else:
                        logger.info(f"🖼️ Detected image post")
                
                # Post to Instagram
                logger.info(f"📸 Posting {'video' if is_video else 'image'} to Instagram...")
                post_result = instagram_service.post_to_instagram_sync(
                    ig_user_id=account.ig_user_id,
                    image_url=post.image_url,
                    caption=post.caption or "",
                    access_token=account.access_token,
                    media_type=media_type
                )
                
                logger.info(f"📥 Post result: {post_result}")
                
                if post_result.get("success"):
                    # Update post status
                    await instagram_crud.update_post_status(
                        db=db,
                        post_id=post.id,
                        status="posted",
                        instagram_post_id=post_result["post_id"]
                    )
                    posted_count += 1
                    logger.info(f"✅ Successfully posted scheduled post {post.id}")
                else:
                    failed_count += 1
                    logger.error(f"❌ Failed to post scheduled post {post.id}: {post_result.get('error')}")
                    
            except Exception as e:
                logger.error(f"❌ Error posting scheduled post {post.id}: {e}", exc_info=True)
                failed_count += 1
        
        logger.info(f"🎉 Processing complete: {posted_count} posted, {failed_count} failed")
        
        return {
            "success": True,
            "message": f"Processed {len(posts)} scheduled posts",
            "posted_count": posted_count,
            "failed_count": failed_count,
            "current_time_utc": utc_now.isoformat(),
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing scheduled posts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process scheduled posts"
        )
