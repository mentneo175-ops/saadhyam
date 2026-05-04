from typing import Any, Dict

from sqlalchemy.orm import Session

from ai_models.website_ai.app.db.models.theme_config import ThemeConfig


class ThemeService:
    """Theme config loader for website_ai templates."""

    def __init__(self, db: Session):
        self.db = db

    def get_default_theme_config(self) -> Dict[str, Any]:
        try:
            config = (
                self.db.query(ThemeConfig)
                .filter(ThemeConfig.is_default.is_(True))
                .first()
            )
            if config and config.config_data:
                return config.config_data
        except Exception:
            pass
        return {}
