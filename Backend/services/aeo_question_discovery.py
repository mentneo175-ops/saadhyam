"""
AEO Question Discovery Service
Discovers AI-search questions related to business
Uses Gemini API with Google Search grounding for real data
Enhanced with Pinecone vector search for semantic matching
"""

import logging
import os
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from db.aeo_geo_models import AEOQuestion
from models.user import User
from db.models import BusinessAnalysis
import json
import google.generativeai as genai
from services.rate_limiter import gemini_rate_limiter
from services.vector_storage_service import vector_storage
from config.pinecone_config import NAMESPACE_AEO_QUESTIONS

logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


async def discover_questions(
    user: User,
    db: Session,
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
        
        # Get business analysis
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user.id,
            BusinessAnalysis.analysis_status == 'completed'
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
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
            existing = db.query(AEOQuestion).filter(
                AEOQuestion.user_id == user.id,
                AEOQuestion.question == q['question']
            ).first()
            
            if not existing:
                new_question = AEOQuestion(
                    user_id=user.id,
                    question=q['question'],
                    category=q['category'],
                    intent=q['intent'],
                    source=q['source'],
                    search_volume=q.get('search_volume'),
                    difficulty=q.get('difficulty'),
                    priority=q.get('priority', 0)
                )
                db.add(new_question)
                db.flush()  # Get the ID
                
                stored_questions.append(q)
                
                # Prepare for Pinecone storage
                vectors_to_store.append({
                    'id': f"user_{user.id}_question_{new_question.id}",
                    'text': q['question'],
                    'metadata': {
                        'user_id': user.id,
                        'question_id': new_question.id,
                        'category': q['category'],
                        'intent': q['intent'],
                        'priority': q.get('priority', 0),
                        'source': q['source']
                    }
                })
        
        db.commit()
        
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
            "pinecone_enabled": vector_storage.enabled
        }
        
    except Exception as e:
        logger.error(f"[AEOQuestionDiscovery] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to discover questions: {str(e)}"
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
                tools='google_search_retrieval'  # This enables Google Search grounding
            )
            
            content_text = response.text
            
        except Exception as e:
            logger.warning(f"[AEOQuestionDiscovery] Primary model failed, trying fallback: {e}")
            
            # Apply rate limiting for fallback request too
            await gemini_rate_limiter.acquire()
            
            # Fallback to Gemini 1.5 Flash
            model = genai.GenerativeModel(
                'models/gemini-1.5-flash',
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 8192,
                }
            )
            
            response = model.generate_content(
                prompt,
                tools='google_search_retrieval'
            )
            
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
    db: Session,
    category: str = None,
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
        query = db.query(AEOQuestion).filter(AEOQuestion.user_id == user.id)
        
        if category:
            query = query.filter(AEOQuestion.category == category)
        
        questions = query.order_by(AEOQuestion.priority.desc()).limit(limit).all()
        
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
        
        logger.info(f"[AEOQuestionDiscovery] ✅ Found {len(results)} similar questions")
        
        return results
        
    except Exception as e:
        logger.error(f"[AEOQuestionDiscovery] ❌ Error searching similar questions: {e}", exc_info=True)
        return []
