"""
Speech-to-Text Service using OpenAI Whisper (Free Open Source)
Supports multiple languages with excellent accuracy
"""

import logging
import os
from pathlib import Path
from typing import Optional, Dict, Any
import torch

logger = logging.getLogger(__name__)

# Try to import Whisper
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ Whisper not installed. Run: pip install openai-whisper")
    WHISPER_AVAILABLE = False


class STTService:
    """Speech-to-Text service using OpenAI Whisper"""
    
    def __init__(self):
        self.model = None
        self.model_size = "base"  # Options: tiny, base, small, medium, large
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        if WHISPER_AVAILABLE:
            self._initialize_model()
        else:
            logger.error("❌ Whisper not available. Install with: pip install openai-whisper")
    
    def _initialize_model(self):
        """Initialize Whisper model"""
        try:
            logger.info(f"🎤 Loading Whisper {self.model_size} model...")
            self.model = whisper.load_model(self.model_size, device=self.device)
            logger.info(f"✅ Whisper model loaded on {self.device}")
            
            # Model sizes and their characteristics:
            # - tiny: Fastest, least accurate (~1GB RAM)
            # - base: Good balance (~1GB RAM) ← DEFAULT
            # - small: Better accuracy (~2GB RAM)
            # - medium: High accuracy (~5GB RAM)
            # - large: Best accuracy (~10GB RAM)
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Whisper model: {e}")
    
    def speech_to_text(
        self,
        audio_path: str,
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        Convert speech to text
        
        Args:
            audio_path: Path to audio file (mp3, wav, m4a, etc.)
            language: Language code (en, hi, te) - auto-detect if None
            task: 'transcribe' or 'translate' (translate to English)
        
        Returns:
            Dictionary with transcription results
        """
        if not WHISPER_AVAILABLE:
            raise Exception("Whisper not installed")
        
        if not self.model:
            raise Exception("Whisper model not initialized")
        
        try:
            logger.info(f"🎤 Transcribing audio: {audio_path}")
            
            # Map language names to codes
            language_code = self._get_language_code(language) if language else None
            
            # Transcribe
            result = self.model.transcribe(
                audio_path,
                language=language_code,
                task=task,
                fp16=False  # Use FP32 for CPU compatibility
            )
            
            logger.info(f"✅ Transcription complete: {result['text'][:100]}...")
            
            return {
                'text': result['text'].strip(),
                'language': result.get('language', 'unknown'),
                'segments': result.get('segments', []),
                'confidence': self._calculate_confidence(result)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to transcribe audio: {e}")
            raise
    
    def speech_to_text_from_bytes(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        Convert speech to text from audio bytes
        
        Args:
            audio_bytes: Audio data as bytes
            language: Language code
            task: 'transcribe' or 'translate'
        
        Returns:
            Dictionary with transcription results
        """
        # Save bytes to temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name
        
        try:
            # Transcribe
            result = self.speech_to_text(temp_path, language, task)
            return result
        finally:
            # Clean up temporary file
            try:
                os.remove(temp_path)
            except:
                pass
    
    def transcribe_call_recording(
        self,
        recording_path: str,
        language: str = "english"
    ) -> Dict[str, Any]:
        """
        Transcribe a call recording with timestamps
        
        Args:
            recording_path: Path to call recording
            language: Language of the call
        
        Returns:
            Dictionary with full transcription and segments
        """
        result = self.speech_to_text(recording_path, language)
        
        # Format segments with timestamps
        formatted_segments = []
        for segment in result.get('segments', []):
            formatted_segments.append({
                'start': segment['start'],
                'end': segment['end'],
                'text': segment['text'].strip(),
                'confidence': segment.get('no_speech_prob', 0)
            })
        
        return {
            'full_text': result['text'],
            'language': result['language'],
            'segments': formatted_segments,
            'duration': formatted_segments[-1]['end'] if formatted_segments else 0
        }
    
    def _get_language_code(self, language: str) -> str:
        """Get language code for Whisper"""
        language_map = {
            'english': 'en',
            'hinglish': 'hi',
            'hindi': 'hi',
            'telugu': 'te'
        }
        return language_map.get(language.lower(), 'en')
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calculate average confidence from segments"""
        segments = result.get('segments', [])
        if not segments:
            return 0.0
        
        # Whisper provides no_speech_prob, convert to confidence
        confidences = [1 - seg.get('no_speech_prob', 0) for seg in segments]
        return sum(confidences) / len(confidences) if confidences else 0.0
    
    def change_model_size(self, size: str):
        """
        Change Whisper model size
        
        Args:
            size: Model size (tiny, base, small, medium, large)
        """
        if size not in ['tiny', 'base', 'small', 'medium', 'large']:
            raise ValueError(f"Invalid model size: {size}")
        
        self.model_size = size
        self._initialize_model()
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        return [
            'english', 'hindi', 'hinglish', 'telugu',
            'spanish', 'french', 'german', 'italian',
            'portuguese', 'russian', 'japanese', 'korean',
            'chinese', 'arabic', 'turkish', 'vietnamese'
            # Whisper supports 99+ languages
        ]
    
    def is_available(self) -> bool:
        """Check if STT service is available"""
        return WHISPER_AVAILABLE and self.model is not None


# Singleton instance
stt_service = STTService()


# Alternative: Using SpeechRecognition library (simpler but less accurate)
class SpeechRecognitionService:
    """Alternative STT using SpeechRecognition library"""
    
    def __init__(self):
        try:
            import speech_recognition as sr
            self.recognizer = sr.Recognizer()
            self.available = True
            logger.info("✅ SpeechRecognition available")
        except ImportError:
            logger.warning("⚠️ SpeechRecognition not installed. Run: pip install SpeechRecognition")
            self.available = False
    
    def speech_to_text(self, audio_path: str, language: str = "en-US") -> str:
        """Convert speech to text using Google Speech Recognition"""
        if not self.available:
            raise Exception("SpeechRecognition not installed")
        
        import speech_recognition as sr
        
        # Load audio file
        with sr.AudioFile(audio_path) as source:
            audio = self.recognizer.record(source)
        
        # Recognize speech
        try:
            text = self.recognizer.recognize_google(audio, language=language)
            logger.info(f"✅ Transcription: {text}")
            return text
        except sr.UnknownValueError:
            logger.error("❌ Could not understand audio")
            return ""
        except sr.RequestError as e:
            logger.error(f"❌ Could not request results: {e}")
            return ""


# Alternative service
speech_recognition_service = SpeechRecognitionService()
