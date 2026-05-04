import logging
from typing import List

import httpx

logger = logging.getLogger(__name__)

DUCKDUCKGO_API_URL = "https://api.duckduckgo.com/"
DUCKDUCKGO_TIMEOUT_SECONDS = 5.0


def _extract_related_topics(raw_topics: List[dict]) -> List[str]:
    related: List[str] = []

    for topic in raw_topics or []:
        if isinstance(topic, dict):
            text = topic.get("Text")
            if text:
                related.append(text)
                continue

            nested = topic.get("Topics")
            if isinstance(nested, list):
                for nested_topic in nested:
                    if isinstance(nested_topic, dict):
                        nested_text = nested_topic.get("Text")
                        if nested_text:
                            related.append(nested_text)

    return related


async def duck_search(query: str) -> str:
    query = (query or "").strip()
    if not query:
        return ""

    params = {
        "q": query,
        "format": "json",
        "no_redirect": 1,
        "no_html": 1,
    }

    try:
        timeout = httpx.Timeout(DUCKDUCKGO_TIMEOUT_SECONDS)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(DUCKDUCKGO_API_URL, params=params)
            response.raise_for_status()

        data = response.json()
        abstract = (data.get("Abstract") or "").strip()
        related_topics = _extract_related_topics(data.get("RelatedTopics", []))[:5]

        parts: List[str] = []
        if abstract:
            parts.append(f"Abstract: {abstract}")
        if related_topics:
            topics_formatted = "\n".join(f"- {topic}" for topic in related_topics)
            parts.append(f"Related topics:\n{topics_formatted}")

        return "\n\n".join(parts).strip()
    except httpx.TimeoutException:
        logger.warning("DuckDuckGo search timed out")
    except httpx.HTTPError as exc:
        logger.warning("DuckDuckGo search failed: %s", exc)
    except Exception as exc:
        logger.warning("Unexpected DuckDuckGo search error: %s", exc)

    return ""
