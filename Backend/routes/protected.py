from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from models.user import User
from schemas.user_schema import UserResponse
from utils.security import decode_token
from services.auth_service_sync import get_user_by_id
from config.database import get_db_sync
from jose import JWTError
import logging
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(tags=["protected"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user info",
    responses={
        200: {"description": "Current user information"},
        401: {"description": "Unauthorized"},
    },
)
def get_current_user_info(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db_sync),
) -> UserResponse:
    """
    Get information about the current authenticated user.

    Requires valid JWT token in Authorization header.
    """
    logger.info(f"🔍 /me endpoint called")
    
    if not authorization:
        logger.warning("❌ Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authorization header missing",
        )

    try:
        # Extract token from "Bearer <token>"
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            logger.warning("❌ Invalid authorization header format")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header",
            )
        token = parts[1]
        logger.info(f"🔑 Token extracted")

        # Decode token
        logger.info(f"🔐 Decoding token...")
        payload = decode_token(token)
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        
        logger.info(f"✅ Token decoded - User ID: {user_id}, Email: {email}")

        if user_id is None or email is None:
            logger.warning("❌ Invalid token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        # Get user from database
        logger.info(f"🔐 Getting user from database...")
        user = get_user_by_id(db, user_id)
        logger.info(f"✅ User retrieved from database")

        if user is None:
            logger.warning(f"❌ User not found for ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        logger.info(f"✅ User authenticated: {user.email}")
        
        response = UserResponse(
            id=user.id,
            email=user.email,
            created_at=user.created_at,
        )
        logger.info(f"✅ Returning user response")
        return response

    except JWTError as e:
        logger.warning(f"❌ JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in /me endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
