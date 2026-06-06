"""
Feature Gate Utility
Validates feature access permissions against Admin Service and logs usage events
"""

import os
import logging
import httpx
from fastapi import HTTPException, status
from models.user import User

logger = logging.getLogger(__name__)

# Admin Service configuration
ADMIN_API_URL = os.getenv("SAADHYAM_ADMIN_API_URL") or os.getenv("ADMIN_API_URL") or "http://127.0.0.1:8082"

async def check_feature_access(user: User, feature_key: str) -> None:
    """
    Evaluates whether the user is allowed to access/use a feature.
    If access is denied, raises an HTTP 503 so that the frontend dispatches
    the custom "feature-blocked" event to show the billing/quota warning.
    Also records a feature usage event if access is allowed.
    """
    # Safety checks
    if user is None or not getattr(user, "id", None):
        logger.warning(f"Feature check requested for empty user or missing user ID: {feature_key}")
        return

    plan_key = (getattr(user, "selected_plan_key", None) or "starter").strip() or "starter"
    
    # 1. Evaluate feature access on Admin Service
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(
                f"{ADMIN_API_URL}/api/features/{feature_key}/evaluate",
                params={"user_id": user.id, "plan_key": plan_key},
            )
            response.raise_for_status()
            access = response.json()
    except Exception as exc:
        logger.warning(f"Admin Service feature evaluation failed for {feature_key}: {exc}")
        # Default allow on failure so we don't block users if Admin Service is down/unreachable
        return

    if not access.get("allowed", True):
        # Deny access: raise 503 Service Unavailable so VITE client's api.ts intercepts it
        logger.info(f"🚫 Feature access DENIED for user {user.email} (ID: {user.id}) on feature: {feature_key}")
        raise HTTPException(
            status_code=503,
            detail=access.get("message") or f"You have reached the free usage limit for {feature_key}.",
        )

    # 2. Record feature usage event asynchronously on Admin Service
    payload = {
        "feature_key": feature_key,
        "user_id": user.id,
        "path": f"/api/{feature_key}/usage",
        "metadata": {
            "user_email": user.email,
            "plan_key": plan_key
        },
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            await client.post(f"{ADMIN_API_URL}/api/admin/analytics/feature-usage/event", json=payload)
            logger.info(f"📈 Recorded usage event of '{feature_key}' for user {user.email}")
    except Exception as exc:
        logger.warning(f"Failed to record {feature_key} usage event: {exc}")
