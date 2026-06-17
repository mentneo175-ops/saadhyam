"""
AI Voice Agent API Routes V2
Complete voice calling agent system with conversation engine and script generator
"""

import json
import logging
import tempfile
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
import csv
import io

from config.database import get_db_sync
from sqlalchemy.orm import Session
from utils.dependencies import get_current_user
from services.conversation_engine import conversation_engine
from services.voice_integration_service import voice_integration_service
from services.script_generator import script_generator
from services.voice_agent_service import voice_agent_service
from models.user import User
from utils.feature_gate import check_feature_access
from models.voice_agent import VoiceCampaign, VoiceContact, VoiceCall, VoiceLead, CallStatus

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


class LocalConversationStartRequest(BaseModel):
    session_name: Optional[str] = None
    business_name: str
    business_description: Optional[str] = ""
    services: Optional[str] = ""
    offer_details: str
    industry: Optional[str] = ""
    language: str = Field(default="english", pattern="^(telugu|hinglish|english|tamil|hindi)$")
    voice_type: str = Field(default="female", pattern="^(male|female)$")
    customer_name: Optional[str] = ""
    customer_type: Optional[str] = ""
    campaign_goal: str
    target_audience: Optional[str] = ""
    call_purpose: Optional[str] = ""


class LocalConversationEndRequest(BaseModel):
    call_id: int
    conversation_history: List[Dict[str, str]] = []
    final_note: Optional[str] = None


def _build_transcript(conversation_history: List[Dict[str, str]]) -> str:
    transcript_lines: List[str] = []
    for entry in conversation_history:
        role = entry.get("role", "user")
        content = entry.get("content", "").strip()
        if not content:
            continue
        label = "Customer" if role in {"user", "customer"} else "Agent"
        transcript_lines.append(f"{label}: {content}")
    return "\n".join(transcript_lines)


def _audio_url_from_path(audio_path: str) -> str:
    return f"/voice-audio/{Path(audio_path).name}"


