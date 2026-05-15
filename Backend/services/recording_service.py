"""
Recording Service
Handles call recording storage, retrieval, and transcription
"""

import logging
import os
import requests
from pathlib import Path
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from models.voice_agent import VoiceCall
from services.stt_service import stt_service
from services.voice_agent_service import voice_agent_service

logger = logging.getLogger(__name__)


class RecordingService:
    """Service for managing call recordings"""
    
    def __init__(self):
        self.storage_dir = Path("recordings")
        self.storage_dir.mkdir(exist_ok=True)
        
        # Storage configuration
        self.use_s3 = os.getenv("USE_S3_STORAGE", "false").lower() == "true"
        self.s3_bucket = os.getenv("S3_BUCKET_NAME", "")
        
        if self.use_s3:
            logger.info("✅ Using S3 for recording storage")
        else:
            logger.info("✅ Using local storage for recordings")
    
    def save_recording(
        self,
        call_id: int,
        recording_url: str,
        recording_sid: str,
        duration: int,
        db: Session
    ):
        """
        Save call recording from Twilio
        
        Args:
            call_id: Call ID
            recording_url: URL to download recording from Twilio
            recording_sid: Twilio recording SID
            duration: Recording duration in seconds
            db: Database session
        """
        try:
            logger.info(f"💾 Saving recording for call {call_id}")
            
            # Download recording from Twilio
            recording_path = self._download_recording(
                recording_url=recording_url,
                call_id=call_id,
                recording_sid=recording_sid
            )
            
            if not recording_path:
                logger.error(f"❌ Failed to download recording")
                return
            
            # Update call record
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if call:
                call.recording_url = recording_path
                call.duration = duration
                db.commit()
            
            # Transcribe recording in background
            self._transcribe_recording(call_id, recording_path, db)
            
            logger.info(f"✅ Recording saved: {recording_path}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save recording: {e}")
    
    def _download_recording(
        self,
        recording_url: str,
        call_id: int,
        recording_sid: str
    ) -> Optional[str]:
        """Download recording from Twilio"""
        try:
            # Add .mp3 extension to URL if not present
            if not recording_url.endswith('.mp3'):
                recording_url = f"{recording_url}.mp3"
            
            # Download recording
            response = requests.get(recording_url, stream=True)
            response.raise_for_status()
            
            # Save to local storage
            filename = f"call_{call_id}_{recording_sid}.mp3"
            filepath = self.storage_dir / filename
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"✅ Recording downloaded: {filepath}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"❌ Failed to download recording: {e}")
            return None
    
    def _transcribe_recording(
        self,
        call_id: int,
        recording_path: str,
        db: Session
    ):
        """Transcribe call recording"""
        try:
            logger.info(f"📝 Transcribing recording for call {call_id}")
            
            # Get call to determine language
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if not call:
                return
            
            # Get campaign language
            from models.voice_agent import VoiceCampaign
            campaign = db.query(VoiceCampaign).filter(
                VoiceCampaign.id == call.campaign_id
            ).first()
            
            language = campaign.language.value if campaign else 'english'
            
            # Transcribe
            result = stt_service.transcribe_call_recording(
                recording_path=recording_path,
                language=language
            )
            
            # Generate summary
            summary = voice_agent_service.generate_conversation_summary(
                transcript=result['full_text']
            )
            
            # Analyze sentiment
            sentiment = voice_agent_service.analyze_conversation_sentiment(
                transcript=result['full_text']
            )
            
            # Update call record
            call.conversation_transcript = result['full_text']
            call.conversation_summary = summary
            call.customer_sentiment = sentiment
            db.commit()
            
            logger.info(f"✅ Recording transcribed for call {call_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to transcribe recording: {e}")
    
    def get_recording_url(self, call_id: int, db: Session) -> Optional[str]:
        """Get recording URL for a call"""
        try:
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if call and call.recording_url:
                return call.recording_url
            return None
            
        except Exception as e:
            logger.error(f"❌ Failed to get recording URL: {e}")
            return None
    
    def get_recording_bytes(self, call_id: int, db: Session) -> Optional[bytes]:
        """Get recording as bytes"""
        try:
            recording_url = self.get_recording_url(call_id, db)
            if not recording_url:
                return None
            
            # Read file
            with open(recording_url, 'rb') as f:
                return f.read()
                
        except Exception as e:
            logger.error(f"❌ Failed to get recording bytes: {e}")
            return None
    
    def delete_recording(self, call_id: int, db: Session) -> bool:
        """Delete recording file"""
        try:
            recording_url = self.get_recording_url(call_id, db)
            if not recording_url:
                return False
            
            # Delete file
            if os.path.exists(recording_url):
                os.remove(recording_url)
                logger.info(f"✅ Recording deleted: {recording_url}")
            
            # Update database
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if call:
                call.recording_url = None
                db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete recording: {e}")
            return False
    
    def get_storage_stats(self) -> dict:
        """Get storage statistics"""
        try:
            total_size = 0
            file_count = 0
            
            for file in self.storage_dir.glob("*.mp3"):
                total_size += file.stat().st_size
                file_count += 1
            
            return {
                'total_files': file_count,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'storage_dir': str(self.storage_dir)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get storage stats: {e}")
            return {}
    
    def cleanup_old_recordings(self, days: int = 30):
        """Delete recordings older than specified days"""
        try:
            from datetime import timedelta
            
            cutoff_date = datetime.now() - timedelta(days=days)
            deleted_count = 0
            
            for file in self.storage_dir.glob("*.mp3"):
                file_time = datetime.fromtimestamp(file.stat().st_mtime)
                if file_time < cutoff_date:
                    file.unlink()
                    deleted_count += 1
            
            logger.info(f"✅ Cleaned up {deleted_count} old recordings")
            return deleted_count
            
        except Exception as e:
            logger.error(f"❌ Failed to cleanup recordings: {e}")
            return 0


# Singleton instance
recording_service = RecordingService()
