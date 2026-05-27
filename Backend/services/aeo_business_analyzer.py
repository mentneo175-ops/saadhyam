"""
AEO Business Analyzer Service
Analyzes business for AEO/GEO optimization opportunities
Uses existing business analysis data + Gemini API
"""

import logging
import json
from typing import Dict, Any, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import BusinessAnalysis
from models.user import User

logger = logging.getLogger(__name__)


async def analyze_business_for_aeo(
    user: User,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Analyze business for AEO/GEO opportunities
    Uses existing business analysis data
    
    Args:
        user: User object
        db: Database session
    
    Returns:
        Dict with AEO/GEO analysis
    """
    
    try:
        logger.info(f"[AEOBusinessAnalyzer] Analyzing business for user {user.id}")
        
        # Get existing business analysis
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
        
        # Extract business details
        business_name = analysis.business_name or user.business_name or "Your Business"
        business_type = analysis.business_type or user.business_type or "Business"
        location = analysis.location or user.business_location or "Location"
        
        # Parse services
        services = []
        if analysis.services:
            try:
                services = json.loads(analysis.services)
            except:
                pass
        
        # Generate authority topics based on business type and services
        authority_topics = generate_authority_topics(business_type, services)
        
        # Generate trust signals
        trust_signals = generate_trust_signals(business_type, location)
        
        # Generate semantic entities
        semantic_entities = generate_semantic_entities(business_name, business_type, location, services)
        
        # Generate business summary for AEO
        business_summary = f"{business_name} is a {business_type} located in {location}."
        if services:
            business_summary += f" We specialize in {', '.join(services[:3])}."
        
        # Calculate AEO readiness score
        aeo_readiness_score = calculate_aeo_readiness(analysis)
        
        return {
            "status": "success",
            "business_summary": business_summary,
            "authority_topics": authority_topics,
            "trust_signals": trust_signals,
            "semantic_entities": semantic_entities,
            "aeo_readiness_score": aeo_readiness_score,
            "recommendations": generate_aeo_recommendations(aeo_readiness_score)
        }
        
    except Exception as e:
        logger.error(f"[AEOBusinessAnalyzer] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to analyze business for AEO: {str(e)}"
        }


def generate_authority_topics(business_type: str, services: List[str]) -> List[str]:
    """Generate authority topics based on business type and services"""
    
    topics = []
    
    # Add business type as primary topic
    topics.append(business_type)
    
    # Add services as topics
    topics.extend(services[:5])
    
    # Add related topics based on business type
    business_type_lower = business_type.lower()
    
    if 'restaurant' in business_type_lower or 'food' in business_type_lower:
        topics.extend(['local dining', 'food quality', 'menu options', 'customer service'])
    elif 'salon' in business_type_lower or 'beauty' in business_type_lower:
        topics.extend(['beauty services', 'hair care', 'styling', 'customer experience'])
    elif 'retail' in business_type_lower or 'shop' in business_type_lower:
        topics.extend(['product quality', 'customer service', 'shopping experience', 'local retail'])
    elif 'service' in business_type_lower:
        topics.extend(['professional services', 'customer satisfaction', 'quality service', 'local expertise'])
    else:
        topics.extend(['customer service', 'quality', 'local business', 'professional service'])
    
    return list(set(topics))[:10]  # Remove duplicates, limit to 10


def generate_trust_signals(business_type: str, location: str) -> List[str]:
    """Generate trust signals for AI engines"""
    
    signals = [
        f"Established {business_type} in {location}",
        "Verified business profile",
        "Active customer engagement",
        "Regular business updates",
        "Responsive to customer inquiries"
    ]
    
    return signals


def generate_semantic_entities(
    business_name: str,
    business_type: str,
    location: str,
    services: List[str]
) -> Dict[str, List[str]]:
    """Generate semantic entities for GEO optimization"""
    
    entities = {
        "brand": [business_name],
        "service": services[:5] if services else [business_type],
        "industry": [business_type],
        "location": [location],
        "user_intent": [
            "find local business",
            "get service information",
            "compare options",
            "read reviews",
            "contact business"
        ]
    }
    
    return entities


def calculate_aeo_readiness(analysis: BusinessAnalysis) -> int:
    """Calculate AEO readiness score (0-100)"""
    
    score = 0
    
    # Has business name (10 points)
    if analysis.business_name:
        score += 10
    
    # Has business type (10 points)
    if analysis.business_type:
        score += 10
    
    # Has location (10 points)
    if analysis.location:
        score += 10
    
    # Has services (15 points)
    if analysis.services:
        try:
            services = json.loads(analysis.services)
            if services:
                score += 15
        except:
            pass
    
    # Has business summary (10 points)
    if analysis.business_summary:
        score += 10
    
    # Has strengths data (15 points)
    if analysis.strengths_data:
        score += 15
    
    # Has local market insights (15 points)
    if analysis.local_market_insights:
        score += 15
    
    # Has SEO tips (15 points)
    if analysis.seo_google_maps_tips:
        score += 15
    
    return min(score, 100)


def generate_aeo_recommendations(readiness_score: int) -> List[str]:
    """Generate recommendations based on AEO readiness score"""
    
    recommendations = []
    
    if readiness_score < 50:
        recommendations.append("Complete your business profile with detailed information")
        recommendations.append("Add comprehensive service descriptions")
        recommendations.append("Run a full business analysis to gather insights")
    elif readiness_score < 75:
        recommendations.append("Enhance your business description with more details")
        recommendations.append("Add more specific service offerings")
        recommendations.append("Optimize your local market presence")
    else:
        recommendations.append("Start generating AEO content for common questions")
        recommendations.append("Implement schema markup for better AI visibility")
        recommendations.append("Monitor AI engine mentions and citations")
    
    return recommendations
