"""
LinkedIn Marketing Service Adapters (Development / Mock & Real API interface).
Separates in-memory mock/test storage from production LinkedIn API.
"""

import logging
import uuid
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class BaseLinkedInService:
    """Abstract interface for LinkedIn Marketing API services."""

    async def create_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def list_campaigns(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def get_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def update_budget(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def pause_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def resume_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def campaign_statistics(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def health_check(self) -> Dict[str, Any]:
        raise NotImplementedError


class MockLinkedInService(BaseLinkedInService):
    """
    In-memory Mock LinkedIn Service Adapter for Development & Regression Testing.
    Exposes mode='development' and api_status='mock'.
    """

    def __init__(self):
        self._campaign_db: Dict[str, Dict[str, Any]] = {}
        # Pre-seed initial default campaign for testing
        self._campaign_db["Pizza Shop"] = {
            "campaign_id": "li_camp_01A52B",
            "campaign_name": "Pizza Shop",
            "budget": 5000.0,
            "status": "Enabled",
            "objective": "Lead Generation",
            "audience": "Food Enthusiasts",
            "location": "India",
            "impressions": 12500,
            "clicks": 1420,
            "ctr": "11.36%",
            "conversions": 98,
            "total_spend": 10500.0,
        }

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "plugin_key": "marketing_linkedin",
            "plugin_version": "v1.0",
            "manifest_version": "v1.0",
            "schema_version": "v1.0",
            "mode": "development",
            "api_status": "mock",
            "oauth_status": "not_configured",
            "response_time_ms": 5.0,
            "message": "LinkedIn Marketing plugin (Development/Mock Mode) is online and operational.",
        }

    async def create_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        c_name = params.get("campaign_name") or params.get("topic") or params.get("product") or params.get("name")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "data": {},
            }

        raw_budget = params.get("budget") or params.get("daily_budget") or 5000.0
        try:
            budget_val = float(raw_budget)
        except (ValueError, TypeError):
            budget_val = 5000.0

        objective = params.get("objective") or "Lead Generation"
        audience = params.get("audience") or "Target Audience"
        location = params.get("location") or "Global"
        cid = f"li_camp_{uuid.uuid4().hex[:6].upper()}"

        camp_record = {
            "campaign_id": cid,
            "campaign_name": c_name,
            "budget": budget_val,
            "status": "Enabled",
            "objective": objective,
            "audience": audience,
            "location": location,
            "impressions": 0,
            "clicks": 0,
            "ctr": "0.00%",
            "conversions": 0,
            "total_spend": 0.0,
        }
        self._campaign_db[c_name] = camp_record

        reply_te = (
            f"≡ƒÆ╝ **LinkedIn Marketing Campaign Created**\n\n"
            f"ΓÇó **Campaign:** {c_name}\n"
            f"ΓÇó **Budget:** Γé╣{budget_val:,.0f}/day\n"
            f"ΓÇó **Status:** Enabled\n"
            f"ΓÇó **Objective:** {objective}\n"
            f"ΓÇó **Campaign ID:** `{cid}`"
        )

        return {
            "success": True,
            "message": f"LinkedIn Marketing campaign '{c_name}' created successfully.",
            "reply_te": reply_te,
            "data": camp_record,
        }

    async def list_campaigns(self, params: Dict[str, Any]) -> Dict[str, Any]:
        status_filter = params.get("status")
        camps = list(self._campaign_db.values())

        if status_filter:
            camps = [c for c in camps if c.get("status").lower() == str(status_filter).lower()]

        if camps:
            formatted_list = "\n".join(
                [f"ΓÇó **{c['campaign_name']}** (ID: `{c['campaign_id']}`) ΓÇö Budget: Γé╣{c['budget']:,.0f}/day | Status: **{c['status']}**" for c in camps]
            )
        else:
            formatted_list = "No campaigns found."

        reply_te = f"≡ƒôï **LinkedIn Marketing Campaigns ({len(camps)} Total)**\n\n{formatted_list}"

        return {
            "success": True,
            "message": f"Retrieved {len(camps)} LinkedIn campaigns.",
            "reply_te": reply_te,
            "data": {
                "total": len(camps),
                "campaigns": camps,
            },
        }

    async def get_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        c_name = params.get("campaign_name") or params.get("campaign_id")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "data": {},
            }

        if c_name not in self._campaign_db:
            return {
                "success": False,
                "message": f"Campaign '{c_name}' not found.",
                "error": "CAMPAIGN_NOT_FOUND",
                "data": {},
            }

        camp = self._campaign_db[c_name]
        reply_te = (
            f"≡ƒôè **LinkedIn Campaign Details: {camp['campaign_name']}**\n\n"
            f"ΓÇó **ID:** `{camp['campaign_id']}`\n"
            f"ΓÇó **Status:** {camp['status']}\n"
            f"ΓÇó **Daily Budget:** Γé╣{camp['budget']:,.0f}\n"
            f"ΓÇó **Objective:** {camp.get('objective', 'Lead Generation')}\n"
            f"ΓÇó **Impressions:** {camp.get('impressions', 0):,}\n"
            f"ΓÇó **Clicks:** {camp.get('clicks', 0):,} (CTR: {camp.get('ctr', '0.00%')})\n"
            f"ΓÇó **Conversions:** {camp.get('conversions', 0)}"
        )

        return {
            "success": True,
            "message": f"Retrieved details for LinkedIn campaign '{camp['campaign_name']}'.",
            "reply_te": reply_te,
            "data": camp,
        }

    async def update_budget(self, params: Dict[str, Any]) -> Dict[str, Any]:
        c_name = params.get("campaign_name")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "data": {},
            }

        raw_budget = params.get("budget") or params.get("daily_budget")
        if raw_budget is None:
            return {
                "success": False,
                "message": "Missing required parameter: budget",
                "error": "MISSING_PARAM",
                "data": {},
            }

        try:
            budget_val = float(raw_budget)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "Invalid type for parameter 'budget': expected number",
                "error": "INVALID_PARAM",
                "data": {},
            }

        if c_name not in self._campaign_db:
            return {
                "success": False,
                "message": f"Campaign '{c_name}' not found.",
                "error": "CAMPAIGN_NOT_FOUND",
                "data": {},
            }

        self._campaign_db[c_name]["budget"] = budget_val
        camp = self._campaign_db[c_name]

        reply_te = (
            f"≡ƒÆ╡ **LinkedIn Campaign Budget Updated**\n\n"
            f"ΓÇó **Campaign:** {c_name}\n"
            f"ΓÇó **New Daily Budget:** Γé╣{budget_val:,.0f}/day"
        )

        return {
            "success": True,
            "message": f"Updated daily budget for '{c_name}' to Γé╣{budget_val:,.0f}.",
            "reply_te": reply_te,
            "data": camp,
        }

    async def pause_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        c_name = params.get("campaign_name")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "data": {},
            }

        if c_name not in self._campaign_db:
            return {
                "success": False,
                "message": f"Campaign '{c_name}' not found.",
                "error": "CAMPAIGN_NOT_FOUND",
                "data": {},
            }

        self._campaign_db[c_name]["status"] = "Paused"
        camp = self._campaign_db[c_name]

        reply_te = (
            f"ΓÅ╕∩╕Å **LinkedIn Campaign Paused**\n\n"
            f"ΓÇó **Campaign:** {c_name}\n"
            f"ΓÇó **New Status:** Paused"
        )

        return {
            "success": True,
            "message": f"LinkedIn campaign '{c_name}' has been paused.",
            "reply_te": reply_te,
            "data": camp,
        }

    async def resume_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        c_name = params.get("campaign_name")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "data": {},
            }

        if c_name not in self._campaign_db:
            return {
                "success": False,
                "message": f"Campaign '{c_name}' not found.",
                "error": "CAMPAIGN_NOT_FOUND",
                "data": {},
            }

        self._campaign_db[c_name]["status"] = "Enabled"
        camp = self._campaign_db[c_name]

        reply_te = (
            f"Γû╢∩╕Å **LinkedIn Campaign Resumed**\n\n"
            f"ΓÇó **Campaign:** {c_name}\n"
            f"ΓÇó **New Status:** Enabled"
        )

        return {
            "success": True,
            "message": f"LinkedIn campaign '{c_name}' has been enabled and resumed.",
            "reply_te": reply_te,
            "data": camp,
        }

    async def campaign_statistics(self, params: Dict[str, Any]) -> Dict[str, Any]:
        c_name = params.get("campaign_name")

        if c_name and c_name in self._campaign_db:
            camps = [self._campaign_db[c_name]]
        else:
            camps = list(self._campaign_db.values())

        total_imp = sum(c.get("impressions", 0) for c in camps)
        total_clicks = sum(c.get("clicks", 0) for c in camps)
        total_conv = sum(c.get("conversions", 0) for c in camps)
        total_spend = sum(c.get("total_spend", 0.0) for c in camps)
        overall_ctr = f"{(total_clicks / total_imp * 100):.2f}%" if total_imp > 0 else "0.00%"

        reply_te = (
            f"≡ƒôê **LinkedIn Marketing Performance Statistics**\n\n"
            f"ΓÇó **Total Impressions:** {total_imp:,}\n"
            f"ΓÇó **Total Clicks:** {total_clicks:,} (CTR: **{overall_ctr}**)\n"
            f"ΓÇó **Total Conversions:** {total_conv:,}\n"
            f"ΓÇó **Total Spend:** Γé╣{total_spend:,.2f}"
        )

        return {
            "success": True,
            "message": "Retrieved LinkedIn campaign statistics.",
            "reply_te": reply_te,
            "data": {
                "total_impressions": total_imp,
                "total_clicks": total_clicks,
                "average_ctr": overall_ctr,
                "total_conversions": total_conv,
                "total_spend": total_spend,
            },
        }


class RealLinkedInService(BaseLinkedInService):
    """
    Real External LinkedIn API Adapter (Future Integration).
    Exposes mode='production' and api_status='connected' when configured with live OAuth tokens.
    """

    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token

    def health_check(self) -> Dict[str, Any]:
        is_configured = bool(self.access_token)
        return {
            "status": "healthy" if is_configured else "unhealthy",
            "plugin_key": "marketing_linkedin",
            "plugin_version": "v1.0",
            "manifest_version": "v1.0",
            "schema_version": "v1.0",
            "mode": "production",
            "api_status": "connected" if is_configured else "disconnected",
            "oauth_status": "configured" if is_configured else "not_configured",
            "response_time_ms": 12.0,
            "message": "LinkedIn Marketing Live API Service.",
        }

    async def create_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Real LinkedIn API integration pending credentials.")

    async def list_campaigns(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Real LinkedIn API integration pending credentials.")

    async def get_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Real LinkedIn API integration pending credentials.")

    async def update_budget(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Real LinkedIn API integration pending credentials.")

    async def pause_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Real LinkedIn API integration pending credentials.")

    async def resume_campaign(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Real LinkedIn API integration pending credentials.")

    async def campaign_statistics(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Real LinkedIn API integration pending credentials.")