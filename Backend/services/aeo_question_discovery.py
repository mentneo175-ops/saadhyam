"""
AEO Question Discovery Service
Discovers AI-search questions related to business
Uses Gemini API with Google Search grounding for real data
Enhanced with Pinecone vector search for semantic matching
"""

import logging
import os
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.aeo_geo_models import AEOQuestion
from models.user import User
from db.models import BusinessAnalysis
import json
import google.generativeai as genai
from sqlalchemy import or_
from services.rate_limiter import gemini_rate_limiter
from services.vector_storage_service import vector_storage
from services.embedding_service import compute_similarity
from config.pinecone_config import NAMESPACE_AEO_QUESTIONS

logger = logging.getLogger(__name__)


def normalize_search_volume(value: Any) -> Optional[int]:
    """Convert Gemini search volume output into an integer for database storage."""

    if value is None:
        return None

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        return int(value)

    text = str(value).strip().lower()
    if not text:
        return None

    label_map = {
        "low": 300,
        "medium": 1000,
        "high": 2000,
        "very low": 100,
        "very high": 5000,
    }

    if text in label_map:
        return label_map[text]

    digits = "".join(ch for ch in text if ch.isdigit())
    if digits:
        try:
            return int(digits)
        except ValueError:
            return None

    return None


def normalize_text_field(value: Any, max_length: int) -> str:
    """Normalize arbitrary Gemini text into a bounded database-safe string."""

    text = "" if value is None else str(value).strip()
    if len(text) <= max_length:
        return text
    return text[:max_length].rstrip()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


async def discover_questions(
    user: User,
    db: AsyncSession,
    limit: int = 20
) -> Dict[str, Any]:
    """
    Discover AI-search questions for business using Gemini API with Google Search grounding
    
    Args:
        user: User object
        db: Database session
        limit: Maximum number of questions to discover
    
    Returns:
        Dict with discovered questions
    """
    
    try:
        logger.info(f"[AEOQuestionDiscovery] Discovering questions for user {user.id}")

        rate_limit_snapshot = {
            "remaining_requests": gemini_rate_limiter.get_remaining_requests(),
            "reset_in_seconds": round(gemini_rate_limiter.get_reset_time() or 0, 1),
        }
        
        # Get business analysis
        analysis_stmt = (
            select(BusinessAnalysis)
            .where(
                BusinessAnalysis.user_id == user.id,
                BusinessAnalysis.analysis_status == 'completed'
            )
            .order_by(BusinessAnalysis.last_analyzed_at.desc())
            .limit(1)
        )
        analysis_result = await db.execute(analysis_stmt)
        analysis = analysis_result.scalars().first()
        
        if not analysis:
            return {
                "status": "error",
                "message": "No business analysis found. Please run business analysis first."
            }
        
        business_type = analysis.business_type or user.business_type or "business"
        location = analysis.location or user.business_location or "your area"
        business_name = analysis.business_name or user.business_name or "Business"
        
        # Check if we should use Gemini API or mock data
        use_gemini = GEMINI_API_KEY and GEMINI_API_KEY != "your_google_ai_studio_api_key_here"
        
        if use_gemini:
            logger.info(f"[AEOQuestionDiscovery] Using Gemini API with Google Search grounding")
            questions = await discover_questions_with_gemini(business_name, business_type, location, limit)
        else:
            logger.info(f"[AEOQuestionDiscovery] Using mock data (no Gemini API key)")
            questions = generate_mock_questions(business_type, location, limit)
        
        # Store questions in database
        stored_questions = []
        vectors_to_store = []
        
        for q in questions:
            # Check if question already exists
            category = normalize_text_field(q.get("category"), 100)
            intent = normalize_text_field(q.get("intent"), 100)
            source = normalize_text_field(q.get("source"), 100)

            existing_stmt = (
                select(AEOQuestion)
                .where(
                    AEOQuestion.user_id == user.id,
                    AEOQuestion.question == q['question']
                )
                .limit(1)
            )
            existing_result = await db.execute(existing_stmt)
            existing = existing_result.scalars().first()
            
            if not existing:
                new_question = AEOQuestion(
                    user_id=user.id,
                    question=q['question'],
                    category=category,
                    intent=intent,
                    source=source,
                    search_volume=normalize_search_volume(q.get('search_volume')),
                    difficulty=q.get('difficulty'),
                    priority=q.get('priority', 0)
                )
                db.add(new_question)
                await db.flush()  # Get the ID
                
                stored_questions.append(q)
                
                # Prepare for Pinecone storage
                vectors_to_store.append({
                    'id': f"user_{user.id}_question_{new_question.id}",
                    'text': q['question'],
                    'metadata': {
                        'user_id': user.id,
                        'question_id': new_question.id,
                        'category': category,
                        'intent': intent,
                        'priority': q.get('priority', 0),
                        'source': source
                    }
                })
        
        await db.commit()
        
        # Store in Pinecone for semantic search
        if vectors_to_store and vector_storage.enabled:
            logger.info(f"[AEOQuestionDiscovery] Storing {len(vectors_to_store)} questions in Pinecone...")
            vector_storage.store_vectors_batch(vectors_to_store, NAMESPACE_AEO_QUESTIONS)
        
        logger.info(f"[AEOQuestionDiscovery] ✅ Discovered {len(stored_questions)} new questions")
        
        return {
            "status": "success",
            "questions": questions,
            "new_questions_count": len(stored_questions),
            "total_questions_count": len(questions),
            "source": "gemini_search_grounding" if use_gemini else "mock",
            "pinecone_enabled": vector_storage.enabled,
            "rate_limit": rate_limit_snapshot,
        }
        
    except Exception as e:
        logger.error(f"[AEOQuestionDiscovery] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to discover questions: {str(e)}",
            "rate_limit": {
                "remaining_requests": gemini_rate_limiter.get_remaining_requests(),
                "reset_in_seconds": round(gemini_rate_limiter.get_reset_time() or 0, 1),
            },
        }


