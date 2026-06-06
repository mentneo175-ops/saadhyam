import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from config.database import get_db_sync
from utils.dependencies import get_current_user
from models.user import User
from models.voice_command import VoiceCommandLog
from services.voice_command_service import parse_command

logger = logging.getLogger(__name__)

router = APIRouter(tags=["voice-command"])

class ParseRequest(BaseModel):
    text: str
    currentRoute: str
    lang: Optional[str] = "te"

class ParseResponse(BaseModel):
    log_id: int
    intent: str
    action: str
    route: Optional[str] = None
    params: Dict[str, Any]
    confidence: float
    requiresConfirmation: bool
    reply_te: str

class LogExecutionRequest(BaseModel):
    log_id: int
    executed: bool

@router.post("/parse", response_model=ParseResponse)
async def parse_voice_command(
    request: ParseRequest,
    db: Session = Depends(get_db_sync),
    current_user: User = Depends(get_current_user)
):
    """
    Parses a voice or typed text command.
    Checks permissions, logs the event to the database, and returns structured execution payload.
    """
    text = (request.text or "").strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Command text cannot be empty"
        )
        
    try:
        # Parse command using service layer
        result = await parse_command(text, request.currentRoute, current_user, db, lang=request.lang or "te")
        
        # Log to the database
        log_entry = VoiceCommandLog(
            user_id=current_user.id,
            command_text=text,
            detected_intent=result.get("intent", "UNKNOWN"),
            action=result.get("action", "NO_ACTION"),
            route=result.get("route"),
            confidence=result.get("confidence", 0.0),
            requires_confirmation=result.get("requiresConfirmation", False),
            executed=False # Will be set to True if safe action executed directly or confirmed later
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        # Include log_id in the response
        return ParseResponse(
            log_id=log_entry.id,
            intent=result.get("intent", "UNKNOWN"),
            action=result.get("action", "NO_ACTION"),
            route=result.get("route"),
            params=result.get("params", {}),
            confidence=result.get("confidence", 0.0),
            requiresConfirmation=result.get("requiresConfirmation", False),
            reply_te=result.get("reply_te", "క్షమించండి, ఆ కమాండ్ అర్థం కాలేదు.")
        )
        
    except Exception as e:
        logger.error(f"Error parsing voice command route: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse command due to internal error"
        )

@router.post("/log-execution")
async def log_execution(
    request: LogExecutionRequest,
    db: Session = Depends(get_db_sync),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the execution status of a logged command (primarily after dangerous action confirmation).
    """
    log_entry = db.query(VoiceCommandLog).filter(
        VoiceCommandLog.id == request.log_id,
        VoiceCommandLog.user_id == current_user.id
    ).first()
    
    if not log_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice command log not found"
        )
        
    try:
        log_entry.executed = request.executed
        db.commit()
        return {"success": True, "message": "Command execution log updated"}
    except Exception as e:
        logger.error(f"Error updating execution log: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update execution log"
        )