@router.post("/conversation/local/start")
async def start_local_conversation(
    request: LocalConversationStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Create a browser-local voice conversation session."""
    try:
        campaign_name = request.session_name or f"Live Voice Session - {request.business_name}"
        campaign = voice_agent_service.create_campaign(
            db=db,
            user_id=current_user.id,
            name=campaign_name,
            description=request.campaign_goal,
            language=request.language,
            voice_type=request.voice_type,
            script_template=f"Business: {request.business_name}\nDescription: {request.business_description}\nServices: {request.services}\nIndustry: {request.industry}\nOffers: {request.offer_details}\nCustomer Name: {request.customer_name}\nCustomer Type: {request.customer_type}\nCampaign Goal: {request.campaign_goal}",
            scheduled_start=None,
        )

        contact = VoiceContact(
            campaign_id=campaign.id,
            name=request.customer_name or "Browser Visitor",
            phone_number="browser-session",
            email=None,
            custom_data={
                "business_name": request.business_name,
                "business_description": request.business_description,
                "services": request.services,
                "industry": request.industry,
                "offer_details": request.offer_details,
                "customer_name": request.customer_name,
                "customer_type": request.customer_type,
                "campaign_goal": request.campaign_goal,
            },
        )
        db.add(contact)
        db.flush()

        call = VoiceCall(
            campaign_id=campaign.id,
            contact_id=contact.id,
            phone_number=contact.phone_number,
            call_sid=f"local_{campaign.id}_{contact.id}_{int(datetime.utcnow().timestamp())}",
            status=CallStatus.CONNECTED,
            started_at=datetime.utcnow(),
        )
        db.add(call)
        db.commit()
        db.refresh(call)

        greeting = voice_integration_service.generate_greeting(campaign=campaign, contact=contact)
        if not greeting.get("success"):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=greeting.get("error", "Failed to generate greeting"))

        return {
            "success": True,
            "session": {
                "session_id": call.call_sid,
                "call_id": call.id,
                "campaign_id": campaign.id,
                "contact_id": contact.id,
                "campaign_name": campaign.name,
                "business_name": request.business_name,
                "language": request.language,
                "voice_type": request.voice_type,
            },
            "greeting": {
                "text": greeting["text"],
                "audio_url": _audio_url_from_path(greeting["audio_path"]),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to start local conversation: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/conversation/local/turn")
async def process_local_conversation_turn(
    call_id: int = Form(...),
    conversation_history: str = Form("[]"),
    language: str = Form("english"),
    customer_audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Process a browser-recorded audio turn through Whisper, Gemini, and TTS."""
    temp_audio_path: Optional[str] = None
    try:
        call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
        if not call:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call session not found")

        campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id, VoiceCampaign.user_id == current_user.id).first()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

        history = json.loads(conversation_history or "[]")
        if not isinstance(history, list):
            history = []

        suffix = Path(customer_audio.filename or "turn.webm").suffix or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            temp_audio.write(await customer_audio.read())
            temp_audio_path = temp_audio.name

        result = voice_integration_service.process_customer_speech(
            audio_path=temp_audio_path,
            call_id=call.id,
            campaign=campaign,
            db=db,
        )
        if not result.get("success"):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result.get("error", "Failed to process conversation turn"))

        customer_text = result["customer_text"]
        analysis = conversation_engine.analyze_customer_intent(customer_text, history)
        updated_history = history + [
            {"role": "user", "content": customer_text},
            {"role": "assistant", "content": result["ai_response"]},
        ]
        transcript = _build_transcript(updated_history)

        call.conversation_transcript = transcript
        call.customer_sentiment = analysis.get("sentiment") or result.get("sentiment")
        call.status = CallStatus.CONNECTED
        db.commit()

        return {
            "success": True,
            "turn": {
                "customer_text": customer_text,
                "intent": analysis.get("intent", "neutral"),
                "sentiment": analysis.get("sentiment", result.get("sentiment", "neutral")),
                "interest_level": analysis.get("interest_level", "medium"),
                "should_followup": analysis.get("should_followup", False),
                "recommended_action": analysis.get("recommended_action", "continue_conversation"),
                "should_continue": result.get("should_continue", True),
            },
            "response": {
                "text": result["ai_response"],
                "audio_url": _audio_url_from_path(result["response_audio_path"]),
            },
            "conversation_history": updated_history,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to process local conversation turn: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    finally:
        if temp_audio_path:
            try:
                Path(temp_audio_path).unlink(missing_ok=True)
            except Exception:
                pass


@router.post("/conversation/local/end")
async def end_local_conversation(
    request: LocalConversationEndRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Finalize a browser-local voice conversation and persist the summary."""
    try:
        call = db.query(VoiceCall).filter(VoiceCall.id == request.call_id).first()
        if not call:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call session not found")

        campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id, VoiceCampaign.user_id == current_user.id).first()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

        transcript = _build_transcript(request.conversation_history)
        summary = voice_agent_service.generate_conversation_summary(transcript=transcript)
        sentiment = voice_agent_service.analyze_conversation_sentiment(transcript=transcript)

        call.conversation_transcript = transcript
        call.conversation_summary = summary
        call.customer_sentiment = sentiment
        call.status = CallStatus.COMPLETED
        call.ended_at = datetime.utcnow()
        call.duration = max(call.duration or 0, len(request.conversation_history) * 15)

        # Analyze customer intent from history
        intents = [msg.get("intent") for msg in request.conversation_history if msg.get("role") == "user"]
        transcript_lower = transcript.lower()

        status_val = "interested"
        interest_level = "medium"
        follow_up_required = False
        callback_requested = False
        lead_score = 50

        if "not_interested" in intents or any(kw in transcript_lower for kw in ["not interested", "no thanks", "busy", "don't want", "not looking"]):
            status_val = "not_interested"
            interest_level = "low"
            lead_score = 15
        elif "callback" in intents or any(kw in transcript_lower for kw in ["call back", "later", "tomorrow", "next week", "call later"]):
            status_val = "callback_requested"
            interest_level = "medium"
            callback_requested = True
            follow_up_required = True
            lead_score = 70
        elif "needs_info" in intents or "objection" in intents or any(kw in transcript_lower for kw in ["price", "cost", "how much", "details", "email me", "send me info"]):
            status_val = "follow_up_required"
            interest_level = "medium"
            follow_up_required = True
            lead_score = 60
        elif "interested" in intents or any(kw in transcript_lower for kw in ["interested", "yes", "sure", "ok", "sounds good", "interested in", "love it"]):
            status_val = "interested"
            interest_level = "high"
            lead_score = 85

        # Create a Lead from this Call
        lead = voice_agent_service.create_lead_from_call(
            db=db,
            call=call,
            status=status_val,
            lead_score=lead_score,
            notes=request.final_note or summary,
        )
        
        # Populate fields
        from datetime import timedelta
        lead.interest_level = interest_level
        lead.follow_up_required = follow_up_required
        lead.callback_requested = callback_requested
        if callback_requested:
            lead.callback_time = datetime.utcnow() + timedelta(days=1)

        db.commit()
        db.refresh(lead)

        return {
            "success": True,
            "summary": summary,
            "sentiment": sentiment,
            "lead": lead.to_dict() if lead else None,
            "call": call.to_dict(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to end local conversation: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== Campaign Management ====================

@router.post("/campaigns")
async def create_campaign(
    request: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Create a new voice campaign"""
    try:
        # Check feature access
        await check_feature_access(current_user, "voice_agent")
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
    db: Session = Depends(get_db_sync),
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
            detail=str(e)
        )


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
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


# ==================== Script Generation ====================

@router.post("/script/generate")
async def generate_script(
    request: ScriptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Generate AI sales script"""
    try:
        # Check feature access
        await check_feature_access(current_user, "voice_agent")
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync),
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
    db: Session = Depends(get_db_sync)
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
        db.refresh(contact)
        
        logger.info(f"✅ Lead added to campaign {campaign_id}")
        
        return {
            "success": True,
            "message": "Lead added successfully",
            "contact_id": contact.id,
            "contact": {
                "id": contact.id,
                "name": contact.name,
                "phone": contact.phone_number,
                "email": contact.email,
                "language": contact.custom_data.get("language") if contact.custom_data else None,
                "location": contact.custom_data.get("location") if contact.custom_data else None,
                "interest": contact.custom_data.get("interest") if contact.custom_data else None,
                "call_attempts": 0,
                "is_completed": False,
                "created_at": contact.created_at.isoformat() if contact.created_at else None
            }
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
    db: Session = Depends(get_db_sync)
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
    db: Session = Depends(get_db_sync),
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
    db: Session = Depends(get_db_sync)
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


@router.get("/stats")
async def get_voice_agent_stats(
    db: Session = Depends(get_db_sync)
):
    """Get aggregated voice agent stats from the database"""
    try:
        from sqlalchemy import text
        total_calls = db.execute(text("SELECT COUNT(*) FROM voice_calls")).scalar() or 0
        active_users = db.execute(text("SELECT COUNT(DISTINCT user_id) FROM voice_campaigns")).scalar() or 0
        avg_duration_sec = db.execute(text("SELECT COALESCE(AVG(duration), 0) FROM voice_calls WHERE duration > 0")).scalar() or 0
        
        avg_minutes = int(avg_duration_sec // 60)
        avg_seconds = int(avg_duration_sec % 60)
        avg_duration_str = f"{avg_minutes}m {avg_seconds}s" if avg_minutes > 0 else f"{avg_seconds}s"
        
        completed_calls = db.execute(text("SELECT COUNT(*) FROM voice_calls WHERE LOWER(CAST(status AS VARCHAR)) = 'completed'")).scalar() or 0
        success_rate = f"{int(completed_calls / total_calls * 100)}%" if total_calls > 0 else "0%"
        
        return {
            "total_calls": total_calls,
            "active_users": active_users,
            "avg_duration": avg_duration_str,
            "success_rate": success_rate
        }
    except Exception as e:
        logger.error(f"❌ Failed to fetch voice agent stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calls")
async def get_recent_calls(
    db: Session = Depends(get_db_sync)
):
    """Get list of recent voice calls across all campaigns"""
    try:
        from sqlalchemy import text
        query = text("""
            SELECT 
                COALESCE(vco.name, vc.phone_number) AS recipient,
                vc.status AS status,
                vc.created_at AS created_at,
                u.email AS user_email
            FROM voice_calls vc
            LEFT JOIN voice_contacts vco ON vc.contact_id = vco.id
            JOIN voice_campaigns vcp ON vc.campaign_id = vcp.id
            JOIN users u ON vcp.user_id = u.id
            ORDER BY vc.created_at DESC
            LIMIT 50
        """)
        result = db.execute(query).fetchall()
        
        calls = []
        for row in result:
            status_obj = row._mapping["status"]
            status_str = str(status_obj.value) if hasattr(status_obj, "value") else str(status_obj)
            
            calls.append({
                "recipient": row._mapping["recipient"],
                "status": status_str.lower() if status_str else "pending",
                "created_at": row._mapping["created_at"].isoformat() if row._mapping["created_at"] else None,
                "user_email": row._mapping["user_email"]
            })
            
        return calls
    except Exception as e:
        logger.error(f"❌ Failed to fetch recent calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))



