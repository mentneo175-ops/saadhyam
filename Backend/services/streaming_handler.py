import os
import json
import base64
import logging
import asyncio
import aiohttp
import audioop
from typing import Dict, Any, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
import google.generativeai as genai

from config.settings import settings
from config.database import get_db_sync
from models.voice_agent import VoiceCall, VoiceCampaign, VoiceContact, CallStatus
from services.voice_agent_service import voice_agent_service

logger = logging.getLogger(__name__)

# Global flag to track ElevenLabs availability across calling sessions
elevenlabs_cooldown_active = False

# Map campaign languages to Deepgram language codes
LANG_MAPPING = {
    "English": "en",
    "Telugu": "te",
    "Tamil": "ta",
    "Hindi": "hi",
    "Hinglish": "hi"
}

# Default ElevenLabs Voice ID (Sarah - high quality multilingual)
DEFAULT_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "TX3LPaxmHKxFdv7VOQHJ")


# Localized greetings
GREETINGS = {
    "Telugu": "హలో అండీ, నమస్కారం. నేను {name} గారితో మాట్లాడవచ్చా?",
    "Tamil": "ஹலோ, நான் {name} அவர்களிடம் பேசலாமா?",
    "Hindi": "हैलो, क्या मैं {name} जी से बात कर सकता हूँ?",
    "Hinglish": "हैलो, क्या मैं {name} जी से बात कर सकता हूँ?",
    "English": "Hello, am I speaking with {name}?"
}

