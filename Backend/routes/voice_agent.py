import os
import re
import uuid
import json
import base64
import asyncio
import logging
import requests
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from pathlib import Path

from fastapi import APIRouter, WebSocket, Depends, HTTPException, status, Form, File, UploadFile, Request
from fastapi.websockets import WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import and_
import google.generativeai as genai
import aiohttp

from config.database import get_db_sync, get_db
from models.user import User
from routes.auth import get_current_user
from models.voice_agent import CompanyProfile, AIAgent, Campaign, Lead, WhatsAppLog, CallSession

logger = logging.getLogger(__name__)

router = APIRouter()

from config.settings import settings

# Setup Google Generative AI config
GEMINI_API_KEY = settings.GEMINI_API_KEY
if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("AQ.") and GEMINI_API_KEY != "your_google_ai_studio_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("✅ Gemini API Configured successfully inside Voice Agent router.")
else:
    logger.warning("⚠️ Valid GEMINI_API_KEY is not configured inside Voice Agent router.")


# Global fallback flags
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_QUOTA_EXCEEDED = False
ELEVENLABS_USE_FALLBACK = False

# ==================== TELUGU TRANSLATION HELPERS ====================
def telugu_digits_to_words(digits_str: str) -> str:
    digit_map = {
        '0': "సున్నా", '1': "ఒకటి", '2': "రెండు", '3': "మూడు", '4': "నాలుగు",
        '5': "ఐదు", '6': "ఆరు", '7': "ఏడు", '8': "ఎనిమిది", '9': "తొమ్మిది"
    }
    return " ".join(digit_map[d] for d in digits_str if d in digit_map)

def telugu_number_to_words(num: int) -> str:
    ones = {
        0: "", 1: "ఒకటి", 2: "రెండు", 3: "మూడు", 4: "నాలుగు", 5: "ఐదు", 
        6: "ఆరు", 7: "ఏడు", 8: "ఎనిమిది", 9: "తొమ్మిది", 10: "పది",
        11: "పదకొండు", 12: "పన్నెండు", 13: "పదమూడు", 14: "పద్నాలుగు", 15: "పదిహేను",
        16: "పదహారు", 17: "పదిహేడు", 18: "పద్దెనిమిది", 19: "పంతొమ్మిది"
    }
    tens = {
        2: "ఇరవై", 3: "ముప్పై", 4: "నలభై", 5: "యాభై", 
        6: "అరవై", 7: "దెబ్బై", 8: "ఎనభై", 9: "తొంభై"
    }
    
    if num == 0:
        return "సున్నా"
        
    parts = []
    
    # Lakhs (up to 99 Lakhs)
    if num >= 100000:
        lakhs = num // 100000
        if lakhs == 1:
            parts.append("లక్ష")
        elif lakhs < 20:
            parts.append(ones[lakhs] + " లక్షలు")
        else:
            t = lakhs // 10
            o = lakhs % 10
            if o == 0:
                parts.append(tens[t] + " లక్షలు")
            else:
                parts.append(tens[t] + " " + ones[o] + " లక్షలు")
        num %= 100000
        
    # Thousands & Ten-Thousands
    if num >= 1000:
        thousands = num // 1000
        is_exact = (num % 1000 == 0)
        suffix = " వేలు" if is_exact else " వేల"
        if thousands == 1:
            parts.append("వెయ్యి" if not parts else "ఒక వెయ్యి")
        elif thousands < 20:
            parts.append(ones[thousands] + suffix)
        else:
            t = thousands // 10
            o = thousands % 10
            if o == 0:
                parts.append(tens[t] + suffix)
            else:
                parts.append(tens[t] + " " + ones[o] + suffix)
        num %= 1000
        
    # Hundreds
    if num >= 100:
        hundreds = num // 100
        if hundreds == 1:
            parts.append("వంద" if num % 100 == 0 else "వందల")
        else:
            parts.append(ones[hundreds] + " వందలు" if num % 100 == 0 else ones[hundreds] + " వందల")
        num %= 100
        
    # Tens and Ones
    if num > 0:
        if num < 20:
            parts.append(ones[num])
        else:
            t = num // 10
            o = num % 10
            if o == 0:
                parts.append(tens[t])
            else:
                parts.append(tens[t] + " " + ones[o])
                
    return " ".join(p for p in parts if p)

def replace_numbers_with_telugu_words(text: str) -> str:
    currency_pattern = r"(?:₹|Rs\.?|Rs)\s*(\d{1,6})"
    def curr_repl(match):
        val = int(match.group(1))
        words = telugu_number_to_words(val)
        return f" {words} రూపాయలు "
    text = re.sub(currency_pattern, curr_repl, text)
    
    dash_pattern = r"(\d{1,6})\s*/-"
    def dash_repl(match):
        val = int(match.group(1))
        words = telugu_number_to_words(val)
        return f" {words} రూపాయలు "
    text = re.sub(dash_pattern, dash_repl, text)
    
    phone_pattern = r"\b\d{7,15}\b"
    def phone_repl(match):
        digits_str = match.group(0)
        return f" {telugu_digits_to_words(digits_str)} "
    text = re.sub(phone_pattern, phone_repl, text)
    
    num_pattern = r"\b\d{1,6}\b"
    def num_repl(match):
        val = int(match.group(0))
        return f" {telugu_number_to_words(val)} "
    text = re.sub(num_pattern, num_repl, text)
    return text


# ==================== TEXT GENERATION & SPEECH GENERATION ====================
def generate_text(prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 600) -> str:
    global OPENAI_QUOTA_EXCEEDED
    
    # Try OpenAI first
    if OPENAI_API_KEY and not OPENAI_QUOTA_EXCEEDED:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.4
            }
            response = requests.post(url, json=payload, headers=headers, timeout=12)
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"].strip()
            elif response.status_code == 429:
                logger.warning("⚠️ OpenAI API Key Quota Limit Exceeded. Enabling fallback trigger...")
                OPENAI_QUOTA_EXCEEDED = True
            else:
                logger.error(f"OpenAI error status {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"OpenAI Call Exception (will trigger Gemini fallback): {e}")

    # Fallback to Gemini
    try:
        if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AQ.") or GEMINI_API_KEY == "your_google_ai_studio_api_key_here":
            raise ValueError("GEMINI_API_KEY is not configured or is invalid. Set a valid Gemini API key in your .env file.")
        
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash-lite",
            system_instruction=system_prompt
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"❌ Text Generation Exception in Gemini fallback: {e}")
        raise e



