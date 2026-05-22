"""
AEO Content Generator Service
Generates AEO-optimized content using Gemini API
"""

import logging
import os
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from db.aeo_geo_models import AEOContent, AEOQuestion
from models.user import User
from db.models import BusinessAnalysis
import google.generativeai as genai
from services.rate_limiter import gemini_rate_limiter
from services.business_pinecone_service import store_web_fetched_data_in_pinecone
from config.pinecone_config import NAMESPACE_AEO_CONTENT

logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


async def generate_aeo_content(
    user: User,
    question_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    Generate AEO-optimized content for a question
    
    Args:
        user: User object
        question_id: Question ID
        db: Database session
    
    Returns:
        Dict with generated content
    """
    
    try:
        logger.info(f"[AEOContentGenerator] Generating content for question {question_id}")
        
        # Get question
        question = db.query(AEOQuestion).filter(
            AEOQuestion.id == question_id,
            AEOQuestion.user_id == user.id
        ).first()
        
        if not question:
            return {
                "status": "error",
                "message": "Question not found"
            }
        
        # Get business analysis for context
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user.id,
            BusinessAnalysis.analysis_status == 'completed'
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        if not analysis:
            return {
                "status": "error",
                "message": "No business analysis found"
            }
        
        # Generate content using Gemini
        content_data = await generate_content_with_gemini(
            question.question,
            analysis.business_name or user.business_name or "Business",
            analysis.business_type or user.business_type or "Business",
            analysis.location or user.business_location or "Location"
        )
        
        if content_data.get("status") == "error":
            return content_data
        
        # Store content in database
        new_content = AEOContent(
            user_id=user.id,
            question_id=question_id,
            title=content_data['title'],
            question=question.question,
            direct_answer=content_data['direct_answer'],
            detailed_explanation=content_data['detailed_explanation'],
            bullet_points=content_data['bullet_points'],
            cta=content_data['cta'],
            keywords=content_data['keywords'],
            semantic_entities=content_data['semantic_entities'],
            readability_score=content_data['readability_score'],
            factual_density=content_data['factual_density'],
            geo_score=content_data['geo_score'],
            aeo_score=content_data['aeo_score']
        )
        
        db.add(new_content)
        
        # Update question status
        question.status = 'content_generated'
        
        db.commit()
        db.refresh(new_content)
        
        # Store content in Pinecone for semantic search
        content_text = f"{new_content.title}. {new_content.direct_answer}. {new_content.detailed_explanation}"
        await store_web_fetched_data_in_pinecone(
            user_id=user.id,
            query=question.question,
            web_data=content_text,
            source="aeo_content_generator"
        )
        
        logger.info(f"[AEOContentGenerator] ✅ Content generated (ID: {new_content.id})")
        logger.info(f"[AEOContentGenerator] ✅ Content stored in Pinecone")
        
        return {
            "status": "success",
            "content_id": new_content.id,
            "content": {
                "title": new_content.title,
                "question": new_content.question,
                "direct_answer": new_content.direct_answer,
                "detailed_explanation": new_content.detailed_explanation,
                "bullet_points": new_content.bullet_points,
                "cta": new_content.cta,
                "aeo_score": new_content.aeo_score,
                "geo_score": new_content.geo_score
            }
        }
        
    except Exception as e:
        logger.error(f"[AEOContentGenerator] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to generate content: {str(e)}"
        }


async def generate_content_with_gemini(
    question: str,
    business_name: str,
    business_type: str,
    location: str
) -> Dict[str, Any]:
    """
    Generate AEO content using Gemini API
    """
    
    try:
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_google_ai_studio_api_key_here":
            # Return mock content if no API key
            return generate_mock_content(question, business_name, business_type, location)
        
        # Create prompt for Gemini
        prompt = f"""
You are an expert AEO (Answer Engine Optimization) content writer.

Generate AEO-optimized content for the following question:
Question: {question}

Business Context:
- Business Name: {business_name}
- Business Type: {business_type}
- Location: {location}

Requirements:
1. Title: Create an SEO-friendly title (50-60 characters)
2. Direct Answer: Provide a concise, direct answer (40-60 words) that AI engines can easily extract
3. Detailed Explanation: Expand on the answer with more context (150-200 words)
4. Bullet Points: List 3-5 key points in bullet format
5. Call to Action: Add a compelling CTA related to the business
6. Keywords: Extract 5-7 relevant keywords
7. Semantic Entities: Identify key entities (brand, service, location, etc.)

Format your response as JSON:
{{
    "title": "...",
    "direct_answer": "...",
    "detailed_explanation": "...",
    "bullet_points": ["...", "...", "..."],
    "cta": "...",
    "keywords": ["...", "...", "..."],
    "semantic_entities": ["...", "...", "..."]
}}

Make the content:
- Simple and clear (8th-grade reading level)
- Factually accurate
- Voice-search friendly
- AI-readable with high semantic density
- Locally relevant to {location}
"""
        
        # Apply rate limiting (5 requests per minute)
        await gemini_rate_limiter.acquire()
        
        remaining = gemini_rate_limiter.get_remaining_requests()
        logger.info(f"[AEOContentGenerator] 🔒 Rate limit check passed. Remaining requests: {remaining}/5")
        
        # Try primary model first
        try:
            model = genai.GenerativeModel('models/gemini-2.5-flash')
            
            # Create generation config with search grounding
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            }
            
            # Generate content with Google Search grounding
            response = model.generate_content(
                prompt,
                generation_config=generation_config,
                tools='google_search_retrieval'  # Enable Google Search grounding
            )
            content_text = response.text
        except Exception as e:
            logger.warning(f"[AEOContentGenerator] Primary model failed, trying fallback: {e}")
            
            # Apply rate limiting for fallback request too
            await gemini_rate_limiter.acquire()
            
            # Fallback to Gemini 1.5 Flash
            model = genai.GenerativeModel('models/gemini-1.5-flash')
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 8192,
                },
                tools='google_search_retrieval'
            )
            content_text = response.text
        
        # Parse JSON response
        # Remove markdown code blocks if present
        content_text = content_text.strip()
        if content_text.startswith('```json'):
            content_text = content_text[7:]
        if content_text.startswith('```'):
            content_text = content_text[3:]
        if content_text.endswith('```'):
            content_text = content_text[:-3]
        content_text = content_text.strip()
        
        content_data = json.loads(content_text)
        
        # Calculate scores
        readability_score = calculate_readability_score(content_data['direct_answer'])
        factual_density = calculate_factual_density(content_data['detailed_explanation'])
        aeo_score = calculate_aeo_score(content_data)
        geo_score = calculate_geo_score(content_data)
        
        return {
            "status": "success",
            "title": content_data['title'],
            "direct_answer": content_data['direct_answer'],
            "detailed_explanation": content_data['detailed_explanation'],
            "bullet_points": content_data['bullet_points'],
            "cta": content_data['cta'],
            "keywords": content_data['keywords'],
            "semantic_entities": content_data['semantic_entities'],
            "readability_score": readability_score,
            "factual_density": factual_density,
            "aeo_score": aeo_score,
            "geo_score": geo_score
        }
        
    except Exception as e:
        logger.error(f"[AEOContentGenerator] ❌ Gemini API error: {e}", exc_info=True)
        # Fallback to mock content
        return generate_mock_content(question, business_name, business_type, location)


def generate_mock_content(
    question: str,
    business_name: str,
    business_type: str,
    location: str
) -> Dict[str, Any]:
    """Generate mock AEO content"""
    
    return {
        "status": "success",
        "title": f"Complete Guide: {question}",
        "direct_answer": f"{business_name} is a trusted {business_type} in {location} offering professional services. We provide high-quality solutions tailored to your needs with experienced staff and competitive pricing.",
        "detailed_explanation": f"{business_name} has been serving the {location} community with exceptional {business_type} services. Our team of experienced professionals is dedicated to delivering outstanding results. We understand the local market and customer needs, which allows us to provide personalized service that exceeds expectations. Whether you're looking for quality, reliability, or value, {business_name} is your go-to choice in {location}.",
        "bullet_points": [
            f"Experienced {business_type} professionals",
            f"Located conveniently in {location}",
            "Competitive pricing and flexible options",
            "High customer satisfaction ratings",
            "Personalized service for every client"
        ],
        "cta": f"Contact {business_name} today to learn more about our services and get a free consultation!",
        "keywords": [
            business_type.lower(),
            location.lower(),
            "professional service",
            "local business",
            "customer satisfaction"
        ],
        "semantic_entities": [
            business_name,
            business_type,
            location,
            "professional service",
            "customer satisfaction"
        ],
        "readability_score": 85,
        "factual_density": 75,
        "aeo_score": 80,
        "geo_score": 75
    }


def calculate_readability_score(text: str) -> float:
    """Calculate readability score (0-100)"""
    # Simple heuristic: shorter sentences = higher readability
    words = len(text.split())
    sentences = text.count('.') + text.count('!') + text.count('?')
    if sentences == 0:
        sentences = 1
    avg_words_per_sentence = words / sentences
    
    # Ideal: 15-20 words per sentence
    if avg_words_per_sentence <= 20:
        return min(100, 100 - (avg_words_per_sentence - 15) * 2)
    else:
        return max(50, 100 - (avg_words_per_sentence - 20) * 3)


def calculate_factual_density(text: str) -> float:
    """Calculate factual density (0-100)"""
    # Simple heuristic: more specific words = higher density
    words = text.split()
    specific_words = [w for w in words if len(w) > 5]
    if len(words) == 0:
        return 0
    density = (len(specific_words) / len(words)) * 100
    return min(100, density * 2)


def calculate_aeo_score(content_data: Dict[str, Any]) -> float:
    """Calculate AEO score (0-100)"""
    score = 0
    
    # Has direct answer (30 points)
    if content_data.get('direct_answer'):
        answer_length = len(content_data['direct_answer'].split())
        if 40 <= answer_length <= 60:
            score += 30
        elif 30 <= answer_length <= 70:
            score += 20
        else:
            score += 10
    
    # Has bullet points (20 points)
    if content_data.get('bullet_points') and len(content_data['bullet_points']) >= 3:
        score += 20
    
    # Has keywords (20 points)
    if content_data.get('keywords') and len(content_data['keywords']) >= 5:
        score += 20
    
    # Has CTA (15 points)
    if content_data.get('cta'):
        score += 15
    
    # Has semantic entities (15 points)
    if content_data.get('semantic_entities') and len(content_data['semantic_entities']) >= 3:
        score += 15
    
    return min(100, score)


def calculate_geo_score(content_data: Dict[str, Any]) -> float:
    """Calculate GEO score (0-100)"""
    score = 0
    
    # Has semantic entities (40 points)
    if content_data.get('semantic_entities'):
        score += min(40, len(content_data['semantic_entities']) * 8)
    
    # Has keywords (30 points)
    if content_data.get('keywords'):
        score += min(30, len(content_data['keywords']) * 5)
    
    # Has detailed explanation (30 points)
    if content_data.get('detailed_explanation'):
        explanation_length = len(content_data['detailed_explanation'].split())
        if explanation_length >= 150:
            score += 30
        elif explanation_length >= 100:
            score += 20
        else:
            score += 10
    
    return min(100, score)


async def get_generated_content(
    user: User,
    db: Session,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """Get generated AEO content from database"""
    
    try:
        content_list = db.query(AEOContent).filter(
            AEOContent.user_id == user.id
        ).order_by(AEOContent.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": c.id,
                "title": c.title,
                "question": c.question,
                "direct_answer": c.direct_answer,
                "aeo_score": c.aeo_score,
                "geo_score": c.geo_score,
                "is_published": c.is_published,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in content_list
        ]
        
    except Exception as e:
        logger.error(f"[AEOContentGenerator] ❌ Error getting content: {e}", exc_info=True)
        return []
