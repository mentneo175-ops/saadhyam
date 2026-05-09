"""
Comprehensive AEO/GEO Service
Main service that coordinates all AEO/GEO features
"""

import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from models.user import User
from services.aeo_business_analyzer import analyze_business_for_aeo
from services.aeo_question_discovery import discover_questions, get_discovered_questions
from services.aeo_content_generator import generate_aeo_content, get_generated_content
from services.schema_generator import generate_faq_schema, generate_local_business_schema, get_all_schemas
from services.ai_visibility_tracker import track_ai_visibility, get_visibility_dashboard

logger = logging.getLogger(__name__)


async def get_aeo_geo_overview(
    user: User,
    db: Session
) -> Dict[str, Any]:
    """
    Get comprehensive AEO/GEO overview
    
    Args:
        user: User object
        db: Database session
    
    Returns:
        Dict with complete AEO/GEO data
    """
    
    try:
        logger.info(f"[AEOGEOService] Getting overview for user {user.id}")
        
        # Get business analysis for AEO
        business_analysis = await analyze_business_for_aeo(user, db)
        
        # Get discovered questions
        questions = await get_discovered_questions(user, db, limit=10)
        
        # Get generated content
        content = await get_generated_content(user, db, limit=10)
        
        # Get schema markups
        schemas = await get_all_schemas(user, db)
        
        # Get visibility dashboard
        visibility = await get_visibility_dashboard(user, db)
        
        # Calculate overall AEO/GEO score
        aeo_geo_score = calculate_overall_score(
            business_analysis,
            questions,
            content,
            schemas,
            visibility
        )
        
        return {
            "status": "success",
            "aeo_geo_score": aeo_geo_score,
            "business_analysis": business_analysis,
            "questions": {
                "total": len(questions),
                "recent": questions[:5]
            },
            "content": {
                "total": len(content),
                "recent": content[:5]
            },
            "schemas": {
                "total": len(schemas),
                "types": list(set(s["schema_type"] for s in schemas))
            },
            "visibility": visibility.get("overview", {})
        }
        
    except Exception as e:
        logger.error(f"[AEOGEOService] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to get AEO/GEO overview: {str(e)}"
        }


async def run_full_aeo_geo_optimization(
    user: User,
    db: Session
) -> Dict[str, Any]:
    """
    Run complete AEO/GEO optimization workflow
    
    Args:
        user: User object
        db: Database session
    
    Returns:
        Dict with optimization results
    """
    
    try:
        logger.info(f"[AEOGEOService] Running full optimization for user {user.id}")
        
        results = {
            "status": "success",
            "steps_completed": []
        }
        
        # Step 1: Analyze business
        logger.info("[AEOGEOService] Step 1: Analyzing business...")
        business_analysis = await analyze_business_for_aeo(user, db)
        results["steps_completed"].append("business_analysis")
        results["business_analysis"] = business_analysis
        
        # Step 2: Discover questions
        logger.info("[AEOGEOService] Step 2: Discovering questions...")
        questions_result = await discover_questions(user, db, limit=20)
        results["steps_completed"].append("question_discovery")
        results["questions_discovered"] = questions_result.get("new_questions_count", 0)
        
        # Step 3: Generate LocalBusiness schema
        logger.info("[AEOGEOService] Step 3: Generating schema...")
        schema_result = await generate_local_business_schema(user, db)
        results["steps_completed"].append("schema_generation")
        results["schema_generated"] = schema_result.get("status") == "success"
        
        # Step 4: Track visibility (mock data)
        logger.info("[AEOGEOService] Step 4: Tracking visibility...")
        visibility_result = await track_ai_visibility(user, db)
        results["steps_completed"].append("visibility_tracking")
        results["visibility_tracked"] = visibility_result.get("total_mentions", 0)
        
        logger.info(f"[AEOGEOService] ✅ Full optimization completed")
        
        return results
        
    except Exception as e:
        logger.error(f"[AEOGEOService] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to run full optimization: {str(e)}"
        }


def calculate_overall_score(
    business_analysis: Dict[str, Any],
    questions: list,
    content: list,
    schemas: list,
    visibility: Dict[str, Any]
) -> int:
    """Calculate overall AEO/GEO score (0-100)"""
    
    score = 0
    
    # Business readiness (20 points)
    if business_analysis.get("status") == "success":
        readiness = business_analysis.get("aeo_readiness_score", 0)
        score += (readiness / 100) * 20
    
    # Questions discovered (20 points)
    if len(questions) > 0:
        score += min(20, len(questions) * 2)
    
    # Content generated (25 points)
    if len(content) > 0:
        score += min(25, len(content) * 5)
    
    # Schema markup (15 points)
    if len(schemas) > 0:
        score += min(15, len(schemas) * 5)
    
    # AI visibility (20 points)
    if visibility.get("status") == "success":
        overview = visibility.get("overview", {})
        mention_rate = overview.get("mention_rate", 0)
        score += (mention_rate / 100) * 20
    
    return min(100, int(score))
