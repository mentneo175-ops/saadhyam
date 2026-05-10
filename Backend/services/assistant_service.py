import logging

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
GROQ_TIMEOUT_SECONDS = 20.0
GROQ_MODEL = "llama-3.3-70b-versatile"  # Updated to latest model
FALLBACK_MESSAGE = "I could not find enough information right now. Please try again with more details."


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
        
        # SWOT Analysis
        if analysis.strengths:
            context_parts.append(f"Strengths: {', '.join(analysis.strengths[:3])}")
        if analysis.weaknesses:
            context_parts.append(f"Weaknesses: {', '.join(analysis.weaknesses[:2])}")
        if analysis.opportunities:
            context_parts.append(f"Opportunities: {', '.join(analysis.opportunities[:2])}")
        
        # Target audience
        if analysis.target_audience:
            context_parts.append(f"Target Audience: {analysis.target_audience.get('description', 'Not specified')}")
        
        # USPs
        if analysis.unique_selling_points:
            context_parts.append(f"USPs: {', '.join(analysis.unique_selling_points[:2])}")
        
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


async def generate_response(query: str, db: Session, user: User) -> str:
    """
    Generate AI response with business context from Pinecone, semantic search, and live search data.
    Optimized for voice interaction - concise and conversational.
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
    system_prompt = """You are a smart business AI assistant with voice interaction capabilities.

IMPORTANT RULES:
1. Keep responses CONCISE and CONVERSATIONAL (2-3 sentences max for voice)
2. Use the user's business context to personalize responses
3. Use related questions to provide more relevant answers
4. Provide actionable insights and recommendations
5. Be friendly and professional
6. If asked about business details, use the provided business context
7. For market/general queries, use the live search data
8. Always relate answers back to the user's business when relevant

Response style: Direct, helpful, and easy to understand when spoken aloud."""

    user_prompt = f"""User Query: {query}

USER'S BUSINESS CONTEXT:
{business_context}

{relevant_questions if relevant_questions else ""}

LIVE MARKET DATA:
{search_data if search_data else "No live data available"}

Provide a helpful, concise response that addresses the query using the business context, related questions, and live data."""

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

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        timeout = httpx.Timeout(GROQ_TIMEOUT_SECONDS)
        async with httpx.AsyncClient(timeout=timeout) as client:
            logger.info(f"Sending request to Groq API with model: {GROQ_MODEL}")
            response = await client.post(GROQ_API_URL, json=payload, headers=headers)
            
            # Log response details for debugging
            logger.info(f"Groq API response status: {response.status_code}")
            
            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"Groq API error response: {error_detail}")
            
            response.raise_for_status()

        data = response.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        
        logger.info(f"Groq API response received: {content[:100]}...")
        return content or FALLBACK_MESSAGE
    except httpx.TimeoutException:
        logger.warning("Groq request timed out")
    except httpx.HTTPError as exc:
        logger.warning("Groq request failed: %s", exc)
        # Try to get more details from response
        if hasattr(exc, 'response') and exc.response is not None:
            try:
                error_data = exc.response.json()
                logger.error(f"Groq API error details: {error_data}")
            except:
                logger.error(f"Groq API error text: {exc.response.text}")
    except Exception as exc:
        logger.warning("Unexpected Groq error: %s", exc)

    return FALLBACK_MESSAGE
