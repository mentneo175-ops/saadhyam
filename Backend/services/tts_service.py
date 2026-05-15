"""
Text-to-Speech Service using Coqui TTS (Free Open Source)
Supports multiple languages including Telugu, Hindi, and English
"""

import logging
import os
from pathlib import Path
from typing import Optional
import torch

logger = logging.getLogger(__name__)

# Try to import TTS
try:
    from TTS.api import TTS
    TTS_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ TTS library not installed. Run: pip install TTS")
    TTS_AVAILABLE = False


class TTSService:
    """Text-to-Speech service using Coqui TTS"""
    
    def __init__(self):
        self.tts_models = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.output_dir = Path("audio_output")
        self.output_dir.mkdir(exist_ok=True)
        
        if TTS_AVAILABLE:
            self._initialize_models()
        else:
            logger.error("❌ TTS not available. Install with: pip install TTS")
    
    def _initialize_models(self):
        """Initialize TTS models for different languages"""
        try:
            # English - High quality female voice
            logger.info("🔊 Loading English TTS model...")
            self.tts_models['english'] = TTS(
                model_name="tts_models/en/ljspeech/tacotron2-DDC",
                progress_bar=False
            ).to(self.device)
            logger.info("✅ English TTS model loaded")
            
            # Hindi/Hinglish - Using multilingual model
            logger.info("🔊 Loading Hindi TTS model...")
            self.tts_models['hinglish'] = TTS(
                model_name="tts_models/multilingual/multi-dataset/your_tts",
                progress_bar=False
            ).to(self.device)
            logger.info("✅ Hindi TTS model loaded")
            
            # Telugu - Using multilingual model
            logger.info("🔊 Loading Telugu TTS model...")
            self.tts_models['telugu'] = TTS(
                model_name="tts_models/multilingual/multi-dataset/your_tts",
                progress_bar=False
            ).to(self.device)
            logger.info("✅ Telugu TTS model loaded")
            
            logger.info(f"✅ All TTS models loaded on {self.device}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize TTS models: {e}")
            logger.info("💡 Tip: Run 'tts --list_models' to see available models")
    
    def text_to_speech(
        self,
        text: str,
        language: str = "english",
        voice_type: str = "female",
        output_path: Optional[str] = None
    ) -> str:
        """
        Convert text to speech
        
        Args:
            text: Text to convert to speech
            language: Language (english, hinglish, telugu)
            voice_type: Voice type (male, female) - currently only female supported
            output_path: Optional custom output path
        
        Returns:
            Path to generated audio file
        """
        if not TTS_AVAILABLE:
            raise Exception("TTS library not installed")
        
        if not self.tts_models:
            raise Exception("TTS models not initialized")
        
        try:
            # Get appropriate model
            model = self.tts_models.get(language.lower())
            if not model:
                logger.warning(f"⚠️ Language {language} not found, using English")
                model = self.tts_models.get('english')
            
            # Generate output filename
            if not output_path:
                import hashlib
                text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
                output_path = str(self.output_dir / f"tts_{language}_{text_hash}.wav")
            
            # Generate speech
            logger.info(f"🎙️ Generating speech for: {text[:50]}...")
            
            if language.lower() == 'english':
                model.tts_to_file(
                    text=text,
                    file_path=output_path
                )
            else:
                # For multilingual models, specify language
                model.tts_to_file(
                    text=text,
                    file_path=output_path,
                    language=self._get_language_code(language)
                )
            
            logger.info(f"✅ Speech generated: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Failed to generate speech: {e}")
            raise
    
    def text_to_speech_bytes(
        self,
        text: str,
        language: str = "english",
        voice_type: str = "female"
    ) -> bytes:
        """
        Convert text to speech and return audio bytes
        
        Args:
            text: Text to convert
            language: Language code
            voice_type: Voice type
        
        Returns:
            Audio data as bytes
        """
        # Generate audio file
        audio_path = self.text_to_speech(text, language, voice_type)
        
        # Read and return bytes
        with open(audio_path, 'rb') as f:
            audio_bytes = f.read()
        
        # Clean up temporary file
        try:
            os.remove(audio_path)
        except:
            pass
        
        return audio_bytes
    
    def _get_language_code(self, language: str) -> str:
        """Get language code for multilingual models"""
        language_map = {
            'english': 'en',
            'hinglish': 'hi',
            'hindi': 'hi',
            'telugu': 'te'
        }
        return language_map.get(language.lower(), 'en')
    
    def get_available_languages(self) -> list:
        """Get list of available languages"""
        return list(self.tts_models.keys())
    
    def is_available(self) -> bool:
        """Check if TTS service is available"""
        return TTS_AVAILABLE and len(self.tts_models) > 0


# Singleton instance
tts_service = TTSService()


# Alternative: Using gTTS (Google Text-to-Speech) - Simpler but requires internet
class GTTSService:
    """Alternative TTS using Google Text-to-Speech (requires internet)"""
    
    def __init__(self):
        try:
            from gtts import gTTS
            self.gtts = gTTS
            self.available = True
            logger.info("✅ gTTS available (requires internet)")
        except ImportError:
            logger.warning("⚠️ gTTS not installed. Run: pip install gtts")
            self.available = False
    
    def text_to_speech(
        self,
        text: str,
        language: str = "english",
        output_path: Optional[str] = None
    ) -> str:
        """Convert text to speech using gTTS"""
        if not self.available:
            raise Exception("gTTS not installed")
        
        # Map language to gTTS codes
        lang_map = {
            'english': 'en',
            'hinglish': 'hi',
            'hindi': 'hi',
            'telugu': 'te'
        }
        lang_code = lang_map.get(language.lower(), 'en')
        
        # Generate output path
        if not output_path:
            import hashlib
            text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
            output_path = f"audio_output/gtts_{language}_{text_hash}.mp3"
        
        # Generate speech
        tts = self.gtts(text=text, lang=lang_code, slow=False)
        tts.save(output_path)
        
        logger.info(f"✅ Speech generated with gTTS: {output_path}")
        return output_path


# Alternative gTTS service
gtts_service = GTTSService()
