"""
WhatsApp Automation Routes
Handles automation rules, follow-ups, and auto-replies
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from config.database import get_db
from models.user import User
from models.whatsapp_account import WhatsAppAccount
from models.whatsapp_automation import WhatsAppAutomation, AutomationType, TriggerEvent
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp/automation", tags=["whatsapp-automation"])


class CreateAutomationRequest(BaseModel):
    """Request model for creating an automation"""
    name: str
    description: Optional[str] = None
    automation_type: str  # auto_reply, follow_up, welcome_message, etc.
    trigger_event: str  # new_message, no_reply, keyword_match, etc.
    trigger_keywords: Optional[List[str]] = None
    message_template: str
    use_ai: Optional[bool] = False
    delay_minutes: Optional[int] = 0
    working_hours: Optional[Dict[str, Any]] = None


class UpdateAutomationRequest(BaseModel):
    """Request model for updating an automation"""
    name: Optional[str] = None
    description: Optional[str] = None
    message_template: Optional[str] = None
    use_ai: Optional[bool] = None
    delay_minutes: Optional[int] = None
    working_hours: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None
    trigger_keywords: Optional[List[str]] = None


@router.post("")
async def create_automation(
    request: CreateAutomationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new automation rule
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="No active WhatsApp account found")
        
        # Validate automation type
        try:
            automation_type = AutomationType(request.automation_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid automation_type: {request.automation_type}")
        
        # Validate trigger event
        try:
            trigger_event = TriggerEvent(request.trigger_event)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid trigger_event: {request.trigger_event}")
        
        # Create automation
        automation = WhatsAppAutomation(
            account_id=account.id,
            user_id=current_user.id,
            name=request.name,
            description=request.description,
            automation_type=automation_type,
            trigger_event=trigger_event,
            trigger_keywords=request.trigger_keywords,
            message_template=request.message_template,
            use_ai=request.use_ai or False,
            delay_minutes=request.delay_minutes or 0,
            working_hours=request.working_hours,
            is_enabled=True
        )
        
        db.add(automation)
        await db.commit()
        await db.refresh(automation)
        
        logger.info(f"✅ Created automation: {automation.id} - {automation.name}")
        
        return {
            "success": True,
            "automation": {
                "id": automation.id,
                "name": automation.name,
                "automation_type": automation.automation_type.value,
                "trigger_event": automation.trigger_event.value,
                "is_enabled": automation.is_enabled,
                "created_at": automation.created_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating automation: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def get_automations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    automation_type: Optional[str] = Query(None),
    is_enabled: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get all automations for the current user
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            return {"automations": [], "total": 0}
        
        # Build query
        query = db.query(WhatsAppAutomation).filter(
            WhatsAppAutomation.account_id == account.id
        )
        
        # Filter by automation type if provided
        if automation_type:
            try:
                auto_type = AutomationType(automation_type)
                query = query.filter(WhatsAppAutomation.automation_type == auto_type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid automation_type: {automation_type}")
        
        # Filter by enabled status if provided
        if is_enabled is not None:
            query = query.filter(WhatsAppAutomation.is_enabled == is_enabled)
        
        # Order by created date (newest first)
        query = query.order_by(desc(WhatsAppAutomation.created_at))
        
        total = query.count()
        automations = query.offset(offset).limit(limit).all()
        
        # Format automations
        formatted_automations = [
            {
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "automation_type": a.automation_type.value,
                "trigger_event": a.trigger_event.value,
                "trigger_keywords": a.trigger_keywords,
                "message_template": a.message_template,
                "use_ai": a.use_ai,
                "delay_minutes": a.delay_minutes,
                "working_hours": a.working_hours,
                "is_enabled": a.is_enabled,
                "triggered_count": a.triggered_count,
                "sent_count": a.sent_count,
                "success_count": a.success_count,
                "failed_count": a.failed_count,
                "last_triggered_at": a.last_triggered_at.isoformat() if a.last_triggered_at else None,
                "created_at": a.created_at.isoformat()
            }
            for a in automations
        ]
        
        return {
            "automations": formatted_automations,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting automations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{automation_id}")
async def get_automation(
    automation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific automation by ID
    """
    try:
        automation = db.query(WhatsAppAutomation).filter(
            WhatsAppAutomation.id == automation_id,
            WhatsAppAutomation.user_id == current_user.id
        ).first()
        
        if not automation:
            raise HTTPException(status_code=404, detail="Automation not found")
        
        return {
            "id": automation.id,
            "name": automation.name,
            "description": automation.description,
            "automation_type": automation.automation_type.value,
            "trigger_event": automation.trigger_event.value,
            "trigger_keywords": automation.trigger_keywords,
            "message_template": automation.message_template,
            "use_ai": automation.use_ai,
            "delay_minutes": automation.delay_minutes,
            "working_hours": automation.working_hours,
            "is_enabled": automation.is_enabled,
            "triggered_count": automation.triggered_count,
            "sent_count": automation.sent_count,
            "success_count": automation.success_count,
            "failed_count": automation.failed_count,
            "last_triggered_at": automation.last_triggered_at.isoformat() if automation.last_triggered_at else None,
            "created_at": automation.created_at.isoformat(),
            "updated_at": automation.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting automation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{automation_id}")
async def update_automation(
    automation_id: int,
    request: UpdateAutomationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an automation
    """
    try:
        automation = db.query(WhatsAppAutomation).filter(
            WhatsAppAutomation.id == automation_id,
            WhatsAppAutomation.user_id == current_user.id
        ).first()
        
        if not automation:
            raise HTTPException(status_code=404, detail="Automation not found")
        
        # Update fields
        if request.name is not None:
            automation.name = request.name
        if request.description is not None:
            automation.description = request.description
        if request.message_template is not None:
            automation.message_template = request.message_template
        if request.use_ai is not None:
            automation.use_ai = request.use_ai
        if request.delay_minutes is not None:
            automation.delay_minutes = request.delay_minutes
        if request.working_hours is not None:
            automation.working_hours = request.working_hours
        if request.is_enabled is not None:
            automation.is_enabled = request.is_enabled
        if request.trigger_keywords is not None:
            automation.trigger_keywords = request.trigger_keywords
        
        automation.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(automation)
        
        return {
            "success": True,
            "automation": {
                "id": automation.id,
                "name": automation.name,
                "is_enabled": automation.is_enabled,
                "updated_at": automation.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating automation: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{automation_id}/toggle")
async def toggle_automation(
    automation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle automation enabled/disabled status
    """
    try:
        automation = db.query(WhatsAppAutomation).filter(
            WhatsAppAutomation.id == automation_id,
            WhatsAppAutomation.user_id == current_user.id
        ).first()
        
        if not automation:
            raise HTTPException(status_code=404, detail="Automation not found")
        
        automation.is_enabled = not automation.is_enabled
        automation.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(automation)
        
        return {
            "success": True,
            "is_enabled": automation.is_enabled,
            "message": f"Automation {'enabled' if automation.is_enabled else 'disabled'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error toggling automation: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{automation_id}")
async def delete_automation(
    automation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an automation
    """
    try:
        automation = db.query(WhatsAppAutomation).filter(
            WhatsAppAutomation.id == automation_id,
            WhatsAppAutomation.user_id == current_user.id
        ).first()
        
        if not automation:
            raise HTTPException(status_code=404, detail="Automation not found")
        
        await db.delete(automation)
        await db.commit()
        
        return {"success": True, "message": "Automation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting automation: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/overview")
async def get_automation_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get automation statistics overview
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            return {
                "total_automations": 0,
                "enabled_automations": 0,
                "total_triggered": 0,
                "total_sent": 0,
                "success_rate": 0
            }
        
        # Get all automations
        automations = db.query(WhatsAppAutomation).filter(
            WhatsAppAutomation.account_id == account.id
        ).all()
        
        total_automations = len(automations)
        enabled_automations = sum(1 for a in automations if a.is_enabled)
        total_triggered = sum(a.triggered_count for a in automations)
        total_sent = sum(a.sent_count for a in automations)
        total_success = sum(a.success_count for a in automations)
        
        success_rate = (total_success / total_sent * 100) if total_sent > 0 else 0
        
        return {
            "total_automations": total_automations,
            "enabled_automations": enabled_automations,
            "total_triggered": total_triggered,
            "total_sent": total_sent,
            "success_rate": round(success_rate, 2)
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting automation stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
