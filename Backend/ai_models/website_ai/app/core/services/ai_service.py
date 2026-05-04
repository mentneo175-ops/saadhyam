from typing import Any, Dict

from ai_models.website_ai.app.models.schema import WebsiteRequest, WebsiteProfile, WebsiteContent
from ai_models.website_ai.app.services.ai_service import (
    generate_website_profile,
    generate_content as generate_site_content,
)


class AIService:
    """Adapter around the website_ai AI helpers."""

    def generate_profile(self, business_data: Dict[str, Any]) -> WebsiteProfile:
        request = WebsiteRequest(
            business_name=business_data.get("business_name", ""),
            business_type=business_data.get("business_type", ""),
            theme=business_data.get("theme"),
        )
        return generate_website_profile(request)

    def generate_content(self, profile: WebsiteProfile) -> WebsiteContent:
        return generate_site_content(profile)
