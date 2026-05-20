"""
Feature control helpers for the main Saadhyam backend.

This module enforces the feature toggles maintained by the admin service.
It checks the shared ``feature_flags`` table first, then falls back to the
local ``feature_control`` table for compatibility.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from config.database import SyncSessionLocal
from models.feature_control import FeatureControl  # noqa: F401 - registers metadata

logger = logging.getLogger(__name__)


EXEMPT_PATHS = (
    "/",
    "/health",
    "/api/status",
    "/test",
    "/test-auth",
    "/docs",
    "/redoc",
    "/openapi.json",
)

FEATURE_ROUTE_RULES = (
    ("/api/dashboard", "analytics_dashboard"),
    ("/dashboard", "analytics_dashboard"),
    ("/instagram", "instagram_manager"),
    ("/api/instagram", "instagram_manager"),
    ("/api/instagram-analytics", "instagram_manager"),
    ("/api/instagram/tokens", "instagram_manager"),
    ("/auth/instagram", "instagram_manager"),
    ("/api/whatsapp", "whatsapp_campaigns"),
    ("/whatsapp", "whatsapp_campaigns"),
    ("/api/voice-agent", "voice_agent"),
    ("/voice-agent", "voice_agent"),
    ("/api/v1/website-ai", "ai_tools"),
    ("/website-ai", "ai_tools"),
    ("/ai", "ai_tools"),
    ("/assistant", "ai_tools"),
    ("/review", "ai_tools"),
    ("/blog", "ai_tools"),
    ("/auto-blogger", "content_scheduler"),
    ("/api/tasks", "content_scheduler"),
    ("/api/partnership", "lead_management"),
    ("/api/customer-retention", "lead_management"),
    ("/api/b2b-network", "lead_management"),
    ("/api/b2b-chat", "lead_management"),
    ("/api/influencers", "lead_management"),
    ("/business-intelligence", "lead_management"),
    ("/api/meta-oauth", "api_integration"),
    ("/api/meta-ads", "api_integration"),
    ("/auth/meta", "api_integration"),
    ("/webhooks", "api_integration"),
    ("/api/whatsapp/webhook", "api_integration"),
    ("/api/business", "lead_management"),
    ("/api/realtime", "lead_management"),
    ("/settings", "security_center"),
)


@dataclass
class FeatureDecision:
    feature_key: str
    allowed: bool
    mode: str
    message: str
    source: str = "unknown"


def _normalize_status(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def get_feature_key_for_path(path: str) -> Optional[str]:
    """Resolve the feature key that should guard the given request path."""
    for prefix, feature_key in FEATURE_ROUTE_RULES:
        if path.startswith(prefix):
            return feature_key
    return None


def _read_feature_flags_table(db, feature_key: str) -> Optional[FeatureDecision]:
    row = db.execute(
        text(
            """
            SELECT key, name, status, reason
            FROM feature_flags
            WHERE key = :feature_key
            LIMIT 1
            """
        ),
        {"feature_key": feature_key},
    ).mappings().first()

    if not row:
        return None

    status_value = _normalize_status(row["status"])
    message = row["reason"] or f"{row['name'] or feature_key} is {status_value or 'unknown'}."

    if status_value == "enabled":
        return FeatureDecision(feature_key, True, "enabled", "Allowed", "feature_flags")

    if status_value == "maintenance":
        return FeatureDecision(feature_key, False, "maintenance", message, "feature_flags")

    return FeatureDecision(feature_key, False, "disabled", message, "feature_flags")


def _read_feature_control_table(db, feature_key: str) -> Optional[FeatureDecision]:
    row = db.execute(
        text(
            """
            SELECT feature_key, feature_name, is_enabled, is_maintenance, maintenance_message
            FROM feature_control
            WHERE feature_key = :feature_key
            LIMIT 1
            """
        ),
        {"feature_key": feature_key},
    ).mappings().first()

    if not row:
        return None

    if row["is_maintenance"]:
        message = row["maintenance_message"] or f"{row['feature_name'] or feature_key} is under maintenance."
        return FeatureDecision(feature_key, False, "maintenance", message, "feature_control")

    if row["is_enabled"]:
        return FeatureDecision(feature_key, True, "enabled", "Allowed", "feature_control")

    message = row["maintenance_message"] or f"{row['feature_name'] or feature_key} is disabled."
    return FeatureDecision(feature_key, False, "disabled", message, "feature_control")


def evaluate_feature(db, feature_key: str) -> FeatureDecision:
    """Check the shared feature tables and return the effective decision."""
    for reader in (_read_feature_flags_table, _read_feature_control_table):
        try:
            decision = reader(db, feature_key)
        except Exception as exc:
            logger.debug("Feature lookup failed for %s via %s: %s", feature_key, reader.__name__, exc)
            continue

        if decision is not None:
            return decision

    return FeatureDecision(
        feature_key=feature_key,
        allowed=True,
        mode="enabled",
        message="Feature not configured; allowing request by default.",
        source="default",
    )


async def feature_control_middleware(request: Request, call_next):
    """Block requests that belong to disabled or maintenance-gated features."""
    path = request.url.path

    if request.method == "OPTIONS" or path in EXEMPT_PATHS:
        return await call_next(request)

    feature_key = get_feature_key_for_path(path)
    if not feature_key:
        return await call_next(request)

    db = SyncSessionLocal()
    try:
        decision = evaluate_feature(db, feature_key)
    except Exception as exc:
        logger.error("Feature gate lookup error for %s: %s", feature_key, exc, exc_info=True)
        return await call_next(request)
    finally:
        db.close()

    if not decision.allowed:
        return JSONResponse(
            status_code=503,
            content={
                "detail": decision.message,
                "feature_key": decision.feature_key,
                "mode": decision.mode,
                "source": decision.source,
            },
        )

    return await call_next(request)
