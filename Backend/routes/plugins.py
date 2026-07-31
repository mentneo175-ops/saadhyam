"""
Plugin Management Routes
API endpoints for managing and executing plugins
"""

import logging
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from config.database import get_db
from models.user import User
from models.plugins import Plugin, UserPlugin, PluginCategory, PluginStatus
from services.plugin_service import plugin_manager
from pydantic import BaseModel
from utils.dependencies import get_current_user
from typing import List, Dict, Any, Optional

from sqlalchemy import select, and_, func, cast, String

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plugins", tags=["plugins"])


def _serialize_plugin(p: Plugin) -> dict:
    """Eagerly serialize Plugin to dict (no lazy loading)."""
    return {
        "id": p.id,
        "plugin_key": p.plugin_key,
        "name": p.name,
        "description": p.description,
        "icon": p.icon,
        "category": p.category.value if hasattr(p.category, 'value') else str(p.category),
        "version": p.version,
        "is_premium": p.is_premium,
        "is_ai_powered": p.is_ai_powered,
        "pricing_tier": p.pricing_tier,
        "rating": p.rating,
        "install_count": p.install_count,
    }


def _serialize_user_plugin(up: 'UserPlugin', plugin: Plugin) -> dict:
    """Eagerly serialize UserPlugin + Plugin to dict (no lazy loading)."""
    return {
        "id": up.id,
        "is_enabled": up.is_enabled,
        "installed_version": up.installed_version,
        "usage_count": up.usage_count,
        "last_used": up.last_used.isoformat() if up.last_used else None,
        "installation_date": up.created_at.isoformat() if up.created_at else None,
        "plugin_key": plugin.plugin_key,
        "plugin": _serialize_plugin(plugin),
        "name": plugin.name,
        "enabled": up.is_enabled,
        "installed_at": up.created_at.isoformat() if up.created_at else None,
        # Include user_config so the frontend can pre-populate configuration forms
        "user_config": up.user_config or {}
    }

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

from datetime import datetime

class UserPluginResponse(BaseModel):
    id: int
    is_enabled: bool
    installed_version: Optional[str] = None
    usage_count: int
    last_used: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    plugin_key: Optional[str] = None
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
async def get_plugin_categories(db: AsyncSession = Depends(get_db)):
    """Get all plugin categories with active plugin count"""
    try:
        # Get count per category from DB
        stmt = (
            select(Plugin.category, func.count(Plugin.id))
            .where(Plugin.status == PluginStatus.ACTIVE)
            .group_by(Plugin.category)
        )
        result = await db.execute(stmt)
        counts = {}
        for cat, count in result.all():
            key = cat.value if hasattr(cat, 'value') else str(cat)
            counts[key] = count

        categories = []
        for category in PluginCategory:
            category_info = {
                "key": category.value,
                "name": category.value.replace("_", " ").title(),
                "description": get_category_description(category),
                "count": counts.get(category.value, 0)
            }
            categories.append(category_info)
        
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Failed to get plugin categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to get categories")

@router.get("/marketplace")
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

