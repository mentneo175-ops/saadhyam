from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config.database import get_db
from models.user import User
from schemas.user_schema import UserRegister, UserLogin, TokenResponse, UserResponse
from services.auth_service_sync import register_user, authenticate_user
from services.firebase_service import firebase_service
from services.redis_service import blacklist_token
from services.token_blacklist_service import token_blacklist_service
from utils.security import create_access_token
from utils.dependencies import get_current_user
from utils.validators import validate_password_strength, validate_email
from config.settings import settings
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

# Create limiter instance for this router
limiter = Limiter(key_func=get_remote_address)


@router.get("/health")
async def auth_health():
    """Simple health check for auth router"""
    return {"status": "ok", "router": "auth"}


class GoogleAuthRequest(BaseModel):
    """Request model for Google authentication"""
    id_token: str


@router.post(
    "/google",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate with Google",
    responses={
        200: {"description": "Authentication successful"},
        400: {"description": "Invalid token or missing data"},
        401: {"description": "Authentication failed"},
        500: {"description": "Internal server error"},
        503: {"description": "Google authentication not configured"},
    },
)
async def google_auth(
    auth_request: GoogleAuthRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate user with Google Firebase token - PRODUCTION ONLY.
    
    - **id_token**: REAL Firebase ID token from Google authentication
    
    Creates user automatically if not exists.
    Returns JWT access token for backend authentication.
    NO MOCK/DEMO TOKENS ACCEPTED.
    
    **Single Session Enforcement**: Only one active session allowed per user.
    If user is already logged in elsewhere, that session will be invalidated.
    """
    try:
        # Check if Firebase is available FIRST
        if not firebase_service.is_firebase_available():
            logger.error("❌ CRITICAL: Firebase authentication not available")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google authentication is not configured. Please contact support."
            )
        
        # Verify REAL Firebase token ONLY - NO MOCK TOKENS
        logger.info(f"🔍 Processing Google OAuth with REAL Firebase token")
        user_info = await firebase_service.verify_id_token(auth_request.id_token)
        
        # Check if user exists by Firebase UID
        stmt = select(User).where(User.firebase_uid == user_info['firebase_uid'])
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        logger.info(f"🔍 Looking for existing Firebase user with UID: {user_info['firebase_uid']}")
        logger.info(f"🔍 Firebase user found: {user is not None}")
        
        if not user:
            # Check if user exists by email (for migration from email auth)
            stmt = select(User).where(User.email == user_info['email'])
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            logger.info(f"🔍 Looking for existing email user: {user_info['email']}")
            logger.info(f"🔍 Email user found: {user is not None}")
            
            if user:
                logger.info(f"📋 FOUND EXISTING USER - Email: {user.email}")
                logger.info(f"📋 Current setup status: {user.business_setup_completed}")
                logger.info(f"📋 Current provider: {user.auth_provider}")
                
                # Update existing user with Firebase info (MERGE ACCOUNTS)
                logger.info(f"🔗 Merging existing email account with Google OAuth: {user.email}")
                
                # Update with Firebase info but PRESERVE business setup
                user.firebase_uid = user_info['firebase_uid']
                user.auth_provider = 'both'  # User can now login with both methods
                user.profile_picture = user_info.get('picture')
                if user_info.get('name') and not user.name:
                    user.name = user_info['name']
                
                # DO NOT CHANGE business_setup_completed - keep existing value
                logger.info(f"✅ Account merged. Business setup PRESERVED: {user.business_setup_completed}")
            else:
                # Create new user with REAL Firebase data
                logger.info(f"👤 Creating new Firebase user: {user_info['email']}")
                user = User(
                    email=user_info['email'],
                    firebase_uid=user_info['firebase_uid'],
                    auth_provider='google',
                    name=user_info.get('name'),
                    profile_picture=user_info.get('picture'),
                    hashed_password=None  # No password for Firebase users
                )
                db.add(user)
                logger.info(f"✅ New Firebase user created: {user.email}")
        else:
            # Update existing Firebase user info
            logger.info(f"🔄 Updating existing Firebase user: {user.email}")
            if user_info.get('picture'):
                user.profile_picture = user_info['picture']
            if user_info.get('name') and not user.name:
                user.name = user_info['name']
            logger.info(f"✅ Firebase user updated: {user.email}")
        
        # Check if user already has an active session
        if user.active_session_token:
            logger.warning(f"⚠️  User {user.email} already has an active session. Invalidating old session.")
            # Old session will be invalidated when new token is created
        
        # Create backend JWT token
        access_token = create_access_token(user.id, user.email)
        
        # Get client info
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Update user's active session info
        user.active_session_token = access_token
        user.session_created_at = datetime.utcnow()
        user.session_ip_address = client_ip
        user.session_user_agent = user_agent
        
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"✅ Session registered: IP={client_ip}, Device={user_agent[:50]}...")
        logger.info(f"🎉 REAL Google authentication successful for user: {user.email}")
        logger.info(f"👤 User ID: {user.id}")
        logger.info(f"🔑 Firebase UID: {user.firebase_uid}")
        
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
        logger.error(f"Unexpected error in Google auth endpoint: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed",
        )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user with email/password",
    responses={
        201: {"description": "User registered successfully"},
        400: {"description": "Email already registered or validation failed"},
        422: {"description": "Validation error"},
        429: {"description": "Too many requests - rate limit exceeded"},
        500: {"description": "Internal server error"},
    },
)
@limiter.limit("3/minute")
async def register(
    request: Request,
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Register a new user with email and password.
    
    - **email**: Valid email address
    - **password**: Strong password (min 8 chars, uppercase, lowercase, number, special char)
    - **name**: Optional full name
    
    Rate limited to 3 registrations per minute per IP address.
    Returns JWT access token for backend authentication.
    """
    try:
        # Validate email format (raises HTTPException if invalid)
        validate_email(user_data.email)
        
        # Validate password strength (raises HTTPException if invalid)
        validate_password_strength(user_data.password)
        
        # Register user using auth service
        user = register_user(db, user_data)
        
        # Create access token
        access_token = create_access_token(user.id, user.email)
        
        logger.info(f"User registered successfully: {user.email}")
        
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
    summary="Login user with email/password",
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid credentials"},
        429: {"description": "Too many requests - rate limit exceeded"},
        500: {"description": "Internal server error"},
    },
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate user with email and password.
    
    - **email**: User email address
    - **password**: User password
    
    Rate limited to 5 attempts per minute per IP address.
    Returns JWT access token for backend authentication.
    
    **Single Session Enforcement**: Only one active session allowed per user.
    If user is already logged in elsewhere, that session will be invalidated.
    """
    try:
        logger.info(f"🔐 Login attempt for: {credentials.email}")
        
        # Authenticate user using auth service
        user = authenticate_user(db, credentials.email, credentials.password)
        logger.info(f"✅ User authenticated: {user.email}, ID: {user.id}")
        
        # Check if user already has an active session
        if user.active_session_token:
            logger.warning(f"⚠️  User {user.email} already has an active session. Invalidating old session.")
            # Old session will be invalidated when new token is created
        
        # Create access token
        access_token = create_access_token(user.id, user.email)
        logger.info(f"✅ Token created for user: {user.email}")
        
        # Get client info
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Update user's active session info
        user.active_session_token = access_token
        user.session_created_at = datetime.utcnow()
        user.session_ip_address = client_ip
        user.session_user_agent = user_agent
        await db.commit()
        
        logger.info(f"✅ Session registered: IP={client_ip}, Device={user_agent[:50]}...")
        
        # Create response
        response = TokenResponse(
            access_token=access_token,
            token_type="bearer",
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at,
        )
        logger.info(f"✅ Response created successfully")
        
        logger.info(f"✅ User logged in successfully: {user.email}")
        return response
        
    except HTTPException as he:
        logger.warning(f"⚠️  HTTP Exception in login: {he.status_code} - {he.detail}")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in login endpoint: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}",
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
async def logout(
    current_user: User = Depends(get_current_user),
    authorization: str = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Logout user by clearing their active session.

    Clears the user's active session token and session info.
    """
    try:
        # Clear user's active session
        current_user.active_session_token = None
        current_user.session_created_at = None
        current_user.session_ip_address = None
        current_user.session_user_agent = None
        db.commit()
        
        logger.info(f"✅ User logged out successfully: {current_user.email}")
        
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
            name=current_user.name,
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
