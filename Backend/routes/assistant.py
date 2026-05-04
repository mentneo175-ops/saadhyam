from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from services.assistant_service import generate_response

router = APIRouter(tags=["assistant"])


class AssistantRequest(BaseModel):
    query: str


class AssistantResponse(BaseModel):
    response: str


@router.post("/assistant", response_model=AssistantResponse)
async def assistant_query(request: AssistantRequest):
    query = (request.query or "").strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty",
        )

    response_text = await generate_response(query)
    return AssistantResponse(response=response_text)
