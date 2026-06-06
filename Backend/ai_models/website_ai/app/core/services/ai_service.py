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
        profile = generate_website_profile(request)
        
        # Merge description
        description = business_data.get("description")
        if description and description.strip():
            profile.description = description.strip()
            
        # Merge services (ensure list format and validate length)
        services = business_data.get("services", [])
        if services:
            unique_services = []
            for s in services:
                if s and s.strip() and s.strip() not in unique_services:
                    unique_services.append(s.strip())
            
            # Pad with inferred services if there are fewer than 3
            if len(unique_services) < 3:
                for s in profile.services:
                    if s not in unique_services:
                        unique_services.append(s)
            
            profile.services = unique_services[:8]
            
        # Merge target audience
        target_audience = business_data.get("target_audience")
        if target_audience and target_audience.strip():
            profile.target_audience = target_audience.strip()
            
        # Merge tone
        tone = business_data.get("tone")
        if tone and tone.strip():
            profile.tone = tone.strip()
            
        # Merge branding style
        branding_style = business_data.get("branding_style")
        if branding_style and branding_style.strip():
            profile.branding_style = branding_style.strip()
            
        return profile

    def generate_content(self, profile: WebsiteProfile) -> WebsiteContent:
        return generate_site_content(profile)
