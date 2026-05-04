import logging

import httpx

from config.settings import settings
from services.search_service import duck_search

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TIMEOUT_SECONDS = 20.0
GROQ_MODEL = "llama-3.1-8b-instant"
FALLBACK_MESSAGE = "I could not find enough live data right now. Please try again with more details."


async def generate_response(query: str) -> str:
    search_data = await duck_search(query)
    if not search_data:
        return FALLBACK_MESSAGE

    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        logger.warning("Groq API key is not configured")
        return FALLBACK_MESSAGE

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a smart business AI assistant. Use given data but enhance it with reasoning.",
            },
            {
                "role": "user",
                "content": f"Query: {query}\n\nLive data:\n{search_data}",
            },
        ],
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
