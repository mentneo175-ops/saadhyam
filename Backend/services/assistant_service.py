import logging
import asyncio
import json
import re
import time
from typing import Optional, List, Dict, Any
from fastapi import HTTPException

import httpx
from sqlalchemy.orm import Session

from config.settings import settings
from services.search_service import duck_search
from models.user import User
from db.models import BusinessAnalysis
from services.vector_storage_service import vector_storage
from config.pinecone_config import NAMESPACE_AEO_QUESTIONS, NAMESPACE_BUSINESS_INSIGHTS
from services.business_pinecone_service import get_business_context_from_pinecone

logger = logging.getLogger(__name__)

# Conversational Parameter Collection Memory
CONVERSATION_MEMORY = {}

def validate_param_value(param_name: str, value: Any) -> tuple[bool, Any]:
    if param_name == "recipients":
        if not value:
            return False, "Recipients list cannot be empty. Who should receive the email?"
        emails = []
        if isinstance(value, str):
            emails = re.findall(r'[\w\.-]+@[\w\.-]+', value)
        elif isinstance(value, list):
            for v in value:
                if isinstance(v, str):
                    emails.extend(re.findall(r'[\w\.-]+@[\w\.-]+', v))
        if not emails:
            return False, "I couldn't find a valid email address. Who should receive the email?"
        return True, emails
    elif param_name == "subject":
        val_str = str(value).strip() if value is not None else ""
        if not val_str:
            return False, "The subject cannot be empty. What is the subject of the email?"
        return True, val_str
    elif param_name == "candidate_name":
        val_str = str(value).strip() if value is not None else ""
        if not val_str:
            return False, "Candidate name cannot be empty. What is the candidate's name?"
        return True, val_str
    elif param_name == "candidate_email":
        val_str = str(value).strip() if value is not None else ""
        if not val_str:
            return False, "Candidate email cannot be empty. What is the candidate's email address?"
        return True, val_str
    elif param_name == "interviewer_name":
        val_str = str(value).strip() if value is not None else ""
        if not val_str:
            return False, "Interviewer name cannot be empty. Who will conduct the interview?"
        return True, val_str
    elif param_name == "job_role":
        val_str = str(value).strip() if value is not None else ""
        if not val_str:
            return False, "Job role cannot be empty. What is the job role for this interview?"
        return True, val_str
    elif param_name == "interview_date":
        val_str = str(value).strip() if value is not None else ""
        if not val_str:
            return False, "Interview date cannot be empty. What date should the interview be scheduled for?"
        return True, val_str
    elif param_name == "interview_time":
        val_str = str(value).strip() if value is not None else ""
        if not val_str:
            return False, "Interview time cannot be empty. What time should the interview be scheduled for?"
        return True, val_str
    return True, value

def get_followup_question(param_name: str) -> str:
    prompts = {
        "recipients": "Who should receive the email?",
        "subject": "What is the subject of the email?",
        "body": "What should the email body say?",
        "candidate_name": "What is the candidate's name?",
        "candidate_email": "What is the candidate's email address?",
        "interviewer_name": "Who will be conducting the interview?",
        "job_role": "What is the job role for this interview?",
        "interview_date": "What date should the interview be scheduled for?",
        "interview_time": "What time should the interview be scheduled for?"
    }
    return prompts.get(param_name, f"Please provide the value for '{param_name}':")

def get_required_params(plugin_instance, action: str) -> List[str]:
    actions = plugin_instance.get_actions()
    target_action = next((a for a in actions if a["action"] == action), None)
    if not target_action:
        return []
    action_params_schema = target_action.get("parameters") or {}
    required = []
    for name, schema in action_params_schema.items():
        if schema.get("required", False):
            required.append(name)
    return required

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TIMEOUT_SECONDS = 30.0  # Increased timeout
GROQ_MODEL = "llama-3.3-70b-versatile"  # Updated to latest model
FALLBACK_MODEL = "llama-3.1-8b-instant"  # Faster fallback model
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2.0
FALLBACK_MESSAGE = "I could not find enough information right now. Please try again with more details."


def _safe_json_loads(value, default):
    if value is None or value == "":
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return default


