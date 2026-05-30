"""
Celery Tasks for Voice Call Processing
Background tasks for automated calling campaigns
"""

import logging
from celery_worker import celery
from config.database import get_db_sync
from services.voice_call_queue_service import voice_call_queue_service
from models.voice_agent import VoiceCampaign, CampaignStatus
import time

logger = logging.getLogger(__name__)


@celery.task(name="voice_call_tasks.start_campaign_calling")
def start_campaign_calling(campaign_id: int):
    """
    Start processing calls for a campaign
    
    This task:
    1. Queues all pending contacts
    2. Triggers individual call tasks
    """
    logger.info(f"🚀 Starting campaign calling for campaign {campaign_id}")
    
    db = next(get_db_sync())
    try:
        # Queue all calls
        result = voice_call_queue_service.start_campaign_calls(db, campaign_id)
        
        if not result["success"]:
            logger.warning(f"⚠️ No calls queued for campaign {campaign_id}: {result['message']}")
            return result
        
        logger.info(f"✅ Queued {result['queued_count']} calls for campaign {campaign_id}")
        
        # Trigger processing of queued calls
        process_campaign_calls.delay(campaign_id)
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Failed to start campaign calling: {e}")
        raise
    finally:
        db.close()


@celery.task(name="voice_call_tasks.process_campaign_calls")
def process_campaign_calls(campaign_id: int):
    """
    Process all queued calls for a campaign sequentially
    
    This task runs continuously until all calls are processed
    """
    logger.info(f"📞 Processing calls for campaign {campaign_id}")
    
    db = next(get_db_sync())
    try:
        # Check campaign status
        campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"❌ Campaign {campaign_id} not found")
            return
        
        if campaign.status not in [CampaignStatus.ACTIVE]:
            logger.warning(f"⚠️ Campaign {campaign_id} is not active (status: {campaign.status.value})")
            return
        
        # Process calls one by one
        processed_count = 0
        max_calls_per_batch = 100  # Safety limit
        
        # Check if Exotel is configured for real calls
        from config.settings import settings
        has_exotel = bool(settings.EXOTEL_SID and settings.EXOTEL_API_KEY and settings.EXOPHONE_NUMBER)
        
        while processed_count < max_calls_per_batch:
            # Get next queued call
            next_call = voice_call_queue_service.get_next_queued_call(db, campaign_id)
            
            if not next_call:
                logger.info(f"✅ No more queued calls for campaign {campaign_id}")
                break
            
            # Process the call
            try:
                logger.info(f"📞 Processing call {next_call.id} for campaign {campaign_id}")
                result = voice_call_queue_service.process_call(db, next_call.id)
                
                if result["success"]:
                    logger.info(f"✅ Call {next_call.id} completed: {result.get('outcome') or result.get('status')}")
                else:
                    logger.warning(f"⚠️ Call {next_call.id} failed: {result.get('status')}")
                
                processed_count += 1
                
                if has_exotel:
                    logger.info(f"🚀 Exotel call {next_call.id} triggered. Pausing task loop. Exotel callback/webhook will handle sequential call progression.")
                    break
                
                # Small delay between calls (simulate realistic calling pace)
                time.sleep(2)
                
            except Exception as e:
                logger.error(f"❌ Error processing call {next_call.id}: {e}")
                # Continue with next call
                continue
        
        # Check if there are more calls to process
        remaining_call = voice_call_queue_service.get_next_queued_call(db, campaign_id)
        if remaining_call:
            logger.info(f"🔄 More calls remaining, continuing processing...")
            process_campaign_calls.delay(campaign_id)
        else:
            logger.info(f"🎉 All calls processed for campaign {campaign_id}")
            # Update campaign status to completed
            campaign.status = CampaignStatus.COMPLETED
            db.commit()
        
    except Exception as e:
        logger.error(f"❌ Failed to process campaign calls: {e}")
        raise
    finally:
        db.close()


@celery.task(name="voice_call_tasks.process_single_call")
def process_single_call(call_id: int):
    """
    Process a single call
    
    This can be used for retry logic or manual call triggering
    """
    logger.info(f"📞 Processing single call {call_id}")
    
    db = next(get_db_sync())
    try:
        result = voice_call_queue_service.process_call(db, call_id)
        logger.info(f"✅ Call {call_id} processed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Failed to process call {call_id}: {e}")
        raise
    finally:
        db.close()


@celery.task(name="voice_call_tasks.pause_campaign")
def pause_campaign(campaign_id: int):
    """Pause an active campaign"""
    logger.info(f"⏸️ Pausing campaign {campaign_id}")
    
    db = next(get_db_sync())
    try:
        campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == campaign_id).first()
        if campaign:
            campaign.status = CampaignStatus.PAUSED
            db.commit()
            logger.info(f"✅ Campaign {campaign_id} paused")
        
    except Exception as e:
        logger.error(f"❌ Failed to pause campaign: {e}")
        raise
    finally:
        db.close()


@celery.task(name="voice_call_tasks.resume_campaign")
def resume_campaign(campaign_id: int):
    """Resume a paused campaign"""
    logger.info(f"▶️ Resuming campaign {campaign_id}")
    
    db = next(get_db_sync())
    try:
        campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == campaign_id).first()
        if campaign:
            campaign.status = CampaignStatus.ACTIVE
            db.commit()
            logger.info(f"✅ Campaign {campaign_id} resumed")
            
            # Continue processing calls
            process_campaign_calls.delay(campaign_id)
        
    except Exception as e:
        logger.error(f"❌ Failed to resume campaign: {e}")
        raise
    finally:
        db.close()