async def discover_questions_with_gemini(
    business_name: str,
    business_type: str,
    location: str,
    limit: int
) -> List[Dict[str, Any]]:
    """
    Discover real questions using Gemini API with Google Search grounding
    """
    
    try:
        # Create prompt for Gemini with search grounding
        prompt = f"""
You are an expert in AI search behavior and question discovery.

Using Google Search, find the most common questions people ask about {business_type} businesses in {location}.

Business Context:
- Business Name: {business_name}
- Business Type: {business_type}
- Location: {location}

Search for and identify:
1. Questions people ask on Google about this type of business
2. "People Also Ask" questions
3. Common voice search queries
4. Local search queries
5. Comparison questions
6. Buying intent questions

For each question, provide:
- The exact question text
- Category (informational, transactional, local, comparison, buying_intent)
- Intent (what the user wants to know)
- Estimated search volume (low=100-500, medium=500-1500, high=1500+)
- Difficulty score (0-100, how competitive the question is)
- Priority (1-10, how important for this business)

Return EXACTLY {limit} questions in JSON format:
[
  {{
    "question": "...",
    "category": "...",
    "intent": "...",
    "search_volume": 1200,
    "difficulty": 65,
    "priority": 9
  }},
  ...
]

Focus on questions that:
- Are actually being searched on Google
- Are relevant to {business_type} in {location}
- Would help the business appear in AI engine responses
- Have good search volume and business value
"""
        
        # Apply rate limiting (5 requests per minute)
        await gemini_rate_limiter.acquire()
        
        remaining = gemini_rate_limiter.get_remaining_requests()
        logger.info(f"[AEOQuestionDiscovery] 🔒 Rate limit check passed. Remaining requests: {remaining}/5")
        
        # Try primary model first (Gemini 2.5 Flash)
        try:
            model = genai.GenerativeModel(
                'models/gemini-2.5-flash',
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 8192,
                }
            )
            
            # Enable Google Search grounding
            response = model.generate_content(
                prompt,
                tools='google_search'  # This enables Google Search grounding
            )
            
            content_text = response.text
            
        except Exception as e:
            logger.warning(f"[AEOQuestionDiscovery] google_search grounding failed, retrying without grounding: {e}")

            response = model.generate_content(prompt)
            content_text = response.text
        
        # Parse JSON response
        content_text = content_text.strip()
        if content_text.startswith('```json'):
            content_text = content_text[7:]
        if content_text.startswith('```'):
            content_text = content_text[3:]
        if content_text.endswith('```'):
            content_text = content_text[:-3]
        content_text = content_text.strip()
        
        questions_data = json.loads(content_text)
        
        # Add source field
        for q in questions_data:
            q['source'] = 'gemini_search_grounding'
        
        logger.info(f"[AEOQuestionDiscovery] ✅ Discovered {len(questions_data)} questions using Gemini + Google Search")
        
        return questions_data
        
    except Exception as e:
        logger.error(f"[AEOQuestionDiscovery] ❌ Gemini API error: {e}", exc_info=True)
        logger.warning(f"[AEOQuestionDiscovery] Falling back to mock data")
        # Fallback to mock data
        return generate_mock_questions(business_type, location, limit)