class ExotelStreamHandler:
    """Manages real-time bidirectional WebSocket streaming between Exotel and AI Services"""

    def __init__(self, websocket: WebSocket, call_id: int):
        self.websocket = websocket
        self.call_id = call_id
        self.session = next(get_db_sync())
        self.call = None
        self.campaign = None
        self.contact = None
        self.language = "English"
        self.transcript_lines: List[str] = []
        self.dg_ws = None
        self.client_session = None
        self.is_running = True
        self.ai_speaking = False
        self.ai_speaking_lock = asyncio.Lock()
        self.speak_task = None
        self.response_task = None
        self.suppress_until = 0.0  # Timestamp until which transcripts are suppressed (AI echo guard)
        self.processing_lock = asyncio.Lock()  # Prevent concurrent AI responses
        self._response_seq = 0  # Debounce version counter — increments on each is_final

    async def initialize(self) -> bool:
        """Fetch call metadata and establish initial setups"""
        try:
            self.call = self.session.query(VoiceCall).filter(VoiceCall.id == self.call_id).first()
            if not self.call:
                logger.error(f"❌ Call {self.call_id} not found in DB")
                return False

            self.campaign = self.session.query(VoiceCampaign).filter(VoiceCampaign.id == self.call.campaign_id).first()
            self.contact = self.session.query(VoiceContact).filter(VoiceContact.id == self.call.contact_id).first()

            if not self.campaign or not self.contact:
                logger.error(f"❌ Campaign or Contact not found for Call {self.call_id}")
                return False

            # Normalize language to Capitalized string
            lang_val = self.campaign.language
            if hasattr(lang_val, "value"):
                lang_val = lang_val.value
            self.language = str(lang_val).capitalize() if lang_val else "English"

            # Attempt to resolve language dynamically from Lead record
            try:
                from models.voice_agent import CallSession, Lead
                lead = None
                
                # 1. Resolve Lead by active CallSession SID
                if self.call.call_sid:
                    session_record = self.session.query(CallSession).filter(CallSession.session_id == self.call.call_sid).first()
                    if session_record and session_record.lead_id:
                        lead = self.session.query(Lead).filter(Lead.id == session_record.lead_id).first()
                
                # 2. Fallback: Resolve Lead by matching phone number
                if not lead and self.contact and self.contact.phone_number:
                    clean_phone = "".join(c for c in self.contact.phone_number if c.isdigit())[-10:]
                    lead = self.session.query(Lead).filter(Lead.phone.like(f"%{clean_phone}%")).first()
                
                if lead and lead.language:
                    lead_lang = str(lead.language).lower().strip()
                    if "te" in lead_lang or "telugu" in lead_lang:
                        self.language = "Telugu"
                    elif "hi" in lead_lang or "hindi" in lead_lang:
                        self.language = "Hindi"
                    elif "ta" in lead_lang or "tamil" in lead_lang:
                        self.language = "Tamil"
                    elif "en" in lead_lang or "english" in lead_lang:
                        self.language = "English"
                    logger.info(f"🎯 Dynamic Lang Resolution: Found lead '{lead.name}' with language '{lead.language}' -> Set call language to '{self.language}'")
            except Exception as lang_err:
                logger.error(f"⚠️ Failed to dynamically resolve Lead language: {lang_err}")

            # Configure Gemini API
            if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("AQ.") or settings.GEMINI_API_KEY == "your_google_ai_studio_api_key_here":
                logger.error("❌ Gemini API key is missing or invalid. Set a valid GEMINI_API_KEY in your .env file.")
                return False
            genai.configure(api_key=settings.GEMINI_API_KEY)


            # Update call status to connected
            self.call.status = CallStatus.CONNECTED
            self.session.commit()
            logger.info(f"🟢 Exotel Stream connected for Call {self.call_id} ({self.contact.name})")
            return True
        except Exception as e:
            logger.error(f"❌ Initialization error for Call {self.call_id}: {e}")
            return False

    async def speak_greeting(self):
        """Pre-generate and speak localized greeting to caller with zero starting latency"""
        lang = self.language
        greeting_tmpl = GREETINGS.get(lang, GREETINGS["English"])
        greeting_text = greeting_tmpl.format(name=self.contact.name)

        logger.info(f"🗣️ Speaking initial greeting in {lang}: '{greeting_text}'")
        self.transcript_lines.append(f"AI: {greeting_text}")
        
        # Stream greeting audio to caller
        self.speak_task = asyncio.create_task(self.speak_text(greeting_text))
        try:
            await self.speak_task
        except asyncio.CancelledError:
            logger.info("speak_greeting task cancelled")

    async def stop_speaking(self):
        """Cancel any active speech generation or streaming task"""
        if self.speak_task and not self.speak_task.done():
            self.speak_task.cancel()
            logger.info("🛑 Cancelled active Exotel speak_text task")
        if self.response_task and not self.response_task.done():
            self.response_task.cancel()
            logger.info("🛑 Cancelled active Exotel get_ai_response task")
        self.ai_speaking = False
        self.suppress_until = 0.0  # Clear IMMEDIATELY so user can speak right away (no race condition)

    async def generate_and_speak(self, transcript: str):
        try:
            # Generate AI reply
            reply = await self.get_ai_response(transcript)
            logger.info(f"🤖 AI: {reply}")
            self.transcript_lines.append(f"AI: {reply}")

            # Set suppress window: block AI audio echo from being picked up by phone mic as user input
            word_count = len(reply.split())
            estimated_duration = max((word_count / 2.5) + 1.5, 3.0)  # min 3s suppress window
            self.suppress_until = asyncio.get_event_loop().time() + estimated_duration
            logger.info(f"🔇 Echo guard active: suppressing input for {estimated_duration:.1f}s")

            # Speak it back
            self.speak_task = asyncio.create_task(self.speak_text(reply))
            await self.speak_task
        except asyncio.CancelledError:
            logger.info("generate_and_speak task cancelled")
        except Exception as e:
            logger.error(f"Error in generate_and_speak: {e}")
        finally:
            self.suppress_until = 0.0  # Always clear echo guard after speaking finishes

    async def _speak_sarvam_exotel(self, text: str) -> bool:
        sarvam_api_key = os.getenv("SARVAM_API_KEY")
        if not sarvam_api_key:
            return False

        sarvam_lang = "te-IN"
        lang_str = str(self.language).capitalize()
        if "English" in lang_str:
            sarvam_lang = "en-IN"
        elif "Tamil" in lang_str:
            sarvam_lang = "ta-IN"
        elif "Hindi" in lang_str or "Hinglish" in lang_str:
            sarvam_lang = "hi-IN"
            
        url = "https://api.sarvam.ai/text-to-speech/stream"
        headers = {
            "api-subscription-key": sarvam_api_key,
            "Content-Type": "application/json"
        }
        # Determine speaker dynamically: default to 'ritu' for Telugu/Tamil if speaker is 'shubh'
        speaker = os.getenv("SARVAM_SPEAKER", "shubh")
        if speaker == "shubh" and ("telugu" in lang_str.lower() or "tamil" in lang_str.lower()):
            speaker = "ritu"

        try:
            pace = float(os.getenv("SARVAM_PACE", "1.1"))
        except ValueError:
            pace = 1.1

        payload = {
            "text": text,
            "target_language_code": sarvam_lang,
            "model": os.getenv("SARVAM_MODEL", "bulbul:v3"),
            "speaker": speaker,
            "pace": pace,
            "speech_sample_rate": 8000,
            "output_audio_codec": "linear16",
            "enable_preprocessing": True
        }
        try:
            audio_queue = asyncio.Queue()
            download_done = asyncio.Event()

            async def download_audio():
                try:
                    pcm_buffer = b""
                    pcm_chunk_size = 4096
                    async with aiohttp.ClientSession() as client:
                        async with client.post(url, json=payload, headers=headers) as resp:
                            if resp.status == 200:
                                logger.info(f"🔊 Sarvam download started (Exotel)")
                                async for raw_chunk in resp.content.iter_any():
                                    if not self.is_running:
                                        break
                                    pcm_buffer += raw_chunk
                                    while len(pcm_buffer) >= pcm_chunk_size:
                                        pcm_frame = pcm_buffer[:pcm_chunk_size]
                                        pcm_buffer = pcm_buffer[pcm_chunk_size:]
                                        await audio_queue.put(pcm_frame)
                                if pcm_buffer and self.is_running:
                                    await audio_queue.put(pcm_buffer)
                            else:
                                err_txt = await resp.text()
                                logger.error(f"❌ Sarvam Streaming TTS failed (Exotel): {resp.status} - {err_txt}")
                except Exception as e:
                    logger.error(f"❌ Exception downloading Sarvam audio (Exotel): {e}")
                finally:
                    download_done.set()

            downloader_task = asyncio.create_task(download_audio())

            # Wait for a tiny buffer
            for _ in range(3):
                if audio_queue.empty() and not download_done.is_set():
                    await asyncio.sleep(0.05)

            start_time = asyncio.get_event_loop().time()
            bytes_sent = 0
            chunks_sent = 0
            while self.is_running:
                if audio_queue.empty():
                    if download_done.is_set():
                        break
                    try:
                        pcm_frame = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                    except asyncio.TimeoutError:
                        continue
                else:
                    pcm_frame = audio_queue.get_nowait()

                b64_data = base64.b64encode(pcm_frame).decode("utf-8")
                media_frame = {
                    "event": "media",
                    "media": {"chunk": b64_data}
                }
                await self.websocket.send_text(json.dumps(media_frame))
                chunks_sent += 1
                bytes_sent += len(pcm_frame)
                target_elapsed = bytes_sent / 16000.0  # linear16 8000Hz => 16000 bytes/sec
                now = asyncio.get_event_loop().time()
                sleep_dur = start_time + target_elapsed - now
                if sleep_dur < -0.05:
                    start_time = now - target_elapsed
                    sleep_dur = 0
                if sleep_dur > 0:
                    await asyncio.sleep(sleep_dur)

            if not downloader_task.done():
                downloader_task.cancel()

            if chunks_sent > 0:
                logger.info(f"🔊 Exotel Sarvam stream complete. Sent {chunks_sent} chunks.")
                return True
            return False
        except asyncio.CancelledError:
            logger.info("🛑 Sarvam speak_text (Exotel) cancelled")
            raise
        except Exception as e:
            logger.error(f"❌ Exception in Sarvam speak_text (Exotel): {e}")
            return False

    async def _speak_elevenlabs_exotel(self, text: str) -> bool:
        if not settings.ELEVENLABS_API_KEY:
            return False

        lang_str = str(self.language).capitalize()
        if "Telugu" in lang_str:
            voice_id = settings.ELEVENLABS_TELUGU_VOICE_ID
        elif "Hindi" in lang_str or "Hinglish" in lang_str:
            voice_id = settings.ELEVENLABS_HINDI_VOICE_ID
        else:
            voice_id = settings.ELEVENLABS_VOICE_ID

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream?output_format=pcm_8000"
        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_v3",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            audio_queue = asyncio.Queue()
            download_done = asyncio.Event()

            async def download_audio():
                try:
                    pcm_buffer = b""
                    pcm_chunk_size = 4096
                    async with aiohttp.ClientSession() as client:
                        async with client.post(url, json=payload, headers=headers) as resp:
                            if resp.status == 200:
                                logger.info(f"🔊 ElevenLabs download started (Exotel) using voice {voice_id}")
                                async for raw_chunk in resp.content.iter_any():
                                    if not self.is_running:
                                        break
                                    pcm_buffer += raw_chunk
                                    while len(pcm_buffer) >= pcm_chunk_size:
                                        pcm_frame = pcm_buffer[:pcm_chunk_size]
                                        pcm_buffer = pcm_buffer[pcm_chunk_size:]
                                        await audio_queue.put(pcm_frame)
                                if pcm_buffer and self.is_running:
                                    padded = pcm_buffer + b"\x00" * (pcm_chunk_size - len(pcm_buffer))
                                    await audio_queue.put(padded)
                            else:
                                err_txt = await resp.text()
                                logger.error(f"❌ ElevenLabs TTS stream failed (Exotel): Status {resp.status} - {err_txt}")
                                if resp.status in [401, 402, 403]:
                                    global elevenlabs_cooldown_active
                                    elevenlabs_cooldown_active = True
                                    logger.warning("⚠️ ElevenLabs returned terminal error. Bypassing ElevenLabs for future turns.")
                except Exception as e:
                    logger.error(f"❌ Exception downloading ElevenLabs audio (Exotel): {e}")
                finally:
                    download_done.set()

            downloader_task = asyncio.create_task(download_audio())

            # Wait for buffer
            for _ in range(3):
                if audio_queue.empty() and not download_done.is_set():
                    await asyncio.sleep(0.05)

            start_time = asyncio.get_event_loop().time()
            bytes_sent = 0
            chunks_sent = 0
            while self.is_running:
                if audio_queue.empty():
                    if download_done.is_set():
                        break
                    try:
                        chunk = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                    except asyncio.TimeoutError:
                        continue
                else:
                    chunk = audio_queue.get_nowait()

                b64_data = base64.b64encode(chunk).decode("utf-8")
                media_frame = {
                    "event": "media",
                    "media": {
                        "chunk": b64_data
                    }
                }
                await self.websocket.send_text(json.dumps(media_frame))
                chunks_sent += 1
                bytes_sent += len(chunk)
                target_elapsed = bytes_sent / 16000.0  # linear16 8000Hz => 16000 bytes/sec
                now = asyncio.get_event_loop().time()
                sleep_dur = start_time + target_elapsed - now
                if sleep_dur < -0.05:
                    start_time = now - target_elapsed
                    sleep_dur = 0
                if sleep_dur > 0:
                    await asyncio.sleep(sleep_dur)

            if not downloader_task.done():
                downloader_task.cancel()

            if chunks_sent > 0:
                logger.info(f"🔊 Exotel ElevenLabs stream complete. Sent {chunks_sent} chunks.")
                return True
            return False
        except asyncio.CancelledError:
            logger.info("🛑 ElevenLabs speak_text (Exotel) cancelled")
            raise
        except Exception as e:
            logger.error(f"❌ Exception in speak_text (Exotel): {e}")
            return False

    async def speak_text(self, text: str):
        """Query TTS (Sarvam AI or ElevenLabs) and stream PCM chunks to Exotel"""
        async with self.ai_speaking_lock:
            self.ai_speaking = True

        try:
            sarvam_api_key = os.getenv("SARVAM_API_KEY")
            tts_provider = os.getenv("TTS_PROVIDER", "sarvam").lower()
            
            # For Indian languages, default to Sarvam AI if available to avoid ElevenLabs restrictions
            lang_str = str(self.language).capitalize()
            is_indian_lang = any(x in lang_str for x in ["Telugu", "Tamil", "Hindi", "Hinglish"])
            
            if is_indian_lang and sarvam_api_key:
                tts_provider = "sarvam"
                
            global elevenlabs_cooldown_active
            if elevenlabs_cooldown_active:
                tts_provider = "sarvam"
                
            success = False
            if tts_provider == "elevenlabs":
                success = await self._speak_elevenlabs_exotel(text)
                if not success and sarvam_api_key:
                    logger.warning("⚠️ ElevenLabs Exotel streaming failed. Falling back to Sarvam AI...")
                    success = await self._speak_sarvam_exotel(text)
            else:
                if sarvam_api_key:
                    success = await self._speak_sarvam_exotel(text)
                if not success:
                    logger.warning("⚠️ Sarvam AI Exotel streaming failed/missing. Falling back to ElevenLabs...")
                    success = await self._speak_elevenlabs_exotel(text)
                    
            if not success:
                logger.error("❌ Both TTS providers failed for Exotel call.")
        finally:
            async with self.ai_speaking_lock:
                self.ai_speaking = False

    async def get_ai_response(self, user_speech: str) -> str:
        """Call Gemini model to process the conversation context and return AI script reply"""
        logger.info(f"🧠 Generating AI reply for user input: '{user_speech}'")
        
        # Build conversation history context
        history = "\n".join(self.transcript_lines[-4:]) # Last 4 turns
        
        telugu_rules = ""
        if "telugu" in str(self.language).lower():
            telugu_rules = """
CRITICAL TELUGU LANGUAGE RULES (NATIVE & CASUAL SLANG):
- Talk like a real, friendly Telugu person on a phone call. Use natural, everyday Telugu slang.
- DO NOT use formal translation terms like "మిత్రుడా" (my friend), "మగనికి" (male/husband), "తమమ్మాయి", or "ఆసక్తి ఉంది".
- To ask about admission/class for their child, use natural phrases like: "బాబు ఏ క్లాస్ అండీ?", "పాప ఏ క్లాస్ కి అడ్మిషన్ కావాలండీ?", "బాబుకా లేక పాపకా అండీ అడ్మిషన్?"
- Add the polite suffix "అండీ" (andi) at the end of sentences to show respect naturally (e.g., "ఆగండి అండీ", "చెప్పండి అండీ", "నమస్కారం అండీ", "అవునండీ", "ఫీజు వివరాలు చెప్తానండీ").
- Mix in common English words naturally as people do in daily life: "school", "admission", "fees", "seat", "office", "class", "direct", "okay", "sure", "thank you".
- Example greetings: "హలో అండీ, నమస్కారం. అభి గారితో మాట్లాడవచ్చా?"
- Example casual sentences:
  * "స్కూల్ అడ్మిషన్స్ గురించి అడగటానికి కాల్ చేశామండీ."
  * "బాబు ఏ క్లాస్ అడ్మిషన్ కోసం చూస్తున్నారండీ?"
  * "అవునా అండీ, పర్వాలేదు."
  * "ఫీజుల వివరాలు మా ఆఫీస్ లో డైరెక్ట్ గా చెప్తారండీ."
"""

        prompt = f"""
You are an advanced interactive AI phone calling voice agent representing a business.
Your target language is {self.language}.

{telugu_rules}

IMPORTANT LANGUAGE RULES:
- Speak in simple, casual, everyday conversational {self.language} that common people use in daily life.
- DO NOT use formal, literary, or pure {self.language}. Use the way normal people talk on phone calls.
- Mix in common English words naturally (like "school", "admission", "fees", "ok", "sure", "thank you") as people normally do in conversation.
- Keep it friendly, warm, and easy to understand for everyone.
- Keep answers extremely brief (1-2 short sentences) since this is a voice call.

Campaign Script Guidelines:
{self.campaign.script_template}

Caller Info:
- Name: {self.contact.name}
- Phone: {self.contact.phone_number}

Recent Conversation History:
{history}

Customer said: "{user_speech}"

Provide your next direct script response now. Speak directly to the customer. Do not add any metadata, parenthetical cues, or formatting.
"""
        try:
            response_text = await asyncio.to_thread(voice_agent_service._generate_with_fallback, prompt)
            if response_text:
                return response_text
            raise Exception("All generation models failed")
        except Exception as e:
            logger.error(f"❌ AI generation failed, using fallback: {e}")
            if self.language == "Telugu":
                return "క్షమించండి, మీ మాట సరిగ్గా వినబడలేదు. మళ్ళీ చెప్పగలరా?"
            return "I am sorry, I did not catch that. Could you please repeat?"

    async def start_deepgram_stt(self):
        """Establish connection to Deepgram WebSocket and launch transcript listener task"""
        lang_code = LANG_MAPPING.get(self.language, "te") # Default to Telugu
        
        url = f"wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=8000&channels=1&model=nova-3&language={lang_code}&endpointing=1000"
        headers = {
            "Authorization": f"Token {settings.DEEPGRAM_API_KEY}"
        }

        logger.info(f"🎙️ Connecting to Deepgram STT. Language model: {lang_code}")
        
        try:
            self.client_session = aiohttp.ClientSession()
            self.dg_ws = await self.client_session.ws_connect(url, headers=headers)
            
            # Start background listener task
            asyncio.create_task(self.listen_deepgram_transcripts())
        except Exception as e:
            logger.error(f"❌ Deepgram STT connection failed: {e}")

    async def listen_deepgram_transcripts(self):
        """Listen for final speech transcripts from Deepgram, feed to Gemini, and speak reply"""
        try:
            async for msg in self.dg_ws:
                if not self.is_running:
                    break
                
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    channel = data.get("channel", {})
                    alternatives = channel.get("alternatives", [{}])
                    transcript = alternatives[0].get("transcript", "").strip()
                    is_final = data.get("is_final", False)

                    if transcript:
                        # Filter out common filler words and short noise/punctuation
                        clean_trans = "".join([c for c in transcript.lower() if c.isalnum() or c.isspace()]).strip()
                        fillers = {"uh", "um", "ah", "eh", "oh", "hmmm", "hmm"}
                        if not clean_trans or clean_trans in fillers or len(clean_trans) < 2:
                            logger.info(f"Ignoring filler/noise transcript: '{transcript}'")
                            continue

                        # Avoid feedback loop if speaker echoes fallback message
                        fallback_phrases = [
                            "i am sorry i did not catch that",
                            "could you please repeat",
                            "క్షమించండి మీ మాట సరిగ్గా వినబడలేదు",
                            "మళ్ళీ చెప్పగలరా"
                        ]
                        if any(phrase in clean_trans for phrase in fallback_phrases):
                            logger.info(f"Ignoring feedback echo transcript: '{transcript}'")
                            continue

                        # If AI is currently speaking and user started talking, stop the AI immediately!
                        if self.ai_speaking and len(transcript.strip()) >= 2:
                            logger.info(f"🛑 User interrupted AI (Exotel) with text: '{transcript}' (is_final={is_final})")
                            await self.stop_speaking()

                        if is_final:
                            # Block transcripts while AI audio is playing back (prevents echo loop)
                            now = asyncio.get_event_loop().time()
                            if now < self.suppress_until:
                                logger.info(f"🔇 Suppressed echo transcript (Exotel): '{transcript}'")
                                continue

                            # Require at least 2 words — avoids responding to mid-speech partial bursts
                            if len(clean_trans.split()) < 2:
                                logger.info(f"⏭️ Skipping short partial ({len(clean_trans.split())} word): '{transcript}'")
                                continue

                            logger.info(f"👤 Customer (final, pending debounce): {transcript}")

                            # Cancel any previous generating or speaking task
                            await self.stop_speaking()

                            # Debounce 500ms: if user continues speaking within this window,
                            # the old pending response is cancelled and we start fresh.
                            # This prevents AI from interrupting mid-sentence on natural pauses.
                            self._response_seq += 1
                            seq = self._response_seq
                            captured = transcript

                            async def _debounced_respond(s=seq, t=captured):
                                try:
                                    await asyncio.sleep(0.3)
                                    if self.is_running and s == self._response_seq:
                                        self.transcript_lines.append(f"Customer: {t}")
                                        logger.info(f"👤 Customer (confirmed): {t}")
                                        await self.generate_and_speak(t)
                                except asyncio.CancelledError:
                                    pass

                            self.response_task = asyncio.create_task(_debounced_respond())

        except Exception as e:
            logger.error(f"❌ Exception in Deepgram transcript receiver loop: {e}")
        finally:
            logger.info("🎙️ Deepgram STT receiver loop stopped")

    async def handle_exotel_media(self):
        """Read media packets from Exotel WebSocket and write them to Deepgram STT"""
        try:
            async for message in self.websocket.iter_text():
                if not self.is_running:
                    break

                data = json.loads(message)
                event = data.get("event")

                if event == "media":
                    media = data.get("media", {})
                    chunk_b64 = media.get("chunk")
                    
                    if chunk_b64 and self.dg_ws and not self.dg_ws.closed:
                        # Decode Base64 and write raw binary PCM to Deepgram
                        raw_pcm = base64.b64decode(chunk_b64)
                        await self.dg_ws.send_bytes(raw_pcm)

                elif event == "stop":
                    logger.info("⏹️ Stop event received from Exotel call")
                    break

        except Exception as e:
            logger.error(f"❌ Exception in Exotel media loop: {e}")
        finally:
            await self.close_call()

    async def close_call(self):
        """Close services, perform summary extraction, triggers n8n webhook, and triggers next call"""
        if not self.is_running:
            return
            
        self.is_running = False
        logger.info(f"🏁 Closing Call {self.call_id} session...")

        # Close sockets
        if self.dg_ws and not self.dg_ws.closed:
            await self.dg_ws.close()
        if self.client_session and not self.client_session.closed:
            await self.client_session.close()
        
        # Save transcript
        full_transcript = "\n".join(self.transcript_lines)
        
        try:
            # Update call status metadata immediately in DB (so status changes to COMPLETED instantly in UI)
            self.call.status = CallStatus.COMPLETED
            self.call.conversation_transcript = full_transcript
            self.call.duration = len(self.transcript_lines) * 6 # rough calculation: ~6 seconds per turn
            
            # Sync with CRM CallSession and Lead tables
            from models.voice_agent import CallSession, Lead, Campaign
            session_record = self.session.query(CallSession).filter(CallSession.session_id == self.call.call_sid).first()
            if not session_record and self.call.call_sid:
                # Resolve Campaign and Lead by matching phone number and campaign name
                clean_phone = "".join(c for c in self.call.phone_number if c.isdigit())[-10:]
                crm_campaign = self.session.query(Campaign).filter(Campaign.name == self.campaign.name).first()
                crm_campaign_id = crm_campaign.id if crm_campaign else None
                
                crm_lead = None
                if crm_campaign_id:
                    crm_lead = self.session.query(Lead).filter(
                        Lead.phone.like(f"%{clean_phone}%"),
                        Lead.campaign_id == crm_campaign_id
                    ).first()
                if not crm_lead:
                    crm_lead = self.session.query(Lead).filter(Lead.phone.like(f"%{clean_phone}%")).first()
                
                lead_id = crm_lead.id if crm_lead else None
                logger.info(f"🆕 Pre-creating missing CallSession in close_call for Call SID {self.call.call_sid}, Lead ID: {lead_id}")
                session_record = CallSession(
                    session_id=self.call.call_sid,
                    status="completed",
                    transcript=full_transcript,
                    lead_id=lead_id,
                    campaign_id=crm_campaign_id
                )
                self.session.add(session_record)
                if crm_lead:
                    crm_lead.status = "called"
            elif session_record:
                session_record.status = "completed"
                session_record.transcript = full_transcript
                crm_lead = self.session.query(Lead).filter(Lead.id == session_record.lead_id).first()
                if crm_lead:
                    crm_lead.status = "called"
            
            # Update contact
            self.contact.is_completed = True
            self.contact.call_attempts += 1
            
            # Update campaign metrics
            self.campaign.calls_completed = (self.campaign.calls_completed or 0) + 1
            self.campaign.calls_pending = max(0, (self.campaign.calls_pending or 1) - 1)
            
            # Recalculate averages
            if self.call.duration:
                prev_completed = self.campaign.calls_completed - 1
                if prev_completed > 0:
                    total_dur = (self.campaign.avg_call_duration or 0.0) * prev_completed
                    self.campaign.avg_call_duration = (total_dur + self.call.duration) / self.campaign.calls_completed
                else:
                    self.campaign.avg_call_duration = float(self.call.duration)

            self.session.commit()
            logger.info("💾 Call metadata saved to DB successfully!")

            # Trigger background post-call LLM analytics (summary, sentiment, outcomes, lead generation)
            asyncio.create_task(run_post_call_analytics_background(self.call_id, full_transcript))

            # Trigger the next call in the queue sequentially!
            asyncio.create_task(self.trigger_next_campaign_call())

        except Exception as e:
            logger.error(f"❌ Failed to save call results: {e}")
            self.session.rollback()
        finally:
            self.session.close()

    async def trigger_n8n_webhook(self, is_interested: bool):
        """Send call detail package to n8n webhook for Google Sheets / WhatsApp alerts"""
        webhook_url = os.getenv("N8N_LEAD_WEBHOOK_URL")
        if not webhook_url:
            logger.info("ℹ️ N8N_LEAD_WEBHOOK_URL is not set. Skipping n8n notification webhook.")
            return

        payload = {
            "call_id": self.call_id,
            "campaign_id": self.campaign.id,
            "campaign_name": self.campaign.name,
            "contact_name": self.contact.name,
            "phone_number": self.contact.phone_number,
            "outcome": self.call.call_outcome,
            "sentiment": self.call.customer_sentiment,
            "summary": self.call.conversation_summary,
            "key_quote": self.call.key_quote,
            "notes": self.call.notes,
            "is_interested": is_interested,
            "timestamp": self.call.ended_at.isoformat() if self.call.ended_at else ""
        }

        try:
            async with aiohttp.ClientSession() as client:
                async with client.post(webhook_url, json=payload, timeout=5) as resp:
                    logger.info(f"🚀 Triggered n8n webhook - Status: {resp.status}")
        except Exception as e:
            logger.error(f"❌ Failed to trigger n8n webhook: {e}")

    async def trigger_next_campaign_call(self):
        """Check if campaign is active and trigger the next call in the queue sequentially"""
        # Small pause before triggering the next call
        await asyncio.sleep(3)
        
        db = next(get_db_sync())
        try:
            # Re-fetch campaign to verify status
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == self.campaign.id).first()
            if not campaign or campaign.status.value != "active":
                logger.info(f"⏹️ Campaign {self.campaign.id} is no longer active or is completed. Stop queue.")
                return

            from services.voice_call_queue_service import voice_call_queue_service
            next_call = voice_call_queue_service.get_next_queued_call(db, campaign.id)
            
            if next_call:
                logger.info(f"🔄 Triggering next sequential call in queue (Call ID: {next_call.id})")
                # Process directly in a thread instead of Celery
                import threading
                def _process_next(call_id: int):
                    db2 = next(get_db_sync())
                    try:
                        voice_call_queue_service.process_call(db2, call_id)
                    except Exception as e:
                        logger.error(f"❌ Error processing next call {call_id}: {e}")
                    finally:
                        db2.close()
                threading.Thread(target=_process_next, args=(next_call.id,), daemon=True).start()
            else:
                logger.info(f"🎉 No more calls in queue. Marking Campaign {campaign.id} as COMPLETED")
                campaign.status = "completed"
                db.commit()
        except Exception as e:
            logger.error(f"❌ Error triggering next sequential call: {e}")
        finally:
            db.close()


