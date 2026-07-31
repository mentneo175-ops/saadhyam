# pyrefly: ignore [missing-import]
from fastapi import Depends, HTTPException, status, Header
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
from config.database import get_db
from utils.security import decode_token
from services.auth_service import get_user_by_id
from services.token_blacklist_service import token_blacklist_service
from models.user import User
from schemas.user_schema import TokenData
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    import time
    t0 = time.monotonic()
    
    if not authorization:
        logger.warning("❌ Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract token from "Bearer <token>"
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError("Invalid authorization header")
        token = parts[1]
    except (ValueError, IndexError) as e:
        logger.warning(f"❌ Invalid authorization header format: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    t1 = time.monotonic()
    try:
        # Decode and validate token
        payload = decode_token(token)
        
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")

        if user_id is None or email is None:
            logger.warning("❌ Invalid token payload - missing user_id or email")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = TokenData(user_id=user_id, email=email)

    except JWTError as e:
        logger.warning(f"❌ JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    t2 = time.monotonic()
    # Check if token is blacklisted (revoked)
    if token_blacklist_service.is_token_blacklisted(token):
        logger.warning(f"❌ Blacklisted token attempted to be used")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    t3 = time.monotonic()
    # Check if user is blacklisted (all sessions revoked)
    if token_blacklist_service.is_user_blacklisted(user_id):
        logger.warning(f"❌ Blacklisted user {user_id} attempted to use token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="All sessions have been revoked. Please login again",
            headers={"WWW-Authenticate": "Bearer"},
        )

    t4 = time.monotonic()
    # Get user from database (async call, await needed)
    user = await get_user_by_id(db, token_data.user_id)

    t5 = time.monotonic()
    if user is None:
        logger.warning(f"❌ User not found for ID: {token_data.user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # **SINGLE SESSION ENFORCEMENT**: Check if this token matches the active session
    # CRITICAL: If active_session_token is NULL (e.g., after DB refresh), reject the request
    if not user.active_session_token:
        logger.warning(f"⚠️  No active session for user {user.email}. Session was cleared (DB refresh or logout).")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has been cleared. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reject suspended or inactive users immediately so existing tokens cannot be used
    if not getattr(user, 'is_active', True) or getattr(user, 'is_suspended', False):
        logger.warning(f"❌ Suspended or inactive user attempted request: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You have been suspended by the admin. Please contact admin.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.active_session_token != token:
        logger.warning(f"⚠️  Session mismatch for user {user.email}. User logged in from another device/browser.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account is logged in from another device or browser. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    t6 = time.monotonic()
    print(f"[LATENCY DEPENDENCY] decode={t2-t1:.4f}s blacklists={t4-t2:.4f}s get_user={t5-t4:.4f}s checks={t6-t5:.4f}s total={t6-t0:.4f}s")
    # Only log successful auth at DEBUG level (won't show in production)
    logger.debug(f"✅ User authenticated: {user.email}")
    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Optional dependency to get current user if token provided.

    Args:
        authorization: Authorization header (optional)
        db: Database session

    Returns:
        Current user object or None if no token provided
    """
    if authorization is None:
        return None

    return await get_current_user(authorization, db)