def generate_mock_questions(business_type: str, location: str, limit: int) -> List[Dict[str, Any]]:
    """Generate mock questions based on business type"""
    
    business_type_lower = business_type.lower()
    
    # Base questions that work for any business
    base_questions = [
        {
            "question": f"What are the best {business_type} in {location}?",
            "category": "comparison",
            "intent": "find local business",
            "source": "mock",
            "search_volume": 1200,
            "difficulty": 65,
            "priority": 10
        },
        {
            "question": f"How to choose a good {business_type} in {location}?",
            "category": "informational",
            "intent": "research",
            "source": "mock",
            "search_volume": 800,
            "difficulty": 55,
            "priority": 8
        },
        {
            "question": f"What services does a {business_type} offer?",
            "category": "informational",
            "intent": "learn about services",
            "source": "mock",
            "search_volume": 950,
            "difficulty": 45,
            "priority": 7
        },
        {
            "question": f"How much does a {business_type} cost in {location}?",
            "category": "transactional",
            "intent": "pricing information",
            "source": "mock",
            "search_volume": 1500,
            "difficulty": 70,
            "priority": 9
        },
        {
            "question": f"Is {business_type} worth it?",
            "category": "informational",
            "intent": "evaluate value",
            "source": "mock",
            "search_volume": 600,
            "difficulty": 50,
            "priority": 6
        }
    ]
    
    # Industry-specific questions
    industry_questions = []
    
    if 'restaurant' in business_type_lower or 'food' in business_type_lower:
        industry_questions = [
            {
                "question": f"What are the best dishes at {business_type} in {location}?",
                "category": "informational",
                "intent": "menu information",
                "source": "mock",
                "search_volume": 700,
                "difficulty": 60,
                "priority": 8
            },
            {
                "question": f"Does {business_type} in {location} offer delivery?",
                "category": "transactional",
                "intent": "service availability",
                "source": "mock",
                "search_volume": 900,
                "difficulty": 40,
                "priority": 7
            },
            {
                "question": f"What are the hours for {business_type} in {location}?",
                "category": "local",
                "intent": "business hours",
                "source": "mock",
                "search_volume": 1100,
                "difficulty": 35,
                "priority": 9
            }
        ]
    elif 'salon' in business_type_lower or 'beauty' in business_type_lower:
        industry_questions = [
            {
                "question": f"What beauty services are available at {business_type} in {location}?",
                "category": "informational",
                "intent": "service offerings",
                "source": "mock",
                "search_volume": 650,
                "difficulty": 55,
                "priority": 8
            },
            {
                "question": f"How to book an appointment at {business_type} in {location}?",
                "category": "transactional",
                "intent": "booking",
                "source": "mock",
                "search_volume": 850,
                "difficulty": 45,
                "priority": 9
            },
            {
                "question": f"What are the prices for {business_type} services in {location}?",
                "category": "transactional",
                "intent": "pricing",
                "source": "mock",
                "search_volume": 1000,
                "difficulty": 65,
                "priority": 10
            }
        ]
    elif 'retail' in business_type_lower or 'shop' in business_type_lower:
        industry_questions = [
            {
                "question": f"What products does {business_type} sell in {location}?",
                "category": "informational",
                "intent": "product catalog",
                "source": "mock",
                "search_volume": 750,
                "difficulty": 50,
                "priority": 8
            },
            {
                "question": f"Does {business_type} in {location} offer online shopping?",
                "category": "transactional",
                "intent": "shopping options",
                "source": "mock",
                "search_volume": 900,
                "difficulty": 40,
                "priority": 7
            },
            {
                "question": f"What are the return policies at {business_type} in {location}?",
                "category": "informational",
                "intent": "policies",
                "source": "mock",
                "search_volume": 500,
                "difficulty": 45,
                "priority": 6
            }
        ]
    else:
        industry_questions = [
            {
                "question": f"What makes {business_type} in {location} different?",
                "category": "comparison",
                "intent": "differentiation",
                "source": "mock",
                "search_volume": 600,
                "difficulty": 55,
                "priority": 7
            },
            {
                "question": f"How long has {business_type} been in {location}?",
                "category": "informational",
                "intent": "business history",
                "source": "mock",
                "search_volume": 400,
                "difficulty": 30,
                "priority": 5
            },
            {
                "question": f"What do customers say about {business_type} in {location}?",
                "category": "informational",
                "intent": "reviews",
                "source": "mock",
                "search_volume": 800,
                "difficulty": 60,
                "priority": 8
            }
        ]
    
    # Voice search questions
    voice_questions = [
        {
            "question": f"Hey Google, find me a {business_type} near me",
            "category": "local",
            "intent": "voice search",
            "source": "mock",
            "search_volume": 2000,
            "difficulty": 75,
            "priority": 10
        },
        {
            "question": f"Alexa, what's the best {business_type} in {location}?",
            "category": "comparison",
            "intent": "voice search",
            "source": "mock",
            "search_volume": 1800,
            "difficulty": 70,
            "priority": 9
        }
    ]
    
    # Combine all questions
    all_questions = base_questions + industry_questions + voice_questions
    
    # Sort by priority and limit
    all_questions.sort(key=lambda x: x['priority'], reverse=True)
    
    return all_questions[:limit]