class TwilioStreamHandler:
    """Manages real-time bidirectional WebSocket streaming between Twilio and AI Services"""

    def __init__(self, websocket: WebSocket, call_id: int):
        self.websocket = websocket
        self.call_id = call_id
        self.session = next(get_db_sync())
        self.call = None
        self.campaign = None
        self.contact = None
        self.language = "English"
        self.transcript_lines: List[str] = []
        self.dg_ws = None
        self.client_session = None
        self.is_running = True
        self.ai_speaking = False
        self.ai_speaking_lock = asyncio.Lock()
        self.stream_sid = None
        self.speak_task = None
        self.response_task = None
        self.suppress_until = 0.0  # Timestamp until which transcripts are suppressed (AI echo guard)
        self.processing_lock = asyncio.Lock()  # Prevent concurrent AI responses
        self._response_seq = 0  # Debounce version counter — increments on each is_final

    async def initialize(self) -> bool:
        """Fetch call metadata and establish initial setups"""
        try:
            self.call = self.session.query(VoiceCall).filter(VoiceCall.id == self.call_id).first()
            if not self.call:
                logger.error(f"❌ Call {self.call_id} not found in DB")
                return False

            self.campaign = self.session.query(VoiceCampaign).filter(VoiceCampaign.id == self.call.campaign_id).first()
            self.contact = self.session.query(VoiceContact).filter(VoiceContact.id == self.call.contact_id).first()

            if not self.campaign or not self.contact:
                logger.error(f"❌ Campaign or Contact not found for Call {self.call_id}")
                return False

            # Normalize language to Capitalized string
            lang_val = self.campaign.language
            if hasattr(lang_val, "value"):
                lang_val = lang_val.value
            self.language = str(lang_val).capitalize() if lang_val else "English"

            # Attempt to resolve language dynamically from Lead record
            try:
                from models.voice_agent import CallSession, Lead
                lead = None
                
                # 1. Resolve Lead by active CallSession SID
                if self.call.call_sid:
                    session_record = self.session.query(CallSession).filter(CallSession.session_id == self.call.call_sid).first()
                    if session_record and session_record.lead_id:
                        lead = self.session.query(Lead).filter(Lead.id == session_record.lead_id).first()
                
                # 2. Fallback: Resolve Lead by matching phone number
                if not lead and self.contact and self.contact.phone_number:
                    clean_phone = "".join(c for c in self.contact.phone_number if c.isdigit())[-10:]
                    lead = self.session.query(Lead).filter(Lead.phone.like(f"%{clean_phone}%")).first()
                
                if lead and lead.language:
                    lead_lang = str(lead.language).lower().strip()
                    if "te" in lead_lang or "telugu" in lead_lang:
                        self.language = "Telugu"
                    elif "hi" in lead_lang or "hindi" in lead_lang:
                        self.language = "Hindi"
                    elif "ta" in lead_lang or "tamil" in lead_lang:
                        self.language = "Tamil"
                    elif "en" in lead_lang or "english" in lead_lang:
                        self.language = "English"
                    logger.info(f"🎯 Dynamic Lang Resolution: Found lead '{lead.name}' with language '{lead.language}' -> Set call language to '{self.language}'")
            except Exception as lang_err:
                logger.error(f"⚠️ Failed to dynamically resolve Lead language: {lang_err}")

            # Configure Gemini API
            if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("AQ.") or settings.GEMINI_API_KEY == "your_google_ai_studio_api_key_here":
                logger.error("❌ Gemini API key is missing or invalid. Set a valid GEMINI_API_KEY in your .env file.")
                return False
            genai.configure(api_key=settings.GEMINI_API_KEY)


            # Update call status to connected
            self.call.status = CallStatus.CONNECTED
            self.session.commit()
            logger.info(f"🟢 Twilio Stream connected for Call {self.call_id} ({self.contact.name})")
            return True
        except Exception as e:
            logger.error(f"❌ Initialization error for Call {self.call_id}: {e}")
            return False

    async def speak_greeting(self):
        """Pre-generate and speak localized greeting to caller with zero starting latency"""
        lang = self.language
        greeting_tmpl = GREETINGS.get(lang, GREETINGS["English"])
        greeting_text = greeting_tmpl.format(name=self.contact.name)

        logger.info(f"🗣️ Speaking initial greeting in {lang}: '{greeting_text}'")
        self.transcript_lines.append(f"AI: {greeting_text}")
        
        # Stream greeting audio to caller
        self.speak_task = asyncio.create_task(self.speak_text(greeting_text))
        try:
            await self.speak_task
        except asyncio.CancelledError:
            logger.info("speak_greeting task cancelled")

    async def stop_speaking(self):
        """Cancel any active speech generation or streaming task and clear Twilio buffer"""
        if self.speak_task and not self.speak_task.done():
            self.speak_task.cancel()
            logger.info("🛑 Cancelled active Twilio speak_text task")
        if self.response_task and not self.response_task.done():
            self.response_task.cancel()
            logger.info("🛑 Cancelled active Twilio get_ai_response task")
        self.ai_speaking = False
        self.suppress_until = 0.0  # Clear IMMEDIATELY so user can speak right away (no race condition)
        
        # Clear Twilio's audio play buffer
        if self.stream_sid:
            try:
                clear_frame = {
                    "event": "clear",
                    "streamSid": self.stream_sid
                }
                await self.websocket.send_text(json.dumps(clear_frame))
                logger.info("🧼 Sent clear event to Twilio stream")
            except Exception as e:
                logger.error(f"❌ Failed to send clear event to Twilio: {e}")

    async def generate_and_speak(self, transcript: str):
        try:
            # Generate AI reply
            reply = await self.get_ai_response(transcript)
            logger.info(f"🤖 AI: {reply}")
            self.transcript_lines.append(f"AI: {reply}")

            # Set suppress window: block AI audio echo from being picked up by phone mic as user input
            word_count = len(reply.split())
            estimated_duration = max((word_count / 2.5) + 1.5, 3.0)  # min 3s suppress window
            self.suppress_until = asyncio.get_event_loop().time() + estimated_duration
            logger.info(f"🔇 Echo guard active: suppressing input for {estimated_duration:.1f}s")

            # Speak it back
            self.speak_task = asyncio.create_task(self.speak_text(reply))
            await self.speak_task
        except asyncio.CancelledError:
            logger.info("generate_and_speak task cancelled")
        except Exception as e:
            logger.error(f"Error in generate_and_speak: {e}")
        finally:
            self.suppress_until = 0.0  # Always clear echo guard after speaking finishes

    async def _speak_sarvam_twilio(self, text: str) -> bool:
        sarvam_api_key = os.getenv("SARVAM_API_KEY")
        if not sarvam_api_key:
            return False
        
        sarvam_lang = "te-IN"
        lang_str = str(self.language).capitalize()
        if "English" in lang_str:
            sarvam_lang = "en-IN"
        elif "Tamil" in lang_str:
            sarvam_lang = "ta-IN"
        elif "Hindi" in lang_str or "Hinglish" in lang_str:
            sarvam_lang = "hi-IN"
            
        url = "https://api.sarvam.ai/text-to-speech/stream"
        headers = {
            "api-subscription-key": sarvam_api_key,
            "Content-Type": "application/json"
        }
        speaker = os.getenv("SARVAM_SPEAKER", "shubh")
        if speaker == "shubh" and ("telugu" in lang_str.lower() or "tamil" in lang_str.lower()):
            speaker = "ritu"

        try:
            pace = float(os.getenv("SARVAM_PACE", "1.1"))
        except ValueError:
            pace = 1.1

        payload = {
            "text": text,
            "target_language_code": sarvam_lang,
            "model": os.getenv("SARVAM_MODEL", "bulbul:v3"),
            "speaker": speaker,
            "pace": pace,
            "speech_sample_rate": 8000,
            "output_audio_codec": "linear16",
            "enable_preprocessing": True
        }
        
        try:
            audio_queue = asyncio.Queue()
            download_done = asyncio.Event()

            async def download_audio():
                try:
                    pcm_buffer = b""
                    pcm_chunk_size = 640
                    async with aiohttp.ClientSession() as client:
                        async with client.post(url, json=payload, headers=headers) as resp:
                            if resp.status == 200:
                                logger.info(f"🔊 Sarvam download started (Twilio)")
                                async for raw_chunk in resp.content.iter_any():
                                    if not self.is_running:
                                        break
                                    pcm_buffer += raw_chunk
                                    while len(pcm_buffer) >= pcm_chunk_size:
                                        pcm_frame = pcm_buffer[:pcm_chunk_size]
                                        pcm_buffer = pcm_buffer[pcm_chunk_size:]
                                        await audio_queue.put(pcm_frame)
                                if pcm_buffer and self.is_running:
                                    if len(pcm_buffer) % 2 != 0:
                                        pcm_buffer += b'\x00'
                                    await audio_queue.put(pcm_buffer)
                            else:
                                err_txt = await resp.text()
                                logger.error(f"❌ Sarvam Streaming TTS failed (Twilio): {resp.status} - {err_txt}")
                except Exception as e:
                    logger.error(f"❌ Exception downloading Sarvam audio (Twilio): {e}")
                finally:
                    download_done.set()

            downloader_task = asyncio.create_task(download_audio())

            for _ in range(12):
                if audio_queue.empty() and not download_done.is_set():
                    await asyncio.sleep(0.04)

            start_time = asyncio.get_event_loop().time()
            chunk_duration = 0.040
            chunks_sent = 0
            while self.is_running:
                if audio_queue.empty():
                    if download_done.is_set():
                        break
                    try:
                        pcm_frame = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                    except asyncio.TimeoutError:
                        continue
                else:
                    pcm_frame = audio_queue.get_nowait()

                mulaw_frame = audioop.lin2ulaw(pcm_frame, 2)
                b64_data = base64.b64encode(mulaw_frame).decode("utf-8")
                
                media_frame = {
                    "event": "media",
                    "streamSid": self.stream_sid,
                    "media": {"payload": b64_data}
                }
                await self.websocket.send_text(json.dumps(media_frame))
                chunks_sent += 1
                
                next_send_time = start_time + (chunks_sent * chunk_duration)
                now = asyncio.get_event_loop().time()
                sleep_dur = next_send_time - now
                if sleep_dur < -0.02:
                    # Reset clock to current time to prevent fast-burst playback when queue runs dry
                    start_time = now - (chunks_sent * chunk_duration)
                    sleep_dur = 0
                if sleep_dur > 0:
                    await asyncio.sleep(sleep_dur)

            if not downloader_task.done():
                downloader_task.cancel()

            if chunks_sent > 0:
                if self.is_running:
                    mark_frame = {
                        "event": "mark",
                        "streamSid": self.stream_sid,
                        "mark": {"name": "sarvam_done"}
                    }
                    await self.websocket.send_text(json.dumps(mark_frame))

                logger.info(f"🔊 Sarvam stream complete. Sent {chunks_sent} mulaw chunks to Twilio.")
                return True
            return False
        except asyncio.CancelledError:
            logger.info("🛑 Sarvam speak_text (Twilio) cancelled")
            raise
        except Exception as e:
            logger.error(f"❌ Exception in Sarvam speak_text (Twilio): {e}")
            return False

    async def _speak_elevenlabs_twilio(self, text: str) -> bool:
        if not settings.ELEVENLABS_API_KEY:
            return False

        lang_str = str(self.language).capitalize()
        if "Telugu" in lang_str:
            voice_id = settings.ELEVENLABS_TELUGU_VOICE_ID
        elif "Hindi" in lang_str or "Hinglish" in lang_str:
            voice_id = settings.ELEVENLABS_HINDI_VOICE_ID
        else:
            voice_id = settings.ELEVENLABS_VOICE_ID

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream?output_format=ulaw_8000"
        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_v3",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            audio_queue = asyncio.Queue()
            download_done = asyncio.Event()

            async def download_audio():
                try:
                    ulaw_buffer = b""
                    ulaw_chunk_size = 320
                    async with aiohttp.ClientSession() as client:
                        async with client.post(url, json=payload, headers=headers) as resp:
                            if resp.status == 200:
                                logger.info(f"🔊 ElevenLabs download started (Twilio) using voice {voice_id}")
                                async for raw_chunk in resp.content.iter_any():
                                    if not self.is_running:
                                        break
                                    ulaw_buffer += raw_chunk
                                    while len(ulaw_buffer) >= ulaw_chunk_size:
                                        ulaw_frame = ulaw_buffer[:ulaw_chunk_size]
                                        ulaw_buffer = ulaw_buffer[ulaw_chunk_size:]
                                        await audio_queue.put(ulaw_frame)
                                if ulaw_buffer and self.is_running:
                                    padded = ulaw_buffer + b"\xff" * (ulaw_chunk_size - len(ulaw_buffer))
                                    await audio_queue.put(padded)
                            else:
                                err_txt = await resp.text()
                                logger.error(f"❌ ElevenLabs TTS stream failed (Twilio): Status {resp.status} - {err_txt}")
                                if resp.status in [401, 402, 403]:
                                    global elevenlabs_cooldown_active
                                    elevenlabs_cooldown_active = True
                                    logger.warning("⚠️ ElevenLabs returned terminal error. Bypassing ElevenLabs for future turns.")
                except Exception as e:
                    logger.error(f"❌ Exception downloading ElevenLabs audio (Twilio): {e}")
                finally:
                    download_done.set()

            downloader_task = asyncio.create_task(download_audio())

            for _ in range(12):
                if audio_queue.empty() and not download_done.is_set():
                    await asyncio.sleep(0.04)

            start_time = asyncio.get_event_loop().time()
            chunk_duration = 0.040
            chunks_sent = 0
            while self.is_running:
                if audio_queue.empty():
                    if download_done.is_set():
                        break
                    try:
                        chunk = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                    except asyncio.TimeoutError:
                        continue
                else:
                    chunk = audio_queue.get_nowait()

                b64_data = base64.b64encode(chunk).decode("utf-8")
                media_frame = {
                    "event": "media",
                    "streamSid": self.stream_sid,
                    "media": {"payload": b64_data}
                }
                await self.websocket.send_text(json.dumps(media_frame))
                chunks_sent += 1
                
                next_send_time = start_time + (chunks_sent * chunk_duration)
                now = asyncio.get_event_loop().time()
                sleep_dur = next_send_time - now
                if sleep_dur < -0.02:
                    # Reset clock to current time to prevent fast-burst playback when queue runs dry
                    start_time = now - (chunks_sent * chunk_duration)
                    sleep_dur = 0
                if sleep_dur > 0:
                    await asyncio.sleep(sleep_dur)

            if not downloader_task.done():
                downloader_task.cancel()

            if chunks_sent > 0:
                if self.is_running:
                    mark_frame = {
                        "event": "mark",
                        "streamSid": self.stream_sid,
                        "mark": {"name": "elevenlabs_done"}
                    }
                    await self.websocket.send_text(json.dumps(mark_frame))

                logger.info(f"🔊 Twilio ElevenLabs stream complete. Sent {chunks_sent} chunks.")
                return True
            return False
        except asyncio.CancelledError:
            logger.info("🛑 ElevenLabs speak_text cancelled")
            raise
        except Exception as e:
            logger.error(f"❌ Exception in Twilio speak_text: {e}")
            return False

    async def speak_text(self, text: str):
        """Query TTS (Sarvam AI or ElevenLabs) in ulaw_8000 format and stream chunks to Twilio"""
        async with self.ai_speaking_lock:
            self.ai_speaking = True

        try:
            sarvam_api_key = os.getenv("SARVAM_API_KEY")
            tts_provider = os.getenv("TTS_PROVIDER", "sarvam").lower()
            
            # For Indian languages, default to Sarvam AI if available to avoid ElevenLabs restrictions
            lang_str = str(self.language).capitalize()
            is_indian_lang = any(x in lang_str for x in ["Telugu", "Tamil", "Hindi", "Hinglish"])
            
            if is_indian_lang and sarvam_api_key:
                tts_provider = "sarvam"
                
            global elevenlabs_cooldown_active
            if elevenlabs_cooldown_active:
                tts_provider = "sarvam"
                
            success = False
            if tts_provider == "elevenlabs":
                success = await self._speak_elevenlabs_twilio(text)
                if not success and sarvam_api_key:
                    logger.warning("⚠️ ElevenLabs Twilio streaming failed. Falling back to Sarvam AI...")
                    success = await self._speak_sarvam_twilio(text)
            else:
                if sarvam_api_key:
                    success = await self._speak_sarvam_twilio(text)
                if not success:
                    logger.warning("⚠️ Sarvam AI Twilio streaming failed/missing. Falling back to ElevenLabs...")
                    success = await self._speak_elevenlabs_twilio(text)
                    
            if not success:
                logger.error("❌ Both TTS providers failed for Twilio call.")
        finally:
            async with self.ai_speaking_lock:
                self.ai_speaking = False

    async def get_ai_response(self, user_speech: str) -> str:
        """Call Gemini model to process the conversation context and return AI script reply"""
        logger.info(f"🧠 Generating AI reply for user input: '{user_speech}'")
        
        # Build conversation history context
        history = "\n".join(self.transcript_lines[-4:]) # Last 4 turns
        
        telugu_rules = ""
        if "telugu" in str(self.language).lower():
            telugu_rules = """
CRITICAL TELUGU LANGUAGE RULES (NATIVE & CASUAL SLANG):
- Talk like a real, friendly Telugu person on a phone call. Use natural, everyday Telugu slang.
- DO NOT use formal translation terms like "మిత్రుడా" (my friend), "మగనికి" (male/husband), "తమమ్మాయి", or "ఆసక్తి ఉంది".
- To ask about admission/class for their child, use natural phrases like: "బాబు ఏ క్లాస్ అండీ?", "పాప ఏ క్లాస్ కి అడ్మిషన్ కావాలండీ?", "బాబుకా లేక పాపకా అండీ అడ్మిషన్?"
- Add the polite suffix "అండీ" (andi) at the end of sentences to show respect naturally (e.g., "ఆగండి అండీ", "చెప్పండి అండీ", "నమస్కారం అండీ", "అవునండీ", "ఫీజు వివరాలు చెప్తానండీ").
- Mix in common English words naturally as people do in daily life: "school", "admission", "fees", "seat", "office", "class", "direct", "okay", "sure", "thank you".
- Example greetings: "హలో అండీ, నమస్కారం. అభి గారితో మాట్లాడవచ్చా?"
- Example casual sentences:
  * "స్కూల్ అడ్మిషన్స్ గురించి అడగటానికి కాల్ చేశామండీ."
  * "బాబు ఏ క్లాస్ అడ్మిషన్ కోసం చూస్తున్నారండీ?"
  * "అవునా అండీ, పర్వాలేదు."
  * "ఫీజుల వివరాలు మా ఆఫీస్ లో డైరెక్ట్ గా చెప్తారండీ."
"""

        prompt = f"""
You are an advanced interactive AI phone calling voice agent representing a business.
Your target language is {self.language}.

{telugu_rules}

IMPORTANT LANGUAGE RULES:
- Speak in simple, casual, everyday conversational {self.language} that common people use in daily life.
- DO NOT use formal, literary, or pure {self.language}. Use the way normal people talk on phone calls.
- Mix in common English words naturally (like "school", "admission", "fees", "ok", "sure", "thank you") as people normally do in conversation.
- Keep it friendly, warm, and easy to understand for everyone.
- Keep answers extremely brief (1-2 short sentences) since this is a voice call.

Campaign Script Guidelines:
{self.campaign.script_template}

Caller Info:
- Name: {self.contact.name}
- Phone: {self.contact.phone_number}

Recent Conversation History:
{history}

Customer said: "{user_speech}"

Provide your next direct script response now. Speak directly to the customer. Do not add any metadata, parenthetical cues, or formatting.
"""
        try:
            response_text = await asyncio.to_thread(voice_agent_service._generate_with_fallback, prompt)
            if response_text:
                return response_text
            raise Exception("All generation models failed")
        except Exception as e:
            logger.error(f"❌ AI generation failed, using fallback: {e}")
            if self.language == "Telugu":
                return "క్షమించండి, మీ మాట సరిగ్గా వినబడలేదు. మళ్ళీ చెప్పగలరా?"
            return "I am sorry, I did not catch that. Could you please repeat?"

    async def start_deepgram_stt(self):
        """Establish connection to Deepgram WebSocket and launch transcript listener task"""
        lang_code = LANG_MAPPING.get(self.language, "te") # Default to Telugu
        
        # Configure Deepgram to parse mulaw (mu-law) encoded audio at 8kHz sample rate
        url = f"wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1&model=nova-3&language={lang_code}&endpointing=1000"
        headers = {
            "Authorization": f"Token {settings.DEEPGRAM_API_KEY}"
        }

        logger.info(f"🎙️ Twilio connecting to Deepgram STT (mulaw). Language model: {lang_code}")
        
        try:
            self.client_session = aiohttp.ClientSession()
            self.dg_ws = await self.client_session.ws_connect(url, headers=headers)
            
            # Start background listener task
            asyncio.create_task(self.listen_deepgram_transcripts())
        except Exception as e:
            logger.error(f"❌ Deepgram STT connection failed: {e}")

    async def listen_deepgram_transcripts(self):
        """Listen for final speech transcripts from Deepgram, feed to Gemini, and speak reply"""
        try:
            async for msg in self.dg_ws:
                if not self.is_running:
                    break
                
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    channel = data.get("channel", {})
                    alternatives = channel.get("alternatives", [{}])
                    transcript = alternatives[0].get("transcript", "").strip()
                    is_final = data.get("is_final", False)

                    if transcript:
                        # Filter out common filler words and short noise/punctuation
                        clean_trans = "".join([c for c in transcript.lower() if c.isalnum() or c.isspace()]).strip()
                        fillers = {"uh", "um", "ah", "eh", "oh", "hmmm", "hmm"}
                        if not clean_trans or clean_trans in fillers or len(clean_trans) < 2:
                            logger.info(f"Ignoring filler/noise transcript: '{transcript}'")
                            continue

                        # Avoid feedback loop if speaker echoes fallback message
                        fallback_phrases = [
                            "i am sorry i did not catch that",
                            "could you please repeat",
                            "క్షమించండి మీ మాట సరిగ్గా వినబడలేదు",
                            "మళ్ళీ చెప్పగలరా"
                        ]
                        if any(phrase in clean_trans for phrase in fallback_phrases):
                            logger.info(f"Ignoring feedback echo transcript: '{transcript}'")
                            continue

                        # If AI is currently speaking and user started talking, stop the AI immediately!
                        if self.ai_speaking and len(transcript.strip()) >= 2:
                            logger.info(f"🛑 User interrupted AI (Twilio) with text: '{transcript}' (is_final={is_final})")
                            await self.stop_speaking()

                        if is_final:
                            # Block transcripts while AI audio is playing back (prevents echo loop)
                            now = asyncio.get_event_loop().time()
                            if now < self.suppress_until:
                                logger.info(f"🔇 Suppressed echo transcript (Twilio): '{transcript}'")
                                continue

                            # Require at least 2 words — avoids responding to mid-speech partial bursts
                            if len(clean_trans.split()) < 2:
                                logger.info(f"⏭️ Skipping short partial ({len(clean_trans.split())} word): '{transcript}'")
                                continue

                            logger.info(f"👤 Customer (final, pending debounce): {transcript}")

                            # Cancel any previous generating or speaking task
                            await self.stop_speaking()

                            # Debounce 500ms: if user continues speaking within this window,
                            # the old pending response is cancelled and we start fresh.
                            # This prevents AI from interrupting mid-sentence on natural pauses.
                            self._response_seq += 1
                            seq = self._response_seq
                            captured = transcript

                            async def _debounced_respond_twilio(s=seq, t=captured):
                                try:
                                    await asyncio.sleep(0.3)
                                    if self.is_running and s == self._response_seq:
                                        self.transcript_lines.append(f"Customer: {t}")
                                        logger.info(f"👤 Customer (confirmed): {t}")
                                        await self.generate_and_speak(t)
                                except asyncio.CancelledError:
                                    pass

                            self.response_task = asyncio.create_task(_debounced_respond_twilio())

        except Exception as e:
            logger.error(f"❌ Exception in Deepgram transcript receiver loop: {e}")
        finally:
            logger.info("🎙️ Deepgram STT receiver loop stopped")

    async def handle_twilio_media(self):
        """Read media packets from Twilio WebSocket and write them to Deepgram STT"""
        try:
            async for message in self.websocket.iter_text():
                if not self.is_running:
                    break

                data = json.loads(message)
                event = data.get("event")

                if event == "start":
                    start_data = data.get("start", {})
                    self.stream_sid = data.get("streamSid") or start_data.get("streamSid")
                    logger.info(f"🚀 Twilio Media Stream started: StreamSid={self.stream_sid}")
                    # Trigger greeting in background now that we have a valid streamSid!
                    asyncio.create_task(self.speak_greeting())

                elif event == "media":
                    media = data.get("media", {})
                    payload = media.get("payload")
                    
                    if payload and self.dg_ws and not self.dg_ws.closed:
                        # Decode Base64 mulaw payload and write raw binary to Deepgram
                        raw_mulaw = base64.b64decode(payload)
                        await self.dg_ws.send_bytes(raw_mulaw)

                elif event == "stop":
                    logger.info("⏹️ Stop event received from Twilio call")
                    break

        except Exception as e:
            logger.error(f"❌ Exception in Twilio media loop: {e}")
        finally:
            await self.close_call()

    async def close_call(self):
        """Close services, perform summary extraction, triggers n8n webhook, and triggers next call"""
        if not self.is_running:
            return
            
        self.is_running = False
        logger.info(f"🏁 Closing Twilio Call {self.call_id} session...")

        # Close sockets
        if self.dg_ws and not self.dg_ws.closed:
            await self.dg_ws.close()
        if self.client_session and not self.client_session.closed:
            await self.client_session.close()
        
        # Save transcript
        full_transcript = "\n".join(self.transcript_lines)
        
        try:
            # Update call status metadata immediately in DB (so status changes to COMPLETED instantly in UI)
            self.call.status = CallStatus.COMPLETED
            self.call.conversation_transcript = full_transcript
            self.call.duration = len(self.transcript_lines) * 6
            
            # Sync with CRM CallSession and Lead tables
            from models.voice_agent import CallSession, Lead, Campaign
            session_record = self.session.query(CallSession).filter(CallSession.session_id == self.call.call_sid).first()
            if not session_record and self.call.call_sid:
                # Resolve Campaign and Lead by matching phone number and campaign name
                clean_phone = "".join(c for c in self.call.phone_number if c.isdigit())[-10:]
                crm_campaign = self.session.query(Campaign).filter(Campaign.name == self.campaign.name).first()
                crm_campaign_id = crm_campaign.id if crm_campaign else None
                
                crm_lead = None
                if crm_campaign_id:
                    crm_lead = self.session.query(Lead).filter(
                        Lead.phone.like(f"%{clean_phone}%"),
                        Lead.campaign_id == crm_campaign_id
                    ).first()
                if not crm_lead:
                    crm_lead = self.session.query(Lead).filter(Lead.phone.like(f"%{clean_phone}%")).first()
                
                lead_id = crm_lead.id if crm_lead else None
                logger.info(f"🆕 Pre-creating missing CallSession in close_call for Call SID {self.call.call_sid}, Lead ID: {lead_id}")
                session_record = CallSession(
                    session_id=self.call.call_sid,
                    status="completed",
                    transcript=full_transcript,
                    lead_id=lead_id,
                    campaign_id=crm_campaign_id
                )
                self.session.add(session_record)
                if crm_lead:
                    crm_lead.status = "called"
            elif session_record:
                session_record.status = "completed"
                session_record.transcript = full_transcript
                crm_lead = self.session.query(Lead).filter(Lead.id == session_record.lead_id).first()
                if crm_lead:
                    crm_lead.status = "called"
            
            # Update contact
            self.contact.is_completed = True
            self.contact.call_attempts += 1
            
            # Update campaign metrics
            self.campaign.calls_completed = (self.campaign.calls_completed or 0) + 1
            self.campaign.calls_pending = max(0, (self.campaign.calls_pending or 1) - 1)
            
            # Recalculate averages
            if self.call.duration:
                prev_completed = self.campaign.calls_completed - 1
                if prev_completed > 0:
                    total_dur = (self.campaign.avg_call_duration or 0.0) * prev_completed
                    self.campaign.avg_call_duration = (total_dur + self.call.duration) / self.campaign.calls_completed
                else:
                    self.campaign.avg_call_duration = float(self.call.duration)

            self.session.commit()
            logger.info("💾 Twilio Call metadata saved to DB successfully!")

            # Trigger background post-call LLM analytics (summary, sentiment, outcomes, lead generation)
            asyncio.create_task(run_post_call_analytics_background(self.call_id, full_transcript))

            # Trigger the next call in the queue sequentially!
            asyncio.create_task(self.trigger_next_campaign_call())

        except Exception as e:
            logger.error(f"❌ Failed to save call results: {e}")
            self.session.rollback()
        finally:
            self.session.close()

    async def trigger_n8n_webhook(self, is_interested: bool):
        """Send call detail package to n8n webhook for Google Sheets / WhatsApp alerts"""
        webhook_url = os.getenv("N8N_LEAD_WEBHOOK_URL")
        if not webhook_url:
            logger.info("ℹ️ N8N_LEAD_WEBHOOK_URL is not set. Skipping n8n notification webhook.")
            return

        payload = {
            "call_id": self.call_id,
            "campaign_id": self.campaign.id,
            "campaign_name": self.campaign.name,
            "contact_name": self.contact.name,
            "phone_number": self.contact.phone_number,
            "outcome": self.call.call_outcome,
            "sentiment": self.call.customer_sentiment,
            "summary": self.call.conversation_summary,
            "key_quote": self.call.key_quote,
            "notes": self.call.notes,
            "is_interested": is_interested,
            "timestamp": self.call.ended_at.isoformat() if self.call.ended_at else ""
        }

        try:
            async with aiohttp.ClientSession() as client:
                async with client.post(webhook_url, json=payload, timeout=5) as resp:
                    logger.info(f"🚀 Triggered n8n webhook - Status: {resp.status}")
        except Exception as e:
            logger.error(f"❌ Failed to trigger n8n webhook: {e}")

    async def trigger_next_campaign_call(self):
        """Check if campaign is active and trigger the next call in the queue sequentially"""
        await asyncio.sleep(3)
        
        db = next(get_db_sync())
        try:
            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == self.campaign.id).first()
            if not campaign or campaign.status.value != "active":
                logger.info(f"⏹️ Campaign {self.campaign.id} is no longer active. Stop queue.")
                return

            from services.voice_call_queue_service import voice_call_queue_service
            next_call = voice_call_queue_service.get_next_queued_call(db, campaign.id)
            
            if next_call:
                logger.info(f"🔄 Triggering next sequential call in queue (Call ID: {next_call.id})")
                import threading
                def _process_next(call_id: int):
                    db2 = next(get_db_sync())
                    try:
                        voice_call_queue_service.process_call(db2, call_id)
                    except Exception as e:
                        logger.error(f"❌ Error processing next call {call_id}: {e}")
                    finally:
                        db2.close()
                threading.Thread(target=_process_next, args=(next_call.id,), daemon=True).start()
            else:
                logger.info(f"🎉 No more calls in queue. Marking Campaign {campaign.id} as COMPLETED")
                campaign.status = "completed"
                db.commit()
        except Exception as e:
            logger.error(f"❌ Error triggering next sequential call: {e}")
        finally:
            db.close()


