"""
Voice Call Queue Service
Manages the queue and processing of voice calls for campaigns
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.voice_agent import VoiceCampaign, VoiceContact, VoiceCall, VoiceLead, CallStatus, LeadStatus, CampaignStatus
from services.voice_conversation_ai_service import VoiceConversationAI

logger = logging.getLogger(__name__)


class VoiceCallQueueService:
    """Service to manage voice call queue and processing"""
    
    def __init__(self):
        self.ai_service = VoiceConversationAI()
    
    def start_campaign_calls(self, db: Session, campaign_id: int) -> Dict[str, Any]:
        """
        Start processing calls for a campaign
        
        Returns:
            dict with status and counts
        """
        try:
            # Get campaign
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == campaign_id).first()
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            # Get all pending contacts
            pending_contacts = db.query(VoiceContact).filter(
                and_(
                    VoiceContact.campaign_id == campaign_id,
                    VoiceContact.is_completed == False
                )
            ).all()
            
            if not pending_contacts:
                logger.warning(f"No pending contacts for campaign {campaign_id}")
                return {
                    "success": False,
                    "message": "No contacts to call",
                    "queued_count": 0
                }
            
            # Create call records for all pending contacts
            queued_count = 0
            for contact in pending_contacts:
                # Check if call already exists
                existing_call = db.query(VoiceCall).filter(
                    and_(
                        VoiceCall.campaign_id == campaign_id,
                        VoiceCall.contact_id == contact.id,
                        VoiceCall.status.in_([CallStatus.PENDING, CallStatus.CALLING, CallStatus.CONNECTED])
                    )
                ).first()
                
                if not existing_call:
                    # Create new call record
                    call = VoiceCall(
                        campaign_id=campaign_id,
                        contact_id=contact.id,
                        phone_number=contact.phone_number,
                        status=CallStatus.PENDING,
                        created_at=datetime.utcnow()
                    )
                    db.add(call)
                    queued_count += 1
            
            db.commit()
            
            logger.info(f"✅ Queued {queued_count} calls for campaign {campaign_id}")
            
            return {
                "success": True,
                "message": f"Queued {queued_count} calls",
                "queued_count": queued_count,
                "total_contacts": len(pending_contacts)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to start campaign calls: {e}")
            db.rollback()
            raise
    
    def get_next_queued_call(self, db: Session, campaign_id: int) -> Optional[VoiceCall]:
        """Get the next queued call for a campaign"""
        return db.query(VoiceCall).filter(
            and_(
                VoiceCall.campaign_id == campaign_id,
                VoiceCall.status == CallStatus.PENDING
            )
        ).order_by(VoiceCall.created_at).first()
    
    def process_call(self, db: Session, call_id: int) -> Dict[str, Any]:
        """
        Process a single call (integrates real Exotel calling, falls back to simulation if credentials are not configured)
        """
        try:
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if not call:
                raise ValueError(f"Call {call_id} not found")
            
            # Get campaign and contact
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id).first()
            contact = db.query(VoiceContact).filter(VoiceContact.id == call.contact_id).first()
            
            if not campaign or not contact:
                raise ValueError("Campaign or contact not found")
            
            # Check if real Twilio or Exotel calling is configured
            from config.settings import settings
            has_twilio = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_PHONE_NUMBER)
            has_exotel = bool(settings.EXOTEL_SID and settings.EXOTEL_API_KEY and settings.EXOPHONE_NUMBER)

            if has_twilio:
                # Update call status to CALLING / RINGING
                call.status = CallStatus.CALLING
                call.started_at = datetime.utcnow()
                db.commit()
                
                logger.info(f"📞 Twilio Outbound Dialing contact {contact.name} ({contact.phone_number})")
                
                # Trigger call connects to WebSocket
                from services.twilio_service import twilio_service
                res = twilio_service.trigger_outbound_call(contact.phone_number, call.id)
                
                if res["success"]:
                    # Save Call SID to track
                    call.call_sid = res["exotel_call_sid"]
                    db.commit()
                    return {
                        "success": True,
                        "call_id": call_id,
                        "status": "calling_triggered",
                        "exotel_call_sid": res["exotel_call_sid"]
                    }
                else:
                    # Update status to failed
                    call.status = CallStatus.FAILED
                    call.ended_at = datetime.utcnow()
                    call.call_outcome = "failed_trigger"
                    db.commit()
                    return {
                        "success": False,
                        "call_id": call_id,
                        "status": "failed",
                        "message": res["message"]
                    }

            elif has_exotel:
                # Update call status to CALLING / RINGING
                call.status = CallStatus.CALLING
                call.started_at = datetime.utcnow()
                db.commit()
                
                logger.info(f"📞 Exotel Outbound Dialing contact {contact.name} ({contact.phone_number})")
                
                # Trigger call connects to WebSocket
                from services.exotel_service import exotel_service
                res = exotel_service.trigger_outbound_call(contact.phone_number, call.id)
                
                if res["success"]:
                    # Save Exotel Call SID to track
                    call.call_sid = res["exotel_call_sid"]
                    db.commit()
                    return {
                        "success": True,
                        "call_id": call_id,
                        "status": "calling_triggered",
                        "exotel_call_sid": res["exotel_call_sid"]
                    }
                else:
                    # Update status to failed
                    call.status = CallStatus.FAILED
                    call.ended_at = datetime.utcnow()
                    call.call_outcome = "failed_trigger"
                    db.commit()
                    return {
                        "success": False,
                        "call_id": call_id,
                        "status": "failed",
                        "message": res["message"]
                    }

            # FALLBACK MOCK SIMULATOR
            # Update call status to RINGING
            call.status = CallStatus.CALLING
            call.started_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"📞 [MOCK] Calling {contact.name} at {contact.phone_number}")
            
            # MOCK: Simulate call connection
            import time
            import random
            time.sleep(2)  # Simulate ringing time
            
            # MOCK: Randomly decide if call is answered
            is_answered = random.choice([True, True, True, False])  # 75% answer rate
            
            if not is_answered:
                # Call not answered
                call.status = CallStatus.FAILED
                call.ended_at = datetime.utcnow()
                call.duration = 0
                call.call_outcome = "no_answer"
                
                # Update contact
                contact.call_attempts += 1
                
                db.commit()
                logger.warning(f"❌ [MOCK] Call to {contact.name} not answered")
                
                return {
                    "success": False,
                    "call_id": call_id,
                    "status": "not_answered"
                }
            
            # Call answered - update status
            call.status = CallStatus.CONNECTED
            db.commit()
            
            logger.info(f"✅ [MOCK] Call connected with {contact.name}")
            
            # MOCK: Simulate conversation
            conversation_result = self._simulate_conversation(
                campaign=campaign,
                contact=contact,
                call=call
            )
            
            # Update call with results
            call.status = CallStatus.COMPLETED
            call.ended_at = datetime.utcnow()
            call.duration = conversation_result["duration"]
            call.conversation_transcript = conversation_result["transcript"]
            call.conversation_summary = conversation_result["summary"]
            call.customer_sentiment = conversation_result["sentiment"]
            call.call_outcome = conversation_result["outcome"]
            
            # Update contact
            contact.call_attempts += 1
            contact.is_completed = True
            contact.last_call_at = datetime.utcnow()
            
            # Update campaign stats
            campaign.calls_completed += 1
            campaign.calls_pending = max(0, campaign.calls_pending - 1)
            
            # Generate lead if customer is interested
            if conversation_result["is_interested"]:
                lead = self._create_lead_from_call(db, call, contact, conversation_result)
                logger.info(f"🎯 [MOCK] Lead generated: {lead.name} (score: {lead.lead_score})")
            
            db.commit()
            
            logger.info(f"✅ [MOCK] Call completed with {contact.name} - Duration: {call.duration}s")
            
            return {
                "success": True,
                "call_id": call_id,
                "status": "completed",
                "duration": call.duration,
                "outcome": call.call_outcome,
                "is_interested": conversation_result["is_interested"]
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to process call {call_id}: {e}")
            db.rollback()
            
            # Mark call as failed
            try:
                call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
                if call:
                    call.status = CallStatus.FAILED
                    call.ended_at = datetime.utcnow()
                    call.call_outcome = "error"
                    db.commit()
            except:
                pass
            
            raise
    
    def _simulate_conversation(
        self,
        campaign: VoiceCampaign,
        contact: VoiceContact,
        call: VoiceCall
    ) -> Dict[str, Any]:
        """
        MOCK: Simulate a conversation
        In production, this would be real-time AI conversation
        """
        import random
        import time
        
        # Simulate conversation duration (30-120 seconds)
        duration = random.randint(30, 120)
        time.sleep(3)  # Simulate processing time
        
        # Generate mock conversation using AI service
        conversation = self.ai_service.generate_mock_conversation(
            campaign_script=campaign.script_template or "",
            contact_name=contact.name,
            language=campaign.language.value
        )
        
        # Determine outcome
        outcomes = ["interested", "not_interested", "callback_requested", "not_available"]
        weights = [0.25, 0.40, 0.20, 0.15]  # 25% interested, 40% not interested, etc.
        outcome = random.choices(outcomes, weights=weights)[0]
        
        is_interested = outcome in ["interested", "callback_requested"]
        
        # Determine sentiment
        if outcome == "interested":
            sentiment = "positive"
        elif outcome == "not_interested":
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "duration": duration,
            "transcript": conversation["transcript"],
            "summary": conversation["summary"],
            "sentiment": sentiment,
            "outcome": outcome,
            "is_interested": is_interested,
            "interest_level": conversation["interest_level"]
        }
    
    def _create_lead_from_call(
        self,
        db: Session,
        call: VoiceCall,
        contact: VoiceContact,
        conversation_result: Dict[str, Any]
    ) -> VoiceLead:
        """Create a lead from a successful call"""
        
        # Calculate lead score based on conversation
        lead_score = self._calculate_lead_score(conversation_result)
        
        # Determine lead status
        if conversation_result["outcome"] == "interested":
            status = LeadStatus.INTERESTED
        elif conversation_result["outcome"] == "callback_requested":
            status = LeadStatus.CALLBACK_REQUESTED
        else:
            status = LeadStatus.FOLLOW_UP_REQUIRED
        
        # Retrieve campaign to get user_id
        campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id).first()
        user_id = campaign.user_id if campaign else 1

        lead = VoiceLead(
            campaign_id=call.campaign_id,
            contact_id=contact.id,
            user_id=user_id,
            name=contact.name,
            phone_number=contact.phone_number,
            email=contact.email,
            status=status,
            lead_score=lead_score,
            interest_level=conversation_result.get("interest_level", "medium"),
            follow_up_required=(conversation_result["outcome"] != "interested"),
            callback_requested=(conversation_result["outcome"] == "callback_requested"),
            interaction_count=1,
            created_at=datetime.utcnow()
        )
        
        db.add(lead)
        return lead
    
    def _calculate_lead_score(self, conversation_result: Dict[str, Any]) -> int:
        """Calculate lead score (0-100) based on conversation"""
        import random
        
        base_score = 50
        
        # Adjust based on outcome
        if conversation_result["outcome"] == "interested":
            base_score += 30
        elif conversation_result["outcome"] == "callback_requested":
            base_score += 20
        elif conversation_result["outcome"] == "not_interested":
            base_score -= 30
        
        # Adjust based on sentiment
        if conversation_result["sentiment"] == "positive":
            base_score += 10
        elif conversation_result["sentiment"] == "negative":
            base_score -= 10
        
        # Adjust based on call duration (longer = more engaged)
        if conversation_result["duration"] > 90:
            base_score += 10
        elif conversation_result["duration"] < 30:
            base_score -= 10
        
        # Add some randomness
        base_score += random.randint(-5, 5)
        
        # Clamp to 0-100
        return max(0, min(100, base_score))
    
    def get_campaign_call_progress(self, db: Session, campaign_id: int) -> Dict[str, Any]:
        """Get real-time progress of campaign calls"""
        try:
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == campaign_id).first()
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            # Get call counts by status
            from sqlalchemy import func
            call_stats = db.query(
                VoiceCall.status,
                func.count(VoiceCall.id).label('count')
            ).filter(
                VoiceCall.campaign_id == campaign_id
            ).group_by(VoiceCall.status).all()
            
            stats_dict = {status.value: 0 for status in CallStatus}
            for status, count in call_stats:
                stats_dict[status.value] = count
            
            # Get current active call
            active_call = db.query(VoiceCall).filter(
                and_(
                    VoiceCall.campaign_id == campaign_id,
                    VoiceCall.status.in_([CallStatus.CALLING, CallStatus.CONNECTED])
                )
            ).first()
            
            # If no active call is in progress, check for the next queued call
            if not active_call:
                active_call = db.query(VoiceCall).filter(
                    and_(
                        VoiceCall.campaign_id == campaign_id,
                        VoiceCall.status == CallStatus.PENDING
                    )
                ).order_by(VoiceCall.created_at).first()
            
            current_call_info = None
            if active_call:
                contact = db.query(VoiceContact).filter(VoiceContact.id == active_call.contact_id).first()
                if contact:
                    current_call_info = {
                        "call_id": active_call.id,
                        "contact_name": contact.name,
                        "phone_number": contact.phone_number,
                        "status": active_call.status.value,
                        "started_at": active_call.started_at.isoformat() if active_call.started_at else None,
                        "duration_seconds": (datetime.utcnow() - active_call.started_at).seconds if active_call.started_at else 0
                    }
            
            total_contacts = campaign.total_contacts
            completed = stats_dict.get("completed", 0)
            failed = stats_dict.get("failed", 0)
            queued = stats_dict.get("pending", 0)
            in_progress = stats_dict.get("calling", 0) + stats_dict.get("connected", 0)
            
            # Auto-complete campaign if all calls are done (especially in interactive/mic mode)
            if campaign.status == CampaignStatus.ACTIVE and (completed + failed) >= total_contacts and total_contacts > 0:
                campaign.status = CampaignStatus.COMPLETED
                campaign.completed_at = datetime.utcnow()
                db.commit()
            
            progress_percentage = (completed + failed) / total_contacts * 100 if total_contacts > 0 else 0
            
            return {
                "campaign_id": campaign_id,
                "campaign_name": campaign.name,
                "status": campaign.status.value,
                "total_contacts": total_contacts,
                "completed": completed,
                "failed": failed,
                "queued": queued,
                "in_progress": in_progress,
                "progress_percentage": round(progress_percentage, 1),
                "current_call": current_call_info,
                "stats_by_status": stats_dict
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get campaign progress: {e}")
            raise


# Global instance
voice_call_queue_service = VoiceCallQueueService()