async def get_discovered_questions(
    user: User,
    db: AsyncSession,
    category: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get discovered questions from database
    
    Args:
        user: User object
        db: Database session
        category: Filter by category (optional)
        limit: Maximum number of questions
    
    Returns:
        List of questions
    """
    
    try:
        stmt = select(AEOQuestion).where(AEOQuestion.user_id == user.id)

        if category:
            stmt = stmt.where(AEOQuestion.category == category)

        stmt = stmt.order_by(AEOQuestion.priority.desc()).limit(limit)
        result = await db.execute(stmt)
        questions = result.scalars().all()
        
        return [
            {
                "id": q.id,
                "question": q.question,
                "category": q.category,
                "intent": q.intent,
                "source": q.source,
                "search_volume": q.search_volume,
                "difficulty": q.difficulty,
                "priority": q.priority,
                "status": q.status,
                "created_at": q.created_at.isoformat() if q.created_at else None
            }
            for q in questions
        ]
        
    except Exception as e:
        logger.error(f"[AEOQuestionDiscovery] ❌ Error getting questions: {e}", exc_info=True)
        return []


async def search_similar_questions(
    user: User,
    query_text: str,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Search for similar questions using Pinecone semantic search
    
    Args:
        user: User object
        query_text: Query text to search for
        top_k: Number of results to return
    
    Returns:
        List of similar questions with similarity scores
    """
    
    if not vector_storage.enabled:
        logger.warning("[AEOQuestionDiscovery] Pinecone not enabled, semantic search unavailable")
        return []
    
    try:
        logger.info(f"[AEOQuestionDiscovery] Searching for similar questions: {query_text}")
        
        # Search Pinecone with user filter
        results = vector_storage.search_similar(
            query_text=query_text,
            namespace=NAMESPACE_AEO_QUESTIONS,
            top_k=top_k,
            filter_dict={'user_id': user.id}
        )

        if results:
            logger.info(f"[AEOQuestionDiscovery] ✅ Found {len(results)} similar questions in Pinecone")
            return results

        logger.info("[AEOQuestionDiscovery] Pinecone returned no matches, falling back to database search")

        fallback_stmt = select(AEOQuestion).where(AEOQuestion.user_id == user.id)
        fallback_result = await db.execute(fallback_stmt)
        db_questions = fallback_result.scalars().all()

        scored_results = []
        query_lower = query_text.lower().strip()

        for question in db_questions:
            candidate_text = " ".join(
                part for part in [question.question, question.intent or "", question.category or ""] if part
            )
            similarity = compute_similarity(query_text, candidate_text)

            # If embeddings are unavailable or weak, give a small boost for keyword overlap.
            overlap_tokens = set(query_lower.split()) & set(candidate_text.lower().split())
            overlap_boost = min(0.25, len(overlap_tokens) * 0.05)
            final_score = max(similarity, overlap_boost)

            if final_score > 0:
                scored_results.append({
                    "id": f"db_question_{question.id}",
                    "score": final_score,
                    "text": question.question,
                    "metadata": {
                        "category": question.category,
                        "intent": question.intent,
                        "priority": question.priority,
                        "source": question.source,
                        "fallback": "database",
                    },
                })

        scored_results.sort(key=lambda item: item["score"], reverse=True)
        fallback_results = scored_results[:top_k]

        logger.info(f"[AEOQuestionDiscovery] ✅ Found {len(fallback_results)} similar questions from database fallback")
        return fallback_results
        
    except Exception as e:
        logger.error(f"[AEOQuestionDiscovery] ❌ Error searching similar questions: {e}", exc_info=True)
        return []
