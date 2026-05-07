from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.assistant_service import generate_response
from services.demo_assistant_service import get_demo_response
from config.database import get_sync_db
from utils.dependencies import get_current_user
from models.user import User

router = APIRouter(tags=["assistant"])


class AssistantRequest(BaseModel):
    query: str


class AssistantResponse(BaseModel):
    response: str


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
    db: Session = Depends(get_sync_db),
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

    response_text = await generate_response(query, db, current_user)
    return AssistantResponse(response=response_text)
