import logging
import re
import json
import httpx
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from config.settings import settings
from models.user import User
from services.rbac_service import RBACService

logger = logging.getLogger(__name__)

# List of known cities in Telugu and English
CITIES = [
    "విజయవాడ", "హైదరాబాద్", "వైజాగ్", "గుంటూరు", "నెల్లూరు", "తిరుపతి", "విశాఖపట్నం", 
    "బెంగళూరు", "చెన్నై", "వరంగల్", "కర్నూలు", "రాజమండ్రి", "కాకినాడ", "కడప", "అనంతపురం",
    "mumbai", "delhi", "hyderabad", "vijayawada", "vizag", "bangalore", "chennai", "guntur"
]

# Action definitions
ACTION_NAVIGATE = "NAVIGATE"
ACTION_FILTER = "FILTER"
ACTION_OPEN_MODAL = "OPEN_MODAL"
ACTION_GENERATE_DRAFT = "GENERATE_DRAFT"
ACTION_API_CALL = "API_CALL"
ACTION_SET_THEME = "SET_THEME"
ACTION_NO_ACTION = "NO_ACTION"
ACTION_ASK_CONFIRMATION = "ASK_CONFIRMATION"

# Permissions mapping for intents
INTENT_PERMISSIONS = {
    "CREATE_CAMPAIGN": "create_campaign",
    "DELETE_CAMPAIGN": "delete_campaign",
    "DELETE_LEAD": "delete_campaign", # or edit lead
    "OPEN_ANALYTICS": "view_analytics",
    "OPEN_ADMIN_SETTINGS": "manage_settings",
    "DELETE_USER": "manage_users",
    "DISABLE_AGENT": "manage_settings",
    "STOP_CAMPAIGN": "edit_campaign",
    "ARCHIVE_CAMPAIGN": "delete_campaign",
}

def normalize_telugu_command(text: str) -> str:
    """Normalize text by converting to lowercase and stripping punctuation"""
    if not text:
        return ""
    text = text.lower().strip()
    # Strip common Telugu punctuation or filler characters
    text = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?\"\'“”]', '', text)
    return text

def requires_confirmation(intent: str) -> bool:
    """Returns True if the intent represents a dangerous action"""
    dangerous_intents = [
        "DELETE_LEAD",
        "DELETE_CAMPAIGN",
        "SEND_WHATSAPP_MESSAGE",
        "ARCHIVE_CAMPAIGN",
        "STOP_CAMPAIGN",
        "DISABLE_AGENT",
        "DELETE_USER",
        "CHANGE_PRICING",
        "CHANGE_FEATURE_FLAGS",
        "CHANGE_ADMIN_SETTINGS"
    ]
    return intent in dangerous_intents

def check_permission(intent: str, user: User, db: Session) -> bool:
    """Validates user permissions using RBACService"""
    required_permission = INTENT_PERMISSIONS.get(intent)
    if not required_permission:
        # Safe by default if no permission mapped
        return True
    
    # If RBAC is disabled or bypass allowed for testing, return True. Otherwise check.
    try:
        # Check if the user has the permission
        has_perm = RBACService.check_permission(db, user.id, required_permission)
        # Check if user is admin (admin bypasses checks)
        is_admin = any(role.name == "admin" for role in RBACService.get_user_roles(db, user.id))
        return has_perm or is_admin
    except Exception as e:
        logger.warning(f"Permission check failed, allowing by default: {e}")
        return True

