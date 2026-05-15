"""
Follow-up Background Tasks
"""

import logging
from celery import Task

from tasks.celery_app import celery_app
from config.database import SessionLocal
from services.followup_service import followup_service

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
def process_pending_followups(self):
    """Process all pending follow-ups"""
    try:
        logger.info("📋 Processing pending follow-ups")
        
        completed = followup_service.process_pending_followups(self.db)
        
        logger.info(f"✅ Processed {completed} follow-ups")
        return {'success': True, 'completed': completed}
        
    except Exception as e:
        logger.error(f"❌ Failed to process follow-ups: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(base=DatabaseTask, bind=True)
def execute_followup(self, followup_id: int):
    """Execute a specific follow-up"""
    try:
        logger.info(f"🚀 Executing follow-up {followup_id}")
        
        success = followup_service.execute_followup(followup_id, self.db)
        
        return {'success': success, 'followup_id': followup_id}
        
    except Exception as e:
        logger.error(f"❌ Failed to execute follow-up: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task(base=DatabaseTask, bind=True)
def schedule_followup(
    self,
    lead_id: int,
    followup_type: str,
    scheduled_time: str,
    message: str
):
    """Schedule a follow-up"""
    try:
        from datetime import datetime
        
        logger.info(f"📅 Scheduling follow-up for lead {lead_id}")
        
        scheduled_dt = datetime.fromisoformat(scheduled_time)
        
        followup = followup_service.schedule_followup(
            lead_id=lead_id,
            followup_type=followup_type,
            scheduled_time=scheduled_dt,
            message=message,
            db=self.db
        )
        
        if followup:
            return {'success': True, 'followup_id': followup.id}
        else:
            return {'success': False, 'error': 'Failed to schedule follow-up'}
            
    except Exception as e:
        logger.error(f"❌ Failed to schedule follow-up: {e}")
        return {'success': False, 'error': str(e)}