def get_business_context(db: Session, user: User) -> str:
    """Extract business context from database for the user"""
    try:
        # Get latest business analysis
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user.id,
            BusinessAnalysis.analysis_status == 'completed'
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        if not analysis:
            return "No business profile configured yet. Please complete your business setup."
        
        # Build comprehensive business context
        context_parts = []
        
        # Basic info
        if analysis.business_name:
            context_parts.append(f"Business: {analysis.business_name}")
        if analysis.business_type:
            context_parts.append(f"Type: {analysis.business_type}")
        if analysis.location:
            context_parts.append(f"Location: {analysis.location}")
        
        # SWOT Analysis (handle JSON string parsing safely)
        def parse_json_list(field):
            parsed = _safe_json_loads(field, [])
            if isinstance(parsed, list):
                return parsed
            if parsed:
                return [parsed]
            return []

        strengths = parse_json_list(analysis.strengths)
        if strengths:
            context_parts.append(f"Strengths: {', '.join(strengths[:3])}")
            
        weaknesses = parse_json_list(analysis.weaknesses)
        if weaknesses:
            context_parts.append(f"Weaknesses: {', '.join(weaknesses[:2])}")
            
        opportunities = parse_json_list(analysis.opportunities)
        if opportunities:
            context_parts.append(f"Opportunities: {', '.join(opportunities[:2])}")
        
        # Target audience
        if analysis.target_audience:
            ta = _safe_json_loads(analysis.target_audience, analysis.target_audience)
            context_parts.append(
                f"Target Audience: {ta.get('description', 'Not specified') if isinstance(ta, dict) else ta}"
            )
        
        # USPs
        if hasattr(analysis, 'unique_selling_points') and getattr(analysis, 'unique_selling_points'):
            usps = parse_json_list(getattr(analysis, 'unique_selling_points'))
            context_parts.append(f"USPs: {', '.join(usps[:2])}")

        # Full business/project summary and planning context
        if getattr(analysis, 'business_summary', None):
            context_parts.append(f"Business Summary: {analysis.business_summary}")
        if getattr(analysis, 'services', None):
            services = parse_json_list(getattr(analysis, 'services'))
            if services:
                context_parts.append(f"Services: {', '.join(str(item) for item in services[:5])}")
        if getattr(analysis, 'goals', None):
            goals = parse_json_list(getattr(analysis, 'goals'))
            if goals:
                context_parts.append(f"Goals: {', '.join(str(item) for item in goals[:5])}")
        if getattr(analysis, 'website_or_instagram', None):
            context_parts.append(f"Website or Instagram: {analysis.website_or_instagram}")

        if getattr(analysis, 'competitor_analysis', None):
            competitor_analysis = _safe_json_loads(getattr(analysis, 'competitor_analysis'), None)
            if competitor_analysis:
                context_parts.append(f"Competitor Analysis: {competitor_analysis}")
        if getattr(analysis, 'local_market_insights', None):
            local_market_insights = _safe_json_loads(getattr(analysis, 'local_market_insights'), None)
            if local_market_insights:
                context_parts.append(f"Local Market Insights: {local_market_insights}")
        if getattr(analysis, 'thirty_day_growth_plan', None):
            growth_plan = _safe_json_loads(getattr(analysis, 'thirty_day_growth_plan'), None)
            if growth_plan:
                context_parts.append(f"30 Day Growth Plan: {growth_plan}")
        if getattr(analysis, 'seo_google_maps_tips', None):
            seo_tips = _safe_json_loads(getattr(analysis, 'seo_google_maps_tips'), None)
            if seo_tips:
                context_parts.append(f"SEO and Google Maps Tips: {seo_tips}")
        if getattr(analysis, 'daily_suggestions', None):
            suggestions = _safe_json_loads(getattr(analysis, 'daily_suggestions'), [])
            if suggestions:
                context_parts.append(f"Daily Suggestions: {', '.join(str(item) for item in suggestions[:5])}")
        
        return "\n".join(context_parts)
        
    except Exception as e:
        logger.error(f"Error getting business context: {e}")
        return "Business profile available but could not be loaded."


async def get_relevant_questions(user: User, query: str, top_k: int = 3) -> str:
    """Get relevant questions from Pinecone based on user query"""
    if not vector_storage.enabled:
        return ""
    
    try:
        # Search for similar questions
        results = vector_storage.search_similar(
            query_text=query,
            namespace=NAMESPACE_AEO_QUESTIONS,
            top_k=top_k,
            filter_dict={'user_id': user.id}
        )
        
        if not results:
            return ""
        
        # Format results
        questions = [f"- {r['text']}" for r in results]
        return "Related questions from your business:\n" + "\n".join(questions)
        
    except Exception as e:
        logger.error(f"Error getting relevant questions from Pinecone: {e}")
        return ""


