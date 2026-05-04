from typing import Any, Dict, Optional

from ai_models.website_ai.app.models.schema import WebsiteRequest, WebsiteContent
from ai_models.website_ai.app.services.template_service import render_website


class TemplateService:
    """Adapter for template rendering helpers."""

    def render(
        self,
        theme: str,
        content: Dict[str, Any],
        business_data: Dict[str, Any],
        theme_config: Optional[Dict[str, Any]] = None,
    ) -> str:
        request = WebsiteRequest(
            business_name=business_data.get("business_name", ""),
            business_type=business_data.get("business_type", ""),
            theme=theme,
        )
        return render_website(theme, WebsiteContent.model_validate(content), request)
