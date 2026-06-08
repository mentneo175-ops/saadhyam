import logging
import os

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import httpx

from services.assistant_service import generate_response
from services.demo_assistant_service import get_demo_response
from config.database import get_db_sync
from utils.dependencies import get_current_user
from models.user import User

router = APIRouter(tags=["assistant"])
ADMIN_API_URL = os.getenv("SAADHYAM_ADMIN_API_URL") or os.getenv("ADMIN_API_URL") or "http://127.0.0.1:8082"
ASSISTANT_FEATURE_KEY = "assistant"


class AssistantRequest(BaseModel):
    query: str


class AssistantResponse(BaseModel):
    response: str


async def _evaluate_assistant_access(user: User) -> dict:
    plan_key = (getattr(user, "selected_plan_key", None) or "starter").strip() or "starter"
    params = {
        "user_id": user.id,
        "plan_key": plan_key,
    }
    async with httpx.AsyncClient(timeout=6.0) as client:
        response = await client.get(f"{ADMIN_API_URL}/api/features/{ASSISTANT_FEATURE_KEY}/evaluate", params=params)
        response.raise_for_status()
        return response.json()


async def _record_assistant_usage(user: User, query: str) -> None:
    payload = {
        "feature_key": ASSISTANT_FEATURE_KEY,
        "user_id": user.id,
        "path": "/assistant",
        "metadata": {
            "query": query[:200],
        },
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            await client.post(f"{ADMIN_API_URL}/api/admin/analytics/feature-usage/event", json=payload)
    except Exception as exc:
        logging.warning("Failed to record assistant usage event: %s", exc)


@router.post("/assistant/demo", response_model=AssistantResponse)
async def assistant_demo(request: AssistantRequest):
    """
    Demo Voice Assistant - No authentication required.
    Uses pre-defined company data (Amazon, Flipkart, Google, Microsoft).
    Perfect for testing voice features!
    """
    query = (request.query or "").strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty",
        )

    response_text = get_demo_response(query)
    return AssistantResponse(response=response_text)


@router.post("/assistant", response_model=AssistantResponse)
async def assistant_query(
    request: AssistantRequest,
    db: Session = Depends(get_db_sync),
    current_user: User = Depends(get_current_user),
):
    """
    Voice-enabled AI assistant with business context.
    Accesses user's business profile and data to provide personalized responses.
    Requires authentication.
    """
    query = (request.query or "").strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty",
        )

    try:
        access = await _evaluate_assistant_access(current_user)
    except HTTPException:
        raise
    except Exception as exc:
        logging.warning("Assistant quota check failed, falling back to backend response: %s", exc)
        access = {"allowed": True}

    if not access.get("allowed", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=access.get("message") or "You have reached the free usage limit for the AI Assistant.",
        )

    response_text = await generate_response(query, db, current_user)

    try:
        await _record_assistant_usage(current_user, query)
    except Exception as exc:
        logging.warning("Assistant usage tracking failed after response generation: %s", exc)

    return AssistantResponse(response=response_text)