async def call_groq_api_with_retry(
    payload: dict,
    headers: dict,
    model: str,
    max_retries: int = MAX_RETRIES
) -> Optional[str]:
    """
    Call GROQ API with retry logic and exponential backoff for rate limits.
    
    Returns:
        Response content or None if all retries failed
    """
    for attempt in range(max_retries):
        try:
            timeout = httpx.Timeout(GROQ_TIMEOUT_SECONDS)
            async with httpx.AsyncClient(timeout=timeout) as client:
                logger.info(f"Attempt {attempt + 1}/{max_retries}: Calling Groq API with model: {model}")
                response = await client.post(GROQ_API_URL, json=payload, headers=headers)
                
                # Handle rate limit (429)
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", RETRY_DELAY_SECONDS * (2 ** attempt)))
                    logger.warning(f"Rate limit hit (429). Retrying after {retry_after} seconds...")
                    
                    if attempt < max_retries - 1:
                        await asyncio.sleep(retry_after)
                        continue
                    else:
                        logger.error("Max retries reached for rate limit")
                        return None
                
                # Handle other errors
                if response.status_code != 200:
                    error_detail = response.text
                    logger.error(f"Groq API error (status {response.status_code}): {error_detail}")
                    
                    # Don't retry on client errors (except 429)
                    if 400 <= response.status_code < 500:
                        return None
                    
                    # Retry on server errors
                    if attempt < max_retries - 1:
                        await asyncio.sleep(RETRY_DELAY_SECONDS * (2 ** attempt))
                        continue
                    else:
                        return None
                
                # Success
                data = response.json()
                content = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                    .strip()
                )
                
                logger.info(f"Groq API response received: {content[:100]}...")
                return content
                
        except httpx.TimeoutException:
            logger.warning(f"Attempt {attempt + 1}/{max_retries}: Request timed out")
            if attempt < max_retries - 1:
                await asyncio.sleep(RETRY_DELAY_SECONDS * (2 ** attempt))
                continue
            else:
                logger.error("Max retries reached for timeout")
                return None
                
        except httpx.HTTPError as exc:
            logger.warning(f"Attempt {attempt + 1}/{max_retries}: HTTP error: {exc}")
            if attempt < max_retries - 1:
                await asyncio.sleep(RETRY_DELAY_SECONDS * (2 ** attempt))
                continue
            else:
                logger.error("Max retries reached for HTTP error")
                return None
                
        except Exception as exc:
            logger.error(f"Attempt {attempt + 1}/{max_retries}: Unexpected error: {exc}")
            if attempt < max_retries - 1:
                await asyncio.sleep(RETRY_DELAY_SECONDS * (2 ** attempt))
                continue
            else:
                logger.error("Max retries reached for unexpected error")
                return None
    
    return None


