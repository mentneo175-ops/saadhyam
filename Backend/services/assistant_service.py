import logging

import httpx
from sqlalchemy.orm import Session

from config.settings import settings
from services.search_service import duck_search
from models.user import User

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TIMEOUT_SECONDS = 20.0
GROQ_MODEL = "llama-3.1-70b-versatile"  # Using more powerful model for voice assistant
FALLBACK_MESSAGE = "I could not find enough information right now. Please try again with more details."


def get_business_context(db: Session, user: User) -> str:
    """Extract business context from database for the user"""
    # Note: Business profile models not available yet
    # This is a placeholder for future implementation
    return "No business profile configured yet. Please complete your business setup."


async def generate_response(query: str, db: Session, user: User) -> str:
    """
    Generate AI response with business context and live search data.
    Optimized for voice interaction - concise and conversational.
    """
    # Get business context from database
    business_context = get_business_context(db, user)
    
    # Get live search data
    search_data = await duck_search(query)
    
    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        logger.warning("Groq API key is not configured")
        return FALLBACK_MESSAGE

    # Build context-aware prompt
    system_prompt = """You are a smart business AI assistant with voice interaction capabilities.

IMPORTANT RULES:
1. Keep responses CONCISE and CONVERSATIONAL (2-3 sentences max for voice)
2. Use the user's business context to personalize responses
3. Provide actionable insights and recommendations
4. Be friendly and professional
5. If asked about business details, use the provided business context
6. For market/general queries, use the live search data
7. Always relate answers back to the user's business when relevant

Response style: Direct, helpful, and easy to understand when spoken aloud."""

    user_prompt = f"""User Query: {query}

USER'S BUSINESS CONTEXT:
{business_context}

LIVE MARKET DATA:
{search_data if search_data else "No live data available"}

Provide a helpful, concise response that addresses the query using the business context and live data."""

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        "temperature": 0.7,
        "max_tokens": 500,  # Limit for concise voice responses
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        timeout = httpx.Timeout(GROQ_TIMEOUT_SECONDS)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(GROQ_API_URL, json=payload, headers=headers)
            response.raise_for_status()

        data = response.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        return content or FALLBACK_MESSAGE
    except httpx.TimeoutException:
        logger.warning("Groq request timed out")
    except httpx.HTTPError as exc:
        logger.warning("Groq request failed: %s", exc)
    except Exception as exc:
        logger.warning("Unexpected Groq error: %s", exc)

    return FALLBACK_MESSAGE
