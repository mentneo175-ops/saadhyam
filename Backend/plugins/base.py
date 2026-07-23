"""
Base Plugin Class
All plugins must inherit from this base class
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class BasePlugin(ABC):
    """
    Abstract base class for all Saadhyam AI plugins
    """
    
    # Plugin metadata (to be overridden by subclasses)
    __plugin__ = True
    plugin_key = None
    plugin_name = None
    plugin_description = None
    plugin_icon = None
    plugin_category = None
    plugin_version = "1.0.0"
    
    def __init__(self):
        self.logger = logging.getLogger(f"plugins.{self.plugin_key}")
        self.config = {}
    
    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        """
        Return plugin information
        """
        return {
            "key": self.plugin_key,
            "name": self.plugin_name,
            "description": self.plugin_description,
            "icon": self.plugin_icon,
            "category": self.plugin_category,
            "version": self.plugin_version
        }
    
    @abstractmethod
    def get_actions(self) -> List[Dict[str, Any]]:
        """
        Return list of available actions this plugin provides
        """
        pass
    
    @abstractmethod
    def get_config_schema(self) -> Dict[str, Any]:
        """
        Return JSON schema for plugin configuration
        """
        pass
    
    def initialize(self, config: Dict[str, Any]):
        """
        Initialize plugin with configuration
        """
        self.config = config
        self.logger.info(f"Plugin {self.plugin_key} initialized")
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate plugin configuration
        """
        # Basic validation - can be overridden by subclasses
        schema = self.get_config_schema()
        required_fields = schema.get("required", [])
        
        for field in required_fields:
            if field not in config:
                self.logger.error(f"Required field {field} missing in config")
                return False
        
        return True
    
    def get_status(self) -> Dict[str, Any]:
        """
        Return plugin status and health information
        """
        return {
            "status": "active",
            "health": "healthy",
            "last_check": None,
            "errors": []
        }
    
    def cleanup(self):
        """
        Cleanup resources when plugin is disabled/uninstalled
        """
        self.logger.info(f"Plugin {self.plugin_key} cleaned up")

class AIPlugin(BasePlugin):
    """
    Base class for AI-powered plugins
    """
    
    def __init__(self):
        super().__init__()
        self.ai_model = None
        self.ai_config = {}
    
    def initialize_ai(self, ai_config: Dict[str, Any]):
        """
        Initialize AI components
        """
        self.ai_config = ai_config
        # AI initialization logic here
    
    def get_ai_status(self) -> Dict[str, Any]:
        """
        Return AI model status
        """
        return {
            "model_loaded": self.ai_model is not None,
            "model_type": self.ai_config.get("model_type"),
            "performance_metrics": {}
        }