def rule_based_tool_classifier(query: str, tools: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    query_lower = query.lower().strip()
    
    # 1. Fallback for sales_email_marketing (Email Marketing)
    has_email_marketing = any(t["plugin_key"] == "sales_email_marketing" for t in tools)
    if has_email_marketing:
        is_email_campaign = any(
            k in query_lower for k in [
                "send campaign", "email campaign", "bulk email", "mass email", 
                "newsletter", "send email to", "email to", "send mail to",
                "marketing email", "send email", "send mail", "compose email"
            ]
        )
        if is_email_campaign:
            emails_found = re.findall(r'[\w\.-]+@[\w\.-]+', query)
            subject = "Marketing Campaign"
            body = query
            for keyword in ["saying", "with body", "body"]:
                if keyword in query_lower:
                    parts = query.split(keyword, 1)
                    if len(parts) > 1:
                        body = parts[1].strip()
                        break
            if "subject" in query_lower:
                match_subj = re.search(r'subject\s*(?::)?\s*([^\n,.]+)', query, re.IGNORECASE)
                if match_subj:
                    subj_val = match_subj.group(1).strip()
                    subj_lower = subj_val.lower()
                    for keyword in [" and body", " body", " and saying", " saying", " and message", " message"]:
                        if keyword in subj_lower:
                            idx = subj_lower.find(keyword)
                            subj_val = subj_val[:idx].strip()
                            subj_lower = subj_val.lower()
                    subject = subj_val
            
            # Detect HTML intent — user explicitly requests HTML or formatted email
            is_html = any(k in query_lower for k in [
                "html email", "html mail", "html format", "formatted email",
                "formatted mail", "rich text", "html template", "send html"
            ])
            
            params = {}
            if emails_found:
                params["recipients"] = emails_found
            if "subject" in query_lower:
                params["subject"] = subject
            if any(k in query_lower for k in ["saying", "with body", "body"]):
                params["body"] = body
            # Only include is_html when explicitly requested to preserve backward compatibility
            if is_html:
                params["is_html"] = True
                
            return {
                "is_tool_call": True,
                "plugin_key": "sales_email_marketing",
                "action": "send_campaign",
                "params": params
            }
                
    # 2. Fallback for gmail (Gmail Integration)
    has_gmail = any(t["plugin_key"] == "gmail" for t in tools)
    if has_gmail:
        if any(k in query_lower for k in ["gmail connection", "check gmail", "test gmail", "gmail test"]):
            return {"is_tool_call": True, "plugin_key": "gmail", "action": "test_connection", "params": {}}
        if any(k in query_lower for k in ["send email", "compose email", "mail someone", "email to"]):
            emails_found = re.findall(r'[\w\.-]+@[\w\.-]+', query)
            to_email = emails_found[0] if emails_found else "test@example.com"
            return {
                "is_tool_call": True,
                "plugin_key": "gmail",
                "action": "send_email",
                "params": {
                    "to": to_email,
                    "subject": "Hello",
                    "body": "hello",
                    "cc": [],
                    "bcc": []
                }
            }
        if any(k in query_lower for k in ["read email", "open email", "get email"]):
            return {"is_tool_call": True, "plugin_key": "gmail", "action": "get_email", "params": {"email_id": "msg123"}}
            
    # 3. Routing for hr_interview_scheduler (Interview Scheduler)
    has_interview_scheduler = any(t["plugin_key"] == "hr_interview_scheduler" for t in tools)
    if has_interview_scheduler:
        is_interview_action = any(
            k in query_lower for k in [
                "schedule interview", "schedule an interview", "book interview", "book an interview",
                "reschedule interview", "reschedule an interview", "cancel interview", "cancel an interview",
                "interview with", "interview for", "interview scheduling"
            ]
        )
        if is_interview_action:
            params = {}
            
            # Extract candidate_name (e.g. "with Rahul", "candidate Rahul", "for Rahul")
            name_match = re.search(r'(?:with|candidate|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', query)
            if not name_match:
                name_match = re.search(r'(?:with|candidate)\s+([a-zA-Z]+)', query, re.IGNORECASE)
            if name_match:
                cand_name = name_match.group(1).strip()
                if cand_name.lower() not in ["backend", "frontend", "fullstack", "developer", "engineer", "manager", "role", "position", "today", "tomorrow"]:
                    params["candidate_name"] = cand_name
                    
            # Extract job_role (e.g. "for Backend Developer", "as React Engineer", "role Python Developer")
            role_match = re.search(r'(?:for|as|role|position)\s+([A-Za-z\s]+(?:Developer|Engineer|Manager|Designer|Lead|Architect|Analyst|Specialist|Tester|QA|Intern))', query, re.IGNORECASE)
            if role_match:
                params["job_role"] = role_match.group(1).strip()
                
            # Extract interview_date (e.g. "tomorrow", "today", "on Monday", "2026-08-10")
            date_match = re.search(r'\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4})\b', query_lower)
            if date_match:
                params["interview_date"] = date_match.group(1).strip()
                
            # Extract interview_time (e.g. "at 3 PM", "at 10:30 AM", "at 15:00")
            time_match = re.search(r'\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))\b', query)
            if time_match:
                params["interview_time"] = time_match.group(1).strip()
                
            action = "schedule_interview"
            if "cancel" in query_lower:
                action = "cancel_interview"
            elif "reschedule" in query_lower:
                action = "reschedule_interview"
            elif any(k in query_lower for k in ["list", "show", "get"]):
                action = "list_interviews"

            return {
                "is_tool_call": True,
                "plugin_key": "hr_interview_scheduler",
                "action": action,
                "params": params
            }

    return None


async def build_tool_registry(user_plugins) -> List[Dict[str, Any]]:
    from services.plugin_service import plugin_manager
    tools = []
    for up in user_plugins:
        if not up.plugin or not up.is_enabled:
            continue
        try:
            plugin_instance = await plugin_manager._load_plugin_instance(up.plugin.plugin_key)
            if not plugin_instance:
                continue
            
            info = plugin_instance.get_info()
            actions = plugin_instance.get_actions()
            
            tools.append({
                "plugin_key": up.plugin.plugin_key,
                "plugin_name": info.get("name") or up.plugin.name,
                "description": info.get("description") or up.plugin.description,
                "actions": actions
            })
        except Exception as e:
            logger.warning(f"Failed to load registry metadata for plugin {up.plugin.plugin_key}: {e}")
    return tools


def build_tool_selection_prompt(tools: List[Dict[str, Any]], query: str) -> str:
    tools_formatted = []
    for t in tools:
        for act in t["actions"]:
            tools_formatted.append({
                "plugin_key": t["plugin_key"],
                "plugin_name": t["plugin_name"],
                "action": act["action"],
                "action_description": act.get("description"),
                "parameters": act.get("parameters") or {}
            })
            
    system_prompt = f"""You are the tool routing core of a smart AI Agent.
Analyze the user's request and determine if any of the available tools match their intent.
If a tool matches, select the tool and extract all required parameters from the request.

AVAILABLE TOOLS:
{json.dumps(tools_formatted, indent=2)}

OUTPUT REQUIREMENT:
You must output a strict JSON payload in the following format:

If a tool matches the user's intent:
{{
  "is_tool_call": true,
  "plugin_key": "<plugin_key_of_selected_tool>",
  "action": "<action_name>",
  "params": {{
     "<parameter_name>": <extracted_value_from_query>
  }}
}}

If no tools match the user's intent:
{{
  "is_tool_call": false
}}

Output ONLY strict raw JSON. Do not include markdown code block formatting (e.g. ```json) or any explanations.
"""
    return system_prompt


def validate_action_params(plugin_instance, action: str, params: Dict[str, Any]) -> Optional[str]:
    actions = plugin_instance.get_actions()
    target_action = next((a for a in actions if a["action"] == action), None)
    if not target_action:
        return f"Unknown plugin action '{action}'."
        
    action_params_schema = target_action.get("parameters") or {}
    for name, schema in action_params_schema.items():
        is_required = schema.get("required", False)
        if is_required and name not in params:
            return f"Required parameter '{name}' is missing for action '{action}'."
    return None


async def format_generic_response(query: str, plugin_key: str, action: str, result: Dict[str, Any], api_key: str) -> str:
    res_data = result.get("result") or result
    if res_data and isinstance(res_data, dict):
        if res_data.get("success") and "emails_sent" in res_data:
            return "Your email has been sent successfully."
        if res_data.get("success") and "messages_total" in res_data:
            return f"Gmail connection is healthy. Account: {res_data.get('email')}, Total Messages: {res_data.get('messages_total')}."
            
    if not api_key:
        return f"Action '{action}' executed successfully."
        
    system_prompt = "You are a helpful AI assistant. Format the plugin execution result into a friendly, natural language response. Response must be concise, conversational, and direct."
    user_prompt = f"User Request: {query}\nPlugin: {plugin_key}\nAction: {action}\nResult Payload: {json.dumps(result)}\nFormat this result as a natural language response to the user."
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": FALLBACK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.5,
        "max_tokens": 200
    }
    try:
        content = await call_groq_api_with_retry(payload, headers, FALLBACK_MODEL, max_retries=2)
        if content:
            return content
    except Exception as e:
        logger.warning(f"Groq dynamic response formatting failed: {e}")
    return f"Action '{action}' completed successfully."