@router.get("/stats")
async def get_plugin_stats(db: AsyncSession = Depends(get_db)):
    """Get plugin system statistics using real database queries"""
    try:
        # 1. Total active plugins
        total_stmt = select(func.count(Plugin.id)).where(Plugin.status == PluginStatus.ACTIVE)
        total_plugins = (await db.execute(total_stmt)).scalar() or 0

        # 2. Installed user plugins (across all users)
        installed_stmt = select(func.count(UserPlugin.id))
        installed_plugins = (await db.execute(installed_stmt)).scalar() or 0

        # 3. Premium plugins
        premium_stmt = select(func.count(Plugin.id)).where(
            and_(Plugin.status == PluginStatus.ACTIVE, Plugin.is_premium == True)
        )
        premium_plugins = (await db.execute(premium_stmt)).scalar() or 0

        # 4. Free plugins
        free_stmt = select(func.count(Plugin.id)).where(
            and_(Plugin.status == PluginStatus.ACTIVE, Plugin.is_premium == False)
        )
        free_plugins = (await db.execute(free_stmt)).scalar() or 0

        # 5. AI powered plugins
        ai_stmt = select(func.count(Plugin.id)).where(
            and_(Plugin.status == PluginStatus.ACTIVE, Plugin.is_ai_powered == True)
        )
        ai_powered_plugins = (await db.execute(ai_stmt)).scalar() or 0

        # 6. Categories count
        categories_stmt = select(func.count(func.distinct(Plugin.category))).where(
            Plugin.status == PluginStatus.ACTIVE
        )
        categories_count = (await db.execute(categories_stmt)).scalar() or 0

        # 7. Frontend compatibility: Total installs sum
        installs_stmt = select(func.coalesce(func.sum(Plugin.install_count), 0)).where(
            Plugin.status == PluginStatus.ACTIVE
        )
        total_installs = (await db.execute(installs_stmt)).scalar() or 0

        # 8. Frontend compatibility: Average rating
        rating_stmt = select(func.coalesce(func.avg(Plugin.rating), 0.0)).where(
            Plugin.status == PluginStatus.ACTIVE
        )
        average_rating = (await db.execute(rating_stmt)).scalar() or 0.0
        average_rating = float(round(average_rating, 1))

        return {
            "total_plugins": total_plugins,
            "installed_plugins": installed_plugins,
            "premium_plugins": premium_plugins,
            "free_plugins": free_plugins,
            "ai_powered_plugins": ai_powered_plugins,
            "categories_count": categories_count,
            "ai_powered_count": ai_powered_plugins,
            "total_installs": total_installs,
            "average_rating": average_rating
        }
    except Exception as e:
        logger.error(f"Failed to get plugin stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get plugin stats")

