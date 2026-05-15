"""
Follow-up Service
Handles automated follow-ups via call, WhatsApp, email, and SMS
"""

import logging
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.voice_agent import VoiceFollowUp, VoiceLead, FollowUpType, FollowUpStatus

logger = logging.getLogger(__name__)


class FollowUpService:
    """Service for managing automated follow-ups"""
    
    def __init__(self):
        # WhatsApp configuration
        self.whatsapp_enabled = os.getenv("WHATSAPP_ENABLED", "false").lower() == "true"
        self.whatsapp_api_key = os.getenv("WHATSAPP_API_KEY", "")
        
        # Email configuration
        self.email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        # SMS configuration
        self.sms_enabled = os.getenv("SMS_ENABLED", "false").lower() == "true"
        
        logger.info(f"✅ Follow-up service initialized")
        logger.info(f"   WhatsApp: {'Enabled' if self.whatsapp_enabled else 'Disabled'}")
        logger.info(f"   Email: {'Enabled' if self.email_enabled else 'Disabled'}")
        logger.info(f"   SMS: {'Enabled' if self.sms_enabled else 'Disabled'}")
    
    def schedule_followup(
        self,
        lead_id: int,
        followup_type: str,
        scheduled_time: datetime,
        message: str,
        db: Session
    ) -> Optional[VoiceFollowUp]:
        """
        Schedule a follow-up for a lead
        
        Args:
            lead_id: Lead ID
            followup_type: Type (call, whatsapp, email, sms)
            scheduled_time: When to send follow-up
            message: Follow-up message
            db: Database session
        
        Returns:
            VoiceFollowUp object
        """
        try:
            logger.info(f"📅 Scheduling {followup_type} follow-up for lead {lead_id}")
            
            # Get lead
            lead = db.query(VoiceLead).filter(VoiceLead.id == lead_id).first()
            if not lead:
                logger.error(f"❌ Lead {lead_id} not found")
                return None
            
            # Create follow-up
            followup = VoiceFollowUp(
                lead_id=lead_id,
                campaign_id=lead.campaign_id,
                followup_type=FollowUpType(followup_type),
                scheduled_time=scheduled_time,
                message=message,
                status=FollowUpStatus.PENDING
            )
            
            db.add(followup)
            
            # Update lead
            lead.follow_up_required = True
            lead.next_followup_at = scheduled_time
            
            db.commit()
            db.refresh(followup)
            
            logger.info(f"✅ Follow-up scheduled: {followup.id}")
            return followup
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to schedule follow-up: {e}")
            return None
    
    def execute_followup(
        self,
        followup_id: int,
        db: Session
    ) -> bool:
        """
        Execute a scheduled follow-up
        
        Args:
            followup_id: Follow-up ID
            db: Database session
        
        Returns:
            Success status
        """
        try:
            logger.info(f"🚀 Executing follow-up {followup_id}")
            
            # Get follow-up
            followup = db.query(VoiceFollowUp).filter(
                VoiceFollowUp.id == followup_id
            ).first()
            
            if not followup:
                logger.error(f"❌ Follow-up {followup_id} not found")
                return False
            
            # Get lead
            lead = db.query(VoiceLead).filter(
                VoiceLead.id == followup.lead_id
            ).first()
            
            if not lead:
                logger.error(f"❌ Lead not found for follow-up {followup_id}")
                return False
            
            # Execute based on type
            success = False
            
            if followup.followup_type == FollowUpType.WHATSAPP:
                success = self._send_whatsapp(lead.phone_number, followup.message)
                
            elif followup.followup_type == FollowUpType.EMAIL:
                success = self._send_email(lead.email, "Follow-up", followup.message)
                
            elif followup.followup_type == FollowUpType.SMS:
                success = self._send_sms(lead.phone_number, followup.message)
                
            elif followup.followup_type == FollowUpType.CALL:
                # Schedule a callback
                success = self._schedule_callback(lead, db)
            
            # Update follow-up status
            if success:
                followup.status = FollowUpStatus.COMPLETED
                followup.completed_at = datetime.utcnow()
                logger.info(f"✅ Follow-up {followup_id} completed")
            else:
                followup.status = FollowUpStatus.FAILED
                logger.error(f"❌ Follow-up {followup_id} failed")
            
            # Update lead
            lead.interaction_count += 1
            lead.last_interaction_at = datetime.utcnow()
            
            db.commit()
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to execute follow-up: {e}")
            return False
    
    def _send_whatsapp(self, phone_number: str, message: str) -> bool:
        """Send WhatsApp message"""
        try:
            if not self.whatsapp_enabled:
                logger.warning("⚠️ WhatsApp not enabled")
                return False
            
            logger.info(f"📱 Sending WhatsApp to {phone_number}")
            
            # TODO: Integrate with WhatsApp Business API
            # For now, just log
            logger.info(f"   Message: {message[:50]}...")
            
            # Placeholder for actual implementation
            # import requests
            # response = requests.post(
            #     "https://api.whatsapp.com/send",
            #     json={
            #         "phone": phone_number,
            #         "message": message
            #     },
            #     headers={"Authorization": f"Bearer {self.whatsapp_api_key}"}
            # )
            
            logger.info(f"✅ WhatsApp sent (simulated)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send WhatsApp: {e}")
            return False
    
    def _send_email(self, email: str, subject: str, body: str) -> bool:
        """Send email"""
        try:
            if not self.email_enabled:
                logger.warning("⚠️ Email not enabled")
                return False
            
            logger.info(f"📧 Sending email to {email}")
            
            # TODO: Integrate with SMTP
            # For now, just log
            logger.info(f"   Subject: {subject}")
            logger.info(f"   Body: {body[:50]}...")
            
            # Placeholder for actual implementation
            # import smtplib
            # from email.mime.text import MIMEText
            # 
            # msg = MIMEText(body)
            # msg['Subject'] = subject
            # msg['From'] = self.smtp_user
            # msg['To'] = email
            # 
            # with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            #     server.starttls()
            #     server.login(self.smtp_user, self.smtp_password)
            #     server.send_message(msg)
            
            logger.info(f"✅ Email sent (simulated)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send email: {e}")
            return False
    
    def _send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS"""
        try:
            if not self.sms_enabled:
                logger.warning("⚠️ SMS not enabled")
                return False
            
            logger.info(f"📱 Sending SMS to {phone_number}")
            
            # TODO: Integrate with SMS gateway (Twilio, etc.)
            # For now, just log
            logger.info(f"   Message: {message[:50]}...")
            
            logger.info(f"✅ SMS sent (simulated)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send SMS: {e}")
            return False
    
    def _schedule_callback(self, lead: VoiceLead, db: Session) -> bool:
        """Schedule a callback for the lead"""
        try:
            logger.info(f"📞 Scheduling callback for lead {lead.id}")
            
            # Update lead
            lead.callback_requested = True
            lead.callback_scheduled_at = datetime.utcnow() + timedelta(hours=24)
            db.commit()
            
            logger.info(f"✅ Callback scheduled")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to schedule callback: {e}")
            return False
    
    def get_pending_followups(self, db: Session) -> list:
        """Get all pending follow-ups that are due"""
        try:
            now = datetime.utcnow()
            
            followups = db.query(VoiceFollowUp).filter(
                VoiceFollowUp.status == FollowUpStatus.PENDING,
                VoiceFollowUp.scheduled_time <= now
            ).all()
            
            return followups
            
        except Exception as e:
            logger.error(f"❌ Failed to get pending follow-ups: {e}")
            return []
    
    def process_pending_followups(self, db: Session) -> int:
        """Process all pending follow-ups"""
        try:
            followups = self.get_pending_followups(db)
            
            logger.info(f"📋 Processing {len(followups)} pending follow-ups")
            
            completed = 0
            for followup in followups:
                if self.execute_followup(followup.id, db):
                    completed += 1
            
            logger.info(f"✅ Processed {completed}/{len(followups)} follow-ups")
            return completed
            
        except Exception as e:
            logger.error(f"❌ Failed to process follow-ups: {e}")
            return 0
    
    def create_followup_template(
        self,
        lead: VoiceLead,
        template_type: str = "interested"
    ) -> str:
        """Create follow-up message from template"""
        
        templates = {
            'interested': f"""
Hello {lead.name}!

Thank you for your interest in our services. We'd love to discuss how we can help you further.

Would you like to schedule a call to learn more?

Best regards,
Saadhyam AI Team
            """.strip(),
            
            'callback': f"""
Hello {lead.name}!

You requested a callback. Our team will reach out to you shortly.

If you have any questions in the meantime, feel free to reply to this message.

Best regards,
Saadhyam AI Team
            """.strip(),
            
            'followup': f"""
Hello {lead.name}!

Just following up on our previous conversation. Are you still interested in learning more about our services?

Let us know if you'd like to schedule a demo or have any questions.

Best regards,
Saadhyam AI Team
            """.strip()
        }
        
        return templates.get(template_type, templates['followup'])


# Singleton instance
followup_service = FollowUpService()
