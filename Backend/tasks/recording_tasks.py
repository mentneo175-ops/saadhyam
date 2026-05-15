"""
Recording Background Tasks
"""

import logging
from celery import Task

from tasks.celery_app import celery_app
from config.database import SessionLocal
from services.recording_service import recording_service

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
def save_recording(
    self,
    call_id: int,
    recording_url: str,
    recording_sid: str,
    duration: int
):
    """Save call recording"""
    try:
        logger.info(f"💾 Saving recording for call {call_id}")
        
        recording_service.save_recording(
            call_id=call_id,
            recording_url=recording_url,
            recording_sid=recording_sid,
            duration=duration,
            db=self.db
        )
        
        return {'success': True, 'call_id': call_id}
        
    except Exception as e:
        logger.error(f"❌ Failed to save recording: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(base=DatabaseTask, bind=True)
def cleanup_old_recordings(self, days: int = 30):
    """Cleanup recordings older than specified days"""
    try:
        logger.info(f"🧹 Cleaning up recordings older than {days} days")
        
        deleted = recording_service.cleanup_old_recordings(days=days)
        
        logger.info(f"✅ Deleted {deleted} old recordings")
        return {'success': True, 'deleted': deleted}
        
    except Exception as e:
        logger.error(f"❌ Failed to cleanup recordings: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(base=DatabaseTask, bind=True)
def transcribe_recording(self, call_id: int, recording_path: str):
    """Transcribe a call recording"""
    try:
        logger.info(f"📝 Transcribing recording for call {call_id}")
        
        from services.voice_integration_service import voice_integration_service
        from models.voice_agent import VoiceCall, VoiceCampaign
        
        # Get call and campaign
        call = self.db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
        if not call:
            return {'success': False, 'error': 'Call not found'}
        
        campaign = self.db.query(VoiceCampaign).filter(
            VoiceCampaign.id == call.campaign_id
        ).first()
        
        # Transcribe
        result = voice_integration_service.transcribe_call_recording(
            recording_path=recording_path,
            call_id=call_id,
            language=campaign.language.value,
            db=self.db
        )
        
        return {'success': True, 'call_id': call_id}
        
    except Exception as e:
        logger.error(f"❌ Failed to transcribe recording: {e}")
        return {'success': False, 'error': str(e)}
