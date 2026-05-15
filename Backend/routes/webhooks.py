"""
Webhook Routes for Voice Agent
Handles callbacks from Twilio and other services
"""

import logging
from fastapi import APIRouter, Request, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from config.database import get_db
from services.call_orchestrator import call_orchestrator
from services.voice_integration_service import voice_integration_service
from services.recording_service import recording_service
from models.voice_agent import VoiceCall, CallStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/call-status")
async def handle_call_status(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Handle call status updates from Twilio
    
    Twilio sends status updates: queued, ringing, in-progress, completed, failed, busy, no-answer
    """
    try:
        # Get form data from Twilio
        form_data = await request.form()
        
        call_sid = form_data.get("CallSid")
        call_status = form_data.get("CallStatus")
        call_duration = form_data.get("CallDuration", "0")
        from_number = form_data.get("From")
        to_number = form_data.get("To")
        
        logger.info(f"📞 Call status webhook: {call_sid} - {call_status}")
        
        # Find call by phone number (since we don't have call_sid yet)
        call = db.query(VoiceCall).filter(
            VoiceCall.phone_number == to_number
        ).order_by(VoiceCall.created_at.desc()).first()
        
        if not call:
            logger.warning(f"⚠️ Call not found for number: {to_number}")
            return {"status": "call_not_found"}
        
        # Update call status based on Twilio status
        if call_status == "completed":
            # Handle call completion
            await call_orchestrator.handle_call_completed(
                call_id=call.id,
                call_data={
                    'duration': int(call_duration),
                    'outcome': 'completed',
                    'interested': False  # Will be determined from conversation
                },
                db=db
            )
            
        elif call_status in ["failed", "busy", "no-answer"]:
            # Handle call failure
            await call_orchestrator.handle_call_failed(
                call_id=call.id,
                error=call_status,
                db=db
            )
            
        elif call_status == "in-progress":
            # Update call status to connected
            call.status = CallStatus.CONNECTED
            call.started_at = form_data.get("Timestamp")
            db.commit()
            
        logger.info(f"✅ Call status updated: {call.id}")
        
        return {"status": "success", "call_id": call.id}
        
    except Exception as e:
        logger.error(f"❌ Failed to handle call status: {e}")
        return {"status": "error", "error": str(e)}


@router.post("/recording-ready")
async def handle_recording_ready(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Handle recording ready notification from Twilio
    
    Twilio sends this when call recording is ready
    """
    try:
        # Get form data
        form_data = await request.form()
        
        call_sid = form_data.get("CallSid")
        recording_url = form_data.get("RecordingUrl")
        recording_sid = form_data.get("RecordingSid")
        recording_duration = form_data.get("RecordingDuration", "0")
        
        logger.info(f"🎙️ Recording ready webhook: {call_sid}")
        
        # Find call
        call = db.query(VoiceCall).filter(
            VoiceCall.id == call_sid  # Assuming we store call_sid
        ).first()
        
        if not call:
            logger.warning(f"⚠️ Call not found: {call_sid}")
            return {"status": "call_not_found"}
        
        # Save recording in background
        background_tasks.add_task(
            recording_service.save_recording,
            call_id=call.id,
            recording_url=recording_url,
            recording_sid=recording_sid,
            duration=int(recording_duration),
            db=db
        )
        
        logger.info(f"✅ Recording queued for processing: {call.id}")
        
        return {"status": "success", "call_id": call.id}
        
    except Exception as e:
        logger.error(f"❌ Failed to handle recording ready: {e}")
        return {"status": "error", "error": str(e)}


@router.post("/call-gather")
async def handle_call_gather(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle speech input from customer during call
    
    Twilio sends this when customer speaks (using <Gather>)
    """
    try:
        # Get form data
        form_data = await request.form()
        
        call_sid = form_data.get("CallSid")
        speech_result = form_data.get("SpeechResult")
        confidence = form_data.get("Confidence", "0")
        
        logger.info(f"🎤 Speech gathered: {speech_result}")
        
        # Find call
        call = db.query(VoiceCall).filter(
            VoiceCall.id == call_sid
        ).first()
        
        if not call:
            logger.warning(f"⚠️ Call not found: {call_sid}")
            return {"status": "call_not_found"}
        
        # Process speech and generate response
        # This would integrate with voice_integration_service
        # For now, just log it
        
        logger.info(f"✅ Speech processed for call: {call.id}")
        
        return {
            "status": "success",
            "call_id": call.id,
            "speech": speech_result
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to handle speech gather: {e}")
        return {"status": "error", "error": str(e)}


@router.post("/call-events")
async def handle_call_events(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle various call events from Twilio
    
    Events: initiated, ringing, answered, completed
    """
    try:
        # Get form data
        form_data = await request.form()
        
        event_type = form_data.get("EventType")
        call_sid = form_data.get("CallSid")
        
        logger.info(f"📡 Call event: {event_type} - {call_sid}")
        
        # Handle different event types
        if event_type == "call-initiated":
            logger.info(f"📞 Call initiated: {call_sid}")
            
        elif event_type == "call-ringing":
            logger.info(f"📞 Call ringing: {call_sid}")
            
        elif event_type == "call-answered":
            logger.info(f"✅ Call answered: {call_sid}")
            
        elif event_type == "call-completed":
            logger.info(f"✅ Call completed: {call_sid}")
        
        return {"status": "success", "event": event_type}
        
    except Exception as e:
        logger.error(f"❌ Failed to handle call event: {e}")
        return {"status": "error", "error": str(e)}


@router.get("/webhook-test")
async def test_webhook():
    """Test endpoint to verify webhooks are working"""
    return {
        "status": "success",
        "message": "Webhook endpoint is working",
        "endpoints": [
            "/webhooks/call-status",
            "/webhooks/recording-ready",
            "/webhooks/call-gather",
            "/webhooks/call-events"
        ]
    }
