from fastapi import APIRouter, Depends
from models.user import User
from schemas.user_schema import UserResponse
from utils.dependencies import get_current_user
import logging

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
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Get information about the current authenticated user.

    Requires valid JWT token in Authorization header.
    """
    logger.info(f"User info requested for: {current_user.email}")

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at,
    )
