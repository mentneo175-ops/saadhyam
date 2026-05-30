import os
import json
import base64
import logging
import asyncio
import aiohttp
from typing import Dict, Any, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
import google.generativeai as genai

from config.settings import settings
from config.database import get_db_sync
from models.voice_agent import VoiceCall, VoiceCampaign, VoiceContact, CallStatus
from services.voice_agent_service import voice_agent_service

logger = logging.getLogger(__name__)

# Map campaign languages to Deepgram language codes
LANG_MAPPING = {
    "English": "en",
    "Telugu": "te",
    "Tamil": "ta",
    "Hindi": "hi",
    "Hinglish": "hi"
}

# Default ElevenLabs Voice ID (Bella - high quality multilingual)
DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSD4Yut" 

# Localized greetings
GREETINGS = {
    "Telugu": "హలో, నేను దయచేసి {name} గారితో మాట్లాడవచ్చా?",
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
        self.transcript_lines: List[str] = []
        self.dg_ws = None
        self.is_running = True
        self.ai_speaking = False
        self.ai_speaking_lock = asyncio.Lock()

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

            # Configure Gemini API
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
        lang = self.campaign.language
        greeting_tmpl = GREETINGS.get(lang, GREETINGS["English"])
        greeting_text = greeting_tmpl.format(name=self.contact.name)

        logger.info(f"🗣️ Speaking initial greeting in {lang}: '{greeting_text}'")
        self.transcript_lines.append(f"AI: {greeting_text}")
        
        # Stream greeting audio to caller
        await self.speak_text(greeting_text)

    async def speak_text(self, text: str):
        """Query ElevenLabs TTS and stream PCM chunks directly to Exotel"""
        async with self.ai_speaking_lock:
            self.ai_speaking = True

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{DEFAULT_VOICE_ID}/stream?output_format=pcm_8000"
        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            async with aiohttp.ClientSession() as client:
                async with client.post(url, json=payload, headers=headers) as resp:
                    if resp.status != 200:
                        err_txt = await resp.text()
                        logger.error(f"❌ ElevenLabs TTS stream failed: Status {resp.status} - {err_txt}")
                        return

                    # Read binary chunks and stream them as Base64 chunks to Exotel
                    chunk_size = 4096  # Exotel standard buffer size
                    while self.is_running:
                        chunk = await resp.content.read(chunk_size)
                        if not chunk:
                            break
                        
                        # Encode to Base64
                        b64_data = base64.b64encode(chunk).decode("utf-8")
                        
                        # Send Exotel media frame
                        media_frame = {
                            "event": "media",
                            "media": {
                                "chunk": b64_data
                            }
                        }
                        await self.websocket.send_text(json.dumps(media_frame))
                        # Small delay to throttle audio stream pacing matching 8kHz playback
                        await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"❌ Exception in speak_text: {e}")
        finally:
            async with self.ai_speaking_lock:
                self.ai_speaking = False

    async def get_ai_response(self, user_speech: str) -> str:
        """Call Gemini model to process the conversation context and return AI script reply"""
        logger.info(f"🧠 Generating AI reply for user input: '{user_speech}'")
        
        # Build conversation history context
        history = "\n".join(self.transcript_lines[-8:]) # Last 8 turns
        
        prompt = f"""
You are an advanced interactive AI phone calling voice agent representing a business.
Your target language is {self.campaign.language}. Speak in the target language natively. Keep answers extremely brief (1-2 short sentences) since this is a voice call.

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
            model = genai.GenerativeModel(settings.GEMINI_PRO_MODEL)
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"❌ Gemini generation failed, using fallback: {e}")
            if self.campaign.language == "Telugu":
                return "క్షమించండి, మీ మాట సరిగ్గా వినబడలేదు. మళ్ళీ చెప్పగలరా?"
            return "I am sorry, I did not catch that. Could you please repeat?"

    async def start_deepgram_stt(self):
        """Establish connection to Deepgram WebSocket and launch transcript listener task"""
        lang_code = LANG_MAPPING.get(self.campaign.language, "te") # Default to Telugu
        
        url = f"wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=8000&channels=1&model=nova-2&language={lang_code}&endpointing=300"
        headers = {
            "Authorization": f"Token {settings.DEEPGRAM_API_KEY}"
        }

        logger.info(f"🎙️ Connecting to Deepgram STT. Language model: {lang_code}")
        
        try:
            client_session = aiohttp.ClientSession()
            self.dg_ws = await client_session.ws_connect(url, headers=headers)
            
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
                    speech_final = data.get("speech_final", False)

                    # Only respond if the user actually said something, it's final speech, and AI is not speaking
                    if transcript and is_final:
                        # Ignore echo when AI is actively speaking
                        if self.ai_speaking:
                            continue
                            
                        logger.info(f"👤 Customer: {transcript}")
                        self.transcript_lines.append(f"Customer: {transcript}")
                        
                        # Generate AI reply
                        reply = await self.get_ai_response(transcript)
                        logger.info(f"🤖 AI: {reply}")
                        self.transcript_lines.append(f"AI: {reply}")
                        
                        # Speak it back
                        await self.speak_text(reply)

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
        
        # Save transcript
        full_transcript = "\n".join(self.transcript_lines)
        
        try:
            # Trigger Gemini summaries and outcomes
            logger.info("📝 Call terminated. Running post-call analytics...")
            summary = voice_agent_service.generate_conversation_summary(full_transcript)
            sentiment = voice_agent_service.analyze_conversation_sentiment(full_transcript)
            outcome = voice_agent_service.extract_call_outcome(full_transcript) # interested, callback_requested, not_interested
            notes = voice_agent_service.extract_specific_requirements(full_transcript)
            key_quote = voice_agent_service.extract_key_quote(full_transcript)

            # Update call in DB
            self.call.status = CallStatus.COMPLETED
            self.call.conversation_transcript = full_transcript
            self.call.conversation_summary = summary
            self.call.customer_sentiment = sentiment
            self.call.call_outcome = outcome
            self.call.notes = notes
            self.call.key_quote = key_quote
            self.call.duration = len(self.transcript_lines) * 6 # rough calculation: ~6 seconds per turn
            
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

            # Generate Lead if outcome is positive
            is_interested = outcome in ["interested", "callback_requested", "follow_up_required"]
            if is_interested:
                lead_score = 80 if outcome == "interested" else (70 if outcome == "callback_requested" else 50)
                lead = voice_agent_service.create_lead_from_call(
                    db=self.session,
                    call=self.call,
                    status=outcome,
                    lead_score=lead_score,
                    notes=notes
                )
                # Assign key quote to lead
                if lead and key_quote:
                    lead.key_quote = key_quote
                logger.info(f"🎯 Lead generated in DB: {self.contact.name}")

            self.session.commit()
            logger.info("💾 Call outcomes saved to DB successfully!")

            # Trigger n8n notification webhook
            asyncio.create_task(self.trigger_n8n_webhook(is_interested))

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
                from tasks.voice_call_tasks import process_single_call
                process_single_call.delay(next_call.id)
            else:
                logger.info(f"🎉 No more calls in queue. Marking Campaign {campaign.id} as COMPLETED")
                campaign.status = "completed"
                db.commit()
        except Exception as e:
            logger.error(f"❌ Error triggering next sequential call: {e}")
        finally:
            db.close()
