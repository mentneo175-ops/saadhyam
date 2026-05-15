"""
AI Voice Agent API Routes
Endpoints for voice campaigns, calls, leads, and analytics
"""

import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, Field

from config.database import get_db
from utils.dependencies import get_current_user
from services.voice_agent_service import voice_agent_service
from models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice-agent", tags=["Voice Agent"])


# ==================== Request/Response Models ====================

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    language: str = Field(default="english", pattern="^(telugu|hinglish|english)$")
    voice_type: str = Field(default="female", pattern="^(male|female)$")
    script_template: Optional[str] = None
    scheduled_start: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ContactCreate(BaseModel):
    name: str
    phone_number: str
    email: Optional[str] = None
    custom_data: Optional[dict] = None


class ContactsBulkCreate(BaseModel):
    contacts: List[ContactCreate]


class CallUpdate(BaseModel):
    status: str
    duration: Optional[int] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    sentiment: Optional[str] = None
    outcome: Optional[str] = None


class LeadUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class ConversationRequest(BaseModel):
    campaign_id: int
    customer_message: str
    conversation_history: Optional[List[dict]] = None


# ==================== Campaign Endpoints ====================

@router.post("/campaigns", status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new voice campaign"""
    try:
        campaign = voice_agent_service.create_campaign(
            db=db,
            user_id=current_user.id,
            name=campaign_data.name,
            description=campaign_data.description,
            language=campaign_data.language,
            voice_type=campaign_data.voice_type,
            script_template=campaign_data.script_template,
            scheduled_start=campaign_data.scheduled_start
        )
        
        return {
            "success": True,
            "message": "Campaign created successfully",
            "campaign": campaign.to_dict()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to create campaign: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create campaign: {str(e)}"
        )


@router.get("/campaigns")
async def get_campaigns(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get user's voice campaigns"""
    try:
        campaigns = voice_agent_service.get_campaigns(
            db=db,
            user_id=current_user.id,
            status=status_filter,
            skip=skip,
            limit=limit
        )
        
        return {
            "success": True,
            "total": len(campaigns),
            "campaigns": [c.to_dict() for c in campaigns]
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get campaigns: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get campaigns: {str(e)}"
        )


@router.get("/campaigns/{campaign_id}")
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get campaign details"""
    try:
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        return {
            "success": True,
            "campaign": campaign.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get campaign: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get campaign: {str(e)}"
        )


@router.patch("/campaigns/{campaign_id}/status")
async def update_campaign_status(
    campaign_id: int,
    status_update: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update campaign status (draft, active, paused, completed, cancelled)"""
    try:
        campaign = voice_agent_service.update_campaign_status(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
            status=status_update
        )
        
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        return {
            "success": True,
            "message": f"Campaign status updated to {status_update}",
            "campaign": campaign.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update campaign status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update campaign status: {str(e)}"
        )


# ==================== Contact Endpoints ====================

@router.post("/campaigns/{campaign_id}/contacts/bulk", status_code=status.HTTP_201_CREATED)
async def add_contacts_bulk(
    campaign_id: int,
    contacts_data: ContactsBulkCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Add multiple contacts to campaign"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        contacts_list = [c.dict() for c in contacts_data.contacts]
        added_count = voice_agent_service.add_contacts_bulk(
            db=db,
            campaign_id=campaign_id,
            contacts=contacts_list
        )
        
        return {
            "success": True,
            "message": f"Added {added_count} contacts to campaign",
            "added_count": added_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to add contacts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add contacts: {str(e)}"
        )


@router.get("/campaigns/{campaign_id}/contacts")
async def get_campaign_contacts(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get contacts for a campaign"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        contacts = voice_agent_service.get_campaign_contacts(
            db=db,
            campaign_id=campaign_id,
            skip=skip,
            limit=limit
        )
        
        return {
            "success": True,
            "total": len(contacts),
            "contacts": [
                {
                    "id": c.id,
                    "name": c.name,
                    "phone_number": c.phone_number,
                    "email": c.email,
                    "call_attempts": c.call_attempts,
                    "is_completed": c.is_completed,
                    "created_at": c.created_at.isoformat() if c.created_at else None
                }
                for c in contacts
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get contacts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get contacts: {str(e)}"
        )


# ==================== Call Endpoints ====================

@router.get("/campaigns/{campaign_id}/calls")
async def get_campaign_calls(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get calls for a campaign"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        calls = voice_agent_service.get_campaign_calls(
            db=db,
            campaign_id=campaign_id,
            status=status_filter,
            skip=skip,
            limit=limit
        )
        
        return {
            "success": True,
            "total": len(calls),
            "calls": [c.to_dict() for c in calls]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get calls: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get calls: {str(e)}"
        )


# ==================== AI Conversation Endpoints ====================

@router.post("/conversation/generate-response")
async def generate_conversation_response(
    request: ConversationRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate AI response for customer conversation"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, request.campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        response = voice_agent_service.generate_conversation_response(
            campaign=campaign,
            customer_message=request.customer_message,
            conversation_history=request.conversation_history
        )
        
        return {
            "success": True,
            "response": response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to generate response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}"
        )


# ==================== Lead Endpoints ====================

@router.get("/campaigns/{campaign_id}/leads")
async def get_campaign_leads(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get leads for a campaign"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        leads = voice_agent_service.get_campaign_leads(
            db=db,
            campaign_id=campaign_id,
            status=status_filter,
            skip=skip,
            limit=limit
        )
        
        return {
            "success": True,
            "total": len(leads),
            "leads": [l.to_dict() for l in leads]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get leads: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get leads: {str(e)}"
        )


@router.patch("/leads/{lead_id}/status")
async def update_lead_status(
    lead_id: int,
    lead_update: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update lead status"""
    try:
        lead = voice_agent_service.update_lead_status(
            db=db,
            lead_id=lead_id,
            status=lead_update.status,
            notes=lead_update.notes
        )
        
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found"
            )
        
        return {
            "success": True,
            "message": "Lead status updated",
            "lead": lead.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update lead: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update lead: {str(e)}"
        )


# ==================== Analytics Endpoints ====================

@router.get("/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get campaign analytics and statistics"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        analytics = voice_agent_service.get_campaign_analytics(db, campaign_id)
        
        return {
            "success": True,
            "analytics": analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )


@router.get("/dashboard/overview")
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get overview statistics for dashboard"""
    try:
        campaigns = voice_agent_service.get_campaigns(db, current_user.id, limit=1000)
        
        total_campaigns = len(campaigns)
        active_campaigns = len([c for c in campaigns if c.status.value == "active"])
        total_calls = sum(c.calls_completed for c in campaigns)
        total_leads = sum(len(c.leads) for c in campaigns)
        
        return {
            "success": True,
            "overview": {
                "total_campaigns": total_campaigns,
                "active_campaigns": active_campaigns,
                "total_calls": total_calls,
                "total_leads": total_leads,
                "recent_campaigns": [c.to_dict() for c in campaigns[:5]]
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get dashboard overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard overview: {str(e)}"
        )


# ==================== Call Processing Endpoints ====================

@router.post("/campaigns/{campaign_id}/start-calling")
async def start_campaign_calling(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Start automated calling for a campaign
    
    This will:
    1. Validate campaign has contacts
    2. Update status to 'active'
    3. Queue all contacts for calling
    4. Start background processing
    """
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Check if campaign has contacts
        if campaign.total_contacts == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campaign has no contacts. Please add contacts before starting."
            )
        
        # Update campaign status to active
        campaign = voice_agent_service.update_campaign_status(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
            status="active"
        )
        
        # Import and trigger Celery task
        from tasks.voice_call_tasks import start_campaign_calling as start_calling_task
        task = start_calling_task.delay(campaign_id)
        
        logger.info(f"🚀 Started calling for campaign {campaign_id}, task_id: {task.id}")
        
        return {
            "success": True,
            "message": "Campaign calling started",
            "campaign_id": campaign_id,
            "task_id": task.id,
            "total_contacts": campaign.total_contacts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to start campaign calling: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start campaign calling: {str(e)}"
        )


@router.get("/campaigns/{campaign_id}/call-progress")
async def get_campaign_call_progress(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get real-time progress of campaign calls
    
    Returns:
        - Total contacts
        - Calls completed/failed/queued/in-progress
        - Current active call details
        - Progress percentage
    """
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Get progress from queue service
        from services.voice_call_queue_service import voice_call_queue_service
        progress = voice_call_queue_service.get_campaign_call_progress(db, campaign_id)
        
        return {
            "success": True,
            "progress": progress
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get call progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get call progress: {str(e)}"
        )


@router.post("/campaigns/{campaign_id}/pause-calling")
async def pause_campaign_calling(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Pause an active campaign"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Update status to paused
        campaign = voice_agent_service.update_campaign_status(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
            status="paused"
        )
        
        logger.info(f"⏸️ Paused campaign {campaign_id}")
        
        return {
            "success": True,
            "message": "Campaign paused",
            "campaign": campaign.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to pause campaign: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pause campaign: {str(e)}"
        )


@router.post("/campaigns/{campaign_id}/resume-calling")
async def resume_campaign_calling(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Resume a paused campaign"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Update status to active
        campaign = voice_agent_service.update_campaign_status(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
            status="active"
        )
        
        # Resume processing
        from tasks.voice_call_tasks import resume_campaign
        task = resume_campaign.delay(campaign_id)
        
        logger.info(f"▶️ Resumed campaign {campaign_id}, task_id: {task.id}")
        
        return {
            "success": True,
            "message": "Campaign resumed",
            "campaign": campaign.to_dict(),
            "task_id": task.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to resume campaign: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resume campaign: {str(e)}"
        )


