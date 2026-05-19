"""
Instagram Token Management Routes
Endpoints for managing Instagram token refresh and status
"""

from fastapi import APIRouter, Depends, HTTPException
from utils.dependencies import get_current_user
from models.user import User
from services.instagram_token_refresh_service import instagram_token_refresh_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/instagram/tokens", tags=["Instagram Token Management"])


@router.get("/status")
async def get_token_status(current_user: User = Depends(get_current_user)):
    """
    Get Instagram token status for current user
    
    Returns token expiry information and health status
    """
    try:
        # Get user's Instagram account
        from config.database import get_db_sync
        from models.instagram import SocialAccount
        
        db = next(get_db_sync())
        account = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == "instagram",
            SocialAccount.is_active == True
        ).first()
        
        if not account:
            return {
                "connected": False,
                "message": "No Instagram account connected"
            }
        
        status = await instagram_token_refresh_service.get_token_status(account.id)
        
        return {
            "connected": True,
            "account_id": account.id,
            "username": account.ig_username,
            **status
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting token status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """
    Manually refresh Instagram token for current user
    
    Use this if automatic refresh fails or you want to refresh immediately
    """
    try:
        # Get user's Instagram account
        from config.database import get_db_sync
        from models.instagram import SocialAccount
        from datetime import datetime, timedelta
        
        db = next(get_db_sync())
        account = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == "instagram",
            SocialAccount.is_active == True
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="No Instagram account connected")
        
        logger.info(f"🔄 Manual token refresh requested for user {current_user.id}, account {account.id}")
        
        # Refresh token
        refresh_result = await instagram_token_refresh_service.refresh_long_lived_token(account.access_token)
        
        if refresh_result:
            # Update token in database
            account.access_token = refresh_result["access_token"]
            
            # Calculate new expiry
            expires_in_seconds = refresh_result.get("expires_in", 5184000)  # Default 60 days
            account.access_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
            
            db.commit()
            
            logger.info(f"✅ Token refreshed successfully for account {account.id}")
            
            return {
                "success": True,
                "message": "Token refreshed successfully",
                "expires_at": account.access_token_expires_at.isoformat(),
                "expires_in_days": (account.access_token_expires_at - datetime.utcnow()).days
            }
        else:
            logger.error(f"❌ Token refresh failed for account {account.id}")
            raise HTTPException(
                status_code=400,
                detail="Failed to refresh token. You may need to reconnect your Instagram account."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error refreshing token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/refresh-all")
async def refresh_all_tokens(current_user: User = Depends(get_current_user)):
    """
    Admin endpoint: Refresh all expiring tokens
    
    Requires admin privileges
    """
    # TODO: Add admin check
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        logger.info(f"🔄 Admin token refresh triggered by user {current_user.id}")
        stats = await instagram_token_refresh_service.check_and_refresh_expiring_tokens()
        
        return {
            "success": True,
            "message": "Token refresh complete",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"❌ Error in admin token refresh: {e}")
        raise HTTPException(status_code=500, detail=str(e))
