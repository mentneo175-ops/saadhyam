"""
Plugin Management Service
Handles plugin registration, installation, configuration, and execution
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from models.plugins import Plugin, UserPlugin, PluginAnalytics, PluginCategory, PluginStatus
from models.user import User
import importlib
import inspect
import json
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class PluginManager:
    """
    Central plugin management system
    """
    
    def __init__(self):
        self.loaded_plugins = {}  # Cache of loaded plugin instances
        self.plugin_registry = {}  # Registry of available plugins
    
    async def register_plugin(
        self, 
        db: AsyncSession,
        plugin_key: str,
        name: str,
        category: PluginCategory,
        description: str = None,
        icon: str = None,
        config_schema: Dict = None,
        api_endpoints: List[str] = None,
        dependencies: List[str] = None,
        is_ai_powered: bool = False,
        is_premium: bool = False
    ) -> Plugin:
        """
        Register a new plugin in the system
        """
        try:
            # Check if plugin already exists
            result = await db.execute(
                select(Plugin).where(Plugin.plugin_key == plugin_key)
            )
            existing_plugin = result.scalar_one_or_none()
            
            if existing_plugin:
                logger.info(f"Plugin {plugin_key} already registered, updating...")
                existing_plugin.name = name
                existing_plugin.description = description
                existing_plugin.icon = icon
                existing_plugin.category = category
                existing_plugin.config_schema = config_schema
                existing_plugin.api_endpoints = api_endpoints or []
                existing_plugin.dependencies = dependencies or []
                existing_plugin.is_ai_powered = is_ai_powered
                existing_plugin.is_premium = is_premium
                existing_plugin.updated_at = datetime.utcnow()
                await db.commit()
                return existing_plugin
            
            # Create new plugin
            plugin = Plugin(
                plugin_key=plugin_key,
                name=name,
                category=category,
                description=description,
                icon=icon,
                config_schema=config_schema or {},
                api_endpoints=api_endpoints or [],
                dependencies=dependencies or [],
                is_ai_powered=is_ai_powered,
                is_premium=is_premium,
                status=PluginStatus.ACTIVE
            )
            
            db.add(plugin)
            await db.commit()
            await db.refresh(plugin)
            
            logger.info(f"✅ Plugin {plugin_key} registered successfully")
            return plugin
            
        except Exception as e:
            logger.error(f"❌ Failed to register plugin {plugin_key}: {e}")
            await db.rollback()
            raise

    async def install_plugin_for_user(
        self,
        db: AsyncSession,
        user_id: int,
        plugin_key: str,
        user_config: Dict = None
    ) -> UserPlugin:
        """
        Install a plugin for a specific user
        """
        try:
            # Get plugin
            result = await db.execute(
                select(Plugin).where(Plugin.plugin_key == plugin_key)
            )
            plugin = result.scalar_one_or_none()
            
            if not plugin:
                raise ValueError(f"Plugin {plugin_key} not found")
            
            # Check if already installed
            result = await db.execute(
                select(UserPlugin).where(
                    and_(
                        UserPlugin.user_id == user_id,
                        UserPlugin.plugin_id == plugin.id
                    )
                )
            )
            existing_installation = result.scalar_one_or_none()
            
            if existing_installation:
                logger.info(f"Plugin {plugin_key} already installed for user {user_id}")
                return existing_installation
            
            # Create installation
            user_plugin = UserPlugin(
                user_id=user_id,
                plugin_id=plugin.id,
                installed_version=plugin.version,
                user_config=user_config or {}
            )
            
            db.add(user_plugin)
            
            # Update install count
            plugin.install_count += 1
            
            await db.commit()
            await db.refresh(user_plugin)
            
            # Log analytics
            await self.log_plugin_event(
                db, plugin.id, user_id, "install", 
                {"version": plugin.version}
            )
            
            logger.info(f"✅ Plugin {plugin_key} installed for user {user_id}")
            return user_plugin
            
        except Exception as e:
            logger.error(f"❌ Failed to install plugin {plugin_key} for user {user_id}: {e}")
            await db.rollback()
            raise

    async def get_user_plugins(
        self,
        db: AsyncSession,
        user_id: int,
        category: Optional[PluginCategory] = None,
        enabled_only: bool = True
    ) -> List[UserPlugin]:
        """
        Get all plugins installed for a user
        """
        try:
            query = select(UserPlugin).join(Plugin).where(UserPlugin.user_id == user_id)
            
            if category:
                query = query.where(Plugin.category == category)
            
            if enabled_only:
                query = query.where(UserPlugin.is_enabled == True)
            
            result = await db.execute(query)
            user_plugins = result.scalars().all()
            
            return user_plugins
            
        except Exception as e:
            logger.error(f"❌ Failed to get user plugins for user {user_id}: {e}")
            return []

    async def get_available_plugins(
        self,
        db: AsyncSession,
        category: Optional[PluginCategory] = None,
        include_premium: bool = True
    ) -> List[Plugin]:
        """
        Get all available plugins in the store
        """
        try:
            query = select(Plugin).where(Plugin.status == PluginStatus.ACTIVE)
            
            if category:
                query = query.where(Plugin.category == category)
            
            if not include_premium:
                query = query.where(Plugin.is_premium == False)
            
            result = await db.execute(query)
            plugins = result.scalars().all()
            
            return plugins
            
        except Exception as e:
            logger.error(f"❌ Failed to get available plugins: {e}")
            return []

    async def execute_plugin_action(
        self,
        db: AsyncSession,
        user_id: int,
        plugin_key: str,
        action: str,
        params: Dict = None
    ) -> Dict[str, Any]:
        """
        Execute a plugin action for a user
        """
        start_time = datetime.utcnow()
        
        try:
            # Get user's plugin installation
            result = await db.execute(
                select(UserPlugin).join(Plugin).where(
                    and_(
                        UserPlugin.user_id == user_id,
                        Plugin.plugin_key == plugin_key,
                        UserPlugin.is_enabled == True
                    )
                )
            )
            user_plugin = result.scalar_one_or_none()
            
            if not user_plugin:
                raise ValueError(f"Plugin {plugin_key} not installed or disabled for user")
            
            # Load plugin instance
            plugin_instance = await self._load_plugin_instance(plugin_key)
            
            if not plugin_instance:
                raise ValueError(f"Plugin {plugin_key} could not be loaded")
            
            # Execute action
            if not hasattr(plugin_instance, action):
                raise ValueError(f"Action {action} not found in plugin {plugin_key}")
            
            # Prepare execution context
            context = {
                'user_id': user_id,
                'user_config': user_plugin.user_config or {},
                'plugin_config': user_plugin.plugin.default_config or {},
                'db': db
            }
            
            # Execute the action
            action_method = getattr(plugin_instance, action)
            if inspect.iscoroutinefunction(action_method):
                result = await action_method(context, params or {})
            else:
                result = action_method(context, params or {})
            
            # Update usage stats
            user_plugin.usage_count += 1
            user_plugin.last_used = datetime.utcnow()
            await db.commit()
            
            # Calculate execution time
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Log successful execution
            await self.log_plugin_event(
                db, user_plugin.plugin_id, user_id, "usage",
                {
                    "action": action,
                    "execution_time": execution_time,
                    "success": True
                }
            )
            
            logger.info(f"✅ Plugin {plugin_key} action {action} executed successfully for user {user_id}")
            
            return {
                "success": True,
                "result": result,
                "execution_time": execution_time
            }
            
        except Exception as e:
            logger.error(f"❌ Plugin {plugin_key} action {action} failed for user {user_id}: {e}")
            
            # Update error stats
            if 'user_plugin' in locals():
                user_plugin.error_count += 1
                user_plugin.last_error = str(e)
                await db.commit()
            
            # Log error
            await self.log_plugin_event(
                db, user_plugin.plugin_id if 'user_plugin' in locals() else None, 
                user_id, "error",
                {
                    "action": action,
                    "error": str(e)
                }
            )
            
            return {
                "success": False,
                "error": str(e)
            }

    async def _load_plugin_instance(self, plugin_key: str):
        """
        Dynamically load plugin instance
        """
        try:
            if plugin_key in self.loaded_plugins:
                return self.loaded_plugins[plugin_key]
            
            # Import plugin module
            module_path = f"plugins.{plugin_key}.main"
            plugin_module = importlib.import_module(module_path)
            
            # Get plugin class (should be named PluginMain or similar)
            plugin_class = getattr(plugin_module, "PluginMain", None)
            if not plugin_class:
                # Try alternative names
                for attr_name in dir(plugin_module):
                    attr = getattr(plugin_module, attr_name)
                    if (inspect.isclass(attr) and 
                        hasattr(attr, '__plugin__') and 
                        attr.__plugin__):
                        plugin_class = attr
                        break
            
            if not plugin_class:
                raise ImportError(f"Plugin main class not found in {module_path}")
            
            # Create instance
            plugin_instance = plugin_class()
            self.loaded_plugins[plugin_key] = plugin_instance
            
            return plugin_instance
            
        except Exception as e:
            logger.error(f"Failed to load plugin {plugin_key}: {e}")
            return None

    async def log_plugin_event(
        self,
        db: AsyncSession,
        plugin_id: int,
        user_id: int,
        event_type: str,
        event_data: Dict = None
    ):
        """
        Log plugin analytics event
        """
        try:
            analytics = PluginAnalytics(
                plugin_id=plugin_id,
                user_id=user_id,
                event_type=event_type,
                event_data=event_data or {}
            )
            
            db.add(analytics)
            await db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log plugin event: {e}")

    async def get_plugin_analytics(
        self,
        db: AsyncSession,
        plugin_key: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get analytics for a plugin
        """
        try:
            # This would contain complex analytics queries
            # For now, return basic structure
            return {
                "total_installs": 0,
                "active_users": 0,
                "usage_trends": [],
                "error_rate": 0,
                "average_rating": 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get plugin analytics: {e}")
            return {}

# Global plugin manager instance
plugin_manager = PluginManager()