async def generate_response(query: str, db: Session, user: User) -> str:
    """
    Generate AI response with business context from Pinecone, semantic search, and live search data.
    Optimized for voice interaction - concise and conversational.
    Includes rate limit handling and automatic fallback to faster model.
    """
    # 0. Check for cancel intent
    if query.lower().strip() in ["cancel", "stop", "start over", "abort"]:
        if user.id in CONVERSATION_MEMORY:
            CONVERSATION_MEMORY.pop(user.id, None)
            return "Okay, I have cancelled the email campaign flow."
            
    # 1. Fetch enabled plugins for this user
    from sqlalchemy.orm import selectinload
    from sqlalchemy import select
    from models.plugins import UserPlugin
    from services.plugin_service import plugin_manager
    from config.database import AsyncSessionLocal
    
    try:
        async with AsyncSessionLocal() as async_db:
            stmt = (
                select(UserPlugin)
                .where(UserPlugin.user_id == user.id, UserPlugin.is_enabled == True)
                .options(selectinload(UserPlugin.plugin))
            )
            result = await async_db.execute(stmt)
            user_plugins = result.scalars().all()
    except Exception as e:
        logger.warning(f"Failed to check user plugins in assistant: {e}")
        user_plugins = []

    api_key = (settings.GROQ_API_KEY or "").strip()

    # 2. Build the Tool Registry dynamically
    tools = await build_tool_registry(user_plugins)
    logger.info(f"[AI Agent Router] Available tools: {[t['plugin_key'] for t in tools]}")
    
