"""
Text-to-Speech Service using Coqui TTS with Windows-friendly fallbacks.
Supports multiple languages including Telugu, Hindi, and English.
"""

import hashlib
import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

logger = logging.getLogger(__name__)

# Try to import TTS
try:
    from TTS.api import TTS
    TTS_AVAILABLE = TORCH_AVAILABLE  # Coqui TTS depends on torch
except ImportError:
    logger.warning("⚠️ TTS library not installed. Run: pip install TTS")
    TTS_AVAILABLE = False

# Lightweight offline fallback for Windows
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ pyttsx3 not installed. Run: pip install pyttsx3")
    PYTTSX3_AVAILABLE = False

# Last-resort network fallback
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ gTTS not installed. Run: pip install gTTS")
    GTTS_AVAILABLE = False


class TTSService:
    """Text-to-Speech service using Coqui TTS"""
    
    def __init__(self):
        self.tts_models = {}
        self.device = "cuda" if (TORCH_AVAILABLE and torch.cuda.is_available()) else "cpu"
        self.output_dir = Path(__file__).resolve().parents[1] / "audio_output"
        self.output_dir.mkdir(exist_ok=True)
        self.pyttsx3_available = PYTTSX3_AVAILABLE
        self.gtts_available = GTTS_AVAILABLE
        
        if TTS_AVAILABLE and TORCH_AVAILABLE:
            self._initialize_models()
        else:
            logger.error("❌ TTS or Torch not available. Install with: pip install TTS torch")
    
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
        try:
            output_path = self._ensure_wav_path(text=text, language=language, output_path=output_path)

            # Priority A: Coqui TTS
            if TTS_AVAILABLE and self.tts_models:
                try:
                    return self._text_to_speech_coqui(
                        text=text,
                        language=language,
                        voice_type=voice_type,
                        output_path=output_path,
                    )
                except Exception as e:
                    logger.warning(f"⚠️ Coqui TTS failed, trying fallback: {e}")

            # Priority B: pyttsx3 fallback (offline, Windows friendly)
            if self.pyttsx3_available:
                return self._text_to_speech_pyttsx3(
                    text=text,
                    output_path=output_path,
                )

            # Priority C: gTTS fallback (network required, converted to WAV)
            if self.gtts_available:
                return self._text_to_speech_gtts(
                    text=text,
                    language=language,
                    output_path=output_path,
                )

            raise Exception("No text-to-speech backend is available")

        except Exception as e:
            logger.error(f"❌ Failed to generate speech: {e}")
            raise

    def _ensure_wav_path(self, text: str, language: str, output_path: Optional[str]) -> str:
        if output_path:
            if output_path.lower().endswith('.wav'):
                return output_path
            return str(Path(output_path).with_suffix('.wav'))

        text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
        return str(self.output_dir / f"tts_{language}_{text_hash}.wav")

    def _text_to_speech_coqui(self, text: str, language: str, voice_type: str, output_path: str) -> str:
        if not self.tts_models:
            raise Exception("TTS models not initialized")

        model = self.tts_models.get(language.lower())
        if not model:
            logger.warning(f"⚠️ Language {language} not found, using English")
            model = self.tts_models.get('english')
        if not model:
            raise Exception("English TTS model not available")

        logger.info(f"🎙️ Generating speech with Coqui for: {text[:50]}...")
        if language.lower() == 'english':
            model.tts_to_file(text=text, file_path=output_path)
        else:
            model.tts_to_file(
                text=text,
                file_path=output_path,
                language=self._get_language_code(language)
            )

        logger.info(f"✅ Speech generated with Coqui: {output_path}")
        return output_path

    def _text_to_speech_pyttsx3(self, text: str, output_path: str) -> str:
        logger.info(f"🎙️ Generating speech with pyttsx3 for: {text[:50]}...")
        engine = pyttsx3.init()
        engine.setProperty('rate', 165)
        engine.save_to_file(text, output_path)
        engine.runAndWait()

        if not Path(output_path).exists():
            raise Exception(f"pyttsx3 did not create output file: {output_path}")

        logger.info(f"✅ Speech generated with pyttsx3: {output_path}")
        return output_path

    def _text_to_speech_gtts(self, text: str, language: str, output_path: str) -> str:
        logger.info(f"🎙️ Generating speech with gTTS for: {text[:50]}...")
        lang_code = self._get_language_code(language)
        temp_fd, temp_mp3 = tempfile.mkstemp(suffix='.mp3')
        os.close(temp_fd)
        try:
            tts = gTTS(text=text, lang=lang_code, slow=False)
            tts.save(temp_mp3)
            self._convert_to_wav(temp_mp3, output_path)
            logger.info(f"✅ Speech generated with gTTS: {output_path}")
            return output_path
        finally:
            try:
                if os.path.exists(temp_mp3):
                    os.remove(temp_mp3)
            except Exception:
                pass

    def _convert_to_wav(self, input_path: str, output_path: str) -> None:
        ffmpeg_path = shutil.which('ffmpeg')
        if not ffmpeg_path:
            local_app_data = os.getenv('LOCALAPPDATA')
            if local_app_data:
                winget_root = Path(local_app_data) / 'Microsoft' / 'WinGet' / 'Packages'
                candidates = list(winget_root.glob('Gyan.FFmpeg*/*/bin/ffmpeg.exe'))
                if candidates:
                    ffmpeg_path = str(candidates[0])
        if not ffmpeg_path:
            raise Exception("ffmpeg not found in PATH; required to convert gTTS output to WAV")

        command = [ffmpeg_path, '-y', '-i', input_path, '-ac', '1', '-ar', '22050', output_path]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"ffmpeg conversion failed: {result.stderr.strip()}")
    
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
        return (TTS_AVAILABLE and len(self.tts_models) > 0) or self.pyttsx3_available or self.gtts_available


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
