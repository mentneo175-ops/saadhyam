"""
AI Voice Agent Service
Handles voice calling campaigns, conversation AI, and lead management
"""

import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import google.generativeai as genai
from config.settings import settings

from models.voice_agent import (
    VoiceCampaign,
    VoiceContact,
    VoiceCall,
    VoiceLead,
    VoiceFollowUp,
    CampaignStatus,
    CallStatus,
    LeadStatus,
    Language
)

logger = logging.getLogger(__name__)

# Initialize Gemini API keys
raw_gemini_keys = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3")
]
GEMINI_API_KEYS = []
_seen_keys = set()
for k in raw_gemini_keys:
    if k and k not in _seen_keys:
        GEMINI_API_KEYS.append(k)
        _seen_keys.add(k)

# Configure default key
if GEMINI_API_KEYS:
    genai.configure(api_key=GEMINI_API_KEYS[0])


class VoiceAgentService:
    """Service for managing voice campaigns and AI conversations"""
    
    def __init__(self):
        from config.settings import settings
        groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        self.ai_available = len(GEMINI_API_KEYS) > 0 or bool(groq_api_key)
        logger.info(f"✅ VoiceAgentService initialized. Gemini keys: {len(GEMINI_API_KEYS)}, Groq available: {bool(groq_api_key)}")

    def _generate_with_fallback(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """Try Gemini keys in sequence, fall back to Groq, and return text content"""
        # Try Gemini keys
        for i, key in enumerate(GEMINI_API_KEYS):
            try:
                logger.info(f"🤖 Trying Voice Agent Gemini key {i+1}/{len(GEMINI_API_KEYS)}")
                genai.configure(api_key=key)
                model_name = settings.GEMINI_CONTENT_MODEL
                
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_instruction
                )
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"⚠️ Voice Agent Gemini key {i+1} failed: {e}")
        
        # If all Gemini keys fail, try Groq
        from config.settings import settings
        from groq import Groq
        groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        if groq_api_key:
            try:
                logger.info("🚀 Voice Agent falling back to Groq API...")
                client = Groq(api_key=groq_api_key)
                model_name = os.getenv("GROQ_CONTENT_MODEL", "llama-3.1-8b-instant")
                
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=600,
                    timeout=15
                )
                if response and response.choices:
                    logger.info("✅ Voice Agent Groq API fallback successful!")
                    return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"❌ Voice Agent Groq fallback failed: {e}")
        
        return None
    
    # ==================== Campaign Management ====================
    
    def create_campaign(
        self,
        db: Session,
        user_id: int,
        name: str,
        description: str = None,
        language: str = "english",
        voice_type: str = "female",
        script_template: str = None,
        scheduled_start: datetime = None
    ) -> VoiceCampaign:
        """Create a new voice campaign"""
        try:
            campaign = VoiceCampaign(
                user_id=user_id,
                name=name,
                description=description,
                language=Language(language),
                voice_type=voice_type,
                script_template=script_template,
                scheduled_start=scheduled_start,
                status=CampaignStatus.DRAFT
            )
            
            db.add(campaign)
            db.commit()
            db.refresh(campaign)
            
            logger.info(f"✅ Created campaign: {campaign.name} (ID: {campaign.id})")
            return campaign
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to create campaign: {e}")
            raise
    
    def get_campaigns(
        self,
        db: Session,
        user_id: int,
        status: str = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[VoiceCampaign]:
        """Get user's campaigns"""
        try:
            query = db.query(VoiceCampaign).filter(VoiceCampaign.user_id == user_id)
            
            if status:
                query = query.filter(VoiceCampaign.status == CampaignStatus(status))
            
            campaigns = query.order_by(VoiceCampaign.created_at.desc()).offset(skip).limit(limit).all()
            return campaigns
            
        except Exception as e:
            logger.error(f"❌ Failed to get campaigns: {e}")
            return []
    
    def get_campaign(self, db: Session, campaign_id: int, user_id: int) -> Optional[VoiceCampaign]:
        """Get campaign by ID"""
        return db.query(VoiceCampaign).filter(
            and_(
                VoiceCampaign.id == campaign_id,
                VoiceCampaign.user_id == user_id
            )
        ).first()
    
    def update_campaign_status(
        self,
        db: Session,
        campaign_id: int,
        user_id: int,
        status: str
    ) -> Optional[VoiceCampaign]:
        """Update campaign status"""
        try:
            campaign = self.get_campaign(db, campaign_id, user_id)
            if not campaign:
                return None
            
            campaign.status = CampaignStatus(status)
            
            if status == "active" and not campaign.started_at:
                campaign.started_at = datetime.utcnow()
            elif status == "completed":
                campaign.completed_at = datetime.utcnow()
            
            db.commit()
            db.refresh(campaign)
            
            logger.info(f"✅ Updated campaign {campaign_id} status to {status}")
            return campaign
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to update campaign status: {e}")
            raise
    
    # ==================== Contact Management ====================
    
    def add_contacts_bulk(
        self,
        db: Session,
        campaign_id: int,
        contacts: List[Dict[str, Any]]
    ) -> int:
        """Add multiple contacts to campaign"""
        try:
            added_count = 0
            
            for contact_data in contacts:
                contact = VoiceContact(
                    campaign_id=campaign_id,
                    name=contact_data.get("name", ""),
                    phone_number=contact_data.get("phone_number", ""),
                    email=contact_data.get("email"),
                    custom_data=contact_data.get("custom_data", {})
                )
                db.add(contact)
                added_count += 1
            
            # Update campaign total contacts
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == campaign_id).first()
            if campaign:
                campaign.total_contacts = db.query(VoiceContact).filter(
                    VoiceContact.campaign_id == campaign_id
                ).count()
                campaign.calls_pending = campaign.total_contacts
            
            db.commit()
            
            logger.info(f"✅ Added {added_count} contacts to campaign {campaign_id}")
            return added_count
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to add contacts: {e}")
            raise
    
    def get_campaign_contacts(
        self,
        db: Session,
        campaign_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[VoiceContact]:
        """Get contacts for a campaign"""
        return db.query(VoiceContact).filter(
            VoiceContact.campaign_id == campaign_id
        ).offset(skip).limit(limit).all()
    
    # ==================== Call Management ====================
    
    def create_call(
        self,
        db: Session,
        campaign_id: int,
        contact_id: int,
        phone_number: str
    ) -> VoiceCall:
        """Create a new call record"""
        try:
            call = VoiceCall(
                campaign_id=campaign_id,
                contact_id=contact_id,
                phone_number=phone_number,
                status=CallStatus.PENDING
            )
            
            db.add(call)
            db.commit()
            db.refresh(call)
            
            return call
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to create call: {e}")
            raise
    
    def update_call_status(
        self,
        db: Session,
        call_id: int,
        status: str,
        duration: int = None,
        transcript: str = None,
        summary: str = None,
        sentiment: str = None,
        outcome: str = None
    ) -> Optional[VoiceCall]:
        """Update call status and details"""
        try:
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if not call:
                return None
            
            call.status = CallStatus(status)
            
            if duration is not None:
                call.duration = duration
            if transcript:
                call.conversation_transcript = transcript
            if summary:
                call.conversation_summary = summary
            if sentiment:
                call.customer_sentiment = sentiment
            if outcome:
                call.call_outcome = outcome
            
            if status == "connected" and not call.started_at:
                call.started_at = datetime.utcnow()
            elif status in ["completed", "failed"]:
                call.ended_at = datetime.utcnow()
            
            db.commit()
            db.refresh(call)
            
            return call
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to update call: {e}")
            raise
    
    def get_campaign_calls(
        self,
        db: Session,
        campaign_id: int,
        status: str = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[VoiceCall]:
        """Get calls for a campaign"""
        query = db.query(VoiceCall).filter(VoiceCall.campaign_id == campaign_id)
        
        if status:
            query = query.filter(VoiceCall.status == CallStatus(status))
        
        return query.order_by(VoiceCall.created_at.desc()).offset(skip).limit(limit).all()
    
    # ==================== AI Conversation ====================
    
    def generate_conversation_response(
        self,
        campaign: VoiceCampaign,
        customer_message: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """Generate AI response for customer conversation"""
        try:
            if not self.ai_available:
                return "I understand. Let me connect you with our team."
            
            # Build conversation context
            context = f"""
You are an AI voice agent for a {campaign.language.value} speaking campaign.
Campaign: {campaign.name}
Language: {campaign.language.value}

Your role is to:
1. Engage customers in natural conversation
2. Understand their needs and interests
3. Answer questions professionally
4. Qualify leads based on interest level
5. Schedule callbacks or appointments if requested

Script Template:
{campaign.script_template or "Introduce the product/service and gauge interest."}

Conversation History:
"""
            
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    context += f"\n{role}: {content}"
            
            context += f"\n\nCustomer: {customer_message}\n\nYour response (keep it natural and conversational):"
            
            # Generate response
            response_text = self._generate_with_fallback(context)
            if response_text:
                return response_text
            
            return "I understand. Let me connect you with our team."
            
        except Exception as e:
            logger.error(f"❌ Failed to generate conversation response: {e}")
            return "I understand. Let me note that down for you."
    
    def analyze_conversation_sentiment(self, transcript: str) -> str:
        """Analyze customer sentiment from conversation"""
        try:
            if not self.ai_available:
                return "neutral"
            
            prompt = f"""
Analyze the customer sentiment in this conversation transcript.
Respond with ONLY one word: positive, neutral, or negative

Transcript:
{transcript}

Sentiment:"""
            
            response_text = self._generate_with_fallback(prompt)
            if response_text:
                sentiment = response_text.strip().lower()
                if sentiment in ["positive", "neutral", "negative"]:
                    return sentiment
            return "neutral"
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze sentiment: {e}")
            return "neutral"
    
    def generate_conversation_summary(self, transcript: str) -> str:
        """Generate summary of conversation"""
        try:
            if not self.ai_available:
                return "Conversation completed."
            
            prompt = f"""
Summarize this customer conversation in 2-3 sentences.
Focus on: customer interest, key points discussed, and next steps.

Transcript:
{transcript}

Summary:"""
            
            response_text = self._generate_with_fallback(prompt)
            if response_text:
                return response_text
            return "Conversation completed."
            
        except Exception as e:
            logger.error(f"❌ Failed to generate summary: {e}")
            return "Conversation completed."
    
    # ==================== Lead Management ====================
    
    def create_lead_from_call(
        self,
        db: Session,
        call: VoiceCall,
        status: str = "interested",
        lead_score: int = 50,
        notes: str = None
    ) -> VoiceLead:
        """Create lead from successful call"""
        try:
            contact = db.query(VoiceContact).filter(VoiceContact.id == call.contact_id).first()
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id).first()
            
            lead = VoiceLead(
                campaign_id=call.campaign_id,
                contact_id=call.contact_id,
                call_id=call.id,
                user_id=campaign.user_id,
                name=contact.name,
                phone_number=contact.phone_number,
                email=contact.email,
                status=LeadStatus(status),
                lead_score=lead_score,
                notes=notes or call.conversation_summary
            )
            
            db.add(lead)
            db.commit()
            db.refresh(lead)
            
            logger.info(f"✅ Created lead from call {call.id}")
            return lead
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to create lead: {e}")
            raise
    
    def get_campaign_leads(
        self,
        db: Session,
        campaign_id: int,
        status: str = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[VoiceLead]:
        """Get leads for a campaign"""
        query = db.query(VoiceLead).filter(VoiceLead.campaign_id == campaign_id)
        
        if status:
            query = query.filter(VoiceLead.status == LeadStatus(status))
        
        return query.order_by(VoiceLead.created_at.desc()).offset(skip).limit(limit).all()
    
    def update_lead_status(
        self,
        db: Session,
        lead_id: int,
        status: str,
        notes: str = None
    ) -> Optional[VoiceLead]:
        """Update lead status"""
        try:
            lead = db.query(VoiceLead).filter(VoiceLead.id == lead_id).first()
            if not lead:
                return None
            
            lead.status = LeadStatus(status)
            lead.last_interaction_at = datetime.utcnow()
            lead.interaction_count += 1
            
            if notes:
                lead.notes = notes
            
            if status == "converted":
                lead.is_converted = True
                lead.converted_at = datetime.utcnow()
            
            db.commit()
            db.refresh(lead)
            
            return lead
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to update lead: {e}")
            raise
    
    # ==================== Analytics ====================
    
    def get_campaign_analytics(self, db: Session, campaign_id: int) -> Dict[str, Any]:
        """Get campaign analytics"""
        try:
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == campaign_id).first()
            if not campaign:
                return {}
            
            # Call statistics
            total_calls = db.query(VoiceCall).filter(VoiceCall.campaign_id == campaign_id).count()
            completed_calls = db.query(VoiceCall).filter(
                and_(
                    VoiceCall.campaign_id == campaign_id,
                    VoiceCall.status == CallStatus.COMPLETED
                )
            ).count()
            
            # Lead statistics
            total_leads = db.query(VoiceLead).filter(VoiceLead.campaign_id == campaign_id).count()
            interested_leads = db.query(VoiceLead).filter(
                and_(
                    VoiceLead.campaign_id == campaign_id,
                    VoiceLead.status == LeadStatus.INTERESTED
                )
            ).count()
            converted_leads = db.query(VoiceLead).filter(
                and_(
                    VoiceLead.campaign_id == campaign_id,
                    VoiceLead.is_converted == True
                )
            ).count()
            
            # Average call duration
            avg_duration = db.query(func.avg(VoiceCall.duration)).filter(
                and_(
                    VoiceCall.campaign_id == campaign_id,
                    VoiceCall.status == CallStatus.COMPLETED
                )
            ).scalar() or 0
            
            # Conversion rate
            conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
            
            return {
                "campaign_id": campaign_id,
                "campaign_name": campaign.name,
                "status": campaign.status.value,
                "total_contacts": campaign.total_contacts,
                "total_calls": total_calls,
                "completed_calls": completed_calls,
                "pending_calls": campaign.calls_pending,
                "failed_calls": campaign.calls_failed,
                "total_leads": total_leads,
                "interested_leads": interested_leads,
                "converted_leads": converted_leads,
                "conversion_rate": round(conversion_rate, 2),
                "avg_call_duration": round(avg_duration, 2),
                "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
                "started_at": campaign.started_at.isoformat() if campaign.started_at else None,
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get analytics: {e}")
            return {}


# Singleton instance
voice_agent_service = VoiceAgentService()
