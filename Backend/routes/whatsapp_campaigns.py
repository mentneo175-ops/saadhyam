"""
WhatsApp Campaigns Routes
Handles campaign creation, scheduling, and management
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from config.database import get_sync_db
from models.user import User
from models.whatsapp_account import WhatsAppAccount
from models.whatsapp_campaign import WhatsAppCampaign, CampaignStatus
from utils.dependencies import get_current_user
from services.whatsapp_campaign_service import campaign_service
from tasks.whatsapp_tasks import process_scheduled_campaigns

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp/campaigns", tags=["whatsapp-campaigns"])


class CreateCampaignRequest(BaseModel):
    """Request model for creating a campaign"""
    title: str
    description: Optional[str] = None
    message_content: str
    recipient_list: List[str]
    scheduled_time: Optional[str] = None  # ISO format datetime
    template_name: Optional[str] = None


class UpdateCampaignRequest(BaseModel):
    """Request model for updating a campaign"""
    title: Optional[str] = None
    description: Optional[str] = None
    message_content: Optional[str] = None
    recipient_list: Optional[List[str]] = None
    scheduled_time: Optional[str] = None


@router.post("")
async def create_campaign(
    request: CreateCampaignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
):
    """
    Create a new WhatsApp campaign
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="No active WhatsApp account found")
        
        # Parse scheduled time if provided
        scheduled_time = None
        if request.scheduled_time:
            try:
                scheduled_time = datetime.fromisoformat(request.scheduled_time.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid scheduled_time format. Use ISO format.")
        
        # Create campaign
        campaign = campaign_service.create_campaign(
            db=db,
            user_id=current_user.id,
            account_id=account.id,
            title=request.title,
            message_content=request.message_content,
            recipient_list=request.recipient_list,
            scheduled_time=scheduled_time,
            template_name=request.template_name,
            description=request.description
        )
        
        return {
            "success": True,
            "campaign": {
                "id": campaign.id,
                "title": campaign.title,
                "status": campaign.campaign_status.value,
                "total_recipients": campaign.total_recipients,
                "scheduled_time": campaign.scheduled_time.isoformat() if campaign.scheduled_time else None,
                "created_at": campaign.created_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating campaign: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def get_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get all campaigns for the current user
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            return {"campaigns": [], "total": 0}
        
        # Build query
        query = db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.account_id == account.id
        )
        
        # Filter by status if provided
        if status:
            try:
                campaign_status = CampaignStatus(status)
                query = query.filter(WhatsAppCampaign.campaign_status == campaign_status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        # Order by created date (newest first)
        query = query.order_by(desc(WhatsAppCampaign.created_at))
        
        total = query.count()
        campaigns = query.offset(offset).limit(limit).all()
        
        # Format campaigns
        formatted_campaigns = [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "status": c.campaign_status.value,
                "total_recipients": c.total_recipients,
                "sent_count": c.sent_count,
                "delivered_count": c.delivered_count,
                "read_count": c.read_count,
                "failed_count": c.failed_count,
                "reply_count": c.reply_count,
                "scheduled_time": c.scheduled_time.isoformat() if c.scheduled_time else None,
                "start_time": c.start_time.isoformat() if c.start_time else None,
                "end_time": c.end_time.isoformat() if c.end_time else None,
                "created_at": c.created_at.isoformat()
            }
            for c in campaigns
        ]
        
        return {
            "campaigns": formatted_campaigns,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting campaigns: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
):
    """
    Get a specific campaign by ID
    """
    try:
        campaign = db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.id == campaign_id,
            WhatsAppCampaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return {
            "id": campaign.id,
            "title": campaign.title,
            "description": campaign.description,
            "message_content": campaign.message_content,
            "template_name": campaign.template_name,
            "status": campaign.campaign_status.value,
            "recipient_list": campaign.recipient_list,
            "total_recipients": campaign.total_recipients,
            "sent_count": campaign.sent_count,
            "delivered_count": campaign.delivered_count,
            "read_count": campaign.read_count,
            "failed_count": campaign.failed_count,
            "reply_count": campaign.reply_count,
            "scheduled_time": campaign.scheduled_time.isoformat() if campaign.scheduled_time else None,
            "start_time": campaign.start_time.isoformat() if campaign.start_time else None,
            "end_time": campaign.end_time.isoformat() if campaign.end_time else None,
            "error_message": campaign.error_message,
            "created_at": campaign.created_at.isoformat(),
            "updated_at": campaign.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting campaign: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{campaign_id}")
async def update_campaign(
    campaign_id: int,
    request: UpdateCampaignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
):
    """
    Update a campaign (only if status is DRAFT or SCHEDULED)
    """
    try:
        campaign = db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.id == campaign_id,
            WhatsAppCampaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        if campaign.campaign_status not in [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot update campaign with status {campaign.campaign_status.value}"
            )
        
        # Update fields
        if request.title is not None:
            campaign.title = request.title
        if request.description is not None:
            campaign.description = request.description
        if request.message_content is not None:
            campaign.message_content = request.message_content
        if request.recipient_list is not None:
            campaign.recipient_list = request.recipient_list
            campaign.total_recipients = len(request.recipient_list)
        if request.scheduled_time is not None:
            try:
                campaign.scheduled_time = datetime.fromisoformat(request.scheduled_time.replace('Z', '+00:00'))
                campaign.campaign_status = CampaignStatus.SCHEDULED
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid scheduled_time format")
        
        campaign.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(campaign)
        
        return {
            "success": True,
            "campaign": {
                "id": campaign.id,
                "title": campaign.title,
                "status": campaign.campaign_status.value,
                "updated_at": campaign.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating campaign: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{campaign_id}/execute")
async def execute_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
):
    """
    Execute a campaign immediately
    """
    try:
        campaign = db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.id == campaign_id,
            WhatsAppCampaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        if campaign.campaign_status not in [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot execute campaign with status {campaign.campaign_status.value}"
            )
        
        # Execute campaign
        result = campaign_service.execute_campaign(db, campaign_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to execute campaign"))
        
        return {
            "success": True,
            "sent_count": result.get("sent_count"),
            "failed_count": result.get("failed_count"),
            "total_recipients": result.get("total_recipients")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error executing campaign: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
):
    """
    Delete a campaign (only if status is DRAFT or FAILED)
    """
    try:
        campaign = db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.id == campaign_id,
            WhatsAppCampaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        if campaign.campaign_status not in [CampaignStatus.DRAFT, CampaignStatus.FAILED]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete campaign with status {campaign.campaign_status.value}"
            )
        
        db.delete(campaign)
        db.commit()
        
        return {"success": True, "message": "Campaign deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting campaign: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}/analytics")
async def get_campaign_analytics(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
):
    """
    Get detailed analytics for a campaign
    """
    try:
        campaign = db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.id == campaign_id,
            WhatsAppCampaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Get analytics
        analytics = campaign_service.get_campaign_analytics(db, campaign_id)
        
        if not analytics.get("success"):
            raise HTTPException(status_code=500, detail="Failed to get analytics")
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting campaign analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
