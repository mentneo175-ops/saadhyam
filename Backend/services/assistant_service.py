import logging
import asyncio
import json
from typing import Optional

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


async def generate_response(query: str, db: Session, user: User) -> str:
    """
    Generate AI response with business context from Pinecone, semantic search, and live search data.
    Optimized for voice interaction - concise and conversational.
    Includes rate limit handling and automatic fallback to faster model.
    """
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