def match_rule_based_intent(text: str, current_route: str) -> Optional[Dict[str, Any]]:
    """Match Telugu and English keywords to return structured command JSON"""
    normalized = normalize_telugu_command(text)
    
    # Theme configuration commands
    if any(k in normalized for k in ["డార్క్ మోడ్", "dark mode", "enable dark", "turn on dark", "switch to dark"]):
        return {
            "intent": "SET_DARK_MODE",
            "action": ACTION_SET_THEME,
            "route": None,
            "params": {"theme": "dark"},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "డార్క్ మోడ్ ఆన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["లైట్ మోడ్", "light mode", "enable light", "turn on light", "switch to light"]):
        return {
            "intent": "SET_LIGHT_MODE",
            "action": ACTION_SET_THEME,
            "route": None,
            "params": {"theme": "light"},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "లైట్ మోడ్ ఆన్ చేస్తున్నాను."
        }
        
    # Dangerous actions (Confirmation checks)
    if any(k in normalized for k in ["లీడ్ డిలీట్ చేయి", "ఈ లీడ్ డిలీట్ చేయి", "delete lead", "remove lead", "delete this lead", "remove this lead", "లీడ్ డిలీట్"]):
        return {
            "intent": "DELETE_LEAD",
            "action": ACTION_ASK_CONFIRMATION,
            "route": None,
            "params": {},
            "confidence": 0.9,
            "requiresConfirmation": True,
            "reply_te": "ఈ చర్యకు మీ కన్ఫర్మేషన్ అవసరం."
        }
    if any(k in normalized for k in ["క్యాంపెయిన్ డిలీట్ చేయి", "ఈ క్యాంపెయిన్ డిలీట్ చేయి", "delete campaign", "remove campaign", "delete this campaign", "remove this campaign"]):
        return {
            "intent": "DELETE_CAMPAIGN",
            "action": ACTION_ASK_CONFIRMATION,
            "route": None,
            "params": {},
            "confidence": 0.9,
            "requiresConfirmation": True,
            "reply_te": "ఈ చర్యకు మీ కన్ఫర్మేషన్ అవసరం."
        }
    if any(k in normalized for k in ["వాట్సాప్ మెసేజ్ పంపు", "whatsapp message send", "send whatsapp message", "send whatsapp", "send message", "మెసేజ్ పంపు"]):
        return {
            "intent": "SEND_WHATSAPP_MESSAGE",
            "action": ACTION_ASK_CONFIRMATION,
            "route": None,
            "params": {},
            "confidence": 0.9,
            "requiresConfirmation": True,
            "reply_te": "ఈ చర్యకు మీ కన్ఫర్మేషన్ అవసరం."
        }
    if any(k in normalized for k in ["క్యాంపెయిన్ ఆపు", "క్యాంపెయిన్ స్టాప్", "stop campaign", "pause campaign", "stop this campaign", "pause this campaign", "క్యాంపెయిన్ ఆపివేయి"]):
        return {
            "intent": "STOP_CAMPAIGN",
            "action": ACTION_ASK_CONFIRMATION,
            "route": None,
            "params": {},
            "confidence": 0.9,
            "requiresConfirmation": True,
            "reply_te": "ఈ చర్యకు మీ కన్ఫర్మేషన్ అవసరం."
        }
    if any(k in normalized for k in ["ఏజెంట్ disable", "ఏజెంట్ డిసేబుల్", "disable agent", "deactivate agent", "turn off agent"]):
        return {
            "intent": "DISABLE_AGENT",
            "action": ACTION_ASK_CONFIRMATION,
            "route": None,
            "params": {},
            "confidence": 0.9,
            "requiresConfirmation": True,
            "reply_te": "ఈ చర్యకు మీ కన్ఫర్మేషన్ అవసరం."
        }
 
    # WhatsApp draft creation
    if any(k in normalized for k in ["తెలుగు వాట్సాప్ మెసేజ్ తయారు చేయి", "వాట్సాప్ డ్రాఫ్ట్", "whatsapp draft", "generate whatsapp draft", "create whatsapp draft", "draft whatsapp", "followup message generate", "మెసేజ్ తయారు చేయి"]):
        return {
            "intent": "GENERATE_TELUGU_WHATSAPP_DRAFT",
            "action": ACTION_GENERATE_DRAFT,
            "route": None,
            "params": {"type": "whatsapp_followup", "language": "te"},
            "confidence": 0.9,
            "requiresConfirmation": False,
            "reply_te": "తెలుగు వాట్సాప్ డ్రాఫ్ట్ తయారు చేస్తున్నాను."
        }
 
    # Leads List Navigation & Specific Categories
    if any(k in normalized for k in ["హాట్ లీడ్స్", "hot leads", "హాట్ లీడ్"]):
        return {
            "intent": "OPEN_HOT_LEADS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/leads?category=hot",
            "params": {"category": "hot"},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "హాట్ లీడ్స్ చూపిస్తున్నాను."
        }
    if any(k in normalized for k in ["వార్మ్ లీడ్స్", "warm leads", "వార్మ్ లీడ్"]):
        return {
            "intent": "OPEN_WARM_LEADS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/leads?category=warm",
            "params": {"category": "warm"},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "వార్మ్ లీడ్స్ చూపిస్తున్నాను."
        }
    if any(k in normalized for k in ["కోల్డ్ లీడ్స్", "cold leads", "కోల్డ్ లీడ్"]):
        return {
            "intent": "OPEN_COLD_LEADS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/leads?category=cold",
            "params": {"category": "cold"},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "కోల్డ్ లీడ్స్ చూపిస్తున్నాను."
        }
 
    # Interview Scheduling
    if any(k in normalized for k in ["ఇంటర్వ్యూ షెడ్యూల్", "ఇంటర్వ్యూ బుక్", "schedule interview", "interview schedule", "book interview", "reschedule interview", "cancel interview", "interview scheduler", "interview"]):
        params = {}
        
        # Extract candidate_name (e.g. "with Rahul", "candidate Rahul", "for Rahul")
        name_match = re.search(r'(?:with|candidate|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', text)
        if not name_match:
            name_match = re.search(r'(?:with|candidate)\s+([a-zA-Z]+)', text, re.IGNORECASE)
        if name_match:
            cand_name = name_match.group(1).strip()
            if cand_name.lower() not in ["backend", "frontend", "fullstack", "developer", "engineer", "manager", "role", "position", "today", "tomorrow"]:
                params["candidate_name"] = cand_name
                
        # Extract job_role (e.g. "for Backend Developer", "as React Engineer", "role Python Developer")
        role_match = re.search(r'(?:for|as|role|position)\s+([A-Za-z\s]+(?:Developer|Engineer|Manager|Designer|Lead|Architect|Analyst|Specialist|Tester|QA|Intern))', text, re.IGNORECASE)
        if role_match:
            params["job_role"] = role_match.group(1).strip()
            
        # Extract interview_date (e.g. "tomorrow", "today", "on Monday", "2026-08-10")
        date_match = re.search(r'\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4})\b', text, re.IGNORECASE)
        if date_match:
            params["interview_date"] = date_match.group(1).strip()
            
        # Extract interview_time (e.g. "at 3 PM", "at 10:30 AM", "at 15:00")
        time_match = re.search(r'\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))\b', text)
        if time_match:
            params["interview_time"] = time_match.group(1).strip()

        action = "schedule_interview"
        if "cancel" in normalized:
            action = "cancel_interview"
        elif "reschedule" in normalized:
            action = "reschedule_interview"
        elif any(k in normalized for k in ["list", "show", "get"]):
            action = "list_interviews"

        return {
            "intent": "SCHEDULE_INTERVIEW",
            "is_plugin_tool": True,
            "plugin_key": "hr_interview_scheduler",
            "action": action,
            "params": params,
            "confidence": 0.95,
            "requiresConfirmation": False
        }

    # Lead creation
    if any(k in normalized for k in ["కొత్త లీడ్ యాడ్ చేయి", "కొత్త లీడ్", "లీడ్ యాడ్", "create lead", "add lead", "new lead", "create a new lead"]):
        return {
            "intent": "CREATE_LEAD",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/leads?action=create",
            "params": {},
            "confidence": 0.9,
            "requiresConfirmation": False,
            "reply_te": "కొత్త లీడ్ యాడ్ చేయడానికి విండో ఓపెన్ చేస్తున్నాను."
        }
 
    # Specific city queries without explicit "leads" keyword (e.g. "హైదరాబాద్ లీడ్స్ చూపించు")
    for city in CITIES:
        if city in normalized and any(k in normalized for k in ["లీడ్స్", "leads"]):
            return {
                "intent": "FILTER_LEADS_BY_CITY",
                "action": ACTION_NAVIGATE,
                "route": f"/dashboard/voice-agent/leads?city={city}",
                "params": {"city": city},
                "confidence": 0.9,
                "requiresConfirmation": False,
                "reply_te": f"{city} లీడ్స్ చూపిస్తున్నాను."
            }
 
    # Navigation Mapping
    if any(k in normalized for k in ["కొత్త క్యాంపెయిన్ క్రియేట్ చేయి", "కొత్త క్యాంపెయిన్", "క్యాంపెయిన్ క్రియేట్", "create campaign", "new campaign", "create a new campaign"]):
        return {
            "intent": "CREATE_CAMPAIGN",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/create-campaign",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "కొత్త క్యాంపెయిన్ క్రియేషన్ విండో ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["డ్యాష్బోర్డ్ ఓపెన్ చేయి", "డ్యాష్బోర్డ్ చూపించు", "డ్యాష్బోర్డ్", "dashboard", "open dashboard", "show dashboard", "view dashboard", "go to dashboard", "డ్యాష్ బోర్డ్"]):
        return {
            "intent": "OPEN_DASHBOARD",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "డ్యాష్బోర్డ్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["లీడ్స్ చూపించు", "లీడ్స్ ఓపెన్ చేయి", "లీడ్స్", "leads", "open leads", "show leads", "view leads", "go to leads"]):
        return {
            "intent": "OPEN_LEADS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/leads",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "లీడ్స్ చూపిస్తున్నాను."
        }
    if any(k in normalized for k in ["క్యాంపెయిన్స్ ఓపెన్ చేయి", "క్యాంపెయిన్స్ చూపించు", "క్యాంపెయిన్ లిస్ట్", "campaigns", "open campaigns", "show campaigns", "view campaigns", "go to campaigns", "క్యాంపెయిన్", "క్యాంపెయిన్స్"]):
        return {
            "intent": "OPEN_CAMPAIGNS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/campaigns",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "క్యాంపెయిన్స్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["అనలిటిక్స్ చూపించు", "రిపోర్ట్స్ చూపించు", "అనలిటిక్స్", "రిపోర్ట్స్", "analytics", "open analytics", "show analytics", "view analytics", "reports", "open reports"]):
        return {
            "intent": "OPEN_ANALYTICS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/analytics",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "అనలిటిక్స్ చూపిస్తున్నాను."
        }
    if any(k in normalized for k in ["వాయిస్ ఏజెంట్ ఓపెన్ చేయి", "వాయిస్ ఏజెంట్", "voice agent", "open voice agent", "show voice agent"]):
        return {
            "intent": "OPEN_VOICE_AGENT",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "వాయిస్ ఏజెంట్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["వాయిస్ ఏజెంట్ సెట్టింగ్స్ ఓపెన్ చేయి", "వాయిస్ ఏజెంట్ సెట్టింగ్స్", "voice settings", "agent settings", "open agent settings", "open voice settings", "ఏజెంట్ సెట్టింగ్స్"]):
        return {
            "intent": "OPEN_AGENT_SETTINGS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/simulator",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "వాయిస్ ఏజెంట్ సెట్టింగ్స్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["కంటెంట్ క్రియేటర్ ఓపెన్ చేయి", "కంటెంట్ క్రియేటర్", "content creator", "open content creator", "show content creator", "go to content creator", "open content", "కంటెంట్"]):
        return {
            "intent": "OPEN_CONTENT_CREATOR",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/content",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "కంటెంట్ క్రియేటర్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["వాట్సాప్ సేల్స్ ఓపెన్ చేయి", "వాట్సాప్ సేల్స్", "వాట్సాప్ ఓపెన్ చేయి", "whatsapp sales", "open whatsapp sales", "open whatsapp", "go to whatsapp", "show whatsapp", "వాట్సాప్"]):
        return {
            "intent": "OPEN_WHATSAPP_SALES",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/whatsapp-sales",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "వాట్సాప్ సేల్స్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["ఇన్స్టాగ్రామ్ ఓపెన్ చేయి", "ఇన్స్టాగ్రామ్", "instagram", "open instagram", "show instagram", "go to instagram"]):
        return {
            "intent": "OPEN_INSTAGRAM",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/instagram",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "ఇన్స్టాగ్రామ్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["బిజినెస్ నెట్వర్క్ ఓపెన్ చేయి", "బిజినెస్ నెట్వర్క్", "b2b network", "open b2b network", "show b2b", "b2b chat", "open b2b chat", "go to b2b", "business network"]):
        return {
            "intent": "OPEN_B2B_NETWORK",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/b2b-network",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "బిజినెస్ నెట్వర్క్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["వెబ్సైట్ ఓపెన్ చేయి", "వెబ్సైట్", "website", "open website", "show website", "go to website", "website builder"]):
        return {
            "intent": "OPEN_WEBSITE",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/website",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "వెబ్సైట్ బిల్డర్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["ప్రొఫైల్ ఓపెన్ చేయి", "ప్రొఫైల్", "profile", "open profile", "show profile", "go to profile", "my profile"]):
        return {
            "intent": "OPEN_PROFILE",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/profile",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "ప్రొఫైల్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["అడ్మిన్ సెట్టింగ్స్ ఓపెన్ చేయి", "అడ్మిన్ సెట్టింగ్స్", "admin settings", "settings", "open settings", "open admin settings", "go to settings"]):
        return {
            "intent": "OPEN_ADMIN_SETTINGS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/settings",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "అడ్మిన్ సెట్టింగ్స్ ఓపెన్ చేస్తున్నాను."
        }
    if any(k in normalized for k in ["ఈరోజు ఫాలోఅప్స్ చూపించు", "ఈరోజు ఫాలోఅప్స్", "today followups", "show today followups", "view today followups"]):
        return {
            "intent": "SHOW_TODAY_FOLLOWUPS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/leads?date=today",
            "params": {"date": "today"},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "ఈరోజు ఫాలోఅప్స్ చూపిస్తున్నాను."
        }
    if any(k in normalized for k in ["పెండింగ్ ఫాలోఅప్స్ చూపించు", "పెండింగ్ ఫాలోఅప్స్", "pending followups", "show pending followups", "view pending followups"]):
        return {
            "intent": "SHOW_PENDING_FOLLOWUPS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/leads?status=pending",
            "params": {"status": "pending"},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "పెండింగ్ ఫాలోఅప్స్ చూపిస్తున్నాను."
        }
    if any(k in normalized for k in ["వాట్సాప్ ఫాలోఅప్స్", "whatsapp followups", "open whatsapp followups"]):
        return {
            "intent": "OPEN_WHATSAPP_FOLLOWUPS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/whatsapp",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "వాట్సాప్ ఫాలోఅప్స్ చూపిస్తున్నాను."
        }
    if any(k in normalized for k in ["సంభాషణ హిస్టరీ", "సంభాషణల హిస్టరీ", "transcripts", "ట్రాన్స్క్రిప్ట్స్", "conversations", "show conversations", "show transcripts", "conversation history"]):
        return {
            "intent": "SHOW_RECENT_CONVERSATIONS",
            "action": ACTION_NAVIGATE,
            "route": "/dashboard/voice-agent/conversations",
            "params": {},
            "confidence": 0.95,
            "requiresConfirmation": False,
            "reply_te": "ఇటీవలి సంభాషణలు చూపిస్తున్నాను."
        }

    # Dynamic Lead Search by Name or filter by City (Wildcards checked last)
    # Support both keyword-first ("search ramesh", "open vizag") and subject-first ("ramesh lead", "vizag leads") patterns
    search_match = None
    
    # 1. Keyword-first search/open
    kw_match = re.search(r"\b(?:search|find|open)\b\s+([a-zA-Z0-9\u0C00-\u0C7F]+)", normalized)
    if kw_match:
        search_match = kw_match
    else:
        # 2. Subject-first query
        subj_match = re.search(r"([a-zA-Z0-9\u0C00-\u0C7F]+)\s*(?:లీడ్ ఓపెన్ చేయి|లీడ్ ఓపెన్|details చూపించు|details|lead search చేయి|lead search|లీడ్|lead|లీడ్స్|leads)", normalized)
        if subj_match:
            search_match = subj_match

    if search_match:
        subject = search_match.group(1).strip()
        # Avoid matching generic intent keywords as names
        if subject not in ["కొత్త", "హాట్", "వార్మ్", "కోల్డ్", "హైదరాబాద్", "విజయవాడ", "వైజాగ్", "leads", "lead", "లీడ్స్", "లీడ్", "search", "open", "find"]:
            # Check if it matches a city
            if subject in CITIES:
                return {
                    "intent": "FILTER_LEADS_BY_CITY",
                    "action": ACTION_NAVIGATE,
                    "route": f"/dashboard/voice-agent/leads?city={subject}",
                    "params": {"city": subject},
                    "confidence": 0.9,
                    "requiresConfirmation": False,
                    "reply_te": f"{subject} లీడ్స్ చూపిస్తున్నాను."
                }
            else:
                return {
                    "intent": "SEARCH_LEAD_BY_NAME",
                    "action": ACTION_NAVIGATE,
                    "route": f"/dashboard/voice-agent/leads?search={subject}",
                    "params": {"name": subject},
                    "confidence": 0.9,
                    "requiresConfirmation": False,
                    "reply_te": f"{subject} లీడ్ కోసం వెతుకుతున్నాను."
                }
 
    return None

async def parse_with_ai(text: str, current_route: str, user: User) -> Optional[Dict[str, Any]]:
    """Uses Groq API as an fallback AI parser if confidence of rule matching is low"""
    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        logger.info("Groq API key not configured, skipping AI voice parser fallback.")
        return None

    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_MODEL = "llama-3.1-8b-instant"  # Quick and reliable for text classification

    system_prompt = """You are a Telugu and English voice command parser for Saadhyam app. Convert user command into safe structured JSON. Do not execute any action. Only classify intent, action, route, params, confidence, requiresConfirmation, and Telugu reply.

The supported intents are:
- OPEN_DASHBOARD (action: NAVIGATE, route: /dashboard, requiresConfirmation: false)
- OPEN_LEADS (action: NAVIGATE, route: /dashboard/voice-agent/leads, requiresConfirmation: false)
- OPEN_HOT_LEADS (action: NAVIGATE, route: /dashboard/voice-agent/leads?category=hot, requiresConfirmation: false)
- OPEN_WARM_LEADS (action: NAVIGATE, route: /dashboard/voice-agent/leads?category=warm, requiresConfirmation: false)
- OPEN_COLD_LEADS (action: NAVIGATE, route: /dashboard/voice-agent/leads?category=cold, requiresConfirmation: false)
- OPEN_CAMPAIGNS (action: NAVIGATE, route: /dashboard/voice-agent/campaigns, requiresConfirmation: false)
- CREATE_CAMPAIGN (action: NAVIGATE, route: /dashboard/voice-agent/create-campaign, requiresConfirmation: false)
- CREATE_LEAD (action: NAVIGATE, route: /dashboard/voice-agent/leads?action=create, requiresConfirmation: false)
- SCHEDULE_INTERVIEW (action: NAVIGATE, route: /dashboard/plugins/interview-scheduler?action=schedule, requiresConfirmation: false)
- OPEN_ANALYTICS (action: NAVIGATE, route: /dashboard/voice-agent/analytics, requiresConfirmation: false)
- OPEN_VOICE_AGENT (action: NAVIGATE, route: /dashboard/voice-agent, requiresConfirmation: false)
- OPEN_AGENT_SETTINGS (action: NAVIGATE, route: /dashboard/voice-agent/simulator, requiresConfirmation: false)
- OPEN_WHATSAPP_FOLLOWUPS (action: NAVIGATE, route: /dashboard/whatsapp, requiresConfirmation: false)
- SHOW_TODAY_FOLLOWUPS (action: NAVIGATE, route: /dashboard/voice-agent/leads?date=today, requiresConfirmation: false)
- SHOW_PENDING_FOLLOWUPS (action: NAVIGATE, route: /dashboard/voice-agent/leads?status=pending, requiresConfirmation: false)
- SHOW_RECENT_CONVERSATIONS (action: NAVIGATE, route: /dashboard/voice-agent/conversations, requiresConfirmation: false)
- SEARCH_LEAD_BY_NAME (action: NAVIGATE, route: /dashboard/voice-agent/leads?search=NAME, params: {"name": "NAME"}, requiresConfirmation: false)
- FILTER_LEADS_BY_CITY (action: NAVIGATE, route: /dashboard/voice-agent/leads?city=CITY, params: {"city": "CITY"}, requiresConfirmation: false)
- GENERATE_TELUGU_WHATSAPP_DRAFT (action: GENERATE_DRAFT, route: null, params: {"type": "whatsapp_followup", "language": "te"}, requiresConfirmation: false)
- SET_DARK_MODE (action: SET_THEME, route: null, params: {"theme": "dark"}, requiresConfirmation: false)
- SET_LIGHT_MODE (action: SET_THEME, route: null, params: {"theme": "light"}, requiresConfirmation: false)

Dangerous actions (requiresConfirmation: true, action: ASK_CONFIRMATION):
- DELETE_LEAD (requiresConfirmation: true, action: ASK_CONFIRMATION, reply_te: "ఈ లీడ్ డిలీట్ చేయాలనుకుంటున్నారా?")
- DELETE_CAMPAIGN (requiresConfirmation: true, action: ASK_CONFIRMATION, reply_te: "ఈ క్యాంపెయిన్ డిలీట్ చేయాలనుకుంటున్నారా?")
- SEND_WHATSAPP_MESSAGE (requiresConfirmation: true, action: ASK_CONFIRMATION, reply_te: "వాట్సాప్ మెసేజ్ పంపాలనుకుంటున్నారా?")
- ARCHIVE_CAMPAIGN (requiresConfirmation: true, action: ASK_CONFIRMATION, reply_te: "ఈ క్యాంపెయిన్ ఆర్కైవ్ చేయాలనుకుంటున్నారా?")
- STOP_CAMPAIGN (requiresConfirmation: true, action: ASK_CONFIRMATION, reply_te: "ఈ క్యాంపెయిన్ ఆపాలనుకుంటున్నారా?")
- DISABLE_AGENT (requiresConfirmation: true, action: ASK_CONFIRMATION, reply_te: "వాయిస్ ఏజెంట్ డిసేబుల్ చేయాలనుకుంటున్నారా?")
- DELETE_USER (requiresConfirmation: true, action: ASK_CONFIRMATION, reply_te: "ఈ యూజర్ డిలీట్ చేయాలనుకుంటున్నారా?")

If the command is unknown, return:
{
  "intent": "UNKNOWN",
  "action": "NO_ACTION",
  "route": null,
  "params": {},
  "confidence": 0,
  "requiresConfirmation": false,
  "reply_te": "క్షమించండి, ఆ కమాండ్ అర్థం కాలేదు."
}

CRITICAL: Return ONLY valid JSON, with keys: "intent", "action", "route", "params", "confidence", "requiresConfirmation", "reply_te". No extra text, explanations, or markdown. Only return JSON.
"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Command: {text}\nCurrent Route: {current_route}"}
        ],
        "temperature": 0.0,  # Strict JSON classification
        "max_tokens": 300,
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(GROQ_API_URL, json=payload, headers=headers)
            if response.status_code == 200:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                result = json.loads(content)
                logger.info(f"Groq parsed voice command successfully: {result}")
                return result
            else:
                logger.error(f"Groq API call failed: {response.text}")
    except Exception as e:
        logger.error(f"Error parsing voice command with Groq AI: {e}")
        
    return None

# English translations for voice assistant feedbacks
ENGLISH_REPLIES = {
    "SET_DARK_MODE": "Switching to dark mode.",
    "SET_LIGHT_MODE": "Switching to light mode.",
    "DELETE_LEAD": "This action requires confirmation.",
    "DELETE_CAMPAIGN": "This action requires confirmation.",
    "SEND_WHATSAPP_MESSAGE": "This action requires confirmation.",
    "STOP_CAMPAIGN": "This action requires confirmation.",
    "DISABLE_AGENT": "This action requires confirmation.",
    "GENERATE_TELUGU_WHATSAPP_DRAFT": "Generating WhatsApp draft.",
    "OPEN_HOT_LEADS": "Showing hot leads.",
    "OPEN_WARM_LEADS": "Showing warm leads.",
    "OPEN_COLD_LEADS": "Showing cold leads.",
    "CREATE_LEAD": "Opening window to add a new lead.",
    "SCHEDULE_INTERVIEW": "Opening interview scheduler.",
    "SEARCH_LEAD_BY_NAME": "Searching for lead: {name}.",
    "FILTER_LEADS_BY_CITY": "Showing leads from {city}.",
    "OPEN_DASHBOARD": "Opening dashboard.",
    "OPEN_LEADS": "Showing leads.",
    "CREATE_CAMPAIGN": "Opening window to create a new campaign.",
    "OPEN_CAMPAIGNS": "Opening campaigns.",
    "OPEN_ANALYTICS": "Showing analytics.",
    "OPEN_VOICE_AGENT": "Opening voice agent.",
    "OPEN_AGENT_SETTINGS": "Opening voice agent settings.",
    "OPEN_ADMIN_SETTINGS": "Opening admin settings.",
    "OPEN_CONTENT_CREATOR": "Opening content creator.",
    "OPEN_WHATSAPP_SALES": "Opening WhatsApp sales.",
    "OPEN_INSTAGRAM": "Opening Instagram.",
    "OPEN_B2B_NETWORK": "Opening B2B network.",
    "OPEN_WEBSITE": "Opening website builder.",
    "OPEN_PROFILE": "Opening profile.",
    "SHOW_TODAY_FOLLOWUPS": "Showing today's followups.",
    "SHOW_PENDING_FOLLOWUPS": "Showing pending followups.",
    "OPEN_WHATSAPP_FOLLOWUPS": "Showing WhatsApp followups.",
    "SHOW_RECENT_CONVERSATIONS": "Showing recent conversations.",
    "PERMISSION_DENIED": "You do not have permission for this action.",
    "UNKNOWN": "Sorry, I didn't understand that command."
}

async def parse_command(text: str, current_route: str, user: User, db: Session, lang: str = "te") -> Dict[str, Any]:
    """
    Main parser service.
    First matches with rules, then falls back to AI parser.
    Validates permissions and applies correct output language translation.
    """
    if not text or not text.strip():
        reply = "Sorry, I didn't understand that command." if lang.startswith("en") else "క్షమించండి, ఆ కమాండ్ అర్థం కాలేదు."
        return {
            "intent": "UNKNOWN",
            "action": ACTION_NO_ACTION,
            "route": None,
            "params": {},
            "confidence": 0.0,
            "requiresConfirmation": False,
            "reply_te": reply
        }
        
    # 1. Rule-based parser
    parsed = match_rule_based_intent(text, current_route)
    
    # 2. AI parser fallback if rules don't match
    if not parsed:
        parsed = await parse_with_ai(text, current_route, user)
        
    # 3. Handle default unknown command
    if not parsed:
        parsed = {
            "intent": "UNKNOWN",
            "action": ACTION_NO_ACTION,
            "route": None,
            "params": {},
            "confidence": 0.0,
            "requiresConfirmation": False,
            "reply_te": "క్షమించండి, ఆ కమాండ్ అర్థం కాలేదు."
        }
        
    # 4. Permission validation
    intent = parsed.get("intent", "UNKNOWN")
    if intent != "UNKNOWN" and not check_permission(intent, user, db):
        return {
            "intent": "PERMISSION_DENIED",
            "action": ACTION_NO_ACTION,
            "route": None,
            "params": {},
            "confidence": 1.0,
            "requiresConfirmation": False,
            "reply_te": "మీకు ఈ చర్యకు permission లేదు."
        }

    # 4.5 If parsed intent represents a generic plugin tool action -> Delegate to shared tool execution pipeline
    if parsed and parsed.get("is_plugin_tool"):
        from services.assistant_service import execute_assistant_plugin_tool
        plugin_key = parsed.get("plugin_key")
        action = parsed.get("action")
        params = parsed.get("params", {})
        
        exec_res = await execute_assistant_plugin_tool(
            user=user,
            plugin_key=plugin_key,
            action=action,
            params=params,
            query=text,
            lang=lang
        )
        
        return {
            "intent": parsed.get("intent", "PLUGIN_ACTION"),
            "action": exec_res.get("action", ACTION_NAVIGATE if exec_res.get("route") else ACTION_NO_ACTION),
            "route": exec_res.get("route"),
            "params": params,
            "confidence": parsed.get("confidence", 0.95),
            "requiresConfirmation": False,
            "reply_te": exec_res.get("reply", "Command processed successfully.")
        }
        
    # 5. Translate reply to English if requested
    if lang.startswith("en"):
        curr_intent = parsed.get("intent", "UNKNOWN")
        en_template = ENGLISH_REPLIES.get(curr_intent, "Command processed successfully.")
        
        # Handle format strings for SEARCH_LEAD_BY_NAME and FILTER_LEADS_BY_CITY
        params = parsed.get("params", {})
        if curr_intent == "SEARCH_LEAD_BY_NAME" and "name" in params:
            parsed["reply_te"] = en_template.format(name=params["name"])
        elif curr_intent == "FILTER_LEADS_BY_CITY" and "city" in params:
            parsed["reply_te"] = en_template.format(city=params["city"])
        else:
            parsed["reply_te"] = en_template
            
    return parsed
