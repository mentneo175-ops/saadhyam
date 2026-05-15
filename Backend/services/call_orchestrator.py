"""
Call Orchestrator Service
Manages campaign execution, call queue, and call flow
"""

import logging
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.voice_agent import (
    VoiceCampaign,
    VoiceContact,
    VoiceCall,
    VoiceLead,
    CampaignStatus,
    CallStatus,
    LeadStatus
)
from services.voice_agent_service import voice_agent_service
from services.voice_integration_service import voice_integration_service

logger = logging.getLogger(__name__)


class CallOrchestrator:
    """Orchestrates campaign execution and call management"""
    
    def __init__(self):
        self.active_campaigns = {}  # Track active campaign executions
        self.call_queue = {}  # Queue of pending calls per campaign
        self.max_concurrent_calls = 5  # Maximum concurrent calls per campaign
        self.retry_attempts = 3  # Maximum retry attempts
        self.retry_delay = 300  # Delay between retries (5 minutes)
    
    async def start_campaign(
        self,
        campaign_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Start executing a campaign
        
        Args:
            campaign_id: Campaign ID
            db: Database session
        
        Returns:
            Dictionary with execution status
        """
        try:
            logger.info(f"🚀 Starting campaign {campaign_id}")
            
            # Get campaign
            campaign = db.query(VoiceCampaign).filter(
                VoiceCampaign.id == campaign_id
            ).first()
            
            if not campaign:
                return {'success': False, 'error': 'Campaign not found'}
            
            # Check if already active
            if campaign_id in self.active_campaigns:
                return {'success': False, 'error': 'Campaign already running'}
            
            # Update campaign status
            campaign.status = CampaignStatus.ACTIVE
            campaign.started_at = datetime.utcnow()
            db.commit()
            
            # Mark as active
            self.active_campaigns[campaign_id] = {
                'started_at': datetime.utcnow(),
                'calls_initiated': 0,
                'calls_completed': 0,
                'calls_failed': 0
            }
            
            # Build call queue
            await self._build_call_queue(campaign_id, db)
            
            # Start processing calls
            asyncio.create_task(self._process_call_queue(campaign_id, db))
            
            logger.info(f"✅ Campaign {campaign_id} started")
            
            return {
                'success': True,
                'campaign_id': campaign_id,
                'total_contacts': len(self.call_queue.get(campaign_id, []))
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to start campaign: {e}")
            return {'success': False, 'error': str(e)}
    
    async def pause_campaign(
        self,
        campaign_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """Pause campaign execution"""
        try:
            logger.info(f"⏸️ Pausing campaign {campaign_id}")
            
            # Update campaign status
            campaign = db.query(VoiceCampaign).filter(
                VoiceCampaign.id == campaign_id
            ).first()
            
            if campaign:
                campaign.status = CampaignStatus.PAUSED
                db.commit()
            
            # Remove from active campaigns
            if campaign_id in self.active_campaigns:
                del self.active_campaigns[campaign_id]
            
            logger.info(f"✅ Campaign {campaign_id} paused")
            
            return {'success': True}
            
        except Exception as e:
            logger.error(f"❌ Failed to pause campaign: {e}")
            return {'success': False, 'error': str(e)}
    
    async def resume_campaign(
        self,
        campaign_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """Resume paused campaign"""
        return await self.start_campaign(campaign_id, db)
    
    async def stop_campaign(
        self,
        campaign_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """Stop campaign execution"""
        try:
            logger.info(f"🛑 Stopping campaign {campaign_id}")
            
            # Update campaign status
            campaign = db.query(VoiceCampaign).filter(
                VoiceCampaign.id == campaign_id
            ).first()
            
            if campaign:
                campaign.status = CampaignStatus.COMPLETED
                campaign.completed_at = datetime.utcnow()
                db.commit()
            
            # Remove from active campaigns
            if campaign_id in self.active_campaigns:
                del self.active_campaigns[campaign_id]
            
            # Clear call queue
            if campaign_id in self.call_queue:
                del self.call_queue[campaign_id]
            
            logger.info(f"✅ Campaign {campaign_id} stopped")
            
            return {'success': True}
            
        except Exception as e:
            logger.error(f"❌ Failed to stop campaign: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _build_call_queue(self, campaign_id: int, db: Session):
        """Build queue of contacts to call"""
        try:
            # Get all pending contacts
            contacts = db.query(VoiceContact).filter(
                and_(
                    VoiceContact.campaign_id == campaign_id,
                    VoiceContact.is_completed == False,
                    VoiceContact.call_attempts < self.retry_attempts
                )
            ).all()
            
            # Add to queue
            self.call_queue[campaign_id] = [
                {
                    'contact_id': contact.id,
                    'phone_number': contact.phone_number,
                    'name': contact.name,
                    'attempts': contact.call_attempts
                }
                for contact in contacts
            ]
            
            logger.info(f"📋 Call queue built: {len(self.call_queue[campaign_id])} contacts")
            
        except Exception as e:
            logger.error(f"❌ Failed to build call queue: {e}")
    
    async def _process_call_queue(self, campaign_id: int, db: Session):
        """Process call queue for a campaign"""
        try:
            logger.info(f"🔄 Processing call queue for campaign {campaign_id}")
            
            queue = self.call_queue.get(campaign_id, [])
            
            while queue and campaign_id in self.active_campaigns:
                # Get next contact
                contact_data = queue.pop(0)
                
                # Initiate call
                await self._initiate_call(campaign_id, contact_data, db)
                
                # Wait between calls (rate limiting)
                await asyncio.sleep(5)
            
            # Campaign completed
            if not queue:
                await self.stop_campaign(campaign_id, db)
                logger.info(f"✅ Campaign {campaign_id} completed - all contacts processed")
            
        except Exception as e:
            logger.error(f"❌ Failed to process call queue: {e}")
    
    async def _initiate_call(
        self,
        campaign_id: int,
        contact_data: Dict,
        db: Session
    ):
        """
        Initiate a call to a contact
        
        Note: This creates the call record and prepares for Twilio integration
        """
        try:
            logger.info(f"📞 Initiating call to {contact_data['phone_number']}")
            
            # Get campaign and contact
            campaign = db.query(VoiceCampaign).filter(
                VoiceCampaign.id == campaign_id
            ).first()
            
            contact = db.query(VoiceContact).filter(
                VoiceContact.id == contact_data['contact_id']
            ).first()
            
            if not campaign or not contact:
                logger.error("❌ Campaign or contact not found")
                return
            
            # Create call record
            call = voice_agent_service.create_call(
                db=db,
                campaign_id=campaign_id,
                contact_id=contact.id,
                phone_number=contact.phone_number
            )
            
            # Generate greeting
            greeting = voice_integration_service.generate_greeting(campaign, contact)
            
            # Update call record
            call.status = CallStatus.PENDING
            call.started_at = datetime.utcnow()
            
            # Update contact
            contact.call_attempts += 1
            contact.last_call_at = datetime.utcnow()
            
            # Update campaign metrics
            campaign.calls_pending += 1
            
            db.commit()
            
            # TODO: When Twilio is integrated, make actual call here
            # For now, we just create the record
            logger.info(f"✅ Call record created: {call.id}")
            
            # Update active campaign stats
            if campaign_id in self.active_campaigns:
                self.active_campaigns[campaign_id]['calls_initiated'] += 1
            
        except Exception as e:
            logger.error(f"❌ Failed to initiate call: {e}")
    
    async def handle_call_completed(
        self,
        call_id: int,
        call_data: Dict[str, Any],
        db: Session
    ):
        """
        Handle call completion
        
        Args:
            call_id: Call ID
            call_data: Call completion data
            db: Database session
        """
        try:
            logger.info(f"✅ Handling call completion for call {call_id}")
            
            # Get call
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if not call:
                return
            
            # Update call status
            call.status = CallStatus.COMPLETED
            call.ended_at = datetime.utcnow()
            call.duration = call_data.get('duration', 0)
            call.call_outcome = call_data.get('outcome', 'completed')
            
            # Update contact
            contact = db.query(VoiceContact).filter(
                VoiceContact.id == call.contact_id
            ).first()
            
            if contact:
                contact.is_completed = True
            
            # Update campaign metrics
            campaign = db.query(VoiceCampaign).filter(
                VoiceCampaign.id == call.campaign_id
            ).first()
            
            if campaign:
                campaign.calls_completed += 1
                campaign.calls_pending -= 1
                
                # Update average call duration
                total_duration = campaign.avg_call_duration * (campaign.calls_completed - 1)
                campaign.avg_call_duration = (total_duration + call.duration) / campaign.calls_completed
            
            db.commit()
            
            # Check if lead should be created
            if call_data.get('interested', False):
                await self._create_lead_from_call(call, db)
            
            # Update active campaign stats
            if call.campaign_id in self.active_campaigns:
                self.active_campaigns[call.campaign_id]['calls_completed'] += 1
            
            logger.info(f"✅ Call {call_id} completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to handle call completion: {e}")
    
    async def handle_call_failed(
        self,
        call_id: int,
        error: str,
        db: Session
    ):
        """Handle call failure"""
        try:
            logger.info(f"❌ Handling call failure for call {call_id}")
            
            # Get call
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if not call:
                return
            
            # Update call status
            call.status = CallStatus.FAILED
            call.ended_at = datetime.utcnow()
            call.call_outcome = f"failed: {error}"
            
            # Update campaign metrics
            campaign = db.query(VoiceCampaign).filter(
                VoiceCampaign.id == call.campaign_id
            ).first()
            
            if campaign:
                campaign.calls_failed += 1
                campaign.calls_pending -= 1
            
            # Check if should retry
            contact = db.query(VoiceContact).filter(
                VoiceContact.id == call.contact_id
            ).first()
            
            if contact and contact.call_attempts < self.retry_attempts:
                # Add back to queue for retry
                if call.campaign_id in self.call_queue:
                    self.call_queue[call.campaign_id].append({
                        'contact_id': contact.id,
                        'phone_number': contact.phone_number,
                        'name': contact.name,
                        'attempts': contact.call_attempts
                    })
                    logger.info(f"🔄 Contact {contact.id} added back to queue for retry")
            
            db.commit()
            
            # Update active campaign stats
            if call.campaign_id in self.active_campaigns:
                self.active_campaigns[call.campaign_id]['calls_failed'] += 1
            
        except Exception as e:
            logger.error(f"❌ Failed to handle call failure: {e}")
    
    async def _create_lead_from_call(self, call: VoiceCall, db: Session):
        """Create lead from successful call"""
        try:
            # Check if lead already exists
            existing_lead = db.query(VoiceLead).filter(
                VoiceLead.call_id == call.id
            ).first()
            
            if existing_lead:
                return
            
            # Get contact
            contact = db.query(VoiceContact).filter(
                VoiceContact.id == call.contact_id
            ).first()
            
            if not contact:
                return
            
            # Create lead
            lead = voice_agent_service.create_lead_from_call(
                db=db,
                call=call,
                status='interested',
                lead_score=70,
                notes=call.conversation_summary
            )
            
            # Update campaign conversion rate
            campaign = db.query(VoiceCampaign).filter(
                VoiceCampaign.id == call.campaign_id
            ).first()
            
            if campaign:
                total_leads = db.query(VoiceLead).filter(
                    VoiceLead.campaign_id == campaign.id
                ).count()
                
                campaign.conversion_rate = (total_leads / campaign.calls_completed * 100) if campaign.calls_completed > 0 else 0
                db.commit()
            
            logger.info(f"✅ Lead created from call {call.id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to create lead: {e}")
    
    def get_campaign_status(self, campaign_id: int) -> Dict[str, Any]:
        """Get current status of campaign execution"""
        if campaign_id not in self.active_campaigns:
            return {'active': False}
        
        stats = self.active_campaigns[campaign_id]
        queue_size = len(self.call_queue.get(campaign_id, []))
        
        return {
            'active': True,
            'started_at': stats['started_at'].isoformat(),
            'calls_initiated': stats['calls_initiated'],
            'calls_completed': stats['calls_completed'],
            'calls_failed': stats['calls_failed'],
            'pending_in_queue': queue_size
        }


# Singleton instance
call_orchestrator = CallOrchestrator()
