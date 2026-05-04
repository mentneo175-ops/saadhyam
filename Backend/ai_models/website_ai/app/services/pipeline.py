from ai_models.website_ai.app.models.schema import WebsiteRequest
from ai_models.website_ai.app.services.ai_service import generate_content, generate_website_profile
from ai_models.website_ai.app.services.template_service import (
    render_website,
    save_website,
    select_random_theme,
    THEMES,
)


def run_website_pipeline(data: WebsiteRequest) -> dict[str, str]:
    profile = generate_website_profile(data)
    content = generate_content(profile)
    # Allow the caller to request a specific theme; otherwise pick a random one
    requested = getattr(data, "theme", None)
    theme = requested if requested and requested in THEMES else select_random_theme()
    html = render_website(theme, content, data)
    file_path = save_website(html, data.business_name, theme)
    return {"status": "success", "theme_used": theme, "file_path": file_path}

