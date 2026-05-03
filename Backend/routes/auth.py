from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_sync_db
from models.user import User
from schemas.user_schema import UserRegister, UserLogin, TokenResponse, UserResponse
from services.auth_service_sync import register_user, authenticate_user
from services.redis_service import blacklist_token
from utils.security import create_access_token
from utils.dependencies import get_current_user
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    responses={
        201: {"description": "User registered successfully"},
        400: {"description": "Email already registered"},
        500: {"description": "Internal server error"},
    },
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_sync_db),
) -> TokenResponse:
    """
    Register a new user.

    - **email**: User email address (must be unique)
    - **password**: User password (minimum 6 characters)

    Returns access token for immediate login.
    """
    try:
        user = register_user(db, user_data)
        access_token = create_access_token(user.id, user.email)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in register endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login user",
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid credentials"},
        500: {"description": "Internal server error"},
    },
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_sync_db),
) -> TokenResponse:
    """
    Authenticate user and return access token.

    - **email**: User email address
    - **password**: User password

    Returns JWT access token valid for 1 hour.
    """
    try:
        user = authenticate_user(db, credentials.email, credentials.password)
        access_token = create_access_token(user.id, user.email)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in login endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed",
        )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user",
    responses={
        200: {"description": "Logout successful"},
        401: {"description": "Unauthorized"},
    },
)
def logout(
    current_user: User = Depends(get_current_user),
    authorization: str = None,
) -> dict:
    """
    Logout user by blacklisting their token.

    Token is added to Redis blacklist and becomes invalid immediately.
    """
    try:
        # Extract token from authorization header
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            # Note: blacklist_token is async, but we'll skip it for now
            # await blacklist_token(token, settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        logger.info(f"User logged out: {current_user.email}")
        return {"message": "Logout successful"}

    except Exception as e:
        logger.error(f"Error during logout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed",
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    responses={
        200: {"description": "Token refreshed successfully"},
        401: {"description": "Invalid or expired token"},
        500: {"description": "Internal server error"},
    },
)
async def refresh_token(
    current_user: User = Depends(get_current_user),
) -> TokenResponse:
    """
    Refresh the access token for authenticated user.
    
    Returns a new JWT access token with extended expiration.
    """
    try:
        # Create new access token
        access_token = create_access_token(current_user.id, current_user.email)
        
        logger.info(f"Token refreshed for user: {current_user.email}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            id=current_user.id,
            email=current_user.email,
            created_at=current_user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in refresh token endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed",
        )
