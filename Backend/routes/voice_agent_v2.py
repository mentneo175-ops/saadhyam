"""
AI Voice Agent API Routes V2
Complete voice calling agent system with conversation engine and script generator
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, Field
import csv
import io

from config.database import get_db
from utils.dependencies import get_current_user
from services.conversation_engine import conversation_engine
from services.script_generator import script_generator
from services.voice_agent_service import voice_agent_service
from models.user import User
from models.voice_agent import VoiceCampaign, VoiceContact, VoiceCall, VoiceLead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2/voice-agent", tags=["Voice Agent V2"])


# ==================== Request/Response Models ====================

class CampaignCreateRequest(BaseModel):
    campaign_name: str = Field(..., min_length=1, max_length=255)
    campaign_goal: str
    language: str = Field(default="english", pattern="^(telugu|hinglish|english|tamil|hindi)$")
    voice_type: str = Field(default="female", pattern="^(male|female)$")
    target_audience: str
    call_purpose: str
    business_context: str
    offer_details: str


class ScriptGenerateRequest(BaseModel):
    campaign_name: str
    campaign_goal: str
    business_context: str
    offer_details: str
    target_audience: str
    call_purpose: str
    language: str = "english"


class ConversationRequest(BaseModel):
    session_id: str
    customer_message: str
    conversation_history: List[Dict[str, str]] = []
    campaign_context: Dict[str, Any]
    language: str = "english"


class LeadCreateRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    language: Optional[str] = "english"
    location: Optional[str] = None
    interest: Optional[str] = None
    notes: Optional[str] = None


# ==================== Campaign Management ====================

@router.post("/campaigns")
async def create_campaign(
    request: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new voice campaign"""
    try:
        # Create campaign
        campaign = voice_agent_service.create_campaign(
            db=db,
            user_id=current_user.id,
            name=request.campaign_name,
            description=f"{request.campaign_goal} - {request.call_purpose}",
            language=request.language,
            voice_type=request.voice_type,
            script_template=f"""
Business: {request.business_context}
Offer: {request.offer_details}
Target: {request.target_audience}
Purpose: {request.call_purpose}
Goal: {request.campaign_goal}
""",
            scheduled_start=None
        )
        
        logger.info(f"✅ Campaign created: {campaign.id}")
        
        return {
            "success": True,
            "message": "Campaign created successfully",
            "campaign": campaign.to_dict()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to create campaign: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/campaigns")
async def get_campaigns(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all campaigns for user"""
    try:
        campaigns = voice_agent_service.get_campaigns(db, current_user.id)
        
        return {
            "success": True,
            "campaigns": [c.to_dict() for c in campaigns]
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get campaigns: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
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
            detail=str(e)
        )


# ==================== Script Generation ====================

@router.post("/script/generate")
async def generate_script(
    request: ScriptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate AI sales script"""
    try:
        campaign_details = {
            "campaign_name": request.campaign_name,
            "campaign_goal": request.campaign_goal,
            "business_context": request.business_context,
            "offer_details": request.offer_details,
            "target_audience": request.target_audience,
            "call_purpose": request.call_purpose
        }
        
        # Generate complete script
        script = script_generator.generate_complete_script(
            campaign_details=campaign_details,
            language=request.language
        )
        
        logger.info(f"✅ Script generated for: {request.campaign_name}")
        
        return {
            "success": True,
            "script": script
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to generate script: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/script/opening")
async def generate_opening(
    request: ScriptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate opening line"""
    try:
        campaign_details = {
            "campaign_name": request.campaign_name,
            "business_context": request.business_context,
            "offer_details": request.offer_details,
            "target_audience": request.target_audience
        }
        
        opening = script_generator.generate_opening_line(
            campaign_details=campaign_details,
            language=request.language
        )
        
        return {
            "success": True,
            "opening_line": opening
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to generate opening: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/script/objections")
async def generate_objections(
    request: ScriptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate objection handling responses"""
    try:
        campaign_details = {
            "business_context": request.business_context,
            "offer_details": request.offer_details
        }
        
        objections = script_generator.generate_objection_responses(
            campaign_details=campaign_details,
            language=request.language
        )
        
        return {
            "success": True,
            "objections": objections
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to generate objections: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== Conversation Simulation ====================

@router.post("/conversation/simulate")
async def simulate_conversation(
    request: ConversationRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Simulate AI conversation"""
    try:
        # Generate AI response
        response = conversation_engine.generate_ai_response(
            customer_message=request.customer_message,
            conversation_history=request.conversation_history,
            campaign_context=request.campaign_context,
            language=request.language
        )
        
        logger.info(f"✅ Conversation response generated for session: {request.session_id}")
        
        return {
            "success": True,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to simulate conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/conversation/analyze-intent")
async def analyze_intent(
    customer_message: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
    conversation_history: List[Dict[str, str]] = []
):
    """Analyze customer intent"""
    try:
        analysis = conversation_engine.analyze_customer_intent(
            customer_message=customer_message,
            conversation_history=conversation_history
        )
        
        return {
            "success": True,
            "analysis": analysis
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to analyze intent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== Lead Management ====================

@router.post("/campaigns/{campaign_id}/leads")
async def add_lead(
    campaign_id: int,
    request: LeadCreateRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Add single lead to campaign"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Create contact
        contact = VoiceContact(
            campaign_id=campaign_id,
            name=request.name,
            phone_number=request.phone,
            email=request.email,
            custom_data={
                "language": request.language,
                "location": request.location,
                "interest": request.interest,
                "notes": request.notes
            }
        )
        
        db.add(contact)
        campaign.total_contacts += 1
        campaign.calls_pending += 1
        db.commit()
        
        logger.info(f"✅ Lead added to campaign {campaign_id}")
        
        return {
            "success": True,
            "message": "Lead added successfully",
            "contact_id": contact.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to add lead: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/campaigns/{campaign_id}/leads/upload")
async def upload_leads(
    campaign_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Upload leads from CSV/Excel"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Read file
        contents = await file.read()
        
        # Parse CSV
        csv_file = io.StringIO(contents.decode('utf-8'))
        csv_reader = csv.DictReader(csv_file)
        
        added_count = 0
        for row in csv_reader:
            # Create contact
            contact = VoiceContact(
                campaign_id=campaign_id,
                name=row.get('name', row.get('Name', '')),
                phone_number=row.get('phone', row.get('Phone', row.get('phone_number', ''))),
                email=row.get('email', row.get('Email', None)),
                custom_data={
                    "language": row.get('language', row.get('Language', 'english')),
                    "location": row.get('location', row.get('Location', None)),
                    "interest": row.get('interest', row.get('Interest', None)),
                    "notes": row.get('notes', row.get('Notes', None))
                }
            )
            
            db.add(contact)
            added_count += 1
        
        # Update campaign stats
        campaign.total_contacts += added_count
        campaign.calls_pending += added_count
        db.commit()
        
        logger.info(f"✅ {added_count} leads uploaded to campaign {campaign_id}")
        
        return {
            "success": True,
            "message": f"{added_count} leads uploaded successfully",
            "added_count": added_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to upload leads: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/campaigns/{campaign_id}/leads")
async def get_leads(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all leads for campaign"""
    try:
        # Verify campaign ownership
        campaign = voice_agent_service.get_campaign(db, campaign_id, current_user.id)
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Get contacts
        contacts = db.query(VoiceContact).filter(
            VoiceContact.campaign_id == campaign_id
        ).all()
        
        leads = []
        for contact in contacts:
            leads.append({
                "id": contact.id,
                "name": contact.name,
                "phone": contact.phone_number,
                "email": contact.email,
                "language": contact.custom_data.get('language') if contact.custom_data else None,
                "location": contact.custom_data.get('location') if contact.custom_data else None,
                "interest": contact.custom_data.get('interest') if contact.custom_data else None,
                "call_attempts": contact.call_attempts,
                "is_completed": contact.is_completed,
                "created_at": contact.created_at.isoformat() if contact.created_at else None
            })
        
        return {
            "success": True,
            "leads": leads,
            "total": len(leads)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get leads: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== Dashboard & Analytics ====================

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get dashboard statistics"""
    try:
        # Get all campaigns
        campaigns = voice_agent_service.get_campaigns(db, current_user.id)
        
        # Calculate stats
        total_calls = sum(c.calls_completed for c in campaigns)
        active_campaigns = len([c for c in campaigns if c.status.value == "active"])
        
        # Get today's calls
        from datetime import date
        today = date.today()
        calls_today = db.query(VoiceCall).filter(
            VoiceCall.campaign_id.in_([c.id for c in campaigns]),
            VoiceCall.created_at >= today
        ).count()
        
        # Get leads
        total_leads = db.query(VoiceLead).filter(
            VoiceLead.user_id == current_user.id
        ).count()
        
        positive_leads = db.query(VoiceLead).filter(
            VoiceLead.user_id == current_user.id,
            VoiceLead.status.in_(["interested", "callback_requested", "appointment_scheduled"])
        ).count()
        
        followups_needed = db.query(VoiceLead).filter(
            VoiceLead.user_id == current_user.id,
            VoiceLead.follow_up_required == True
        ).count()
        
        # Calculate conversion rate
        conversion_rate = (positive_leads / total_leads * 100) if total_leads > 0 else 0
        
        return {
            "success": True,
            "stats": {
                "total_calls": total_calls,
                "active_campaigns": active_campaigns,
                "conversion_rate": round(conversion_rate, 1),
                "calls_today": calls_today,
                "positive_leads": positive_leads,
                "followups_needed": followups_needed
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get dashboard stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


