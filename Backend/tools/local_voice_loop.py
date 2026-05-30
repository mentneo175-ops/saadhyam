#!/usr/bin/env python3
"""
Local voice loop test script

Flow:
  1) Record microphone input (short duration)
  2) Transcribe with Whisper via backend STT service
  3) Send text to Gemini via voice_agent_service.generate_conversation_response
  4) Synthesize Gemini response via Coqui TTS (tts_service)
  5) Play the generated audio locally

Usage:
  python Backend/tools/local_voice_loop.py --duration 5

Notes:
  - This script uses the project's singleton services: stt_service, voice_agent_service, tts_service
  - It runs entirely locally on a laptop (no telephony needed)
"""
import argparse
import tempfile
import os
import wave
import winsound

import sounddevice as sd

# Import project services (assumes running from repo root)
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
backend_root = os.path.join(repo_root, 'Backend')
sys.path.insert(0, backend_root)
sys.path.insert(0, repo_root)

from Backend.services.stt_service import stt_service
from Backend.services.tts_service import tts_service
from Backend.services.voice_agent_service import voice_agent_service


class StubLang:
    def __init__(self, value: str):
        self.value = value


class StubCampaign:
    def __init__(self, name: str = "Local Test Campaign", language: str = "english", script_template: str = "", voice_type: str = "female"):
        self.name = name
        self.language = StubLang(language)
        self.script_template = script_template
        self.voice_type = voice_type


def record_microphone(duration: float = 5.0, samplerate: int = 44100, device: int = 16) -> str:
    """Record microphone audio and save to a temporary WAV file. Returns path."""
    print(f"Recording {duration}s from microphone device {device}... (samplerate={samplerate})")
    frames = int(duration * samplerate)
    audio = sd.rec(frames, samplerate=samplerate, channels=1, dtype='int16', device=device)
    sd.wait()

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    tmp_path = tmp.name
    tmp.close()
    with wave.open(tmp_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(samplerate)
        wf.writeframes(audio.tobytes())
    print(f"Saved recording to {tmp_path}")
    return tmp_path


def transcribe_audio(audio_path: str, language: str = "english") -> str:
    print("Transcribing audio with Whisper...")
    result = stt_service.speech_to_text(audio_path, language=language)
    text = result.get('text', '').strip()
    print(f"Transcription: {text}")
    return text


def generate_ai_response(campaign: StubCampaign, customer_text: str, conversation_history=None) -> str:
    print("Generating AI response via voice_agent_service...")
    if conversation_history is None:
        conversation_history = []
    response = voice_agent_service.generate_conversation_response(campaign, customer_text, conversation_history)
    print(f"AI response: {response}")
    return response


def synthesize_and_play(text: str, language: str = "english") -> None:
    print("Synthesizing text to speech via Coqui TTS...")
    try:
        audio_path = tts_service.text_to_speech(text=text, language=language)
        print(f"Generated audio at {audio_path}")
        print("Playing audio...")
        winsound.PlaySound(audio_path, winsound.SND_FILENAME)
    except Exception as exc:
        print(f"Coqui TTS unavailable, using pyttsx3 fallback: {exc}")
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty('rate', 165)
        engine.say(text)
        engine.runAndWait()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--duration", type=float, default=5.0, help="Recording duration in seconds")
    parser.add_argument("--language", type=str, default="english", help="Language for STT/TTS (english, hindi, telugu)")
    args = parser.parse_args()

    # Basic availability checks
    if not stt_service.is_available():
        print("ERROR: STT service not available. Install and initialize Whisper (see README or voice.txt).")
        return

    stt_service.change_model_size('tiny')
    # Record
    audio_path = record_microphone(duration=args.duration)

    # STT
    customer_text = transcribe_audio(audio_path, language=args.language)
    if not customer_text:
        print("No speech detected. Using fallback validation prompt to continue the loop.")
        customer_text = "Hello, I would like to know more about your service."

    # Build a lightweight campaign stub (used only for prompt context)
    campaign = StubCampaign(name="Local Loop Test", language=args.language, script_template="This is a local validation test.")

    # Send to Gemini (via voice_agent_service)
    ai_response = generate_ai_response(campaign, customer_text)

    # TTS and playback
    synthesize_and_play(ai_response, language=args.language)

    # Cleanup
    try:
        os.remove(audio_path)
    except Exception:
        pass

    print("Local voice loop completed.")


if __name__ == "__main__":
    main()
