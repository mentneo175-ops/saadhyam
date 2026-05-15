"""
Voice Integration Service
Connects TTS, STT, and AI conversation engine for voice calls
"""

import logging
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from services.tts_service import tts_service
from services.stt_service import stt_service
from services.voice_agent_service import voice_agent_service
from models.voice_agent import VoiceCampaign, VoiceCall, VoiceContact, CallStatus

logger = logging.getLogger(__name__)


class VoiceIntegrationService:
    """Service to integrate TTS, STT, and AI for voice calls"""
    
    def __init__(self):
        self.conversation_cache = {}  # Store conversation history per call
    
    def process_customer_speech(
        self,
        audio_path: str,
        call_id: int,
        campaign: VoiceCampaign,
        db: Session
    ) -> Dict[str, Any]:
        """
        Process customer speech and generate AI response
        
        Args:
            audio_path: Path to customer audio file
            call_id: Call ID
            campaign: Campaign object
            db: Database session
        
        Returns:
            Dictionary with transcription, AI response, and audio
        """
        try:
            logger.info(f"🎤 Processing customer speech for call {call_id}")
            
            # Step 1: Speech to Text
            stt_result = stt_service.speech_to_text(
                audio_path=audio_path,
                language=campaign.language.value
            )
            
            customer_text = stt_result['text']
            confidence = stt_result['confidence']
            
            logger.info(f"📝 Customer said: {customer_text}")
            logger.info(f"✅ Confidence: {confidence:.2%}")
            
            # Step 2: Get conversation history
            conversation_history = self._get_conversation_history(call_id)
            
            # Step 3: Generate AI response
            ai_response = voice_agent_service.generate_conversation_response(
                campaign=campaign,
                customer_message=customer_text,
                conversation_history=conversation_history
            )
            
            logger.info(f"🤖 AI response: {ai_response}")
            
            # Step 4: Convert AI response to speech
            response_audio_path = tts_service.text_to_speech(
                text=ai_response,
                language=campaign.language.value,
                voice_type=campaign.voice_type
            )
            
            logger.info(f"🔊 Response audio generated: {response_audio_path}")
            
            # Step 5: Update conversation history
            self._update_conversation_history(call_id, customer_text, ai_response)
            
            # Step 6: Analyze sentiment
            sentiment = voice_agent_service.analyze_conversation_sentiment(
                transcript=customer_text
            )
            
            return {
                'success': True,
                'customer_text': customer_text,
                'ai_response': ai_response,
                'response_audio_path': response_audio_path,
                'confidence': confidence,
                'sentiment': sentiment,
                'conversation_history': conversation_history
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to process customer speech: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_greeting(
        self,
        campaign: VoiceCampaign,
        contact: VoiceContact
    ) -> Dict[str, Any]:
        """
        Generate greeting message for call start
        
        Args:
            campaign: Campaign object
            contact: Contact object
        
        Returns:
            Dictionary with greeting text and audio
        """
        try:
            # Generate personalized greeting
            greeting_text = self._build_greeting(campaign, contact)
            
            # Convert to speech
            audio_path = tts_service.text_to_speech(
                text=greeting_text,
                language=campaign.language.value,
                voice_type=campaign.voice_type
            )
            
            return {
                'success': True,
                'text': greeting_text,
                'audio_path': audio_path
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to generate greeting: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def transcribe_call_recording(
        self,
        recording_path: str,
        call_id: int,
        language: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Transcribe complete call recording
        
        Args:
            recording_path: Path to call recording
            call_id: Call ID
            language: Language code
            db: Database session
        
        Returns:
            Dictionary with full transcription
        """
        try:
            logger.info(f"📝 Transcribing call recording for call {call_id}")
            
            # Transcribe with timestamps
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
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if call:
                call.conversation_transcript = result['full_text']
                call.conversation_summary = summary
                call.customer_sentiment = sentiment
                call.duration = int(result['duration'])
                db.commit()
            
            logger.info(f"✅ Call transcription complete")
            
            return {
                'success': True,
                'full_text': result['full_text'],
                'segments': result['segments'],
                'summary': summary,
                'sentiment': sentiment,
                'duration': result['duration']
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to transcribe recording: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _build_greeting(self, campaign: VoiceCampaign, contact: VoiceContact) -> str:
        """Build personalized greeting message"""
        
        # Use script template if available
        if campaign.script_template:
            greeting = campaign.script_template
            # Replace placeholders
            greeting = greeting.replace('[Name]', contact.name)
            greeting = greeting.replace('[Company]', 'Saadhyam AI')
            return greeting
        
        # Default greeting based on language
        greetings = {
            'english': f"Hello {contact.name}! I'm calling from Saadhyam AI. How are you today?",
            'hinglish': f"नमस्ते {contact.name}! मैं सध्याम एआई से बुला रहा हूं। आप कैसे हैं?",
            'telugu': f"హలో {contact.name}! నేను సాధ్యం AI నుండి కాల్ చేస్తున్నాను. మీరు ఎలా ఉన్నారు?"
        }
        
        return greetings.get(campaign.language.value, greetings['english'])
    
    def _get_conversation_history(self, call_id: int) -> List[Dict[str, str]]:
        """Get conversation history for a call"""
        return self.conversation_cache.get(call_id, [])
    
    def _update_conversation_history(
        self,
        call_id: int,
        customer_message: str,
        ai_response: str
    ):
        """Update conversation history"""
        if call_id not in self.conversation_cache:
            self.conversation_cache[call_id] = []
        
        self.conversation_cache[call_id].extend([
            {'role': 'customer', 'content': customer_message},
            {'role': 'agent', 'content': ai_response}
        ])
        
        # Keep only last 10 messages
        if len(self.conversation_cache[call_id]) > 10:
            self.conversation_cache[call_id] = self.conversation_cache[call_id][-10:]
    
    def clear_conversation_history(self, call_id: int):
        """Clear conversation history for a call"""
        if call_id in self.conversation_cache:
            del self.conversation_cache[call_id]
    
    def get_audio_bytes(self, audio_path: str) -> bytes:
        """Get audio file as bytes"""
        try:
            with open(audio_path, 'rb') as f:
                return f.read()
        except Exception as e:
            logger.error(f"❌ Failed to read audio file: {e}")
            return b''
    
    def convert_audio_format(
        self,
        input_path: str,
        output_format: str = 'wav'
    ) -> str:
        """
        Convert audio to different format
        
        Args:
            input_path: Input audio file path
            output_format: Output format (wav, mp3, etc.)
        
        Returns:
            Path to converted audio file
        """
        try:
            from pydub import AudioSegment
            
            # Load audio
            audio = AudioSegment.from_file(input_path)
            
            # Generate output path
            output_path = input_path.rsplit('.', 1)[0] + f'.{output_format}'
            
            # Export
            audio.export(output_path, format=output_format)
            
            logger.info(f"✅ Audio converted: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Failed to convert audio: {e}")
            return input_path


# Singleton instance
voice_integration_service = VoiceIntegrationService()
