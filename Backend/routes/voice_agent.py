"""
AI Voice Agent API Routes
Endpoints for voice campaigns, calls, leads, and analytics
"""

import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect, Form
from pydantic import BaseModel, Field

from config.database import get_db_sync
from sqlalchemy.orm import Session
from sqlalchemy import and_
from utils.dependencies import get_current_user
from services.voice_agent_service import voice_agent_service
from services.streaming_handler import ExotelStreamHandler
from models.user import User
from models.voice_agent import VoiceCall, VoiceCampaign, VoiceContact, VoiceLead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice-agent", tags=["Voice Agent"])


# ==================== Request/Response Models ====================

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    language: str = Field(default="english", pattern="^(telugu|hinglish|english|hindi|tamil)$")
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync),
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync)
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


@router.delete("/campaigns/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Delete a voice campaign and all its associated contacts, calls, and leads"""
    try:
        success = voice_agent_service.delete_campaign(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
            
        return {
            "success": True,
            "message": "Campaign deleted successfully"
        }
        
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete campaign: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete campaign: {str(e)}"
        )


# ==================== Contact Endpoints ====================

@router.post("/campaigns/{campaign_id}/contacts/bulk", status_code=status.HTTP_201_CREATED)
async def add_contacts_bulk(
    campaign_id: int,
    contacts_data: ContactsBulkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync),
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
    db: Session = Depends(get_db_sync),
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


@router.patch("/calls/{call_id}")
def update_call(
    call_id: int,
    call_data: CallUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Update a call's status and details (e.g. transcript, duration, sentiment, outcome)
    and create a lead if interested.
    """
    try:
        # Get the call
        call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )
            
        # Verify campaign ownership
        campaign = db.query(VoiceCampaign).filter(
            and_(
                VoiceCampaign.id == call.campaign_id,
                VoiceCampaign.user_id == current_user.id
            )
        ).first()
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this campaign"
            )
            
        # Generate AI-based notes (requirements), key quote, summary, and sentiment if transcript is available
        extracted_requirements = None
        extracted_key_quote = None
        final_summary = call_data.summary
        final_sentiment = call_data.sentiment

        if call_data.transcript and call_data.status == "completed":
            extracted_requirements = voice_agent_service.extract_specific_requirements(call_data.transcript)
            extracted_key_quote = voice_agent_service.extract_key_quote(call_data.transcript)
            
            # If the summary is empty or is the default generic frontend summary, override with AI generated summary
            if not call_data.summary or "Interactive test call completed" in call_data.summary:
                try:
                    generated_summary = voice_agent_service.generate_conversation_summary(call_data.transcript)
                    if generated_summary:
                        final_summary = generated_summary
                except Exception as e:
                    logger.warning(f"Failed to generate summary: {e}")
            
            # If sentiment is generic or neutral, override with AI sentiment
            if not call_data.sentiment or call_data.sentiment == "neutral":
                try:
                    generated_sentiment = voice_agent_service.analyze_conversation_sentiment(call_data.transcript)
                    if generated_sentiment:
                        final_sentiment = generated_sentiment
                except Exception as e:
                    logger.warning(f"Failed to analyze sentiment: {e}")

        # Update call fields using voice_agent_service
        updated_call = voice_agent_service.update_call_status(
            db=db,
            call_id=call_id,
            status=call_data.status,
            duration=call_data.duration,
            transcript=call_data.transcript,
            summary=final_summary,
            sentiment=final_sentiment,
            outcome=call_data.outcome
        )
        
        if updated_call:
            if extracted_requirements:
                updated_call.notes = extracted_requirements
            if extracted_key_quote:
                updated_call.key_quote = extracted_key_quote
            db.commit()
            db.refresh(updated_call)
        
        # Update contact if completed
        contact = db.query(VoiceContact).filter(VoiceContact.id == call.contact_id).first()
        if contact:
            if call_data.status in ["completed", "failed"]:
                contact.call_attempts += 1
                contact.is_completed = True
                contact.last_call_at = datetime.utcnow()
                
        # Update campaign stats if completed
        if call_data.status == "completed":
            campaign.calls_completed = (campaign.calls_completed or 0) + 1
            campaign.calls_pending = max(0, (campaign.calls_pending or 1) - 1)
            
            # Calculate average call duration
            if call_data.duration is not None:
                prev_completed = campaign.calls_completed - 1
                if prev_completed > 0:
                    total_duration = (campaign.avg_call_duration or 0.0) * prev_completed
                    campaign.avg_call_duration = (total_duration + call_data.duration) / campaign.calls_completed
                else:
                    campaign.avg_call_duration = float(call_data.duration)
        elif call_data.status == "failed":
            campaign.calls_failed = (campaign.calls_failed or 0) + 1
            campaign.calls_pending = max(0, (campaign.calls_pending or 1) - 1)
            
        # Create lead if outcome is interested, callback_requested or follow_up_required
        if call_data.outcome in ["interested", "callback_requested", "follow_up_required"]:
            # Check if lead already exists
            existing_lead = db.query(VoiceLead).filter(
                and_(
                    VoiceLead.campaign_id == call.campaign_id,
                    VoiceLead.contact_id == call.contact_id
                )
            ).first()
            
            if not existing_lead:
                lead_score = 50
                if call_data.outcome == "interested":
                    lead_score = 80
                    status_val = "interested"
                elif call_data.outcome == "callback_requested":
                    lead_score = 70
                    status_val = "callback_requested"
                else:
                    lead_score = 50
                    status_val = "follow_up_required"
                    
                voice_agent_service.create_lead_from_call(
                    db=db,
                    call=call,
                    status=status_val,
                    lead_score=lead_score,
                    notes=extracted_requirements,
                    key_quote=extracted_key_quote
                )
                
        # Calculate conversion rate (leads / completed calls)
        total_leads = db.query(VoiceLead).filter(VoiceLead.campaign_id == campaign.id).count()
        campaign.conversion_rate = (total_leads / campaign.calls_completed * 100) if campaign.calls_completed and campaign.calls_completed > 0 else 0.0
        
        db.commit()
        
        return {
            "success": True,
            "message": "Call updated successfully",
            "call": updated_call.to_dict() if updated_call else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update call: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update call: {str(e)}"
        )


# ==================== AI Conversation Endpoints ====================

@router.post("/conversation/generate-response")
async def generate_conversation_response(
    request: ConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync),
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync)
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
    run_background: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Start calling for a campaign (supports background Celery or frontend interactive mode)
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
        
        # Queue all calls (creates VoiceCall records if they don't exist)
        from services.voice_call_queue_service import voice_call_queue_service
        queue_result = voice_call_queue_service.start_campaign_calls(db, campaign_id)
        
        # Update campaign status to active
        campaign = voice_agent_service.update_campaign_status(
            db=db,
            campaign_id=campaign_id,
            user_id=current_user.id,
            status="active"
        )
        
        task_id = None
        if run_background:
            # Trigger Celery task
            from tasks.voice_call_tasks import process_campaign_calls as process_calls_task
            task = process_calls_task.delay(campaign_id)
            task_id = task.id
            logger.info(f"🚀 Started background calling for campaign {campaign_id}, task_id: {task_id}")
        else:
            logger.info(f"📱 Started interactive calling for campaign {campaign_id} (no background worker)")
            
        return {
            "success": True,
            "message": "Campaign calling started" if run_background else "Interactive calling mode ready",
            "campaign_id": campaign_id,
            "task_id": task_id,
            "total_contacts": campaign.total_contacts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"❌ Failed to start campaign calling: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start campaign calling: {str(e)}"
        )


@router.get("/campaigns/{campaign_id}/call-progress")
async def get_campaign_call_progress(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync)
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


# ==================== Exotel WebSocket & Webhook routes ====================

@router.websocket("/stream/{call_id}")
async def exotel_ws_stream(websocket: WebSocket, call_id: int):
    """Bidirectional WebSocket stream connection from Exotel AgentStream"""
    handler = ExotelStreamHandler(websocket, call_id)
    init_success = await handler.initialize()
    if not init_success:
        await websocket.close()
        return

    # Accept connection
    await websocket.accept()
    
    # Trigger initial greeting
    await handler.speak_greeting()
    
    # Connect to Deepgram STT
    await handler.start_deepgram_stt()
    
    # Run media handler & listening concurrently
    try:
        await handler.handle_exotel_media()
    except WebSocketDisconnect:
        logger.info(f"🔌 Exotel WebSocket disconnected for Call {call_id}")
    except Exception as e:
        logger.error(f"❌ Error in Exotel WebSocket stream: {e}")
    finally:
        await handler.close_call()


@router.post("/webhooks/exotel-status")
async def exotel_status_callback(
    CallSid: str = Form(...),
    Status: str = Form(...),
    RecordingUrl: Optional[str] = Form(None),
    db: Session = Depends(get_db_sync)
):
    """
    Status Callback endpoint for Exotel outbound call attempts.
    Guaranteed to fire for every call attempt (connected, failed, busy, no-answer).
    """
    logger.info(f"📞 Exotel Status Callback received - CallSid: {CallSid}, Status: {Status}")
    
    try:
        # Find call by call_sid
        call = db.query(VoiceCall).filter(VoiceCall.call_sid == CallSid).first()
        if not call:
            logger.warning(f"⚠️ Call with CallSid {CallSid} not found in DB")
            return {"status": "ignored", "message": "Call SID not found"}

        # If status is busy/no-answer/failed, update database and trigger next call
        if Status in ["failed", "no-answer", "busy"] and call.status == CallStatus.CALLING:
            call.status = CallStatus.FAILED
            call.ended_at = datetime.utcnow()
            call.call_outcome = Status.lower().replace("-", "_")
            call.duration = 0
            
            # Update contact
            contact = db.query(VoiceContact).filter(VoiceContact.id == call.contact_id).first()
            if contact:
                contact.call_attempts += 1
                
            # Update campaign stats
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id).first()
            if campaign:
                campaign.calls_failed = (campaign.calls_failed or 0) + 1
                campaign.calls_pending = max(0, (campaign.calls_pending or 1) - 1)
                
            db.commit()
            logger.info(f"❌ Call {call.id} marked as FAILED via StatusCallback ({Status})")

            # Trigger the next call in the queue sequentially
            if campaign and campaign.status.value == "active":
                from services.voice_call_queue_service import voice_call_queue_service
                next_call = voice_call_queue_service.get_next_queued_call(db, campaign.id)
                if next_call:
                    logger.info(f"🔄 Triggering next sequential call in queue (Call ID: {next_call.id})")
                    from tasks.voice_call_tasks import process_single_call
                    process_single_call.delay(next_call.id)
                else:
                    logger.info(f"🎉 No more calls in queue. Marking Campaign {campaign.id} as COMPLETED")
                    campaign.status = "completed"
                    db.commit()

        elif Status == "completed" and RecordingUrl:
            # Save recording URL if present
            call.recording_url = RecordingUrl
            db.commit()
            logger.info(f"💾 Saved call recording URL for Call {call.id}: {RecordingUrl}")

        return {"status": "success"}

    except Exception as e:
        logger.error(f"❌ Error processing Exotel status callback: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


