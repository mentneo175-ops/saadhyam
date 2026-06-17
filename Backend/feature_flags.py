import asyncio
import logging
import os
import time
from typing import Dict, Optional

import httpx
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("feature_flags")

# Admin features URL (public endpoint)
ADMIN_FEATURES_URL = os.getenv("ADMIN_FEATURES_URL", "http://127.0.0.1:8082/api/features/public")
POLL_INTERVAL = int(os.getenv("ADMIN_FEATURES_POLL_INTERVAL", "15"))  # seconds

# In-memory cache of feature flags: key -> feature dict (status, reason, ...)
FEATURE_CACHE: Dict[str, Dict] = {}
LAST_FETCH_TS: float = 0.0
FETCH_LOCK = asyncio.Lock()


def resolve_feature_key_from_path(path: str) -> Optional[str]:
    p = path.lower()
    # Simple heuristics similar to frontend mapping
    aliases = {
        "assistant": ["assistant", "assistant/"],
        "business_analysis": ["business-analysis", "business_analysis"],
        "competitor_analysis": ["competitor-analysis", "competitor_analysis", "competitors"],
        "daily_suggestions": ["daily-suggestions", "daily-ask", "suggestions"],
        "website_ai": ["website", "website_ai", "website-ai", "/website-ai"],
        "content_scheduler": ["content", "content_creator", "content-scheduler", "/content"],
        "voice_agent": ["voice_agent", "voice-agent", "/voice-agent"],
        "aeo_geo": ["aeo_geo", "aeo-geo", "seo-google-maps", "seo"],
        "instagram_manager": ["instagram", "ig/", "instagram-manager"],
        "whatsapp_campaigns": ["whatsapp", "wa/"],
        "b2b_network": ["b2b-network", "b2b_network", "b2b-chat", "b2b"],
        "meta_ads": ["meta-ads", "meta_ads", "meta"],
        "reports_insights": ["reports", "insights", "growth"],
        "radar_ai": ["radar"],
        "ai_agents": ["agents"],
        "youtube_manager": ["youtube"],
        "review_reply": ["review-reply", "review_reply"],
        "plugins_store": ["plugins"],
        "billing_plans": ["billing", "plans", "/billing"],
        "ai_tools": ["/ai/", "/ai-"]
    }

    for fk, candidates in aliases.items():
        for c in candidates:
            if c in p:
                return fk

    return None


async def fetch_features_once(timeout: int = 5) -> None:
    global LAST_FETCH_TS
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(ADMIN_FEATURES_URL)
            resp.raise_for_status()
            data = resp.json()
            # Expecting list of feature objects with `key` and `status`
            if isinstance(data, list):
                for f in data:
                    k = f.get("key")
                    if not k:
                        continue
                    FEATURE_CACHE[str(k)] = f
            else:
                logger.warning("Unexpected features payload from admin: not a list")
    except Exception as e:
        logger.warning(f"Failed fetching admin features: {e}")
    finally:
        LAST_FETCH_TS = time.monotonic()


async def _poller_task(stop_event: asyncio.Event) -> None:
    # initial fetch
    await fetch_features_once()
    while not stop_event.is_set():
        try:
            await asyncio.sleep(POLL_INTERVAL)
            await fetch_features_once()
        except asyncio.CancelledError:
            break
        except Exception:
            # swallow so task continues
            logger.exception("Error in feature poller loop")


class FeatureGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = str(request.url.path or "")

        # Lazy refresh fallback: keeps flags working even if startup hooks are skipped.
        now = time.monotonic()
        if (not FEATURE_CACHE) or ((now - LAST_FETCH_TS) >= POLL_INTERVAL):
            async with FETCH_LOCK:
                now2 = time.monotonic()
                if (not FEATURE_CACHE) or ((now2 - LAST_FETCH_TS) >= POLL_INTERVAL):
                    await fetch_features_once(timeout=3)

        # allowlist health, docs and static routes
        allow_prefixes = ("/health", "/test", "/api/status", "/openapi.json", "/docs", "/static", "/socket.io", "/favicon")
        if any(path.startswith(p) for p in allow_prefixes):
            return await call_next(request)

        fk = resolve_feature_key_from_path(path)
        if fk:
            feature = FEATURE_CACHE.get(fk)
            # default to enabled if unknown to avoid breaking paths
            status = (feature.get("status") if feature else "enabled")
            if status and status != "enabled":
                # construct a JSON payload so frontend can dispatch feature-blocked
                payload = {
                    "detail": f"Feature {fk} is {status}",
                    "feature_key": fk,
                    "mode": status,
                    "reason": feature.get("reason") if feature else None,
                }
                return JSONResponse(status_code=503, content=payload)

        return await call_next(request)


def setup(app):
    # Add middleware
    app.add_middleware(FeatureGuardMiddleware)


async def start_poller(app) -> None:
    stop_event = asyncio.Event()
    app.state._feature_poller_stop = stop_event
    app.state._feature_poller = asyncio.create_task(_poller_task(stop_event))


async def stop_poller(app) -> None:
    try:
        stop_event = getattr(app.state, "_feature_poller_stop", None)
        if stop_event:
            stop_event.set()
        task = getattr(app.state, "_feature_poller", None)
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
    except Exception:
        logger.exception("Error stopping feature poller")