def speak_elevenlabs(text: str, output_filename: str, voice_id: Optional[str] = None) -> str:
    import os
    import requests
    import base64
    from pathlib import Path
    
    SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
    tts_provider = os.getenv("TTS_PROVIDER", "sarvam").lower()
    if SARVAM_API_KEY and tts_provider == "sarvam":
        logger.info(f"🎤 Using Sarvam AI TTS for '{text[:20]}...'")
        has_telugu = any('\u0c00' <= char <= '\u0c7f' for char in text)
        has_hindi = any('\u0900' <= char <= '\u097f' for char in text)
        has_tamil = any('\u0b80' <= char <= '\u0bff' for char in text)
        
        target_lang = "te-IN" if has_telugu else ("ta-IN" if has_tamil else ("hi-IN" if has_hindi else "en-IN"))
        
        # Determine speaker dynamically: default to 'ritu' for Telugu/Tamil if speaker is 'shubh'
        speaker = os.getenv("SARVAM_SPEAKER", "shubh")
        if speaker == "shubh" and (has_telugu or has_tamil):
            speaker = "ritu"
            
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "target_language_code": target_lang,
            "model": os.getenv("SARVAM_MODEL", "bulbul:v3"),
            "speaker": speaker
        }
        
        BASE_DIR = Path(__file__).resolve().parent.parent
        AUDIO_OUTPUT_DIR = BASE_DIR / "audio_output"
        AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                res_data = response.json()
                audio_base64 = res_data["audios"][0]
                audio_bytes = base64.b64decode(audio_base64)
                
                file_path = AUDIO_OUTPUT_DIR / output_filename
                with open(file_path, "wb") as f:
                    f.write(audio_bytes)
                return f"/audio/{output_filename}"
            else:
                logger.error(f"❌ Sarvam Error: Status {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"❌ Sarvam Call Exception: {e}")
            
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
    
    if not ELEVENLABS_API_KEY:
        logger.warning("⚠️ ElevenLabs Key missing, cannot synthesize speech.")
        return ""
    
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": "eleven_v3",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    
    global ELEVENLABS_USE_FALLBACK
    
    # Dynamic language-based Voice ID routing
    if not voice_id:
        has_telugu = any('\u0c00' <= char <= '\u0c7f' for char in text)
        has_hindi = any('\u0900' <= char <= '\u097f' for char in text)
        
        if has_telugu:
            primary_voice_id = os.getenv("ELEVENLABS_TELUGU_VOICE_ID", "EMxdghWQV7gqV33j4J3F")
        elif has_hindi:
            primary_voice_id = os.getenv("ELEVENLABS_HINDI_VOICE_ID", "uavKGt8JpB2lo1bcty9J")
        else:
            primary_voice_id = os.getenv("ELEVENLABS_VOICE_ID", "TX3LPaxmHKxFdv7VOQHJ")
    else:
        primary_voice_id = voice_id
        
    if ELEVENLABS_USE_FALLBACK and primary_voice_id != "EXAVITQu4vr4xnSDxMaL":
        primary_voice_id = "EXAVITQu4vr4xnSDxMaL"
        
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{primary_voice_id}"
    
    BASE_DIR = Path(__file__).resolve().parent.parent
    AUDIO_OUTPUT_DIR = BASE_DIR / "audio_output"
    AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        is_free_restriction = False
        if response.status_code == 402:
            is_free_restriction = True
        elif response.status_code == 400:
            try:
                err_data = response.json()
                err_detail = err_data.get("detail", {})
                if err_detail.get("code") == "paid_plan_required" or "Free users cannot use" in err_detail.get("message", ""):
                    is_free_restriction = True
            except Exception:
                pass
                
        if is_free_restriction and primary_voice_id != "EXAVITQu4vr4xnSDxMaL":
            logger.warning(f"⚠️ Voice ID {primary_voice_id} failed due to ElevenLabs Free Tier API restrictions. Falling back to Bella.")
            ELEVENLABS_USE_FALLBACK = True
            fallback_voice = "EXAVITQu4vr4xnSDxMaL"
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{fallback_voice}"
            response = requests.post(url, json=payload, headers=headers)
            
        if response.status_code == 200:
            file_path = AUDIO_OUTPUT_DIR / output_filename
            with open(file_path, "wb") as f:
                f.write(response.content)
            return f"/audio/{output_filename}"
        else:
            logger.error(f"❌ ElevenLabs Error: Status {response.status_code} - {response.text}")
            return ""
    except Exception as e:
        logger.error(f"❌ ElevenLabs Call Exception: {e}")
        return ""


def extract_and_parse_json(text: str) -> dict:
    match = re.search(r"({.*})", text, re.DOTALL)
    if match:
        clean_text = match.group(1)
    else:
        clean_text = text.strip()
        
    clean_text = re.sub(r"^```(?:json)?\n", "", clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r"\n```$", "", clean_text)
    clean_text = re.sub(r"(?<!https:)(?<!http:)//.*$", "", clean_text, flags=re.MULTILINE)
    
    try:
        return json.loads(clean_text)
    except json.JSONDecodeError as e:
        fixed_text = re.sub(r",\s*([\]}])", r"\1", clean_text)
        try:
            return json.loads(fixed_text)
        except Exception:
            try:
                import ast
                return ast.literal_eval(fixed_text)
            except Exception:
                raise e


def extract_company_name_from_prompt(prompt_text: str) -> str:
    if not prompt_text:
        return "Voice Agent"
    match = re.search(r"representative for\s+([A-Za-z0-9\s]+?)(?:\.|\n|,|$)", prompt_text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    match = re.search(r"representative at\s+([A-Za-z0-9\s]+?)(?:\.|\n|,|$)", prompt_text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    match = re.search(r"calling from\s+([A-Za-z0-9\s]+?)(?:\.|\n|,|$)", prompt_text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return "Voice Agent"


# ==================== REST ROUTE SCHEMAS ====================
class CompanyCreate(BaseModel):
    name: str
    description: str
    services: str
    offers: str

class StartSessionRequest(BaseModel):
    customer_name: Optional[str] = "Customer"
    lead_id: Optional[int] = None
    campaign_id: Optional[int] = None

class AIAgentCreate(BaseModel):
    name: str
    role: str
    prompt: str
    voice_id: Optional[str] = "EXAVITQu4vr4xnSDxMaL"
    languages: Optional[str] = "te,en"
    whatsapp_threshold: Optional[int] = 70

class CampaignCreate(BaseModel):
    name: str
    objective: str
    agent_id: int
    status: Optional[str] = "active"

class CampaignStatusUpdate(BaseModel):
    status: str  # active, paused, completed, draft

class LeadCreate(BaseModel):
    name: str
    phone: str
    language: Optional[str] = "te"
    campaign_id: Optional[int] = None
    status: Optional[str] = "pending"


class TopupRequest(BaseModel):
    amount: float
    payment_id: Optional[str] = None

class NumberBuyRequest(BaseModel):
    phone_number: str


# ==================== ROUTE ENDPOINTS ====================

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "openai_configured": bool(OPENAI_API_KEY),
        "gemini_active": bool(GEMINI_API_KEY),
        "gemini_model": settings.GEMINI_CONTENT_MODEL,
        "elevenlabs_active": bool(os.getenv("ELEVENLABS_API_KEY", "")),
        "eleven_voice_id": os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL"),
        "eleven_model_id": "eleven_v3"
    }


@router.get("/voice-agent/live-diag")
async def live_diagnostics():
    """Diagnose deployed backend environment variables and API connections"""
    import aiohttp
    from config.settings import settings
    from services.voice_agent_service import voice_agent_service, GEMINI_API_KEYS
    
    dg_key = os.getenv("DEEPGRAM_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    
    def mask_key(k: str) -> str:
        if not k:
            return "MISSING"
        if len(k) < 12:
            return "PRESENT_BUT_SHORT"
        return f"{k[:6]}...{k[-6:]}"
        
    diag_info = {
        "deepgram_key": mask_key(dg_key),
        "gemini_key": mask_key(gemini_key),
        "sarvam_key": mask_key(os.getenv("SARVAM_API_KEY", "")),
        "elevenlabs_key": mask_key(os.getenv("ELEVENLABS_API_KEY", "")),
        "stream_url": settings.EXOTEL_STREAM_URL,
        "backend_url": settings.BACKEND_URL,
        "environment": settings.ENVIRONMENT,
        "deepgram_connection_status": "Not tested",
        "gemini_api_keys_loaded_count": len(GEMINI_API_KEYS),
        "llm_test_result": None,
        "llm_test_error": None,
        "env_vars": {k: (f"{v[:4]}...{v[-4:]}" if len(v) > 8 else "SHORT_VAL") for k, v in os.environ.items() if any(x in k.upper() for x in ["KEY", "TOKEN", "API", "URL", "ENV", "PORT", "SECRET", "DB", "REDIS", "MODEL"])}
    }
    
    try:
        url = "wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1&model=nova-3&language=te&endpointing=1000"
        headers = {
            "Authorization": f"Token {dg_key}"
        }
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(url, headers=headers, timeout=5) as ws:
                diag_info["deepgram_connection_status"] = "SUCCESSFUL"
    except Exception as e:
        diag_info["deepgram_connection_status"] = f"FAILED: {str(e)}"
        
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(model_name=settings.GEMINI_CONTENT_MODEL)
        response = model.generate_content("Respond with hello")
        diag_info["llm_test_result"] = response.text
    except Exception as e:
        diag_info["llm_test_error"] = f"Direct Gemini call failed: {type(e).__name__}: {str(e)}"
        
    try:
        from groq import Groq
        groq_api_key = os.getenv("GROQ_API_KEY", "")
        diag_info["groq_key_configured"] = bool(groq_api_key)
        if groq_api_key:
            client = Groq(api_key=groq_api_key)
            model_name = os.getenv("GROQ_CONTENT_MODEL", "llama-3.1-8b-instant")
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": "Respond with hello"}],
                max_tokens=10
            )
            diag_info["groq_test_result"] = response.choices[0].message.content.strip()
        else:
            diag_info["groq_test_result"] = "No Groq API Key found"
    except Exception as e:
        diag_info["groq_test_error"] = f"Direct Groq call failed: {type(e).__name__}: {str(e)}"
        
    try:
        fallback_res = voice_agent_service._generate_with_fallback("Respond with hello")
        diag_info["voice_agent_service_fallback_test_result"] = fallback_res
    except Exception as e:
        diag_info["voice_agent_service_fallback_test_error"] = f"Fallback generation test failed: {type(e).__name__}: {str(e)}"
        
    return diag_info



@router.get("/company")
def get_company(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        return {
            "name": "",
            "description": "",
            "services": "",
            "offers": "",
            "summary": ""
        }
    return {
        "name": profile.name,
        "description": profile.description,
        "services": profile.services,
        "offers": profile.offers,
        "summary": profile.summary
    }


@router.post("/company")
def save_company(
    data: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        profile = CompanyProfile(
            user_id=current_user.id,
            name=data.name,
            description=data.description,
            services=data.services,
            offers=data.offers
        )
        db.add(profile)
    else:
        profile.name = data.name
        profile.description = data.description
        profile.services = data.services
        profile.offers = data.offers
    db.commit()
    db.refresh(profile)
    return {"message": "Company details saved successfully", "company": profile.name}


@router.post("/company/generate-summary")
def generate_company_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Please save company details before generating summary")
    
    prompt = f"""
    You are an expert business analyst. Please generate a clear, executive summary (3-4 sentences) summarizing this company's business model, services, and offers for a visitor.
    Output the summary in English, but keep it highly polished.
    
    Company Name: {profile.name}
    Description: {profile.description}
    Services Offered: {profile.services}
    Offers: {profile.offers}
    """
    try:
        summary_text = generate_text(prompt)
        profile.summary = summary_text
        db.commit()
        return {"summary": summary_text}
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")


@router.get("/agents")
def get_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    return db.query(AIAgent).filter(AIAgent.user_id == current_user.id).order_by(AIAgent.created_at.desc()).all()


@router.post("/agents")
def create_agent(
    data: AIAgentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    agent = AIAgent(
        user_id=current_user.id,
        name=data.name,
        role=data.role,
        prompt=data.prompt,
        voice_id=data.voice_id,
        languages=data.languages,
        whatsapp_threshold=data.whatsapp_threshold
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.put("/agents/{agent_id}")
def update_agent(
    agent_id: int,
    data: AIAgentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id, AIAgent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.name = data.name
    agent.role = data.role
    agent.prompt = data.prompt
    agent.voice_id = data.voice_id
    agent.languages = data.languages
    agent.whatsapp_threshold = data.whatsapp_threshold
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/agents/{agent_id}")
def delete_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id, AIAgent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(agent)
    db.commit()
    return {"message": "Agent deleted successfully"}


@router.get("/campaigns")
def get_campaigns(
    status: Optional[str] = None,
    view: Optional[str] = None,   # "trash" to list soft-deleted campaigns
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """List campaigns. Supports ?status=active|paused|completed|archived&view=trash"""
    if view == "trash":
        query = db.query(Campaign).filter(Campaign.is_deleted == True, Campaign.user_id == current_user.id)
    else:
        query = db.query(Campaign).filter(
            Campaign.is_deleted == False,
            Campaign.is_archived == False,
            Campaign.user_id == current_user.id
        )
        if status == "archived":
            query = db.query(Campaign).filter(
                Campaign.is_deleted == False,
                Campaign.is_archived == True,
                Campaign.user_id == current_user.id
            )
        elif status and status != "all":
            query = query.filter(Campaign.status == status)

    campaigns_data = query.outerjoin(AIAgent, Campaign.agent_id == AIAgent.id).\
        add_columns(AIAgent.name).\
        order_by(Campaign.created_at.desc()).all()
        
    result = []
    for c, agent_name in campaigns_data:
        result.append({
            "id": c.id,
            "name": c.name,
            "objective": c.objective,
            "agent_id": c.agent_id,
            "agent_name": agent_name if agent_name else "Unknown Agent",
            "status": c.status,
            "is_archived": getattr(c, 'is_archived', False),
            "is_deleted": getattr(c, 'is_deleted', False),
            "archived_at": c.archived_at.isoformat() if getattr(c, 'archived_at', None) else None,
            "deleted_at": c.deleted_at.isoformat() if getattr(c, 'deleted_at', None) else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return result


@router.post("/campaigns")
def create_campaign(
    data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    if data.agent_id:
        agent = db.query(AIAgent).filter(AIAgent.id == data.agent_id, AIAgent.user_id == current_user.id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found or does not belong to you")
            
    campaign = Campaign(
        user_id=current_user.id,
        name=data.name,
        objective=data.objective,
        agent_id=data.agent_id,
        status=data.status
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return {
        "id": campaign.id,
        "name": campaign.name,
        "objective": campaign.objective,
        "agent_id": campaign.agent_id,
        "status": campaign.status,
        "is_archived": False,
        "is_deleted": False,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
    }


@router.put("/campaigns/{campaign_id}")
def update_campaign(
    campaign_id: int,
    data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if data.agent_id:
        agent = db.query(AIAgent).filter(AIAgent.id == data.agent_id, AIAgent.user_id == current_user.id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found or does not belong to you")
            
    campaign.name = data.name
    campaign.objective = data.objective
    campaign.agent_id = data.agent_id
    campaign.status = data.status
    db.commit()
    db.refresh(campaign)
    return {"id": campaign.id, "name": campaign.name, "status": campaign.status}


@router.patch("/campaigns/{campaign_id}/status")
def update_campaign_status(
    campaign_id: int,
    data: CampaignStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Pause, resume (active), complete a campaign."""
    allowed = {"active", "paused", "completed", "draft"}
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {allowed}")
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.status = data.status
    db.commit()
    return {"id": campaign_id, "status": campaign.status, "message": f"Campaign {data.status}"}


@router.patch("/campaigns/{campaign_id}/archive")
def archive_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Toggle archive state of a campaign."""
    from datetime import datetime as _dt
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    currently_archived = getattr(campaign, 'is_archived', False)
    campaign.is_archived = not currently_archived
    campaign.archived_at = _dt.utcnow() if not currently_archived else None
    db.commit()
    action = "archived" if campaign.is_archived else "unarchived"
    return {"id": campaign_id, "is_archived": campaign.is_archived, "message": f"Campaign {action}"}


@router.post("/campaigns/{campaign_id}/duplicate")
def duplicate_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Clone a campaign with '(Copy)' suffix. New campaign starts in draft status."""
    original = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Campaign not found")
    clone = Campaign(
        user_id=current_user.id,
        name=f"{original.name} (Copy)",
        objective=original.objective,
        agent_id=original.agent_id,
        status="draft",
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return {
        "id": clone.id,
        "name": clone.name,
        "status": clone.status,
        "message": "Campaign duplicated successfully",
    }


@router.patch("/campaigns/{campaign_id}/restore")
def restore_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Restore a soft-deleted campaign from Trash."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.is_deleted = False
    campaign.deleted_at = None
    campaign.is_archived = False
    campaign.archived_at = None
    campaign.status = "draft"
    db.commit()
    return {"id": campaign_id, "message": "Campaign restored successfully"}


@router.delete("/campaigns/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    permanent: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Soft-delete a campaign (moves to Trash). Pass ?permanent=true to hard-delete from Trash."""
    from datetime import datetime as _dt
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if permanent:
        db.delete(campaign)
        db.commit()
        return {"message": "Campaign permanently deleted"}
    # Soft delete
    campaign.is_deleted = True
    campaign.deleted_at = _dt.utcnow()
    db.commit()
    return {"message": "Campaign moved to Trash", "id": campaign_id}


@router.get("/leads")
def get_leads(
    campaign_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    query = db.query(Lead).filter(Lead.user_id == current_user.id)
    if campaign_id is not None:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found or does not belong to you")
        query = query.filter(Lead.campaign_id == campaign_id)
    return query.order_by(Lead.created_at.desc()).all()


@router.post("/leads")
def create_lead(
    data: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    if data.campaign_id:
        campaign = db.query(Campaign).filter(Campaign.id == data.campaign_id, Campaign.user_id == current_user.id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found or does not belong to you")
            
    lead = Lead(
        user_id=current_user.id,
        name=data.name,
        phone=data.phone,
        language=data.language,
        campaign_id=data.campaign_id,
        status=data.status
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/leads/{lead_id}")
def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.user_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}


@router.post("/leads/upload")
async def upload_leads_csv(
    campaign_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    import csv
    import io
    
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found or does not belong to you")
        
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    content = await file.read()
    try:
        decoded = content.decode("utf-8")
    except:
        decoded = content.decode("latin-1")
    csv_reader = csv.reader(io.StringIO(decoded))
    headers = next(csv_reader, None)
    if not headers:
        raise HTTPException(status_code=400, detail="Empty CSV file")
    
    def find_index(names):
        for name in names:
            for i, h in enumerate(headers):
                if name.lower() in h.lower(): return i
        return -1
        
    name_idx = find_index(["name", "first name", "lead name"])
    phone_idx = find_index(["phone", "mobile", "phone number", "contact"])
    lang_idx = find_index(["language", "lang"])
    if name_idx == -1 or phone_idx == -1:
        raise HTTPException(status_code=400, detail="CSV must contain name and phone columns")
        
    imported_count = 0
    for row in csv_reader:
        if not row or len(row) <= max(name_idx, phone_idx): continue
        name = row[name_idx].strip()
        phone = row[phone_idx].strip()
        language = row[lang_idx].strip() if (lang_idx != -1 and len(row) > lang_idx) else "te"
        if not name or not phone: continue
        lead = Lead(
            user_id=current_user.id,
            name=name, phone=phone, language=language,
            campaign_id=campaign_id, status="pending"
        )
        db.add(lead)
        imported_count += 1
    db.commit()
    return {"message": f"Successfully imported {imported_count} leads"}


@router.get("/whatsapp-logs")
def get_whatsapp_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    logs = db.query(WhatsAppLog).join(Lead, Lead.id == WhatsAppLog.lead_id).filter(Lead.user_id == current_user.id).order_by(WhatsAppLog.sent_at.desc()).all()
    result = []
    for l in logs:
        lead = db.query(Lead).filter(Lead.id == l.lead_id).first()
        lead_name = lead.name if lead else "Unknown"
        result.append({
            "id": l.id,
            "lead_name": lead_name,
            "phone": l.phone,
            "message_type": l.message_type,
            "content": l.content,
            "sent_at": l.sent_at.isoformat()
        })
    return result


@router.get("/analytics/overview")
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    total_calls = db.query(CallSession).join(Lead, Lead.id == CallSession.lead_id).filter(Lead.user_id == current_user.id).count()
    completed_calls = db.query(CallSession).join(Lead, Lead.id == CallSession.lead_id).filter(CallSession.status == "completed", Lead.user_id == current_user.id).count()
    hot_leads = db.query(Lead).filter(Lead.interest_level == "Hot", Lead.user_id == current_user.id).count()
    warm_leads = db.query(Lead).filter(Lead.interest_level == "Warm", Lead.user_id == current_user.id).count()
    nurture_leads = db.query(Lead).filter(Lead.interest_level == "Nurture", Lead.user_id == current_user.id).count()
    cold_leads = db.query(Lead).filter(Lead.interest_level == "Cold", Lead.user_id == current_user.id).count()
    total_leads = db.query(Lead).filter(Lead.user_id == current_user.id).count()
    conversion_rate = (hot_leads / total_leads * 100) if total_leads > 0 else 0.0
    return {
        "total_calls": total_calls,
        "connected_calls": completed_calls,
        "answered_calls": completed_calls,
        "hot_leads": hot_leads,
        "warm_leads": warm_leads,
        "nurture_leads": nurture_leads,
        "cold_leads": cold_leads,
        "conversion_rate": round(conversion_rate, 1)
    }



@router.get("/voice-agent/dashboard/overview")
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """Aggregate endpoint returning analytics, agents, campaigns, leads and recent sessions in one payload."""
    logger.info(f"📊 [VOICE_AGENT_OVERVIEW] Endpoint called for user: {current_user.email if current_user else 'None'}")
    max_retries = 2
    for attempt in range(max_retries):
        try:
            # Analytics
            total_calls = db.query(CallSession).join(Lead, Lead.id == CallSession.lead_id).filter(Lead.user_id == current_user.id).count()
            completed_calls = db.query(CallSession).join(Lead, Lead.id == CallSession.lead_id).filter(CallSession.status == "completed", Lead.user_id == current_user.id).count()
            hot_leads = db.query(Lead).filter(Lead.interest_level == "Hot", Lead.user_id == current_user.id).count()
            warm_leads = db.query(Lead).filter(Lead.interest_level == "Warm", Lead.user_id == current_user.id).count()
            nurture_leads = db.query(Lead).filter(Lead.interest_level == "Nurture", Lead.user_id == current_user.id).count()
            cold_leads = db.query(Lead).filter(Lead.interest_level == "Cold", Lead.user_id == current_user.id).count()
            total_leads = db.query(Lead).filter(Lead.user_id == current_user.id).count()
            conversion_rate = (hot_leads / total_leads * 100) if total_leads > 0 else 0.0

            analytics = {
                "total_calls": total_calls,
                "connected_calls": completed_calls,
                "answered_calls": completed_calls,
                "hot_leads": hot_leads,
                "warm_leads": warm_leads,
                "nurture_leads": nurture_leads,
                "cold_leads": cold_leads,
                "conversion_rate": round(conversion_rate, 1),
            }

            # Agents
            agents = db.query(AIAgent).filter(AIAgent.user_id == current_user.id).order_by(AIAgent.created_at.desc()).all()

            # Campaigns: main, trash, archived
            campaigns_main_q = db.query(Campaign).filter(Campaign.is_deleted == False, Campaign.is_archived == False, Campaign.user_id == current_user.id)
            campaigns_main = campaigns_main_q.order_by(Campaign.created_at.desc()).all()
            campaigns_trash = db.query(Campaign).filter(Campaign.is_deleted == True, Campaign.user_id == current_user.id).order_by(Campaign.deleted_at.desc()).all()
            campaigns_archived = db.query(Campaign).filter(Campaign.is_archived == True, Campaign.is_deleted == False, Campaign.user_id == current_user.id).order_by(Campaign.archived_at.desc()).all()

            def campaign_to_dict(c):
                return {
                    "id": c.id,
                    "name": c.name,
                    "objective": c.objective,
                    "agent_id": c.agent_id,
                    "status": c.status,
                    "is_archived": getattr(c, 'is_archived', False),
                    "is_deleted": getattr(c, 'is_deleted', False),
                    "archived_at": c.archived_at.isoformat() if getattr(c, 'archived_at', None) else None,
                    "deleted_at": c.deleted_at.isoformat() if getattr(c, 'deleted_at', None) else None,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }

            campaigns = [campaign_to_dict(c) for c in campaigns_main]
            trashed = [campaign_to_dict(c) for c in campaigns_trash]
            archived = [campaign_to_dict(c) for c in campaigns_archived]

            # Leads (recent)
            leads_q = db.query(Lead).filter(Lead.user_id == current_user.id).order_by(Lead.created_at.desc()).limit(500).all()
            leads = []
            for l in leads_q:
                leads.append({
                    "id": l.id,
                    "name": l.name,
                    "phone": l.phone,
                    "language": l.language,
                    "campaign_id": l.campaign_id,
                    "status": l.status,
                    "interest_level": l.interest_level,
                    "urgency_score": l.urgency_score,
                    "created_at": l.created_at.isoformat() if l.created_at else None,
                })

            # Sessions (recent)
            sessions_data = db.query(CallSession, Lead.name, Lead.phone).join(Lead, CallSession.lead_id == Lead.id).filter(Lead.user_id == current_user.id).order_by(CallSession.created_at.desc()).limit(200).all()
            sessions = []
            for s, lead_name, phone in sessions_data:
                sessions.append({
                    "session_id": s.session_id,
                    "status": s.status,
                    "summary": s.summary,
                    "sentiment": s.sentiment,
                    "lead_name": lead_name if lead_name else "Visitor",
                    "phone": phone if phone else "N/A",
                    "interest_score": s.interest_score,
                    "buying_intent": s.buying_intent,
                    "lead_category": s.lead_category,
                    "objections": s.objections,
                    "callback_time": s.callback_time,
                    "whatsapp_sent": s.whatsapp_sent,
                    "transcript": s.transcript,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                })

            return {
                "analytics": analytics,
                "agents": [
                    {
                        "id": a.id,
                        "name": a.name,
                        "role": a.role,
                        "prompt": a.prompt,
                        "voice_id": a.voice_id,
                        "languages": a.languages,
                        "whatsapp_threshold": a.whatsapp_threshold,
                        "created_at": a.created_at.isoformat() if a.created_at else None,
                    }
                    for a in agents
                ],
                "campaigns": campaigns,
                "trashed_campaigns": trashed,
                "archived_campaigns": archived,
                "leads": leads,
                "sessions": sessions,
                "user": {
                    "id": current_user.id,
                    "email": current_user.email,
                    "wallet_balance": current_user.wallet_balance,
                    "leased_phone_number": current_user.leased_phone_number,
                }
            }
        except Exception as e:
            logger.warning(f"Database query attempt {attempt + 1} failed in get_dashboard_overview: {e}")
            if attempt == max_retries - 1:
                logger.error(f"All database query attempts failed in get_dashboard_overview: {e}")
                raise HTTPException(status_code=500, detail="Database connection or query error")
            db.rollback()


@router.get("/sessions")
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    sessions_data = db.query(CallSession, Lead.name, Lead.phone).\
        join(Lead, CallSession.lead_id == Lead.id).\
        filter(Lead.user_id == current_user.id).\
        order_by(CallSession.created_at.desc()).\
        limit(100).all()
        
    result = []
    for s, lead_name, phone in sessions_data:
        result.append({
            "session_id": s.session_id,
            "status": s.status,
            "summary": s.summary,
            "sentiment": s.sentiment,
            "lead_name": lead_name if lead_name else "Visitor",
            "phone": phone if phone else "N/A",
            "interest_score": s.interest_score,
            "buying_intent": s.buying_intent,
            "lead_category": s.lead_category,
            "objections": s.objections,
            "callback_time": s.callback_time,
            "whatsapp_sent": s.whatsapp_sent,
            "transcript": s.transcript,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return result


# ==================== VOICE SESSION ENDPOINTS ====================
@router.post("/voice-agent/start")
def start_voice_session(
    req: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    # Wallet Balance Check
    MINIMUM_BALANCE = 100.00
    if current_user.wallet_balance < MINIMUM_BALANCE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient wallet balance. Minimum required is ₹{MINIMUM_BALANCE:.2f}, but current balance is ₹{current_user.wallet_balance:.2f}."
        )

    agent_prompt = None
    agent_voice_id = None
    
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    company_name = profile.name if (profile and profile.name) else "Saadhyam AI"
    agent_name = "Swetha"
    campaign_objective = "our services"
    
    if req.campaign_id:
        campaign = db.query(Campaign).filter(Campaign.id == req.campaign_id, Campaign.user_id == current_user.id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found or does not belong to you")
        campaign_objective = campaign.objective or campaign.name
        agent = db.query(AIAgent).filter(AIAgent.id == campaign.agent_id, AIAgent.user_id == current_user.id).first()
        if agent:
            agent_prompt = agent.prompt
            agent_voice_id = agent.voice_id
            agent_name = agent.name

    if company_name == "Saadhyam AI" and agent_prompt:
        extracted = extract_company_name_from_prompt(agent_prompt)
        if extracted and extracted.lower() != "voice agent":
            company_name = extracted
            
    campaign_objective = re.sub(r"\bNAI\b", "AI", campaign_objective, flags=re.IGNORECASE)
                
    lead_language = "te"
    lead_name = "కస్టమర్"
    
    if req.lead_id:
        lead = db.query(Lead).filter(Lead.id == req.lead_id, Lead.user_id == current_user.id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found or does not belong to you")
        if lead.language:
            lead_language = lead.language
        if lead.name:
            lead_name = lead.name

    company_name_telugu = "సాధ్యం ఐ" if company_name.lower() == "saadhyam ai" else company_name
    agent_name_telugu = "శ్వేత" if agent_name.lower() == "swetha" else agent_name
    session_id = uuid.uuid4().hex
    
    # Generate brief opening greeting
    if lead_language == "te":
        greeting_prompt = f"""
        Generate a short, polite outbound sales call opening greeting in Telugu script.
        Customer Name: {lead_name}
        Agent Name: {agent_name_telugu}
        Company Name: {company_name_telugu}
        Campaign Objective / Company Services: {campaign_objective}
        
        Instructions:
        1. Greet the customer by name (e.g. "హలో అండి {lead_name} గారు!").
        2. Introduce yourself by your name "{agent_name_telugu}" calling on behalf of the company "{company_name_telugu}".
        3. Briefly state the purpose of the call based on the Campaign Objective.
        4. Ask if they are interested or have a few minutes to talk about this.
        5. CRITICAL: Outbound call context. Do NOT ask "How can I help you today?" or "What can I do for you?".
        6. Keep it to exactly 1 short, polite sentence (maximum 15-20 words).
        7. Use spoken, natural daily conversational language.
        8. Output ONLY the greeting text, no markdown, no quotes, no extra notes.
        """
        default_greeting = f"హలో అండి {lead_name} గారు! నేను {company_name_telugu} నుండి {agent_name_telugu} మాట్లాడుతున్నానండి. మా {campaign_objective} గురించి మాట్లాడటానికి కాల్ చేశానండి. దీనిపై మీకు ఆసక్తి ఉందా?"
    elif lead_language == "hi":
        greeting_prompt = f"""
        Generate a short, polite outbound sales call opening greeting in Hindi.
        Customer Name: {lead_name}
        Agent Name: {agent_name}
        Company Name: {company_name}
        Campaign Objective / Company Services: {campaign_objective}
        
        Instructions:
        1. Greet the customer by name (e.g. "नमस्ते {lead_name} जी!").
        2. Introduce yourself as "{agent_name}" calling from "{company_name}".
        3. Briefly state the purpose of the call based on the Campaign Objective.
        4. Ask if they have a few minutes to talk about this.
        5. CRITICAL: Outbound call context. Do NOT ask "How can I help you today?".
        6. Keep it to exactly 1 short sentence.
        7. Output ONLY the greeting text.
        """
        default_greeting = f"नमस्ते {lead_name} जी! मैं {company_name} से {agent_name} बात कर रही हूँ। हमारे {campaign_objective} के बारे में जानने के लिए कॉल किया है। क्या आप इसमें रुचि रखते हैं?"
    else:
        greeting_prompt = f"""
        Generate a short, polite outbound sales call opening greeting in English.
        Customer Name: {lead_name}
        Agent Name: {agent_name}
        Company Name: {company_name}
        Campaign Objective / Company Services: {campaign_objective}
        
        Instructions:
        1. Greet the customer by name (e.g. "Hello {lead_name}!").
        2. Introduce yourself as "{agent_name}" calling from "{company_name}".
        3. Briefly state the purpose of the call based on the Campaign Objective.
        4. Ask if they have a few minutes to talk about this.
        5. CRITICAL: Outbound call context. Do NOT ask "How can I help you today?".
        6. Keep it to exactly 1 short sentence.
        7. Output ONLY the greeting text.
        """
        default_greeting = f"Hello {lead_name}! This is {agent_name} calling from {company_name} regarding our {campaign_objective}. I wanted to check if you have a few minutes to talk about this?"

    greeting_text = default_greeting
    try:
        generated_greeting = generate_text(greeting_prompt)
        if generated_greeting and len(generated_greeting) > 5 and len(generated_greeting) < 200:
            greeting_text = generated_greeting
    except Exception as e:
        logger.warning(f"Failed to generate outbound greeting, using default: {e}")
    
    greeting_text = re.sub(r"\bNAI\b", "AI", greeting_text, flags=re.IGNORECASE)
    greeting_text = replace_numbers_with_telugu_words(greeting_text)
    
    session_record = CallSession(
        session_id=session_id,
        status="connected",
        transcript=f"AI (Greeting): {greeting_text}\n",
        lead_id=req.lead_id,
        campaign_id=req.campaign_id
    )
    db.add(session_record)
    db.commit()
    
    audio_filename = f"greeting_{session_id}.mp3"
    audio_url = speak_elevenlabs(greeting_text, audio_filename, agent_voice_id)
    
    return {
        "session_id": session_id,
        "text": greeting_text,
        "audio_url": audio_url
    }


@router.post("/voice-agent/turn")
def voice_agent_turn(
    session_id: str = Form(...),
    customer_audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    session_record = db.query(CallSession).filter(CallSession.session_id == session_id).first()
    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session_record.lead_id:
        lead = db.query(Lead).filter(Lead.id == session_record.lead_id, Lead.user_id == current_user.id).first()
        if not lead:
            raise HTTPException(status_code=403, detail="Access denied. This session does not belong to you.")
    elif session_record.campaign_id:
        campaign = db.query(Campaign).filter(Campaign.id == session_record.campaign_id, Campaign.user_id == current_user.id).first()
        if not campaign:
            raise HTTPException(status_code=403, detail="Access denied. This session does not belong to you.")
    else:
        raise HTTPException(status_code=403, detail="Access denied. Unassociated session.")
    
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        profile = CompanyProfile(
            name="Saadhyam AI",
            description="AI Assistant Studio",
            services="Voice agent setup, digital marketing",
            offers="Free trial",
            summary="A digital voice assistant service."
        )
        
    import tempfile
    temp_filename = f"temp_{session_id}_{uuid.uuid4().hex[:6]}.webm"
    temp_filepath = os.path.join(tempfile.gettempdir(), temp_filename)
    
    try:
        with open(temp_filepath, "wb") as buffer:
            buffer.write(customer_audio.file.read())
        
        audio_file_size = os.path.getsize(temp_filepath)
        if audio_file_size < 2000:
            user_text = "[నిశ్శబ్దం]"
            transcription_succeeded = True
        else:
            user_text = ""
            transcription_succeeded = False
        
        global OPENAI_QUOTA_EXCEEDED
        if OPENAI_API_KEY and not OPENAI_QUOTA_EXCEEDED:
            try:
                url = "https://api.openai.com/v1/audio/transcriptions"
                headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
                with open(temp_filepath, "rb") as audio_file:
                    files = {"file": (temp_filename, audio_file, "audio/webm")}
                    data = {
                        "model": "whisper-1",
                        "response_format": "json",
                        "language": "te",
                        "prompt": "నమస్కారం, ఇది తెలుగు వాయిస్ అసిస్టెంట్ సంభాషణ."
                    }
                    res = requests.post(url, headers=headers, files=files, data=data, timeout=15)
                    if res.status_code == 200:
                        transcription_data = res.json()
                        user_text = transcription_data.get("text", "").strip()
                        transcription_succeeded = True
                    elif res.status_code == 429:
                        OPENAI_QUOTA_EXCEEDED = True
            except Exception as e:
                logger.warning(f"Whisper failed: {e}")
                
        if not transcription_succeeded and GEMINI_API_KEY:
            try:
                with open(temp_filepath, "rb") as f:
                    audio_bytes = f.read()
                mime_type = customer_audio.content_type or "audio/webm"
                if ";" in mime_type:
                    mime_type = mime_type.split(";")[0].strip()
                
                lead_language = "te"
                if session_record.lead_id:
                    lead = db.query(Lead).filter(Lead.id == session_record.lead_id).first()
                    if lead and lead.language:
                        lead_language = lead.language
                
                if lead_language == "te":
                    transcribe_instruction = (
                        "You are a professional Speech-to-Text transcriber for a Telugu sales call. "
                        "Transcribe the audio accurately into Telugu script. "
                        "If the speaker uses English words, write them phonetically in Telugu script. "
                        "Do NOT translate to English. Output ONLY the transcription in Telugu script."
                    )
                elif lead_language == "hi":
                    transcribe_instruction = (
                        "You are a professional Speech-to-Text transcriber for a Hindi sales call. "
                        "Transcribe the audio accurately into Hindi script. "
                        "If the speaker uses English words, write them phonetically in Hindi script. "
                        "Do NOT translate to English. Output ONLY the transcription in Hindi script."
                    )
                else:
                    transcribe_instruction = (
                        "You are a professional Speech-to-Text transcriber. "
                        "Transcribe the audio accurately into English script. Output ONLY the transcription."
                    )

                transcribe_prompt = [
                    transcribe_instruction,
                    {"mime_type": mime_type, "data": audio_bytes}
                ]
                model = genai.GenerativeModel("gemini-2.5-flash-lite")
                transcribe_resp = model.generate_content(transcribe_prompt)
                user_text = transcribe_resp.text.strip()
                transcription_succeeded = True
            except Exception as e:
                logger.error(f"Gemini STT inline failed: {e}")
                
        if not transcription_succeeded:
            raise Exception("Speech-to-Text translation failed completely.")
            
        if not user_text:
            user_text = "[నిశ్శబ్దం]"
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        user_text = "సహాయం కావాలి"
    finally:
        if os.path.exists(temp_filepath):
            try: os.remove(temp_filepath)
            except: pass
            
    agent_prompt = None
    agent_voice_id = None
    agent_name = "Swetha"
    company_name = "Saadhyam AI"
    
    if session_record.campaign_id:
        campaign = db.query(Campaign).filter(Campaign.id == session_record.campaign_id).first()
        if campaign:
            campaign_objective = campaign.objective or campaign.name
            agent = db.query(AIAgent).filter(AIAgent.id == campaign.agent_id).first()
            if agent:
                agent_prompt = agent.prompt
                agent_voice_id = agent.voice_id
                agent_name = agent.name
                extracted_company = extract_company_name_from_prompt(agent.prompt)
                if extracted_company and extracted_company.lower() != "voice agent":
                    company_name = extracted_company
                
    lead_language = "te"
    lead_name = "కస్టమర్"
    lead_phone = ""
    lead_city = ""
    lead_info = ""
    
    if session_record.lead_id:
        lead = db.query(Lead).filter(Lead.id == session_record.lead_id).first()
        if lead:
            if lead.language:
                lead_language = lead.language
            if lead.name:
                lead_name = lead.name
            if lead.phone:
                lead_phone = lead.phone
            if lead.city:
                lead_city = lead.city
            lead_info = (
                f"\n\n[CUSTOMER CRM DEMOGRAPHICS]\n"
                f"Customer Name: {lead_name}\n"
                f"Customer Phone: {lead_phone}\n"
                f"Customer Location/City: {lead_city or 'Unknown'}\n"
                f"Student Class (if applicable): {lead.student_class or 'Unknown'}\n"
                f"Budget (if applicable): {lead.budget or 'Unknown'}\n"
                f"Interest Level: {lead.interest_level or 'Cold'}\n"
            )

    user_lower = user_text.lower()
    end_call_keywords = [
        "bye", "goodbye", "good bye", "cut the call", "end the call", "hang up", "ok bye",
        "సరే బాయ్", "బాయ్", "కాల్ కట్", "కట్ చేయి", "కాల్ ముగించు", "ముగించు",
        "సరే అండి బాయ్", "సరే ఉంటాను", "సరేనండి బాయ్"
    ]
    should_end_call = any(kw in user_lower for kw in end_call_keywords)

    profile_name = profile.name
    if profile_name == "Saadhyam AI" and agent_prompt:
        extracted = extract_company_name_from_prompt(agent_prompt)
        if extracted and extracted.lower() != "voice agent":
            profile_name = extracted

    company_context = (
        f"\n\n[COMPANY INFORMATION]\n"
        f"Company Name: {profile_name}\n"
        f"Services Provided: {profile.services or 'Voice agent, digital marketing'}\n"
        f"Offers & Packages: {profile.offers or 'Free Consultation, Basic Package, Premium Package'}\n"
        f"Description: {profile.description or ''}\n"
    )

    if not agent_prompt:
        company_name_telugu = "సాధ్యం ఐ" if company_name.lower() == "saadhyam ai" else company_name
        if lead_language == "te":
            system_prompt = f""" నువ్వు '{company_name_telugu}' తరపున మాట్లాడే తెలుగు వాయిస్ అసిస్టెంట్వి. రోజువారీ మాట్లాడే తెలుగులో మాట్లాడు. చిన్న వాక్యాలు వాడు. """
        elif lead_language == "hi":
            system_prompt = f""" आप '{company_name}' की तरफ से बात करने वाले हिंदी वॉयस असिस्टेंट हैं। सामान्य बातचीत वाली हिंदी बोलें। छोटे वाक्यों का प्रयोग करें। """
        else:
            system_prompt = f""" You are the English voice assistant for '{company_name}'. Speak in clear, professional English. Use short sentences. """
    else:
        system_prompt = agent_prompt

    system_prompt += company_context
    if lead_info:
        system_prompt += lead_info

    if lead_language == "te":
        telugu_voice_id = os.getenv("ELEVENLABS_TELUGU_VOICE_ID", "EMxdghWQV7gqV33j4J3F")
        is_male = telugu_voice_id in ["2DRBj9T2XZ7Jmkcm6WCZ", "EMxdghWQV7gqV33j4J3F", "TX3LPaxmHKxFdv7VOQHJ"] or os.getenv("ELEVENLABS_TELUGU_VOICE_GENDER", "male").lower() == "male"
        voice_tone = "male tone (aged 25-30)" if is_male else "female tone (aged 20-25)"

        sales_directive = (
            "\n\n[SALES DIRECTIVE]\n"
            "నీ ముఖ్య ఉద్దేశ్యం మన కంపెనీ సేవలు (Services) మరియు ప్యాకేజీలను (Packages) కస్టమర్‌కి వివరించి, వాటిని కొనేలా ప్రోత్సహించడం. "
            "కస్టమర్ తమ అవసరాలు చెప్పిన తర్వాత, మన వద్ద ఉన్న ప్యాకేజీలను వారి ముందు ఉంచి, వాటిని ఒక ప్యాకేజీని ఎంచుకోమని అడుగు (ఉదాహరణకు: 'ఈ ప్యాకేజీలలో మీరు ఏది తీసుకుంటారు?'). "
            "సంభాషణను ఎప్పుడూ ప్యాకేజీల అమ్మకం పైనే ఉంచు. కస్టమర్ వ్యాపారం గురించి లోతుగా వెళ్లకుండా మన ప్యాకేజీలపై శ్రద్ధ చూపించు."
        )
        if should_end_call:
            sales_directive += "\n\n[CRITICAL] కస్టమర్ సంభాషణను ముగించాలనుకుంటున్నారు. 'సరేనండి, థాంక్యూ అండి, బాయ్!' అని చెప్తూ పొలైట్ గా బాయ్ చెప్పి ముగించు."
            
        system_prompt += (
            "\n\n[CRITICAL DIRECTIVE]\n"
            "You MUST respond ONLY in Telugu script. Do not write or speak in English script or Hindi.\n"
            "TONE & STYLE GUIDELINES:\n"
            f"- Speak in a calm, polite, respectful, and warm South Indian {voice_tone}.\n"
            "- Use natural, casual, and conversational spoken Telugu (వాడుక భాష/రోజువారీ మాట్లాడే తెలుగు) used on daily phone calls. Avoid bookish, formal, grammatical, or highly sanskritized Telugu vocabulary.\n"
            "- Use common English loanwords written in Telugu script (Teenglish) where appropriate, as they sound more natural to modern speakers than pure Telugu words (e.g. use 'ఇంట్రెస్ట్/ఇంట్రెస్టెడ్' instead of 'ఆసక్తి', 'కాల్' instead of 'ఫోన్ పిలుపు/సంభాషణ', 'సర్వీసెస్' instead of 'సేవలు', 'ప్యాకేజీ' instead of 'పథకం/ప్యాకేజీలు').\n"
            "- Keep your response short, friendly, calm, and limited to 1 or 2 sentences max.\n"
            f"- CRITICAL PROFILE: You already know the customer's name ({lead_name}) and phone number ({lead_phone}). DO NOT ask the customer for their name or phone number. If they ask, confirm you already have it.\n"
            f"- NAME DIRECTIVE: కస్టమర్ పేరును ({lead_name}) కేవలం మొదటి పలకరింపులో మరియు కాల్ చివరి ముగింపు సంభాషణలో మాత్రమే ఉపయోగించు. సంభాషణ మధ్యలో పదే పదే కస్టమర్ పేరు వాడవద్దు.\n"
            "- RE-INTRODUCTION DIRECTIVE: నువ్వు ఇప్పటికే పరిచయం చేసుకున్నావు. మళ్లీ పరిచయం చేసుకోకు. నేరుగా సమాధానం ఇవ్వు.\n"
            + sales_directive
        )
        prompt_lang_instruction = "Strictly in Telugu script ONLY."
    elif lead_language == "hi":
        sales_directive = (
            "\n\n[SALES DIRECTIVE]\n"
            "आपका मुख्य लक्ष्य ग्राहक को हमारे पैकेजों और सेवाओं के बारे में बताना और उन्हें बेचना है। "
            "ग्राहक से पूछें कि वे कौन सा पैकेज चुनेंगे। बातचीत को पैकेजों की बिक्री पर केंद्रित रखें।"
        )
        if should_end_call:
            sales_directive += "\n\n[CRITICAL] ग्राहक अलविदा कह रहे हैं। विनम्रता से अलविदा कहें।"
            
        system_prompt += (
            "\n\n[CRITICAL DIRECTIVE]\n"
            "You MUST respond ONLY in Hindi script. Do not write or speak in English or Telugu. "
            "Keep your response short and limited to 1 or 2 sentences max.\n"
            f"You already know the customer's name ({lead_name}) and phone number ({lead_phone}). DO NOT ask them for their name or phone.\n"
            f"- NAME DIRECTIVE: ग्राहक का नाम ({lead_name}) केवल पहली बार स्वागत करते समय और कॉल समाप्त करते समय कहें।\n"
            "- RE-INTRODUCTION DIRECTIVE: आपने पहले ही परिचय दे दिया है। दोबारा परिचय न दें।\n"
            + sales_directive
        )
        prompt_lang_instruction = "Strictly in Hindi script ONLY."
    else:
        sales_directive = (
            "\n\n[SALES DIRECTIVE]\n"
            "Your main goal is to pitch our services and packages. Explain the offers, present options, "
            "and guide the user to select a package. Keep the discussion sales-oriented."
        )
        if should_end_call:
            sales_directive += "\n\n[CRITICAL] Customer wants to end the call. Say goodbye politely."
            
        system_prompt += (
            "\n\n[CRITICAL DIRECTIVE]\n"
            "You MUST respond ONLY in English. Keep your response short and limited to 1 or 2 sentences max.\n"
            f"You already know the customer's name ({lead_name}) and phone number ({lead_phone}). DO NOT ask them for their name or phone.\n"
            f"- NAME DIRECTIVE: Only use the customer's name ({lead_name}) in the initial greeting and the final call-ending response.\n"
            "- RE-INTRODUCTION DIRECTIVE: Do not repeat your introduction.\n"
            + sales_directive
        )
        prompt_lang_instruction = "Strictly in English ONLY."
        
    history_context = session_record.transcript
    prompt = f"""
    Recent History:
    {history_context}
    Customer: "{user_text}"
    Agent Response ({prompt_lang_instruction}):
    """
    try:
        ai_reply_text = generate_text(prompt, system_prompt=system_prompt)
    except Exception as e:
        logger.error(f"Reply error: {e}")
        ai_reply_text = "క్షమించండి, దయచేసి మళ్ళీ చెప్పండి."
        
    ai_reply_text_converted = replace_numbers_with_telugu_words(ai_reply_text)
    ai_reply_text_converted = re.sub(r"\bNAI\b", "AI", ai_reply_text_converted, flags=re.IGNORECASE)
        
    session_record.transcript += f"Customer: {user_text}\nAI: {ai_reply_text_converted}\n"
    db.commit()
    
    turn_id = uuid.uuid4().hex[:6]
    audio_filename = f"reply_{session_id}_{turn_id}.mp3"
    audio_url = speak_elevenlabs(ai_reply_text_converted, audio_filename, agent_voice_id)
    
    return {
        "user_text": user_text,
        "ai_text": ai_reply_text_converted,
        "audio_url": audio_url,
        "end_call": should_end_call
    }


@router.post("/voice-agent/end")
def end_voice_session(
    session_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    session_record = db.query(CallSession).filter(CallSession.session_id == session_id).first()
    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session_record.lead_id:
        lead = db.query(Lead).filter(Lead.id == session_record.lead_id, Lead.user_id == current_user.id).first()
        if not lead:
            raise HTTPException(status_code=403, detail="Access denied. This session does not belong to you.")
    elif session_record.campaign_id:
        campaign = db.query(Campaign).filter(Campaign.id == session_record.campaign_id, Campaign.user_id == current_user.id).first()
        if not campaign:
            raise HTTPException(status_code=403, detail="Access denied. This session does not belong to you.")
    else:
        raise HTTPException(status_code=403, detail="Access denied. Unassociated session.")
        
    session_record.status = "completed"
    
    # Process final conversation transcript using LLM and generate post-call report
    transcript = session_record.transcript or ""
    
    prompt = f"""
    Analyze the following phone conversation transcript between a Sales AI Agent and a Customer.
    You must extract key metrics and output a JSON dictionary matching this exact structure:
    {{
        "interest_score": 0 to 100,
        "buying_intent": 0 to 100,
        "admission_probability": 0 to 100,
        "conversion_probability": 0 to 100,
        "lead_category": "Classify as 'Hot' (if score >= 90), 'Warm' (if 70-89), 'Nurture' (if 40-69), or 'Cold' (if 0-39)",
        "sentiment": "Detect positive, neutral, or negative",
        "summary": "Brief 2-sentence call summary focusing on customer query and resolution",
        "objections": "List objections raised (e.g. price concern, trust concern, time constraint, none)",
        "callback_time": "Estimated date/time for callback if requested, otherwise leave empty",
        "recommended_action": "Recommended next action for sales team"
    }}
    
    SCORING GUIDELINES:
    - If the customer shows strong interest, asks about packages, or says they want to purchase/buy a service (e.g., in Telugu saying 'తీసుకుంటాను', 'తీసుకోవాలనుకుంటున్నాను', or 'ఓకే', 'సరే పంపించండి'), you MUST score them as 'Hot' (interest_score >= 90, buying_intent >= 90, conversion_probability >= 80).
    - If the customer shows moderate interest or asks for pricing/details but doesn't immediately buy, score as 'Warm' (70-89).
    - If the customer is polite but non-committal, score as 'Nurture' (40-69).
    - If the customer says they are not interested, is rude, hangs up immediately, or if the conversation has only the greeting without customer response, score as 'Cold' (0-39).
    
    Transcript:
    {transcript}
    """
    
    interest_score = 50
    buying_intent = 50
    admission_probability = 30
    conversion_probability = 40
    lead_category = "Nurture"
    sentiment = "neutral"
    summary = "Call completed."
    objections = "none"
    callback_time = ""
    recommended_action = "Follow up via phone call."
    
    try:
        raw_json_str = generate_text(prompt)
        report_data = extract_and_parse_json(raw_json_str)
        
        interest_score = int(report_data.get("interest_score", interest_score))
        buying_intent = int(report_data.get("buying_intent", buying_intent))
        admission_probability = int(report_data.get("admission_probability", admission_probability))
        conversion_probability = int(report_data.get("conversion_probability", conversion_probability))
        lead_category = str(report_data.get("lead_category", lead_category))
        sentiment = str(report_data.get("sentiment", sentiment))
        summary = str(report_data.get("summary", summary))
        objections = str(report_data.get("objections", objections))
        callback_time = str(report_data.get("callback_time", callback_time))
        recommended_action = str(report_data.get("recommended_action", recommended_action))
    except Exception as e:
        logger.error(f"Failed to generate post-call report: {e}")
        
    session_record.summary = summary
    session_record.sentiment = sentiment
    session_record.interest_score = interest_score
    session_record.buying_intent = buying_intent
    session_record.admission_probability = admission_probability
    session_record.conversion_probability = conversion_probability
    session_record.lead_category = lead_category
    session_record.objections = objections
    session_record.callback_time = callback_time
    
    # Save lead outcomes if linked
    if session_record.lead_id:
        lead = db.query(Lead).filter(Lead.id == session_record.lead_id).first()
        if lead:
            lead.status = "interested" if interest_score >= 70 else "not_interested" if interest_score <= 39 else "follow_up_required"
            lead.interest_level = lead_category
            lead.buying_intent = buying_intent
            lead.admission_probability = admission_probability
            lead.conversion_probability = conversion_probability
            lead.callback_time = callback_time
            lead.recommended_action = recommended_action
            
            # Trigger automatic WhatsApp follow-up if lead interest score exceeds AI Agent threshold
            whatsapp_sent = 0
            if session_record.campaign_id:
                campaign = db.query(Campaign).filter(Campaign.id == session_record.campaign_id).first()
                if campaign:
                    agent = db.query(AIAgent).filter(AIAgent.id == campaign.agent_id).first()
                    if agent and interest_score >= agent.whatsapp_threshold:
                        logger.info(f"🚀 Lead Score {interest_score} exceeds agent threshold {agent.whatsapp_threshold}. Triggering auto-WhatsApp brochure...")
                        whatsapp_sent = 1
                        log_msg = WhatsAppLog(
                            lead_id=lead.id,
                            phone=lead.phone,
                            message_type="Brochure",
                            content=f"Hello {lead.name}, thank you for showing interest in our packages. Here is our product brochure."
                        )
                        db.add(log_msg)
            session_record.whatsapp_sent = whatsapp_sent

    db.commit()
    return {
        "session_id": session_id,
        "status": "completed",
        "interest_score": interest_score,
        "buying_intent": buying_intent,
        "admission_probability": admission_probability,
        "conversion_probability": conversion_probability,
        "lead_category": lead_category,
        "summary": summary,
        "objections": objections,
        "callback_time": callback_time,
        "whatsapp_sent": session_record.whatsapp_sent
    }


# ==================== WEBSOCKET LIVE VOICE ENGINE ====================
@router.websocket("/voice-agent/live")
async def voice_agent_live(websocket: WebSocket):
    await websocket.accept()
    session_id = websocket.query_params.get("session_id")
    if not session_id:
        await websocket.send_json({"error": "Missing session_id"})
        await websocket.close()
        return

    from config.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(select(CallSession).filter(CallSession.session_id == session_id))
        session_record = result.scalars().first()
        if not session_record:
            await websocket.send_json({"error": "Session not found"})
            await websocket.close()
            return
        owner_id = None
        if session_record.lead_id:
            lead_res = await db.execute(select(Lead).filter(Lead.id == session_record.lead_id))
            lead = lead_res.scalars().first()
            if lead:
                owner_id = lead.user_id
        if not owner_id and session_record.campaign_id:
            campaign_res = await db.execute(select(Campaign).filter(Campaign.id == session_record.campaign_id))
            campaign = campaign_res.scalars().first()
            if campaign:
                owner_id = campaign.user_id
                
        profile = None
        if owner_id:
            profile_res = await db.execute(select(CompanyProfile).filter(CompanyProfile.user_id == owner_id))
            profile = profile_res.scalars().first()
            
        if not profile:
            profile = CompanyProfile(
                name="Saadhyam AI",
                description="AI Assistant Studio",
                services="Voice agent setup, digital marketing",
                offers="Free trial",
                summary="A digital voice assistant service."
            )

        agent_prompt = None
        agent_voice_id = None
        agent_name = "Swetha"
        company_name = "Saadhyam AI"
        if session_record.campaign_id:
            campaign_res = await db.execute(select(Campaign).filter(Campaign.id == session_record.campaign_id))
            campaign = campaign_res.scalars().first()
            if campaign:
                agent_res = await db.execute(select(AIAgent).filter(AIAgent.id == campaign.agent_id))
                agent = agent_res.scalars().first()
                if agent:
                    agent_prompt = agent.prompt
                    agent_voice_id = agent.voice_id
                    agent_name = agent.name
                    extracted_company = extract_company_name_from_prompt(agent.prompt)
                    if extracted_company and extracted_company.lower() != "voice agent":
                        company_name = extracted_company

        lead_language = "te"
        lead_name = "కస్టమర్"
        lead_phone = ""
        lead_city = ""
        lead_info = ""
        if session_record.lead_id:
            lead_res = await db.execute(select(Lead).filter(Lead.id == session_record.lead_id))
            lead = lead_res.scalars().first()
            if lead:
                if lead.language:
                    lead_language = lead.language
                if lead.name:
                    lead_name = lead.name
                if lead.phone:
                    lead_phone = lead.phone
                if lead.city:
                    lead_city = lead.city
                lead_info = (
                    f"\n\n[CUSTOMER CRM DEMOGRAPHICS]\n"
                    f"Customer Name: {lead_name}\n"
                    f"Customer Phone: {lead_phone}\n"
                    f"Customer Location/City: {lead_city or 'Unknown'}\n"
                    f"Student Class (if applicable): {lead.student_class or 'Unknown'}\n"
                    f"Budget (if applicable): {lead.budget or 'Unknown'}\n"
                    f"Interest Level: {lead.interest_level or 'Cold'}\n"
                )

        profile_name = profile.name
        if profile_name == "Saadhyam AI" and agent_prompt:
            extracted = extract_company_name_from_prompt(agent_prompt)
            if extracted and extracted.lower() != "voice agent":
                profile_name = extracted

        company_context = (
            f"\n\n[COMPANY INFORMATION]\n"
            f"Company Name: {profile_name}\n"
            f"Services Provided: {profile.services or 'Voice agent, digital marketing'}\n"
            f"Offers & Packages: {profile.offers or 'Free Consultation, Basic Package, Premium Package'}\n"
            f"Description: {profile.description or ''}\n"
        )

        if not agent_prompt:
            company_name_telugu = "సాధ్యం ఐ" if company_name.lower() == "saadhyam ai" else company_name
            if lead_language == "te":
                system_prompt = f""" నువ్వు '{company_name_telugu}' తరపున మాట్లాడే తెలుగు వాయిస్ అసిస్టెంట్వి. రోజువారీ మాట్లాడే తెలుగులో మాట్లాడు. చిన్న వాక్యాలు వాడు. """
            elif lead_language == "hi":
                system_prompt = f""" आप '{company_name}' की तरफ से बात करने वाले हिंदी वॉयस असिस्टेंट हैं। सामान्य बातचीत वाली हिंदी बोलें। छोटे वाक्यों का प्रयोग करें। """
            else:
                system_prompt = f""" You are the English voice assistant for '{company_name}'. Speak in clear, professional English. Use short sentences. """
        else:
            system_prompt = agent_prompt

        system_prompt += company_context
        if lead_info:
            system_prompt += lead_info

        if lead_language == "te":
            telugu_voice_id = os.getenv("ELEVENLABS_TELUGU_VOICE_ID", "EMxdghWQV7gqV33j4J3F")
            is_male = telugu_voice_id in ["2DRBj9T2XZ7Jmkcm6WCZ", "EMxdghWQV7gqV33j4J3F", "TX3LPaxmHKxFdv7VOQHJ"] or os.getenv("ELEVENLABS_TELUGU_VOICE_GENDER", "male").lower() == "male"
            voice_tone = "male tone (aged 25-30)" if is_male else "female tone (aged 20-25)"

            sales_directive = (
                "\n\n[SALES DIRECTIVE]\n"
                "నీ ముఖ్య ఉద్దేశ్యం మన కంపెనీ సేవలు (Services) మరియు ప్యాకేజీలను (Packages) కస్టమర్‌కి వివరించి, వాటిని కొనేలా ప్రోత్సహించడం. "
                "కస్టమర్ తమ అవసరాలు చెప్పిన తర్వాత, మన వద్ద ఉన్న ప్యాకేజీలను వారి ముందు ఉంచి, వాటిని ఒక ప్యాకేజీని ఎంచుకోమని అడుగు (ఉదాహరణకు: 'ఈ ప్యాకేజీలలో మీరు ఏది తీసుకుంటారు?'). "
                "సంభాషణను ఎప్పుడూ ప్యాకేజీల అమ్మకం పైనే ఉంచు. కస్టమర్ వ్యాపారం గురించి లోతుగా వెళ్లకుండా మన ప్యాకేజీలపై శ్రద్ధ చూపించు."
            )
            system_prompt += (
                "\n\n[CRITICAL DIRECTIVE]\n"
                "You MUST respond ONLY in Telugu script (తెలుగు లిపి). Do not write or speak in English script or Hindi.\n"
                "TONE & STYLE GUIDELINES:\n"
                f"- Speak in a calm, polite, respectful, and warm South Indian {voice_tone}.\n"
                "- Use natural, casual, and conversational spoken Telugu (వాడుక భాష/రోజువారీ మాట్లాడే తెలుగు) used on daily phone calls. Avoid bookish, formal, grammatical, or highly sanskritized Telugu vocabulary.\n"
                "- Use common English loanwords written in Telugu script (Teenglish) where appropriate, as they sound more natural to modern speakers than pure Telugu words (e.g. use 'ఇంట్రెస్ట్/ఇంట్రెస్టెడ్' instead of 'ఆసక్తి', 'కాల్' instead of 'ఫోన్ పిలుపు/సంభాషణ', 'సర్వీసెస్' instead of 'సేవలు', 'ప్యాకేజీ' instead of 'పథకం/ప్యాకేజీలు').\n"
                "- Keep your response short, friendly, calm, and limited to 1 or 2 sentences max.\n"
                f"- CRITICAL PROFILE: You already know the customer's name ({lead_name}) and phone number ({lead_phone}). DO NOT ask the customer for their name or phone number.\n"
                f"- NAME DIRECTIVE: కస్టమర్ పేరును ({lead_name}) కేవలం మొదటి పలకరింపులో మరియు కాల్ చివరి ముగింపు సంభాషణలో మాత్రమే ఉపయోగించు.\n"
                "- RE-INTRODUCTION DIRECTIVE: నువ్వు ఇప్పటికే పరిచయం చేసుకున్నావు. మళ్లీ పరిచయం చేసుకోకు.\n"
                + sales_directive
            )
        elif lead_language == "hi":
            sales_directive = (
                "\n\n[SALES DIRECTIVE]\n"
                "आपका मुख्य लक्ष्य ग्राहक को हमारे पैकेजों और सेवाओं के बारे में बताना और उन्हें बेचना है। "
                "ग्राहक से पूछें कि वे कौन सा पैकेज चुनेंगे। बातचीत को पैकेजों की बिक्री पर केंद्रित रखें।"
            )
            system_prompt += (
                "\n\n[CRITICAL DIRECTIVE]\n"
                "You MUST respond ONLY in Hindi script. Do not write or speak in English or Telugu. "
                "Keep your response short and limited to 1 or 2 sentences max.\n"
                f"You already know the customer's name ({lead_name}) and phone number ({lead_phone}). DO NOT ask them for their name or phone.\n"
                f"- NAME DIRECTIVE: ग्राहक का नाम ({lead_name}) केवल पहली बार स्वागत करते समय और कॉल समाप्त करते समय कहें।\n"
                "- RE-INTRODUCTION DIRECTIVE: आपने पहले ही परिचय दे दिया है। दोबारा परिचय न दें।\n"
                + sales_directive
            )
        else:
            sales_directive = (
                "\n\n[SALES DIRECTIVE]\n"
                "Your main goal is to pitch our services and packages. Explain the offers, present options, "
                "and guide the user to select a package. Keep the discussion sales-oriented."
            )
            system_prompt += (
                "\n\n[CRITICAL DIRECTIVE]\n"
                "You MUST respond ONLY in English. Keep your response short and limited to 1 or 2 sentences max.\n"
                f"You already know the customer's name ({lead_name}) and phone number ({lead_phone}). DO NOT ask them for their name or phone.\n"
                f"- NAME DIRECTIVE: Only use the customer's name ({lead_name}) in the initial greeting and the final call-ending response.\n"
                "- RE-INTRODUCTION DIRECTIVE: Do not repeat your introduction.\n"
                + sales_directive
            )

        system_prompt += (
            "\n\n[CRITICAL OUTPUT FORMATTING DIRECTIVE]\n"
            "You are in a live voice call. You MUST NOT output any chain-of-thought, planning steps, reasoning processes, "
            "or internal commentary. Output ONLY the direct response to the customer. Do not write any thinking process."
        )

        if not GEMINI_API_KEY:
            await websocket.send_json({"error": "Gemini API key is missing. Configure GEMINI_API_KEY."})
            await websocket.close()
            return

        gemini_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={GEMINI_API_KEY}"
        logger.info("Connecting to Gemini Live WebSocket proxy...")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(gemini_url) as gemini_ws:
                    setup_msg = {
                        "setup": {
                            "model": "models/gemini-2.5-flash-native-audio-latest",
                            "generationConfig": {
                                "responseModalities": ["AUDIO"],
                                "thinkingConfig": {
                                    "thinkingBudget": 0
                                },
                                "speechConfig": {
                                    "voiceConfig": {
                                        "prebuiltVoiceConfig": {
                                            "voiceName": "Kore"
                                        }
                                    }
                                }
                            },
                            "inputAudioTranscription": {},
                            "outputAudioTranscription": {},
                            "systemInstruction": {
                                "parts": [{"text": system_prompt}]
                            }
                        }
                    }
                    await gemini_ws.send_json(setup_msg)
                    logger.info("Gemini Live API Setup Completed.")

                    user_utt_buffer = []
                    ai_utt_buffer = []
                    transcription_state = {
                        "current_user_utt": "",
                        "current_ai_utt": ""
                    }

                    async def client_to_gemini():
                        try:
                            while True:
                                message = await websocket.receive()
                                if "bytes" in message:
                                    audio_bytes = message["bytes"]
                                    base64_data = base64.b64encode(audio_bytes).decode("utf-8")
                                    input_msg = {
                                        "realtimeInput": {
                                            "mediaChunks": [
                                                {
                                                    "mimeType": "audio/pcm",
                                                    "data": base64_data
                                                }
                                            ]
                                        }
                                    }
                                    await gemini_ws.send_json(input_msg)
                                elif "text" in message:
                                    text_data = message["text"]
                                    try:
                                        js_data = json.loads(text_data)
                                        if js_data.get("type") == "user_transcript":
                                            user_txt = js_data.get("text", "")
                                            if user_txt and user_txt not in user_utt_buffer:
                                                user_utt_buffer.append(user_txt)
                                        elif js_data.get("type") == "end_call":
                                            break
                                        elif "text" in js_data:
                                            input_msg = {
                                                "clientContent": {
                                                    "turns": [
                                                        {
                                                            "role": "user",
                                                            "parts": [{"text": js_data["text"]}]
                                                        }
                                                    ],
                                                    "turnComplete": True
                                                }
                                            }
                                            await gemini_ws.send_json(input_msg)
                                    except Exception as e:
                                        logger.warning(f"Could not parse client text message: {e}")
                                elif message.get("type") == "websocket.disconnect":
                                    break
                        except Exception as e:
                            logger.error(f"Error in client_to_gemini task: {e}")

                    async def gemini_to_client():
                        try:
                            async for msg in gemini_ws:
                                if msg.type in (aiohttp.WSMsgType.TEXT, aiohttp.WSMsgType.BINARY):
                                    data_str = msg.data if msg.type == aiohttp.WSMsgType.TEXT else msg.data.decode("utf-8")
                                    data = json.loads(data_str)
                                    server_content = data.get("serverContent")
                                    if server_content:
                                        input_trans = server_content.get("inputTranscription")
                                        if input_trans:
                                            user_text = input_trans.get("text", "")
                                            if user_text:
                                                if transcription_state["current_ai_utt"].strip():
                                                    ai_utt_buffer.append(transcription_state["current_ai_utt"].strip())
                                                    transcription_state["current_ai_utt"] = ""
                                                transcription_state["current_user_utt"] += user_text
                                                await websocket.send_json({
                                                    "type": "user_text",
                                                    "text": user_text
                                                })

                                        output_trans = server_content.get("outputTranscription")
                                        if output_trans:
                                            ai_text = output_trans.get("text", "")
                                            if ai_text:
                                                if transcription_state["current_user_utt"].strip():
                                                    user_utt_buffer.append(transcription_state["current_user_utt"].strip())
                                                    transcription_state["current_user_utt"] = ""
                                                transcription_state["current_ai_utt"] += ai_text
                                                await websocket.send_json({
                                                    "type": "text",
                                                    "text": ai_text
                                                })

                                        model_turn = server_content.get("modelTurn")
                                        if model_turn:
                                            parts = model_turn.get("parts", [])
                                            for part in parts:
                                                inline_data = part.get("inlineData")
                                                if inline_data and inline_data.get("mimeType", "").startswith("audio/pcm"):
                                                    await websocket.send_json({
                                                        "type": "audio",
                                                        "data": inline_data["data"]
                                                    })

                                        if server_content.get("turnComplete"):
                                            if transcription_state["current_user_utt"].strip():
                                                user_utt_buffer.append(transcription_state["current_user_utt"].strip())
                                                transcription_state["current_user_utt"] = ""
                                            if transcription_state["current_ai_utt"].strip():
                                                ai_utt_buffer.append(transcription_state["current_ai_utt"].strip())
                                                transcription_state["current_ai_utt"] = ""
                                            await websocket.send_json({"type": "turnComplete"})

                                        if server_content.get("interrupted"):
                                            if transcription_state["current_ai_utt"].strip():
                                                ai_utt_buffer.append(transcription_state["current_ai_utt"].strip() + " [interrupted]")
                                                transcription_state["current_ai_utt"] = ""
                                            await websocket.send_json({"type": "interrupted"})
                                elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                                    break
                        except Exception as e:
                            logger.error(f"Error in gemini_to_client task: {e}")

                    client_task = asyncio.create_task(client_to_gemini())
                    gemini_task = asyncio.create_task(gemini_to_client())
                    done, pending = await asyncio.wait(
                        [client_task, gemini_task],
                        return_when=asyncio.FIRST_COMPLETED
                    )
                    for task in pending:
                        task.cancel()

                    if transcription_state["current_user_utt"].strip():
                        user_utt_buffer.append(transcription_state["current_user_utt"].strip())
                    if transcription_state["current_ai_utt"].strip():
                        ai_utt_buffer.append(transcription_state["current_ai_utt"].strip())

                    if user_utt_buffer or ai_utt_buffer:
                        transcript_str = "\n[LIVE CALL TRANSCRIPT]\n"
                        min_len = min(len(user_utt_buffer), len(ai_utt_buffer))
                        for u, a in zip(user_utt_buffer, ai_utt_buffer):
                            transcript_str += f"Customer: {u}\nAI: {a}\n"
                        for u in user_utt_buffer[min_len:]:
                            transcript_str += f"Customer: {u}\n"
                        for a in ai_utt_buffer[min_len:]:
                            transcript_str += f"AI: {a}\n"
                        
                        # Re-connect to database using sync to save final transcript
                        from config.database import SyncSessionLocal
                        with SyncSessionLocal() as sync_db:
                            session_rec = sync_db.query(CallSession).filter(CallSession.session_id == session_id).first()
                            if session_rec:
                                session_rec.transcript += transcript_str
                                sync_db.commit()
                        logger.info("Saved final WebSocket live transcript to database.")

        except WebSocketDisconnect:
            logger.info(f"WebSocket connection disconnected for Session: {session_id}")
        except Exception as e:
            logger.error(f"WebSocket error in voice_agent_live: {e}")
            try:
                await websocket.send_json({"error": str(e)})
            except:
                pass


# ==================== EXOTEL WEBSOCKET & WEBHOOK ENDPOINTS ====================
@router.websocket("/voice-agent/stream/{call_id}")
async def exotel_stream_endpoint(websocket: WebSocket, call_id: int):
    """
    WebSocket endpoint for Exotel's bidirectional audio streaming
    Connects Exotel phone line audio to Deepgram STT, Gemini Live context, and ElevenLabs TTS
    """
    await websocket.accept()
    logger.info(f"🟢 Exotel WS stream connection accepted for Call ID: {call_id}")
    try:
        from services.streaming_handler import ExotelStreamHandler
        handler = ExotelStreamHandler(websocket, call_id)
        initialized = await handler.initialize()
        if not initialized:
            logger.error(f"❌ Failed to initialize ExotelStreamHandler for Call ID: {call_id}")
            await websocket.close()
            return
            
        # Start Deepgram speech-to-text task
        await handler.start_deepgram_stt()
        
        # Stream the initial greeting to caller in the background (non-blocking)
        asyncio.create_task(handler.speak_greeting())
        
        # Manage bidirectional streaming (receive caller audio -> Deepgram -> Gemini -> ElevenLabs -> send audio)
        await handler.handle_exotel_media()
        
    except WebSocketDisconnect:
        logger.info(f"🔌 Exotel WebSocket disconnected for Call ID: {call_id}")
    except Exception as e:
        logger.error(f"❌ Exotel WebSocket stream error: {e}")
        try:
            await websocket.close()
        except:
            pass


@router.post("/voice-agent/webhooks/exotel-status")
async def exotel_status_callback(
    request: Request = None,
    db: Session = Depends(get_db_sync)
):
    """
    Exotel status callback webhook. Updates Call status and triggers next calls in the queue.
    """
    from fastapi import Request
    try:
        form_data = await request.form()
        call_sid = form_data.get("CallSid")
        status = form_data.get("Status")
        duration = form_data.get("Duration")
        
        logger.info(f"📞 Received Exotel Status Callback: CallSid={call_sid}, Status={status}, Duration={duration}")
        
        if call_sid:
            from models.voice_agent import VoiceCall, CallStatus, VoiceCampaign
            call = db.query(VoiceCall).filter(VoiceCall.call_sid == call_sid).first()
            if call:
                if status == "completed":
                    call.status = CallStatus.COMPLETED
                    if duration:
                        call.duration = int(duration)
                elif status in ["failed", "busy", "no-answer", "canceled"]:
                    call.status = CallStatus.FAILED
                    call.call_outcome = status
                
                db.commit()
                logger.info(f"✅ Exotel Call {call.id} status updated in DB to {call.status}")
                
                # Chain next call sequentially in campaign
                if status in ["completed", "failed", "busy", "no-answer", "canceled"]:
                    from services.voice_call_queue_service import voice_call_queue_service
                    import threading
                    def _process_next():
                        db2 = next(get_db_sync())
                        try:
                            campaign = db2.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id).first()
                            if campaign and campaign.status.value == "active":
                                next_call = voice_call_queue_service.get_next_queued_call(db2, campaign.id)
                                if next_call:
                                    logger.info(f"🔄 Triggering next sequential campaign call ID: {next_call.id}")
                                    voice_call_queue_service.process_call(db2, next_call.id)
                        except Exception as ex:
                            logger.error(f"❌ Webhook failed to chain next call: {ex}")
                        finally:
                            db2.close()
                    threading.Thread(target=_process_next, daemon=True).start()
                    
        return {"status": "success"}
    except Exception as e:
        logger.error(f"❌ Exotel webhook parsing failed: {e}")
        return {"status": "error", "message": str(e)}


# ==================== TWILIO CALL START, STREAM & STATUS WEBHOOKS ====================
@router.post("/voice-agent/webhooks/twilio-call-start/{call_id}")
async def twilio_call_start(call_id: int):
    """
    Returns TwiML instructions directing Twilio to establish a media stream
    connection back to our WebSocket server.
    """
    from fastapi import Response
    from config.settings import settings
    
    backend_url = settings.EXOTEL_STREAM_URL or settings.BACKEND_URL
    base = backend_url.strip()
    if base.endswith("/"):
        base = base[:-1]
        
    # Convert http/https to ws/wss
    if base.startswith("https://"):
        base = base.replace("https://", "wss://")
    elif base.startswith("http://"):
        base = base.replace("http://", "ws://")
    elif not base.startswith("ws://") and not base.startswith("wss://"):
        base = f"wss://{base}"
        
    stream_url = f"{base}/api/voice-agent/twilio-stream/{call_id}"
    logger.info(f"Generating TwiML payload pointing Twilio caller to stream: {stream_url}")
    
    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{stream_url}" />
    </Connect>
</Response>
"""
    return Response(content=twiml_response, media_type="application/xml")


@router.websocket("/voice-agent/twilio-stream/{call_id}")
async def twilio_stream_endpoint(websocket: WebSocket, call_id: int):
    """
    WebSocket endpoint for Twilio Media Streams (real-time mu-law audio connection).
    """
    await websocket.accept()
    logger.info(f"🟢 Twilio WS stream connection accepted for Call ID: {call_id}")
    try:
        from services.streaming_handler import TwilioStreamHandler
        handler = TwilioStreamHandler(websocket, call_id)
        initialized = await handler.initialize()
        if not initialized:
            logger.error(f"❌ Failed to initialize TwilioStreamHandler for Call ID: {call_id}")
            await websocket.close()
            return
            
        # Start Deepgram STT (mulaw)
        await handler.start_deepgram_stt()
        
        # Manage audio streams
        await handler.handle_twilio_media()
        
    except WebSocketDisconnect:
        logger.info(f"🔌 Twilio WebSocket disconnected for Call ID: {call_id}")
    except Exception as e:
        logger.error(f"❌ Twilio WebSocket stream error: {e}")
        try:
            await websocket.close()
        except:
            pass


@router.post("/voice-agent/webhooks/twilio-status")
async def twilio_status_callback(
    request: Request = None,
    db: Session = Depends(get_db_sync)
):
    """
    Twilio call status updates webhook. Triggers sequential call chaining.
    """
    from fastapi import Request
    try:
        form_data = await request.form()
        call_sid = form_data.get("CallSid")
        status = form_data.get("CallStatus")
        duration = form_data.get("CallDuration")
        
        logger.info(f"📞 Received Twilio Status Callback: CallSid={call_sid}, Status={status}, Duration={duration}")
        
        if call_sid:
            from models.voice_agent import VoiceCall, CallStatus, VoiceCampaign
            call = db.query(VoiceCall).filter(VoiceCall.call_sid == call_sid).first()
            if call:
                if status == "completed":
                    call.status = CallStatus.COMPLETED
                    if duration:
                        call.duration = int(duration)
                        
                        # Calculate minutes rounded up: e.g. 5 seconds -> 1 min; 65 seconds -> 2 mins.
                        dur_secs = int(duration)
                        minutes = (dur_secs + 59) // 60 if dur_secs > 0 else 0
                        charge_per_minute = 8.00
                        total_charge = minutes * charge_per_minute
                        
                        if total_charge > 0:
                            # Fetch campaign and user to deduct the balance
                            campaign = db.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id).first()
                            if campaign:
                                user = db.query(User).filter(User.id == campaign.user_id).first()
                                if user:
                                    user.wallet_balance = max(0.00, user.wallet_balance - total_charge)
                                    logger.info(f"💰 Deducted ₹{total_charge:.2f} from User {user.id} wallet for {minutes} min call. New Balance: ₹{user.wallet_balance:.2f}")
                elif status in ["failed", "busy", "no-answer", "canceled"]:
                    call.status = CallStatus.FAILED
                    call.call_outcome = status
                
                db.commit()
                logger.info(f"✅ Twilio Call {call.id} status updated in DB to {call.status}")
                
                # Chain next call sequentially in campaign
                if status in ["completed", "failed", "busy", "no-answer", "canceled"]:
                    from services.voice_call_queue_service import voice_call_queue_service
                    import threading
                    def _process_next():
                        db2 = next(get_db_sync())
                        try:
                            campaign = db2.query(VoiceCampaign).filter(VoiceCampaign.id == call.campaign_id).first()
                            if campaign and campaign.status.value == "active":
                                next_call = voice_call_queue_service.get_next_queued_call(db2, campaign.id)
                                if next_call:
                                    logger.info(f"🔄 Triggering next sequential campaign call ID: {next_call.id}")
                                    voice_call_queue_service.process_call(db2, next_call.id)
                        except Exception as ex:
                            logger.error(f"❌ Webhook failed to chain next call: {ex}")
                        finally:
                            db2.close()
                    threading.Thread(target=_process_next, daemon=True).start()
                    
        return {"status": "success"}
    except Exception as e:
        logger.error(f"❌ Twilio webhook parsing failed: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/voice-agent/leads/{lead_id}/call-real")
def trigger_real_lead_call(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Bridge route: Triggers a real outbound phone call (Twilio/Exotel) for a lead
    by auto-provisioning the required VoiceCampaign, VoiceContact, and VoiceCall records.
    """
    # 1. User Permissions Check
    if not current_user.is_active or current_user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User account is inactive or suspended."
        )

    # 2. Wallet Balance Check
    MINIMUM_BALANCE = 100.00
    if current_user.wallet_balance < MINIMUM_BALANCE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient wallet balance. Minimum required is ₹{MINIMUM_BALANCE:.2f}, but current balance is ₹{current_user.wallet_balance:.2f}."
        )

    # 3. Active Twilio Number Check
    from services.twilio_service import twilio_service
    from config.settings import settings
    
    # Resolve Caller ID (leased phone number, falling back to server default)
    from_number = current_user.leased_phone_number or settings.TWILIO_PHONE_NUMBER

    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and not from_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active Twilio dialer number configured. Please lease/buy a Twilio phone number first."
        )
        
    # 4. Fetch Lead
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.user_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    # 5. Fetch Campaign details
    campaign_id = lead.campaign_id
    campaign = None
    if campaign_id:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
        
    campaign_name = campaign.name if campaign else "Direct Lead Call"
    campaign_obj = campaign.objective if campaign else "direct inquiry"
    agent_id = campaign.agent_id if campaign else None
    
    # Get AIAgent details
    agent = None
    if agent_id:
        agent = db.query(AIAgent).filter(AIAgent.id == agent_id, AIAgent.user_id == current_user.id).first()
    
    agent_prompt = agent.prompt if agent else "You are Swetha from Saadhyam AI. Greet the user."
    agent_languages = agent.languages if agent else "te,en"
    agent_voice_id = agent.voice_id if agent else "TX3LPaxmHKxFdv7VOQHJ"
    
    # 6. Resolve or Create VoiceCampaign (legacy model)
    from models.voice_agent import VoiceCampaign, VoiceContact, VoiceCall, Language, CampaignStatus, CallStatus
    
    voice_campaign = db.query(VoiceCampaign).filter(VoiceCampaign.name == campaign_name).first()
    if not voice_campaign:
        lang = Language.ENGLISH
        if lead.language:
            lead_lang_lower = lead.language.lower()
            if "te" in lead_lang_lower:
                lang = Language.TELUGU
            elif "hi" in lead_lang_lower:
                lang = Language.HINDI
            elif "ta" in lead_lang_lower:
                lang = Language.TAMIL
                
        voice_campaign = VoiceCampaign(
            name=campaign_name,
            description=campaign_obj,
            user_id=current_user.id,
            language=lang,
            script_template=agent_prompt,
            status=CampaignStatus.ACTIVE
        )
        db.add(voice_campaign)
        db.commit()
        db.refresh(voice_campaign)
    else:
        # Check campaign ownership permissions
        if voice_campaign.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not have permission to trigger calls for this campaign."
            )

    # 7. Campaign limits / Rate limits check (Max 5 concurrent calls per campaign)
    concurrent_calls = db.query(VoiceCall).filter(
        VoiceCall.campaign_id == voice_campaign.id,
        VoiceCall.status.in_([CallStatus.CALLING, CallStatus.CONNECTED])
    ).count()
    if concurrent_calls >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campaign concurrency limit reached. Maximum of 5 concurrent calls is allowed per campaign. Currently active: {concurrent_calls}."
        )

    # 8. Resolve or Create VoiceContact (legacy model)
    voice_contact = db.query(VoiceContact).filter(
        and_(
            VoiceContact.campaign_id == voice_campaign.id,
            VoiceContact.phone_number == lead.phone
        )
    ).first()
    if not voice_contact:
        voice_contact = VoiceContact(
            campaign_id=voice_campaign.id,
            name=lead.name,
            phone_number=lead.phone,
            is_active=True,
            is_completed=False
        )
        db.add(voice_contact)
        db.commit()
        db.refresh(voice_contact)
        
    # 9. Create VoiceCall record
    voice_call = VoiceCall(
        campaign_id=voice_campaign.id,
        contact_id=voice_contact.id,
        phone_number=lead.phone,
        status=CallStatus.PENDING
    )
    db.add(voice_call)
    db.commit()
    db.refresh(voice_call)
    
    # 10. Trigger Twilio or Exotel call
    from services.exotel_service import exotel_service
    
    has_twilio = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and from_number)
    has_exotel = bool(settings.EXOTEL_SID and settings.EXOTEL_API_KEY and settings.EXOPHONE_NUMBER)
    
    if has_twilio:
        voice_call.status = CallStatus.CALLING
        db.commit()
        res = twilio_service.trigger_outbound_call(lead.phone, voice_call.id, from_number=from_number)
        if res["success"]:
            voice_call.call_sid = res["exotel_call_sid"]
            
            # Create CallSession record for CRM / history compatibility
            session_record = CallSession(
                session_id=res["exotel_call_sid"],
                status="calling",
                lead_id=lead.id,
                campaign_id=campaign.id if campaign else None
            )
            db.add(session_record)
            
            # Update Lead status to called
            lead.status = "called"
            
            db.commit()
            return {"success": True, "call_id": voice_call.id, "provider": "twilio", "call_sid": res["exotel_call_sid"], "from_number": from_number}
        else:
            voice_call.status = CallStatus.FAILED
            voice_call.call_outcome = "failed_trigger"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Twilio call failed: {res['message']}")
            
    elif has_exotel:
        voice_call.status = CallStatus.CALLING
        db.commit()
        res = exotel_service.trigger_outbound_call(lead.phone, voice_call.id)
        if res["success"]:
            voice_call.call_sid = res["exotel_call_sid"]
            
            # Create CallSession record for CRM / history compatibility
            session_record = CallSession(
                session_id=res["exotel_call_sid"],
                status="calling",
                lead_id=lead.id,
                campaign_id=campaign.id if campaign else None
            )
            db.add(session_record)
            
            # Update Lead status to called
            lead.status = "called"
            
            db.commit()
            return {"success": True, "call_id": voice_call.id, "provider": "exotel", "call_sid": res["exotel_call_sid"]}
        else:
            voice_call.status = CallStatus.FAILED
            voice_call.call_outcome = "failed_trigger"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Exotel call failed: {res['message']}")
            
    else:
        raise HTTPException(
            status_code=400, 
            detail="No calling credentials (Twilio/Exotel) configured on the backend. Please setup credentials in settings or buy a Twilio number."
        )


# ==================== BILLING ENDPOINTS ====================

@router.post("/voice-agent/billing/topup")
def topup_balance(
    data: TopupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    
    if current_user not in db:
        current_user = db.merge(current_user)
        
    current_user.wallet_balance += data.amount
    db.commit()
    db.refresh(current_user)
    
    if data.payment_id:
        logger.info(f"💰 Wallet top-up of ${data.amount:.2f} for User {current_user.id} verified via Razorpay ID: {data.payment_id}")
    else:
        logger.info(f"💰 Wallet top-up of ${data.amount:.2f} for User {current_user.id} (Manual recharge)")
        
    return {
        "message": f"Successfully recharged ${data.amount:.2f}",
        "wallet_balance": current_user.wallet_balance
    }


@router.get("/voice-agent/billing/numbers/search")
def search_numbers(
    area_code: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    from services.twilio_service import twilio_service
    try:
        if not twilio_service.account_sid or not twilio_service.auth_token:
            logger.info("Twilio credentials missing, returning mock numbers for search.")
            mock_numbers = [
                {"phone_number": f"+1{area_code or '650'}5550101", "friendly_name": f"({area_code or '650'}) 555-0101", "region": "CA", "iso_country": "US"},
                {"phone_number": f"+1{area_code or '650'}5550102", "friendly_name": f"({area_code or '650'}) 555-0102", "region": "CA", "iso_country": "US"},
                {"phone_number": f"+1{area_code or '650'}5550103", "friendly_name": f"({area_code or '650'}) 555-0103", "region": "CA", "iso_country": "US"},
            ]
            return mock_numbers
        
        kwargs = {}
        if area_code:
            kwargs["area_code"] = area_code
        
        numbers = twilio_service.client.available_phone_numbers('US').local.list(limit=10, **kwargs)
        result = []
        for num in numbers:
            result.append({
                "phone_number": num.phone_number,
                "friendly_name": num.friendly_name,
                "region": num.region,
                "iso_country": num.iso_country
            })
        return result
    except Exception as e:
        logger.error(f"Error searching Twilio numbers: {e}")
        mock_numbers = [
            {"phone_number": f"+1{area_code or '650'}5550101", "friendly_name": f"({area_code or '650'}) 555-0101", "region": "CA", "iso_country": "US"},
            {"phone_number": f"+1{area_code or '650'}5550102", "friendly_name": f"({area_code or '650'}) 555-0102", "region": "CA", "iso_country": "US"},
            {"phone_number": f"+1{area_code or '650'}5550103", "friendly_name": f"({area_code or '650'}) 555-0103", "region": "CA", "iso_country": "US"},
        ]
        return mock_numbers


@router.post("/voice-agent/billing/numbers/buy")
def buy_number(
    data: NumberBuyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    from services.twilio_service import twilio_service
    REGISTRATION_COST = 250.00
    
    if current_user.wallet_balance < REGISTRATION_COST:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Leasing a number costs ₹{REGISTRATION_COST:.2f}, but your balance is ₹{current_user.wallet_balance:.2f}."
        )
    
    if current_user not in db:
        current_user = db.merge(current_user)
        
    try:
        if not twilio_service.account_sid or not twilio_service.auth_token:
            logger.info(f"Twilio credentials missing, simulating purchase of {data.phone_number}")
            purchased_number = data.phone_number
        else:
            twiml_url = f"{settings.BACKEND_URL.rstrip('/')}/api/voice-agent/webhooks/twilio-status"
            incoming_number = twilio_service.client.incoming_phone_numbers.create(
                phone_number=data.phone_number,
                voice_url=twiml_url,
                voice_method="POST"
            )
            purchased_number = incoming_number.phone_number
            
        current_user.wallet_balance -= REGISTRATION_COST
        current_user.leased_phone_number = purchased_number
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": f"Successfully purchased {purchased_number}!",
            "leased_phone_number": current_user.leased_phone_number,
            "wallet_balance": current_user.wallet_balance
        }
    except Exception as e:
        logger.error(f"Error buying Twilio number: {e}")
        if settings.ENVIRONMENT == "development" or "test" in settings.ENVIRONMENT:
            current_user.wallet_balance -= REGISTRATION_COST
            current_user.leased_phone_number = data.phone_number
            db.commit()
            db.refresh(current_user)
            return {
                "message": f"Successfully purchased {data.phone_number} (Simulated/Development Mode)!",
                "leased_phone_number": current_user.leased_phone_number,
                "wallet_balance": current_user.wallet_balance
            }
        raise HTTPException(
            status_code=500,
            detail=f"Twilio purchase failed: {str(e)}"
        )




