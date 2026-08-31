"""
LinkedIn Marketing Plugin (Enterprise Production Ready)
Implements the PluginMain contract for LinkedIn Marketing campaign management, budget updates,
status toggling (pause/resume), performance statistics, and diagnostic health monitoring.
"""

import logging
from typing import Dict, Any, List, Optional
from plugins.base import BasePlugin
from plugins.marketing_linkedin.service import MockLinkedInService, RealLinkedInService

logger = logging.getLogger(__name__)


class PluginMain(BasePlugin):
    """Production-Ready Marketing LinkedIn plugin implementation."""

    __plugin__ = True
    plugin_key = "marketing_linkedin"
    plugin_name = "LinkedIn Marketing"
    plugin_description = (
        "Create professional LinkedIn marketing campaigns, update budgets, "
        "toggle campaign statuses, track analytics, and manage outreach via AI Assistant."
    )
    plugin_icon = "💼"
    plugin_category = "marketing"
    plugin_version = "v1.0"

    def __init__(self):
        super().__init__()
        # Use Mock service adapter by default for development & regression testing
        self.service = MockLinkedInService()

    # ------------------------------------------------------------------ #
    # BasePlugin Contract                                                  #
    # ------------------------------------------------------------------ #

    def get_info(self) -> Dict[str, Any]:
        """Return plugin metadata consumed by tool registry."""
        return {
            "key": self.plugin_key,
            "name": self.plugin_name,
            "description": self.plugin_description,
            "icon": self.plugin_icon,
            "category": self.plugin_category,
            "version": self.plugin_version,
        }

    def get_actions(self) -> List[Dict[str, Any]]:
        """Declare actions exposed to assistant tool router and API dispatcher."""
        return [
            {
                "action": "create_campaign",
                "name": "Create LinkedIn Campaign",
                "description": "Create a new LinkedIn marketing campaign with daily budget",
                "parameters": {
                    "campaign_name": {"type": "string", "required": True},
                    "budget": {"type": "number", "required": False},
                    "objective": {"type": "string", "required": False},
                    "audience": {"type": "string", "required": False},
                    "location": {"type": "string", "required": False},
                },
            },
            {
                "action": "list_campaigns",
                "name": "List LinkedIn Campaigns",
                "description": "Retrieve list of active or paused LinkedIn campaigns",
                "parameters": {
                    "status": {"type": "string", "required": False},
                    "max_results": {"type": "number", "required": False},
                },
            },
            {
                "action": "get_campaign",
                "name": "Get Campaign Details",
                "description": "Retrieve full details and performance metrics for a specific LinkedIn campaign",
                "parameters": {
                    "campaign_name": {"type": "string", "required": True},
                    "campaign_id": {"type": "string", "required": False},
                },
            },
            {
                "action": "update_budget",
                "name": "Update Campaign Budget",
                "description": "Update daily budget allocation for a LinkedIn campaign",
                "parameters": {
                    "campaign_name": {"type": "string", "required": True},
                    "budget": {"type": "number", "required": True},
                },
            },
            {
                "action": "pause_campaign",
                "name": "Pause LinkedIn Campaign",
                "description": "Pause an active LinkedIn campaign",
                "parameters": {
                    "campaign_name": {"type": "string", "required": True},
                },
            },
            {
                "action": "resume_campaign",
                "name": "Resume LinkedIn Campaign",
                "description": "Resume a paused LinkedIn campaign",
                "parameters": {
                    "campaign_name": {"type": "string", "required": True},
                },
            },
            {
                "action": "campaign_statistics",
                "name": "LinkedIn Campaign Statistics",
                "description": "Calculate impressions, clicks, CTR, conversions, and total spend for LinkedIn campaigns",
                "parameters": {
                    "campaign_name": {"type": "string", "required": False},
                    "time_frame": {"type": "string", "required": False},
                },
            },
            {
                "action": "get_health",
                "name": "Plugin Health Status",
                "description": "Return LinkedIn plugin connectivity, service adapter mode, and diagnostic metrics",
                "parameters": {},
            },
        ]

    def get_config_schema(self) -> Dict[str, Any]:
        """Return the JSON schema for plugin configuration."""
        return {
            "type": "object",
            "properties": {
                "linkedin_access_token": {
                    "type": "string",
                    "description": "LinkedIn OAuth 2.0 Access Token",
                },
                "company_page_id": {
                    "type": "string",
                    "description": "LinkedIn Organization / Company Page ID",
                },
                "default_currency": {
                    "type": "string",
                    "default": "INR",
                },
            },
            "required": [],
        }

    def health_check(self) -> Dict[str, Any]:
        """Return plugin diagnostic health status from service adapter."""
        return self.service.health_check()

    # ------------------------------------------------------------------ #
    # Execution Dispatcher                                                #
    # ------------------------------------------------------------------ #

    async def execute(
        self,
        action: str,
        params: Dict[str, Any] = None,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generic execution entry point matching framework signature:
        execute(self, action: str, params: dict | None = None, context: dict | None = None)
        """
        params = params or {}
        logger.info(f"[{self.plugin_name}] Executing action '{action}' with params: {params}")

        action_map = {
            "create_campaign": self.create_campaign,
            "list_campaigns": self.list_campaigns,
            "get_campaign": self.get_campaign,
            "update_budget": self.update_budget,
            "pause_campaign": self.pause_campaign,
            "resume_campaign": self.resume_campaign,
            "campaign_statistics": self.campaign_statistics,
            "health_check": self.get_health,
            "get_health": self.get_health,
        }

        handler = action_map.get(action)
        if not handler:
            return {
                "success": False,
                "message": f"Unknown action '{action}' for Marketing LinkedIn plugin.",
                "error": "INVALID_ACTION",
                "reply_te": f"Unknown action '{action}'.",
                "data": {},
            }

        try:
            return await handler(context, params)
        except Exception as e:
            logger.error(f"[{self.plugin_name}] Error executing action '{action}': {e}", exc_info=True)
            return {
                "success": False,
                "message": f"Failed to execute action '{action}': {str(e)}",
                "error": str(e),
                "reply_te": f"Failed to execute action '{action}': {str(e)}",
                "data": {},
            }

    # ------------------------------------------------------------------ #
    # Public Action Handlers                                               #
    # ------------------------------------------------------------------ #

    async def create_campaign(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        params = params or {}
        c_name = params.get("campaign_name")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "reply_te": "Missing required parameter: campaign_name",
                "data": {},
            }

        res = await self.service.create_campaign(params)
        return res

    async def list_campaigns(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        params = params or {}
        res = await self.service.list_campaigns(params)
        return res

    async def get_campaign(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        params = params or {}
        c_name = params.get("campaign_name") or params.get("campaign_id")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "reply_te": "Missing required parameter: campaign_name",
                "data": {},
            }

        res = await self.service.get_campaign(params)
        return res

    async def update_budget(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        params = params or {}
        c_name = params.get("campaign_name")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "reply_te": "Missing required parameter: campaign_name",
                "data": {},
            }

        if "budget" not in params or params["budget"] is None:
            return {
                "success": False,
                "message": "Missing required parameter: budget",
                "error": "MISSING_PARAM",
                "reply_te": "Missing required parameter: budget",
                "data": {},
            }

        res = await self.service.update_budget(params)
        return res

    async def pause_campaign(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        params = params or {}
        c_name = params.get("campaign_name")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "reply_te": "Missing required parameter: campaign_name",
                "data": {},
            }

        res = await self.service.pause_campaign(params)
        return res

    async def resume_campaign(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        params = params or {}
        c_name = params.get("campaign_name")
        if not c_name or not str(c_name).strip():
            return {
                "success": False,
                "message": "Missing required parameter: campaign_name",
                "error": "MISSING_PARAM",
                "reply_te": "Missing required parameter: campaign_name",
                "data": {},
            }

        res = await self.service.resume_campaign(params)
        return res

    async def campaign_statistics(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        params = params or {}
        res = await self.service.campaign_statistics(params)
        return res

    async def get_health(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        health_data = self.health_check()
        return {
            "success": True,
            "message": health_data.get("message", "Health check completed."),
            "reply_te": f"💚 **LinkedIn Plugin Health Status**: {health_data.get('status')} (Mode: `{health_data.get('mode')}`, API: `{health_data.get('api_status')}`)",
            "data": health_data,
        }
