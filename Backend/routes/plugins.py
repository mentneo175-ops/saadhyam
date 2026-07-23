"""
Plugin Management Routes
API endpoints for managing and executing plugins
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from models.user import User
from models.plugins import Plugin, UserPlugin, PluginCategory
from services.plugin_service import plugin_manager
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plugins", tags=["plugins"])

# Pydantic models for API requests/responses
class PluginResponse(BaseModel):
    id: int
    plugin_key: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    category: str
    version: str
    is_premium: bool
    is_ai_powered: bool
    pricing_tier: Optional[str] = None
    rating: int
    install_count: int
    
    class Config:
        from_attributes = True

class UserPluginResponse(BaseModel):
    id: int
    is_enabled: bool
    installed_version: Optional[str] = None
    usage_count: int
    last_used: Optional[str] = None
    plugin: PluginResponse
    
    class Config:
        from_attributes = True

class InstallPluginRequest(BaseModel):
    plugin_key: str
    user_config: Optional[Dict[str, Any]] = None

class ExecutePluginRequest(BaseModel):
    plugin_key: str
    action: str
    params: Optional[Dict[str, Any]] = None

@router.get("/test")
async def test_plugin_system():
    """Test endpoint to verify plugin system is working"""
    return {
        "status": "Plugin system is operational",
        "message": "All plugin endpoints are available",
        "endpoints": [
            "GET /api/plugins/categories",
            "GET /api/plugins/available", 
            "GET /api/plugins/installed",
            "POST /api/plugins/install",
            "POST /api/plugins/execute",
            "PUT /api/plugins/{key}/toggle",
            "DELETE /api/plugins/{key}",
            "GET /api/plugins/{key}/info"
        ]
    }

@router.get("/categories")
async def get_plugin_categories():
    """Get all plugin categories"""
    try:
        categories = []
        for category in PluginCategory:
            category_info = {
                "key": category.value,
                "name": category.value.replace("_", " ").title(),
                "description": get_category_description(category)
            }
            categories.append(category_info)
        
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Failed to get plugin categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to get categories")

@router.get("/available")
async def get_available_plugins(
    category: Optional[str] = None,
    include_premium: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Get all available plugins in the store"""
    try:
        category_enum = None
        if category:
            try:
                category_enum = PluginCategory(category)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid category")
        
        plugins = await plugin_manager.get_available_plugins(
            db, category_enum, include_premium
        )
        
        plugin_responses = [PluginResponse.from_orm(plugin) for plugin in plugins]
        
        return {
            "plugins": plugin_responses,
            "total": len(plugin_responses)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get available plugins: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available plugins")

@router.get("/installed")
async def get_user_plugins(
    category: Optional[str] = None,
    enabled_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Get user's installed plugins (currently returns empty list - auth not configured)"""
    # TODO: Add authentication when auth service is properly configured
    return {
        "plugins": [],
        "total": 0,
        "message": "Authentication not configured. Install plugins through UI."
    }

@router.post("/install")
async def install_plugin(
    request: InstallPluginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Install a plugin (mock endpoint - auth not configured)"""
    # TODO: Add authentication when auth service is properly configured
    return {
        "success": True,
        "message": f"Plugin {request.plugin_key} installation acknowledged (mock)",
        "note": "Authentication not configured. This is a mock response."
    }

@router.post("/execute")
async def execute_plugin(
    request: ExecutePluginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Execute a plugin action (mock endpoint - auth not configured)"""
    return {
        "success": True,
        "message": "Plugin execution acknowledged (mock)",
        "note": "Authentication not configured. This is a mock response."
    }

@router.put("/{plugin_key}/toggle")
async def toggle_plugin(
    plugin_key: str,
    db: AsyncSession = Depends(get_db)
):
    """Enable/disable a plugin (mock endpoint - auth not configured)"""
    return {
        "success": True,
        "message": "Plugin toggle acknowledged (mock)",
        "enabled": True,
        "note": "Authentication not configured. This is a mock response."
    }

@router.delete("/{plugin_key}")
async def uninstall_plugin(
    plugin_key: str,
    db: AsyncSession = Depends(get_db)
):
    """Uninstall a plugin (mock endpoint - auth not configured)"""
    return {
        "success": True,
        "message": f"Plugin {plugin_key} uninstall acknowledged (mock)",
        "note": "Authentication not configured. This is a mock response."
    }

@router.get("/{plugin_key}/info")
async def get_plugin_info(
    plugin_key: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a plugin"""
    try:
        plugins = await plugin_manager.get_available_plugins(db)
        plugin = None
        
        for p in plugins:
            if p.plugin_key == plugin_key:
                plugin = p
                break
        
        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")
        
        return PluginResponse.from_orm(plugin)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get plugin info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get plugin info")

def get_category_description(category: PluginCategory) -> str:
    """Get description for plugin category"""
    descriptions = {
        PluginCategory.SALES_CRM: "Sales and Customer Relationship Management tools",
        PluginCategory.MARKETING: "Marketing automation and campaign management",
        PluginCategory.FINANCE: "Financial management and accounting tools",
        PluginCategory.HR: "Human Resources and employee management",
        PluginCategory.INVENTORY: "Inventory and warehouse management",
        PluginCategory.ECOMMERCE: "E-commerce platform integrations",
        PluginCategory.DOCUMENTS: "Document management and processing",
        PluginCategory.LEGAL: "Legal compliance and documentation",
        PluginCategory.ANALYTICS: "Data analytics and reporting",
        PluginCategory.AI_AGENTS: "AI-powered virtual assistants",
        PluginCategory.WEBSITE: "Website building and management",
        PluginCategory.COMMUNICATION: "Communication and messaging tools",
        PluginCategory.EDUCATION: "Educational and learning management",
        PluginCategory.INDUSTRY_SPECIFIC: "Industry-specific solutions",
        PluginCategory.AI_PRODUCTIVITY: "AI-powered productivity tools"
    }
    return descriptions.get(category, "No description available")