"""
Voice Service
Transcribe audio files to text using Faster Whisper
"""

import logging
import os
from pathlib import Path
from typing import Optional, Tuple, List

logger = logging.getLogger(__name__)

# Supported audio formats
SUPPORTED_FORMATS = ['.mp3', '.wav', '.webm', '.m4a', '.ogg', '.flac']


def validate_audio_file(filename: str, file_bytes: bytes, max_size_mb: int = 25) -> Tuple[bool, Optional[str]]:
    """
    Validate audio file
    
    Args:
        filename: Original filename
        file_bytes: Audio file content
        max_size_mb: Maximum file size in MB
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file extension
    file_ext = Path(filename).suffix.lower()
    if file_ext not in SUPPORTED_FORMATS:
        return False, f"Unsupported audio format. Supported formats: {', '.join(SUPPORTED_FORMATS)}"
    
    # Check file size
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > max_size_mb:
        return False, f"Audio file too large. Maximum size is {max_size_mb}MB"
    
    return True, None


def transcribe_audio_whisper(audio_path: str, language: Optional[str] = None) -> Tuple[bool, str, Optional[str]]:
    """
    Transcribe audio using Faster Whisper
    
    Args:
        audio_path: Path to audio file
        language: Language code (en, hi, te) or None for auto-detect
    
    Returns:
        Tuple of (success, transcribed_text, error_message)
    """
    try:
        from faster_whisper import WhisperModel
        
        logger.info(f"🔄 Loading Whisper model...")
        
        # Use base model for good balance of speed and accuracy
        # Options: tiny, base, small, medium, large-v2
        model = WhisperModel("base", device="cpu", compute_type="int8")
        
        logger.info(f"🔄 Transcribing audio: {audio_path}")
        
        # Transcribe
        segments, info = model.transcribe(
            audio_path,
            language=language,
            beam_size=5,
            vad_filter=True,  # Voice activity detection
            vad_parameters=dict(min_silence_duration_ms=500)
        )
        
        # Collect all segments
        transcribed_parts = []
        for segment in segments:
            transcribed_parts.append(segment.text.strip())
        
        transcribed_text = ' '.join(transcribed_parts)
        
        logger.info(f"✅ Transcribed {len(transcribed_text)} characters")
        logger.info(f"📊 Detected language: {info.language} (probability: {info.language_probability:.2f})")
        
        if not transcribed_text.strip():
            return False, "", "No speech detected in audio file"
        
        return True, transcribed_text, None
        
    except ImportError:
        logger.error("❌ faster-whisper not installed")
        return False, "", "Speech recognition not available. Please install faster-whisper."
    except Exception as e:
        logger.error(f"❌ Transcription error: {e}")
        return False, "", f"Transcription failed: {str(e)}"


def transcribe_audio_groq(audio_path: str) -> Tuple[bool, str, Optional[str]]:
    """
    Transcribe audio using Groq Whisper API (fallback)
    
    Args:
        audio_path: Path to audio file
    
    Returns:
        Tuple of (success, transcribed_text, error_message)
    """
    try:
        from groq import Groq
        
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            return False, "", "GROQ_API_KEY not configured"
        
        client = Groq(api_key=groq_api_key)
        
        logger.info(f"🔄 Transcribing with Groq Whisper API...")
        
        with open(audio_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(Path(audio_path).name, audio_file.read()),
                model="whisper-large-v3",
                response_format="text",
                language="en"  # Can be changed to support multiple languages
            )
        
        transcribed_text = transcription.strip() if isinstance(transcription, str) else transcription.text.strip()
        
        logger.info(f"✅ Transcribed {len(transcribed_text)} characters using Groq")
        
        if not transcribed_text:
            return False, "", "No speech detected in audio file"
        
        return True, transcribed_text, None
        
    except ImportError:
        logger.error("❌ groq package not installed")
        return False, "", "Groq API not available"
    except Exception as e:
        logger.error(f"❌ Groq transcription error: {e}")
        return False, "", f"Transcription failed: {str(e)}"


def transcribe_audio(audio_path: str, language: Optional[str] = None, use_groq: bool = False) -> Tuple[bool, str, Optional[str]]:
    """
    Transcribe audio file to text
    
    Args:
        audio_path: Path to audio file
        language: Language code (en, hi, te) or None for auto-detect
        use_groq: Use Groq API instead of local Whisper
    
    Returns:
        Tuple of (success, transcribed_text, error_message)
    """
    if not os.path.exists(audio_path):
        return False, "", "Audio file not found"
    
    # Try Groq first if requested
    if use_groq:
        success, text, error = transcribe_audio_groq(audio_path)
        if success:
            return success, text, error
        logger.warning(f"Groq transcription failed, falling back to local Whisper: {error}")
    
    # Use local Whisper
    return transcribe_audio_whisper(audio_path, language)


def convert_audio_format(input_path: str, output_path: str) -> Tuple[bool, Optional[str]]:
    """
    Convert audio to WAV format for better compatibility
    
    Args:
        input_path: Input audio file path
        output_path: Output WAV file path
    
    Returns:
        Tuple of (success, error_message)
    """
    try:
        from pydub import AudioSegment
        
        logger.info(f"🔄 Converting audio format...")
        
        # Load audio
        audio = AudioSegment.from_file(input_path)
        
        # Export as WAV
        audio.export(output_path, format="wav")
        
        logger.info(f"✅ Audio converted to WAV")
        return True, None
        
    except ImportError:
        logger.warning("pydub not installed, skipping conversion")
        return False, "Audio conversion not available"
    except Exception as e:
        logger.error(f"❌ Audio conversion error: {e}")
        return False, f"Audio conversion failed: {str(e)}"
