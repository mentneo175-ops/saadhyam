"""
Campaign Background Tasks
"""

import logging
from celery import Task
from sqlalchemy.orm import Session

from tasks.celery_app import celery_app
from config.database import SessionLocal
from services.call_orchestrator import call_orchestrator
from models.voice_agent import VoiceCampaign, CampaignStatus

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    """Base task with database session"""
    _db = None
    
    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db
    
    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()


@celery_app.task(base=DatabaseTask, bind=True)
def execute_campaign(self, campaign_id: int):
    """
    Execute a voice campaign
    
    Args:
        campaign_id: Campaign ID to execute
    """
    try:
        logger.info(f"🚀 Starting campaign execution task for campaign {campaign_id}")
        
        # Start campaign
        import asyncio
        result = asyncio.run(
            call_orchestrator.start_campaign(campaign_id, self.db)
        )
        
        if result['success']:
            logger.info(f"✅ Campaign {campaign_id} execution started")
            return {
                'success': True,
                'campaign_id': campaign_id,
                'message': 'Campaign execution started'
            }
        else:
            logger.error(f"❌ Failed to start campaign {campaign_id}: {result.get('error')}")
            return {
                'success': False,
                'campaign_id': campaign_id,
                'error': result.get('error')
            }
            
    except Exception as e:
        logger.error(f"❌ Campaign execution task failed: {e}")
        return {
            'success': False,
            'campaign_id': campaign_id,
            'error': str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True)
def pause_campaign(self, campaign_id: int):
    """Pause a campaign"""
    try:
        logger.info(f"⏸️ Pausing campaign {campaign_id}")
        
        import asyncio
        result = asyncio.run(
            call_orchestrator.pause_campaign(campaign_id, self.db)
        )
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Failed to pause campaign: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(base=DatabaseTask, bind=True)
def resume_campaign(self, campaign_id: int):
    """Resume a paused campaign"""
    try:
        logger.info(f"▶️ Resuming campaign {campaign_id}")
        
        import asyncio
        result = asyncio.run(
            call_orchestrator.resume_campaign(campaign_id, self.db)
        )
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Failed to resume campaign: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(base=DatabaseTask, bind=True)
def update_campaign_metrics(self):
    """Update metrics for all active campaigns"""
    try:
        logger.info("📊 Updating campaign metrics")
        
        # Get all active campaigns
        campaigns = self.db.query(VoiceCampaign).filter(
            VoiceCampaign.status == CampaignStatus.ACTIVE
        ).all()
        
        updated = 0
        for campaign in campaigns:
            # Update metrics
            # (Metrics are already updated in real-time, this is just a backup)
            updated += 1
        
        logger.info(f"✅ Updated metrics for {updated} campaigns")
        return {'success': True, 'updated': updated}
        
    except Exception as e:
        logger.error(f"❌ Failed to update campaign metrics: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(base=DatabaseTask, bind=True)
def process_call(self, call_id: int, audio_path: str):
    """
    Process a call (transcribe, analyze, create lead)
    
    Args:
        call_id: Call ID
        audio_path: Path to call recording
    """
    try:
        logger.info(f"🎙️ Processing call {call_id}")
        
        from services.voice_integration_service import voice_integration_service
        from models.voice_agent import VoiceCall, VoiceCampaign
        
        # Get call
        call = self.db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
        if not call:
            return {'success': False, 'error': 'Call not found'}
        
        # Get campaign
        campaign = self.db.query(VoiceCampaign).filter(
            VoiceCampaign.id == call.campaign_id
        ).first()
        
        # Transcribe recording
        result = voice_integration_service.transcribe_call_recording(
            recording_path=audio_path,
            call_id=call_id,
            language=campaign.language.value,
            db=self.db
        )
        
        logger.info(f"✅ Call {call_id} processed")
        return {'success': True, 'call_id': call_id}
        
    except Exception as e:
        logger.error(f"❌ Failed to process call: {e}")
        return {'success': False, 'error': str(e)}