@router.get("/search")
async def search_plugins(
    q: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Search active plugins by name, key, description, or category"""
    try:
        # Base query for active plugins
        query = select(Plugin).where(Plugin.status == PluginStatus.ACTIVE)

        # Apply category filter if provided
        if category:
            try:
                category_enum = PluginCategory(category)
                query = query.where(Plugin.category == category_enum)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid category")

        # Apply text search query if provided
        if q:
            search_filter = f"%{q}%"
            query = query.where(
                (Plugin.name.ilike(search_filter)) |
                (Plugin.plugin_key.ilike(search_filter)) |
                (Plugin.description.ilike(search_filter)) |
                (cast(Plugin.category, String).ilike(search_filter))
            )

        result = await db.execute(query)
        plugins = result.scalars().all()

        plugin_responses = [PluginResponse.from_orm(plugin) for plugin in plugins]

        return {
            "plugins": plugin_responses,
            "total": len(plugin_responses)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to search plugins: {e}")
        raise HTTPException(status_code=500, detail="Failed to search plugins")

@router.get("/installed")
async def get_user_plugins(
    category: Optional[str] = None,
    enabled_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get authenticated user's installed plugins"""
    import time
    t0 = time.monotonic()
    try:
        # Use selectinload to eagerly load the plugin relationship within the async session
        stmt = (
            select(UserPlugin)
            .where(UserPlugin.user_id == current_user.id)
            .options(selectinload(UserPlugin.plugin))
        )
        if enabled_only:
            stmt = stmt.where(UserPlugin.is_enabled == True)
        if category:
            try:
                category_enum = PluginCategory(category)
                stmt = stmt.join(Plugin).where(Plugin.category == category_enum)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid category")

        t1 = time.monotonic()
        result = await db.execute(stmt)
        t2 = time.monotonic()
        user_plugins = result.scalars().all()

        # Serialize eagerly while plugin is loaded in session
        plugins_data = [_serialize_user_plugin(up, up.plugin) for up in user_plugins]
        t3 = time.monotonic()
        print(f"[LATENCY ENDPOINT GET] build_stmt={t1-t0:.4f}s execute={t2-t1:.4f}s serialize={t3-t2:.4f}s total={t3-t0:.4f}s")
        return {
            "plugins": plugins_data,
            "total": len(plugins_data)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get installed plugins: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve installed plugins")

@router.post("/install")
async def install_plugin(
    request: InstallPluginRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Install a plugin for the authenticated user"""
    try:
        print("[DEBUG INSTALL] Start install_plugin", flush=True)
        # Fetch plugin first so we can serialize it before the session closes
        print("[DEBUG INSTALL] Fetching plugin...", flush=True)
        plugin_result = await db.execute(
            select(Plugin).where(Plugin.plugin_key == request.plugin_key)
        )
        plugin = plugin_result.scalar_one_or_none()
        print(f"[DEBUG INSTALL] Found plugin: {plugin}", flush=True)
        if not plugin:
            try:
                from services.plugin_initialization import register_marketing_plugins
                await register_marketing_plugins(db)
                plugin_result = await db.execute(
                    select(Plugin).where(Plugin.plugin_key == request.plugin_key)
                )
                plugin = plugin_result.scalar_one_or_none()
            except Exception as seed_error:
                logger.warning(f"Fallback registration failed for {request.plugin_key}: {seed_error}")
        if not plugin:
            raise HTTPException(status_code=404, detail=f"Plugin '{request.plugin_key}' not found")

        print("[DEBUG INSTALL] Calling install_plugin_for_user...", flush=True)
        user_plugin = await plugin_manager.install_plugin_for_user(
            db, current_user.id, request.plugin_key, request.user_config
        )
        print(f"[DEBUG INSTALL] Completed install_plugin_for_user: {user_plugin}", flush=True)
        # Serialize while plugin is still in scope (no lazy load needed)
        print("[DEBUG INSTALL] Serializing response...", flush=True)
        res = {
            "success": True,
            "message": f"Plugin {request.plugin_key} installed successfully",
            "user_plugin": _serialize_user_plugin(user_plugin, plugin)
        }
        print("[DEBUG INSTALL] Serialization complete!", flush=True)
        return res
    except HTTPException:
        print("[DEBUG INSTALL] HTTPException raised", flush=True)
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to install plugin {request.plugin_key}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to install plugin: {str(e)}")

@router.post("/execute")
async def execute_plugin(
    request: ExecutePluginRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    print("========== EXECUTE ENDPOINT ==========")
    print(request)
    """Execute a plugin action"""
    try:
        res = await plugin_manager.execute_plugin_action(
            db, current_user.id, request.plugin_key, request.action, request.params
        )
        return res
    except HTTPException as e:
        if isinstance(e.detail, dict):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=e.status_code, content=e.detail)
        raise
    except Exception as e:
        logger.error(f"Failed to execute plugin: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{plugin_key}/install")
async def install_plugin_by_path(
    plugin_key: str,
    request_data: Optional[Dict[str, Any]] = Body(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Install a plugin for the authenticated user by specifying ID or key in the path"""
    try:
        if plugin_key.isdigit():
            plugin_result = await db.execute(
                select(Plugin).where(Plugin.id == int(plugin_key))
            )
        else:
            plugin_result = await db.execute(
                select(Plugin).where(Plugin.plugin_key == plugin_key)
            )
        plugin = plugin_result.scalar_one_or_none()
        if not plugin:
            try:
                from services.plugin_initialization import register_marketing_plugins
                await register_marketing_plugins(db)
                if plugin_key.isdigit():
                    plugin_result = await db.execute(
                        select(Plugin).where(Plugin.id == int(plugin_key))
                    )
                else:
                    plugin_result = await db.execute(
                        select(Plugin).where(Plugin.plugin_key == plugin_key)
                    )
                plugin = plugin_result.scalar_one_or_none()
            except Exception as seed_error:
                logger.warning(f"Fallback registration failed for {plugin_key}: {seed_error}")
        if not plugin:
            raise HTTPException(status_code=404, detail=f"Plugin '{plugin_key}' not found")

        user_config = (request_data or {}).get("user_config")
        user_plugin = await plugin_manager.install_plugin_for_user(
            db, current_user.id, plugin.plugin_key, user_config
        )
        return {
            "success": True,
            "message": f"Plugin {plugin.plugin_key} installed successfully",
            "user_plugin": _serialize_user_plugin(user_plugin, plugin)
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to install plugin {plugin_key}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{plugin_key}/toggle")
async def toggle_plugin(
    plugin_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enable/disable a plugin installation"""
    try:
        user_plugin = await plugin_manager.toggle_plugin_for_user(
            db, current_user.id, plugin_key
        )
        if not user_plugin:
            raise HTTPException(status_code=404, detail="Plugin installation not found")
        
        return {
            "success": True,
            "enabled": user_plugin.is_enabled,
            "message": f"Plugin {'enabled' if user_plugin.is_enabled else 'disabled'} successfully"
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to toggle plugin {plugin_key}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{plugin_key}")
async def uninstall_plugin(
    plugin_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Uninstall a plugin installation"""
    try:
        success = await plugin_manager.uninstall_plugin_for_user(
            db, current_user.id, plugin_key
        )
        if not success:
            raise HTTPException(status_code=404, detail="Plugin installation not found")
        
        return {
            "success": True,
            "message": f"Plugin {plugin_key} uninstalled successfully"
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to uninstall plugin {plugin_key}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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


class EmailMarketingConfigSave(BaseModel):
    smtp_host: str
    smtp_port: int
    sender_email: str
    password_or_api_key: str
    sender_name: Optional[str] = None


@router.get("/email_marketing/details")
async def get_email_marketing_details(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Check if sales_email_marketing exists
        res = await db.execute(
            select(Plugin).where(Plugin.plugin_key == "sales_email_marketing")
        )
        plugin = res.scalar_one_or_none()
        if not plugin:
            raise HTTPException(status_code=404, detail="Email Marketing plugin registry not found.")

        # Check if user has installed it
        stmt = select(UserPlugin).where(
            UserPlugin.user_id == current_user.id,
            UserPlugin.plugin_id == plugin.id
        )
        result = await db.execute(stmt)
        user_plugin = result.scalar_one_or_none()

        installed = user_plugin is not None
        configured = False

        if installed and user_plugin.user_config:
            config = user_plugin.user_config
            if (config.get("smtp_host") and 
                config.get("smtp_port") and 
                config.get("sender_email") and 
                config.get("password_or_api_key")):
                configured = True

        return {
            "plugin_key": "sales_email_marketing",
            "name": plugin.name,
            "description": plugin.description,
            "version": plugin.version or "1.0.0",
            "developer": "Saadhyam AI",
            "category": "Marketing",
            "permissions": ["SMTP Access", "Network Outbound"],
            "features": ["SMTP Configuration", "SMTP Connection Test", "Bulk Sending (Phase 2)"],
            "required_configuration_fields": ["smtp_host", "smtp_port", "sender_email", "password_or_api_key"],
            "installed": installed,
            "configured": configured
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get Email Marketing details: {e}")
        raise HTTPException(status_code=500, detail="Failed to get details")


@router.post("/email_marketing/config")
async def save_email_marketing_config(
    config_data: EmailMarketingConfigSave,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Check if installed
        res = await db.execute(
            select(Plugin).where(Plugin.plugin_key == "sales_email_marketing")
        )
        plugin = res.scalar_one_or_none()
        if not plugin:
            raise HTTPException(status_code=404, detail="Email Marketing plugin not found")

        stmt = select(UserPlugin).where(
            UserPlugin.user_id == current_user.id,
            UserPlugin.plugin_id == plugin.id
        )
        result = await db.execute(stmt)
        user_plugin = result.scalar_one_or_none()

        if not user_plugin:
            raise HTTPException(status_code=404, detail="Email Marketing plugin is not installed for this user.")

        # Save config
        user_plugin.user_config = {
            "smtp_host": config_data.smtp_host,
            "smtp_port": config_data.smtp_port,
            "sender_email": config_data.sender_email,
            "password_or_api_key": config_data.password_or_api_key,
            "sender_name": config_data.sender_name
        }

        db.add(user_plugin)
        await db.commit()

        return {
            "success": True,
            "message": "Configuration saved successfully",
            "config": user_plugin.user_config
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save Email Marketing configuration: {e}")
        raise HTTPException(status_code=500, detail="Failed to save configuration")


@router.post("/email_marketing/test")
async def test_email_marketing_connection(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Get UserPlugin config
        res = await db.execute(
            select(Plugin).where(Plugin.plugin_key == "sales_email_marketing")
        )
        plugin = res.scalar_one_or_none()
        if not plugin:
            return {"success": False, "message": "Email Marketing plugin not found"}

        stmt = select(UserPlugin).where(
            UserPlugin.user_id == current_user.id,
            UserPlugin.plugin_id == plugin.id
        )
        result = await db.execute(stmt)
        user_plugin = result.scalar_one_or_none()

        if not user_plugin or not user_plugin.user_config:
            return {"success": False, "message": "No configuration saved. Please configure and save first."}

        config = user_plugin.user_config
        host = config.get("smtp_host")
        port = config.get("smtp_port")
        email = config.get("sender_email")
        password = config.get("password_or_api_key")

        if not host or not port or not email or not password:
            return {"success": False, "message": "Missing required fields in configuration"}

        import smtplib
        import asyncio

        def run_smtp_test():
            server = None
            try:
                port_int = int(port)
                # Try secure SSL first for port 465, else standard starttls
                if port_int == 465:
                    server = smtplib.SMTP_SSL(host, port_int, timeout=10)
                else:
                    server = smtplib.SMTP(host, port_int, timeout=10)
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                
                server.login(email, password)
                return {"success": True, "message": "Connection successful"}
            except Exception as e:
                return {"success": False, "message": str(e)}
            finally:
                if server:
                    try:
                        server.quit()
                    except Exception:
                        pass

        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(None, run_smtp_test)
        return res

    except Exception as e:
        logger.error(f"Error during SMTP connection testing: {e}")
        return {"success": False, "message": str(e)}


# ---------------------------------------------------------------------------
# TEMPORARY DEBUG ENDPOINT – remove before production
# ---------------------------------------------------------------------------
@router.get("/debug/user-plugins", tags=["debug"])
async def debug_list_all_user_plugins(db: AsyncSession = Depends(get_db)):
    """
    TEMPORARY – lists every row in the user_plugins table with its related
    plugin eagerly loaded.  No auth required so it is easy to call from a
    browser or curl.  Remove this endpoint once debugging is complete.
    """
    try:
        stmt = (
            select(UserPlugin)
            .options(selectinload(UserPlugin.plugin))
            .order_by(UserPlugin.id)
        )
        result = await db.execute(stmt)
        rows = result.scalars().all()

        data = []
        for up in rows:
            plugin = up.plugin  # already eager-loaded, no lazy-load needed
            data.append({
                "user_plugin_id":    up.id,
                "user_id":           up.user_id,
                "plugin_id":         up.plugin_id,
                "plugin_key":        plugin.plugin_key if plugin else None,
                "plugin_name":       plugin.name if plugin else None,
                "is_enabled":        up.is_enabled,
                "installed_version": up.installed_version,
                "installation_date": up.created_at.isoformat() if up.created_at else None,
                "usage_count":       up.usage_count,
            })

        return {
            "total": len(data),
            "user_plugins": data,
        }
    except Exception as e:
        logger.error(f"[debug] Failed to list user plugins: {e}")
        raise HTTPException(status_code=500, detail=f"Debug query failed: {str(e)}")
# ---------------------------------------------------------------------------
# END TEMPORARY DEBUG ENDPOINT
# ---------------------------------------------------------------------------

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