"""Shared AI response parsing utilities.
Provides robust JSON extraction and async retrying/parsing helpers.
"""
import json
import re
import asyncio
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

try:
    from services.ai_diagnostics import log_ai_response
except Exception:
    # diagnostics optional; failures to import shouldn't break parsing
    def log_ai_response(*args, **kwargs):
        return


def extract_balanced_json(text: str) -> Optional[str]:
    """Attempt to find the largest balanced JSON object in text using brace matching."""
    if not text or "{" not in text:
        return None

    start = text.find("{")
    stack = []
    end_index = -1
    for i in range(start, len(text)):
        ch = text[i]
        if ch == "{":
            stack.append(i)
        elif ch == "}":
            if stack:
                stack.pop()
                if not stack:
                    end_index = i
                    # continue scanning to find potentially larger balanced block
    if start != -1 and end_index != -1 and end_index > start:
        return text[start:end_index + 1]
    return None


async def parse_json_with_retries(text: str, max_attempts: int = 3, metadata: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Try multiple JSON extraction/parsing strategies with retries and backoff.

    Returns parsed dict on success, or None on failure.
    """
    if not text:
        return None

    for attempt in range(1, max_attempts + 1):
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"[JSON Parse] direct parse failed (attempt {attempt}): {e}")

        try:
            candidate = extract_balanced_json(text)
            if candidate:
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError as e:
                    logger.warning(f"[JSON Parse] balanced-extract failed: {e}")
        except Exception as e:
            logger.warning(f"[JSON Parse] balanced-extract exception: {e}")

        try:
            fixed = re.sub(r",\s*([}\]])", r"\1", text)
            try:
                return json.loads(fixed)
            except json.JSONDecodeError:
                pass
        except Exception:
            pass

        try:
            first_brace = text.find("{")
            last_brace = text.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                snippet = text[first_brace:last_brace + 1]
                try:
                    return json.loads(snippet)
                except json.JSONDecodeError:
                    pass
        except Exception:
            pass

        preview = text[:2000] if len(text) > 2000 else text
        logger.debug(f"[JSON Parse] attempt {attempt} failed. Response len={len(text)} preview={preview!r}")

        # Log diagnostic entry for this attempt
        try:
            log_ai_response(
                service=(metadata or {}).get("service"),
                model=(metadata or {}).get("model"),
                parse_attempt=attempt,
                parse_success=False,
                response_length=len(text),
                preview=preview,
                extra=(metadata or {})
            )
        except Exception:
            pass

        await asyncio.sleep(0.4 * (2 ** (attempt - 1)))

    logger.error("[JSON Parse] All parsing attempts failed.")
    try:
        log_ai_response(
            service=(metadata or {}).get("service"),
            model=(metadata or {}).get("model"),
            parse_attempt=max_attempts,
            parse_success=False,
            response_length=len(text),
            preview=(text[:2000] if len(text) > 2000 else text),
            extra=(metadata or {})
        )
    except Exception:
        pass
    return None
