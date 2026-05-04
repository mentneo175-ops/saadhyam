"""
Website generation orchestration service
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from ai_models.website_ai.app.core.services.ai_service import AIService
from ai_models.website_ai.app.core.services.template_service import TemplateService
from ai_models.website_ai.app.core.services.theme_service import ThemeService
from ai_models.website_ai.app.utils.logger import get_logger


logger = get_logger(__name__)


class GenerationService:
    """Orchestrates website generation process"""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIService()
        self.template_service = TemplateService()
        self.theme_service = ThemeService(db)

    def generate_content(self, business_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate website content using AI

        Args:
            business_data: Business information

        Returns:
            Generated content dictionary
        """
        logger.info(f"Generating content for {business_data.get('business_name')}")

        # Generate profile
        profile = self.ai_service.generate_profile(business_data)

        # Generate detailed content
        content = self.ai_service.generate_content(profile)

        return content

    def render_template(
        self,
        theme: str,
        content: Dict[str, Any],
        business_data: Dict[str, Any],
        theme_config: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Render website template with content

        Args:
            theme: Theme name
            content: Generated content
            business_data: Business information
            theme_config: Optional theme configuration from main app

        Returns:
            Rendered HTML string
        """
        logger.info(f"Rendering template: {theme}")

        # Get or create theme configuration
        if theme_config:
            # Use provided theme config from main app
            final_theme_config = theme_config
        else:
            # Use default theme config
            final_theme_config = self.theme_service.get_default_theme_config()

        # Render template
        html = self.template_service.render(
            theme=theme,
            content=content,
            business_data=business_data,
            theme_config=final_theme_config
        )

        return html

    def generate_website(
        self,
        business_data: Dict[str, Any],
        theme: str,
        theme_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Complete website generation pipeline (synchronous)

        Args:
            business_data: Business information
            theme: Theme name
            theme_config: Optional theme configuration

        Returns:
            Dict with HTML and metadata
        """
        logger.info(f"Starting website generation for {business_data.get('business_name')}")

        # Generate content
        content = self.generate_content(business_data)

        # Render template
        html = self.render_template(
            theme=theme,
            content=content,
            business_data=business_data,
            theme_config=theme_config
        )

        return {
            "html": html,
            "content": content,
            "theme": theme
        }