async def run_post_call_analytics_background(call_id: int, full_transcript: str):
    """
    Run post-call analytics (LLM summaries, sentiment, outcomes, notes, key quote,
    and lead creation) in a background thread to prevent blocking the async loop
    and ensure immediate DB commit and UI updates.
    """
    logger.info(f"🧠 Background: Starting post-call analytics for Call ID {call_id}...")
    try:
        # Since LLM queries block the CPU/network synchronously, execute them in a thread pool executor
        loop = asyncio.get_event_loop()
        
        def run_llms():
            summary = voice_agent_service.generate_conversation_summary(full_transcript)
            sentiment = voice_agent_service.analyze_conversation_sentiment(full_transcript)
            outcome = voice_agent_service.extract_call_outcome(full_transcript)
            notes = voice_agent_service.extract_specific_requirements(full_transcript)
            key_quote = voice_agent_service.extract_key_quote(full_transcript)
            return summary, sentiment, outcome, notes, key_quote

        summary, sentiment, outcome, notes, key_quote = await loop.run_in_executor(None, run_llms)
        
        # Now update DB using a fresh session
        db = next(get_db_sync())
        try:
            call = db.query(VoiceCall).filter(VoiceCall.id == call_id).first()
            if call:
                call.conversation_summary = summary
                call.customer_sentiment = sentiment
                call.call_outcome = outcome
                call.notes = notes
                call.key_quote = key_quote
                
                # Check outcome interest
                is_interested = outcome in ["interested", "callback_requested", "follow_up_required"]
                if is_interested:
                    lead_score = 80 if outcome == "interested" else (70 if outcome == "callback_requested" else 50)
                    lead = voice_agent_service.create_lead_from_call(
                        db=db,
                        call=call,
                        status=outcome,
                        lead_score=lead_score,
                        notes=notes
                    )
                    if lead and key_quote:
                        lead.key_quote = key_quote
                    logger.info(f"🎯 Background: Generated lead in DB for Call {call_id}")
                
                # Sync with CRM CallSession and Lead tables for front-end report display
                from models.voice_agent import CallSession, Lead, Campaign
                session_record = db.query(CallSession).filter(CallSession.session_id == call.call_sid).first()
                if not session_record and call.call_sid:
                    # Resolve Campaign and Lead by matching phone number and campaign name
                    clean_phone = "".join(c for c in call.phone_number if c.isdigit())[-10:]
                    crm_campaign_id = None
                    if call.campaign:
                        crm_campaign = db.query(Campaign).filter(Campaign.name == call.campaign.name).first()
                        crm_campaign_id = crm_campaign.id if crm_campaign else None
                    
                    crm_lead = None
                    if crm_campaign_id:
                        crm_lead = db.query(Lead).filter(
                            Lead.phone.like(f"%{clean_phone}%"),
                            Lead.campaign_id == crm_campaign_id
                        ).first()
                    if not crm_lead:
                        crm_lead = db.query(Lead).filter(Lead.phone.like(f"%{clean_phone}%")).first()
                    
                    lead_id = crm_lead.id if crm_lead else None
                    logger.info(f"🆕 Creating missing CallSession in background for Call SID {call.call_sid}, Lead ID: {lead_id}")
                    session_record = CallSession(
                        session_id=call.call_sid,
                        status="completed",
                        lead_id=lead_id,
                        campaign_id=crm_campaign_id
                    )
                    db.add(session_record)
                    db.flush() # ensure ID is assigned
                
                if session_record:
                    session_record.status = "completed"
                    session_record.transcript = full_transcript
                    session_record.summary = summary
                    session_record.sentiment = sentiment
                    
                    interest_score = 50
                    lead_category = "Nurture"
                    if outcome == "interested":
                        interest_score = 90
                        lead_category = "Hot"
                    elif outcome == "callback_requested":
                        interest_score = 75
                        lead_category = "Warm"
                    elif outcome == "not_interested":
                        interest_score = 25
                        lead_category = "Cold"
                        
                    session_record.interest_score = interest_score
                    session_record.buying_intent = interest_score
                    session_record.lead_category = lead_category
                    session_record.objections = notes or "None"
                    
                    crm_lead = db.query(Lead).filter(Lead.id == session_record.lead_id).first()
                    if crm_lead:
                        crm_lead.status = "callback" if outcome == "callback_requested" else "called"
                        crm_lead.interest_level = lead_category
                        crm_lead.urgency_score = interest_score
                        crm_lead.buying_intent = interest_score
                        logger.info(f"🎯 Background: Synced CRM Lead {crm_lead.name} status to {crm_lead.status}")
                
                db.commit()
                logger.info(f"💾 Background: Saved outcomes successfully for Call {call_id}!")
                
                # Trigger n8n notification webhook
                webhook_url = os.getenv("N8N_LEAD_WEBHOOK_URL")
                if webhook_url:
                    payload = {
                        "call_id": call_id,
                        "campaign_id": call.campaign_id,
                        "campaign_name": call.campaign.name if call.campaign else f"Campaign #{call.campaign_id}",
                        "contact_name": call.contact.name if call.contact else "Customer",
                        "phone_number": call.phone_number,
                        "outcome": outcome,
                        "sentiment": sentiment,
                        "summary": summary,
                        "key_quote": key_quote,
                        "notes": notes,
                        "is_interested": is_interested,
                        "timestamp": call.ended_at.isoformat() if call.ended_at else ""
                    }
                    try:
                        async with aiohttp.ClientSession() as client:
                            async with client.post(webhook_url, json=payload, timeout=5) as resp:
                                logger.info(f"🚀 Background: Triggered n8n webhook - Status: {resp.status}")
                    except Exception as e:
                        logger.error(f"❌ Background: Failed to trigger n8n webhook: {e}")
            else:
                logger.error(f"❌ Background: Call ID {call_id} not found in database!")
        except Exception as db_err:
            logger.error(f"❌ Background: Database error: {db_err}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"❌ Background: Error in post-call analytics for Call {call_id}: {e}")