async def execute_assistant_plugin_tool(
    user: User,
    plugin_key: str,
    action: str,
    params: Dict[str, Any],
    query: str = "",
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Generic Plugin Execution Pipeline (Assistant / Voice -> Plugin -> DB -> UI).
    Shared by Typed Assistant (assistant_service.py) and Voice Assistant (voice_command_service.py).
    
    Flow:
    1. Loads plugin instance via plugin_manager
    2. Validates and collects required parameters (multi-turn if missing)
    3. Calls PluginMain.execute() to perform DB/business operation
    4. Formats success/failure response
    5. Returns clean navigation route if execution succeeds (or None if failure/more params needed)
    """
    from services.plugin_service import plugin_manager
    from config.database import AsyncSessionLocal

    try:
        plugin_instance = await plugin_manager._load_plugin_instance(plugin_key)
        if not plugin_instance:
            return {
                "success": False,
                "executed": False,
                "reply": f"Plugin '{plugin_key}' is not available.",
                "route": None,
                "intent": "PLUGIN_NOT_FOUND",
                "action": "NO_ACTION",
                "params": params
            }

        # 1. Find missing required parameters
        required_params = get_required_params(plugin_instance, action)
        missing_params = [p for p in required_params if p not in params or params[p] is None or params[p] == ""]
        
        param_order = {
            "recipients": 0, "subject": 1, "body": 2,
            "candidate_name": 3, "job_role": 4, "interview_date": 5, "interview_time": 6,
            "candidate_email": 7, "interviewer_name": 8
        }
        missing_params.sort(key=lambda p: param_order.get(p, 99))

        if missing_params:
            CONVERSATION_MEMORY[user.id] = {
                "plugin_key": plugin_key,
                "action": action,
                "pending_params": params,
                "missing": missing_params
            }
            logger.info(f"[Generic AI Tool Pipeline] Missing parameters for {plugin_key}:{action} -> {missing_params}")
            followup = get_followup_question(missing_params[0])
            return {
                "success": False,
                "executed": False,
                "needs_more_params": True,
                "reply": followup,
                "route": None,
                "intent": f"{plugin_key.upper()}_{action.upper()}",
                "action": "ASK_PARAM",
                "params": params
            }

        # 2. All required parameters present -> Execute Plugin Main!
        CONVERSATION_MEMORY.pop(user.id, None)
        logger.info(f"[Generic AI Tool Pipeline] Executing {plugin_key}:{action} with params: {json.dumps(params)}")

        t_start = time.monotonic()
        async with AsyncSessionLocal() as async_db:
            try:
                res = await plugin_manager.execute_plugin_action(
                    async_db, user.id, plugin_key, action, params
                )
            except HTTPException as he:
                if he.status_code == 404 or "not installed" in str(he.detail).lower():
                    logger.info(f"[Generic AI Tool Pipeline] Plugin '{plugin_key}' not enabled in DB for user {user.id}. Invoking PluginMain directly.")
                    context = {"user_id": user.id, "db": async_db}
                    if hasattr(plugin_instance, action):
                        action_method = getattr(plugin_instance, action)
                        res = await action_method(context, params)
                    else:
                        res = await plugin_instance.execute(action, params, context)
                else:
                    raise

        duration_ms = int((time.monotonic() - t_start) * 1000)
        logger.info(f"[Generic AI Tool Pipeline] Execution finished in {duration_ms}ms, Result: {json.dumps(res)}")

        res_data = res.get("result") if isinstance(res, dict) and "result" in res else res
        is_success = bool(res_data.get("success", True)) if isinstance(res_data, dict) else True

        # 3. Format Response & Navigation Route
        target_route = None
        formatted_reply = ""

        if is_success:
            plugin_routes = {
                "hr_interview_scheduler": "/dashboard/plugins/interview-scheduler",
                "sales_email_marketing": "/dashboard/plugins/email-marketing",
                "gmail": "/dashboard/plugins/gmail",
                "marketing_google_ads": "/dashboard/plugins/google-ads",
                "sales_live_chat": "/dashboard/plugins/live-chat",
                "marketing_linkedin": "/dashboard/plugins/linkedin-marketing",
            }
            target_route = plugin_routes.get(plugin_key, f"/dashboard/plugins/{plugin_key}")

            if plugin_key == "hr_interview_scheduler" and action == "schedule_interview":
                data = res_data.get("data", {}) if isinstance(res_data, dict) else {}
                cand = data.get("candidate_name") or params.get("candidate_name") or "Candidate"
                role = data.get("job_role") or params.get("job_role") or "Role"
                dt = data.get("interview_date") or params.get("interview_date") or "Date"
                tm = data.get("interview_time") or params.get("interview_time") or "Time"
                formatted_reply = (
                    f"✅ Interview scheduled successfully.\n\n"
                    f"Candidate: {cand}\n"
                    f"Role: {role}\n"
                    f"Date: {str(dt).capitalize()}\n"
                    f"Time: {tm}"
                )
            elif plugin_key == "hr_interview_scheduler" and action == "cancel_interview":
                int_id = params.get("interview_id") or params.get("id")
                formatted_reply = f"✅ Interview {int_id} has been cancelled successfully."
            elif plugin_key == "hr_interview_scheduler" and action == "reschedule_interview":
                int_id = params.get("interview_id") or params.get("id")
                dt = params.get("new_date") or params.get("interview_date")
                tm = params.get("new_time") or params.get("interview_time")
                formatted_reply = f"✅ Interview {int_id} has been rescheduled to {dt} at {tm}."
            else:
                api_key = (settings.GROQ_API_KEY or "").strip()
                formatted_reply = await format_generic_response(query, plugin_key, action, res, api_key)
        else:
            target_route = None
            error_detail = res_data.get("message") or res_data.get("error") if isinstance(res_data, dict) else str(res_data)
            formatted_reply = f"Interview could not be scheduled: {error_detail}"

        return {
            "success": is_success,
            "executed": True,
            "reply": formatted_reply,
            "route": target_route,
            "result": res_data,
            "intent": f"{plugin_key.upper()}_{action.upper()}",
            "action": "NAVIGATE" if (is_success and target_route) else "NO_ACTION",
            "params": params
        }
    except Exception as exc:
        logger.error(f"[Generic AI Tool Pipeline] Error executing plugin action: {exc}", exc_info=True)
        return {
            "success": False,
            "executed": False,
            "reply": f"Failed to execute action '{action}' on plugin '{plugin_key}'. Error: {str(exc)}",
            "route": None,
            "intent": "EXECUTION_ERROR",
            "action": "NO_ACTION",
            "params": params
        }


async def generate_response(query: str, db: Session, user: User) -> str:
    """
    Generate AI response with business context from Pinecone, semantic search, and live search data.
    Optimized for voice interaction - concise and conversational.
    Includes rate limit handling and automatic fallback to faster model.
    """
    # 0. Check for cancel intent
    if query.lower().strip() in ["cancel", "stop", "start over", "abort"]:
        if user.id in CONVERSATION_MEMORY:
            CONVERSATION_MEMORY.pop(user.id, None)
            return "Okay, I have cancelled the active flow."
            
    # 1. Fetch enabled plugins for this user
    from sqlalchemy.orm import selectinload
    from sqlalchemy import select
    from models.plugins import UserPlugin
    from services.plugin_service import plugin_manager
    from config.database import AsyncSessionLocal
    
    try:
        async with AsyncSessionLocal() as async_db:
            stmt = (
                select(UserPlugin)
                .where(UserPlugin.user_id == user.id, UserPlugin.is_enabled == True)
                .options(selectinload(UserPlugin.plugin))
            )
            result = await async_db.execute(stmt)
            user_plugins = result.scalars().all()
    except Exception as e:
        logger.warning(f"Failed to check user plugins in assistant: {e}")
        user_plugins = []

    api_key = (settings.GROQ_API_KEY or "").strip()

    # 2. Build the Tool Registry dynamically
    tools = await build_tool_registry(user_plugins)
    logger.info(f"[AI Agent Router] Available tools: {[t['plugin_key'] for t in tools]}")
    
    # 0.5. Check if user has an active pending parameter collection state
    if user.id in CONVERSATION_MEMORY:
        state = CONVERSATION_MEMORY[user.id]
        plugin_key = state["plugin_key"]
        action = state["action"]
        pending_params = state["pending_params"]
        missing = state["missing"]
        
        current_collect_param = missing[0]
        is_valid, parsed_val = validate_param_value(current_collect_param, query)
        if not is_valid:
            return parsed_val
            
        pending_params[current_collect_param] = parsed_val
        missing.pop(0)
        
        logger.info(f"[AI Agent Conversational] Collected '{current_collect_param}'. Remaining missing: {missing}")
        
        if missing:
            return get_followup_question(missing[0])
            
        # All parameters collected! Delegate to generic execution pipeline
        CONVERSATION_MEMORY.pop(user.id, None)
        tool_res = await execute_assistant_plugin_tool(user, plugin_key, action, pending_params, query)
        return tool_res.get("reply", "Action executed.")

    # 3. Perform tool selection
    tool_call = None
    
    # Try deterministic rule-based mapping first
    tool_call = rule_based_tool_classifier(query, tools)
    
    # If no deterministic match and we have an API Key, run LLM Tool Selection
    if not tool_call and tools and api_key:
        system_prompt = build_tool_selection_prompt(tools, query)
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": FALLBACK_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User Request: {query}"}
            ],
            "temperature": 0.0,
            "max_tokens": 200
        }
        try:
            content = await call_groq_api_with_retry(payload, headers, FALLBACK_MODEL, max_retries=2)
            if content:
                clean_content = content.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_content)
                if isinstance(data, dict) and data.get("is_tool_call"):
                    tool_call = data
        except Exception as e:
            logger.warning(f"LLM tool routing failed: {e}")

    # 4. If a tool call is resolved -> Delegate to generic execution pipeline
    if tool_call and isinstance(tool_call, dict) and tool_call.get("is_tool_call"):
        plugin_key = tool_call.get("plugin_key")
        action = tool_call.get("action")
        params = tool_call.get("params") or {}
        
        logger.info(
            f"[AI Agent Router] Selected Plugin: {plugin_key}, Action: {action}, "
            f"Params: {json.dumps(params)}"
        )
        
        tool_res = await execute_assistant_plugin_tool(user, plugin_key, action, params, query)
        return tool_res.get("reply", "Action executed.")
            
    # Get business context from Pinecone (NOT NeonDB)
    business_context_results = await get_business_context_from_pinecone(user.id, query, top_k=3)
    
    # Format business context from Pinecone
    business_context = ""
    if business_context_results:
        business_context = "Business Context:\n"
        for ctx in business_context_results:
            business_context += f"- {ctx['text']}\n"
    else:
        # Fallback to NeonDB if Pinecone has no data yet
        business_context = get_business_context(db, user)
    
    # Get relevant questions from Pinecone (semantic search)
    relevant_questions = await get_relevant_questions(user, query, top_k=3)
    
    # Get live search data
    search_data = await duck_search(query)
    
    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        logger.warning("Groq API key is not configured")
        return FALLBACK_MESSAGE

    # Build context-aware prompt with Pinecone data
    system_prompt = """You are the user's business and project AI assistant.

IMPORTANT RULES:
1. Answer both text and voice users with the same knowledge and accuracy
2. Keep responses concise and conversational by default, but include all directly relevant details when the user asks for business or project details
3. Use the user's business context, project context, and related questions to personalize responses
4. If asked about the business, project, plans, services, goals, website, competitors, analytics, or strategy, use the provided context first
5. If the answer is missing from context, say what is missing clearly instead of inventing it
6. Use live search data for market or general questions only when it adds value
7. Always relate answers back to the user's business or project when relevant
8. Be friendly, professional, and easy to understand when spoken aloud

Response style: Direct, helpful, and easy to understand when spoken aloud."""

    user_prompt = f"""User Query: {query}

USER'S BUSINESS CONTEXT:
{business_context}

{relevant_questions if relevant_questions else ""}

LIVE MARKET DATA:
{search_data if search_data else "No live data available"}

Provide a helpful, concise response that addresses the query using the business context, related questions, and live data."""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # Try primary model first
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        "temperature": 0.7,
        "max_tokens": 500,  # Limit for concise voice responses
    }

    logger.info(f"Attempting to generate response with primary model: {GROQ_MODEL}")
    content = await call_groq_api_with_retry(payload, headers, GROQ_MODEL, max_retries=2)
    
    # If primary model failed, try fallback model
    if not content:
        logger.warning(f"Primary model failed, trying fallback model: {FALLBACK_MODEL}")
        payload["model"] = FALLBACK_MODEL
        content = await call_groq_api_with_retry(payload, headers, FALLBACK_MODEL, max_retries=2)
    
    # Return content or fallback message
    if content:
        return content
    else:
        logger.error("All attempts to generate response failed")
        return "I'm experiencing high demand right now. Please try again in a moment."
