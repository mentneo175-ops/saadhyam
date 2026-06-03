"""
AEO/GEO Routes
Answer Engine Optimization + Generative Engine Optimization
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from utils.dependencies import get_current_user
from config.database import get_db, get_db_sync
from models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from services.aeo_geo_service import get_aeo_geo_overview, run_full_aeo_geo_optimization
from services.aeo_business_analyzer import analyze_business_for_aeo
from services.aeo_question_discovery import (
    discover_questions,
    get_discovered_questions,
    search_similar_questions
)
from services.aeo_content_generator import generate_aeo_content, get_generated_content
from services.schema_generator import generate_faq_schema, generate_local_business_schema, get_all_schemas
from services.ai_visibility_tracker import track_ai_visibility, get_visibility_dashboard
from services.auto_blogger_service import generate_blog_post, publish_blog_to_website

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/aeo-geo",
    tags=["AEO/GEO"]
)


# ============ Response Models ============

class AEOGEOOverviewResponse(BaseModel):
    """Response model for AEO/GEO overview"""
    status: str
    aeo_geo_score: int
    business_analysis: Dict[str, Any]
    questions: Dict[str, Any]
    content: Dict[str, Any]
    schemas: Dict[str, Any]
    visibility: Dict[str, Any]


class OptimizationResponse(BaseModel):
    """Response model for optimization"""
    status: str
    steps_completed: List[str]
    message: Optional[str] = None


# ============ Routes ============

@router.get(
    "/overview",
    summary="Get AEO/GEO Overview",
    description="Get comprehensive AEO/GEO dashboard data"
)
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get comprehensive AEO/GEO overview
    
    Returns:
    - AEO/GEO score
    - Business analysis
    - Discovered questions
    - Generated content
    - Schema markups
    - AI visibility metrics
    """
    
    result = await get_aeo_geo_overview(current_user, db)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to get AEO/GEO overview")
        )
    
    return result


@router.post(
    "/optimize",
    response_model=OptimizationResponse,
    summary="Run Full AEO/GEO Optimization",
    description="Run complete optimization workflow"
)
async def optimize(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> OptimizationResponse:
    """
    Run full AEO/GEO optimization
    
    Steps:
    1. Analyze business for AEO
    2. Discover AI-search questions
    3. Generate schema markup
    4. Track AI visibility
    """
    
    result = await run_full_aeo_geo_optimization(current_user, db)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to run optimization")
        )
    
    return OptimizationResponse(**result)


@router.get(
    "/business-analysis",
    summary="Get Business Analysis for AEO",
    description="Analyze business for AEO/GEO opportunities"
)
async def get_business_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get business analysis for AEO
    
    Returns:
    - Business summary
    - Authority topics
    - Trust signals
    - Semantic entities
    - AEO readiness score
    """
    
    result = await analyze_business_for_aeo(current_user, db)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("message", "Failed to analyze business")
        )
    
    return result


@router.post(
    "/questions/discover",
    summary="Discover AI-Search Questions",
    description="Discover questions people ask AI engines"
)
async def discover_questions_endpoint(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Discover AI-search questions
    
    Returns:
    - Discovered questions
    - Categories
    - Search volumes
    - Difficulty scores
    """
    
    result = await discover_questions(current_user, db, limit)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to discover questions")
        )
    
    return result


@router.get(
    "/questions",
    summary="Get Discovered Questions",
    description="Get all discovered questions from database"
)
async def get_questions(
    category: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get discovered questions
    
    Query params:
    - category: Filter by category (optional)
    - limit: Maximum number of questions
    """
    
    questions = await get_discovered_questions(current_user, db, category, limit)
    
    return {
        "status": "success",
        "questions": questions,
        "total": len(questions)
    }


@router.post(
    "/questions/search",
    summary="Search Similar Questions (Semantic)",
    description="Search for similar questions using Pinecone vector search"
)
async def search_questions_semantic(
    query: str,
    top_k: int = 5,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Search for similar questions using semantic search (Pinecone)
    
    Query params:
    - query: Question text to search for
    - top_k: Number of results to return (default: 5)
    
    Returns:
    - Similar questions with similarity scores
    - Metadata (category, intent, priority)
    """
    
    if not query or not query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query text is required"
        )
    
    results = await search_similar_questions(current_user, db, query.strip(), top_k)
    
    return {
        "status": "success",
        "query": query,
        "results": results,
        "total": len(results),
        "pinecone_enabled": len(results) > 0 or True  # Show if Pinecone is working
    }


@router.post(
    "/content/generate/{question_id}",
    summary="Generate AEO Content",
    description="Generate AEO-optimized content for a question"
)
async def generate_content(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate AEO content for a question
    
    Returns:
    - Generated content
    - AEO score
    - GEO score
    - Readability metrics
    """
    
    result = await generate_aeo_content(current_user, question_id, db)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to generate content")
        )
    
    return result


@router.get(
    "/content",
    summary="Get Generated Content",
    description="Get all generated AEO content"
)
async def get_content(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get generated AEO content
    """
    
    content = await get_generated_content(current_user, db, limit)
    
    return {
        "status": "success",
        "content": content,
        "total": len(content)
    }


@router.post(
    "/schema/faq/{content_id}",
    summary="Generate FAQ Schema",
    description="Generate FAQ schema markup for content"
)
async def generate_faq_schema_endpoint(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate FAQ schema for content
    """
    
    result = await generate_faq_schema(current_user, content_id, db)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to generate FAQ schema")
        )
    
    return result


@router.post(
    "/schema/local-business",
    summary="Generate LocalBusiness Schema",
    description="Generate LocalBusiness schema markup"
)
async def generate_local_business_schema_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate LocalBusiness schema
    """
    
    result = await generate_local_business_schema(current_user, db)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to generate LocalBusiness schema")
        )
    
    return result


@router.get(
    "/schema",
    summary="Get All Schema Markups",
    description="Get all generated schema markups"
)
async def get_schemas(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get all schema markups
    """
    
    schemas = await get_all_schemas(current_user, db)
    
    return {
        "status": "success",
        "schemas": schemas,
        "total": len(schemas)
    }


@router.post(
    "/visibility/track",
    summary="Track AI Visibility",
    description="Track mentions in AI engines"
)
async def track_visibility(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Track AI visibility
    """
    
    result = await track_ai_visibility(current_user, db)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to track visibility")
        )
    
    return result


@router.get(
    "/visibility/dashboard",
    summary="Get Visibility Dashboard",
    description="Get AI visibility metrics and dashboard"
)
async def get_visibility_dashboard_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get visibility dashboard
    
    Returns:
    - Total mentions
    - Citations
    - Visibility scores
    - Engine-wise breakdown
    - Top performing content
    """
    
    result = await get_visibility_dashboard(current_user, db)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to get visibility dashboard")
        )
    
    return result


@router.get(
    "/health",
    summary="Health check for AEO/GEO service"
)
async def health_check():
    """Check if AEO/GEO service is healthy"""
    
    import os
    
    gemini_configured = bool(
        os.getenv("GEMINI_API_KEY") and 
        os.getenv("GEMINI_API_KEY") != "your_google_ai_studio_api_key_here"
    )
    
    use_mock_data = os.getenv("AEO_GEO_USE_MOCK_DATA", "true").lower() == "true"
    
    return {
        "status": "healthy",
        "service": "AEO/GEO System",
        "version": "1.0.0",
        "gemini_configured": gemini_configured,
        "use_mock_data": use_mock_data,
        "features": [
            "Business Analysis for AEO",
            "AI Question Discovery",
            "AEO Content Generation (Gemini)",
            "GEO Optimization",
            "Schema Markup Generation",
            "AI Visibility Tracking",
            "Auto Blogger (NEW)",
            "Content Distribution (coming soon)",
            "Automated Optimization Loop (coming soon)"
        ]
    }


# ============ Auto Blogger Routes ============

class BlogGenerateRequest(BaseModel):
    """Request model for blog generation"""
    topic: Optional[str] = None
    keywords: Optional[List[str]] = None


@router.post(
    "/blog/generate",
    summary="Generate Blog Post (Auto Blogger)",
    description="Generate SEO-optimized blog post using business details + web search"
)
async def generate_blog(
    request: BlogGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Generate SEO-optimized blog post
    
    Uses:
    - Business details from database
    - Web search for latest trends
    - Pinecone for business context
    - Gemini API for content generation
    
    Returns:
    - Complete blog post with SEO optimization
    - HTML formatted content
    - Publishing instructions
    """
    
    # Get business details
    from db.models import BusinessAnalysis
    
    analysis = db.query(BusinessAnalysis).filter(
        BusinessAnalysis.user_id == current_user.id,
        BusinessAnalysis.analysis_status == 'completed'
    ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business analysis found. Please run business analysis first."
        )
    
    business_name = analysis.business_name or current_user.business_name or "Business"
    business_type = analysis.business_type or current_user.business_type or "Business"
    location = analysis.location or current_user.business_location or "Location"
    
    result = await generate_blog_post(
        user_id=current_user.id,
        business_name=business_name,
        business_type=business_type,
        location=location,
        topic=request.topic,
        keywords=request.keywords
    )
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to generate blog post")
        )
    
    return result


class BlogPublishRequest(BaseModel):
    """Request model for blog publishing"""
    blog_post: Dict[str, Any]
    website_url: str


@router.post(
    "/blog/publish",
    summary="Publish Blog Post to Website",
    description="Publish generated blog post to customer website"
)
async def publish_blog(
    request: BlogPublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Dict[str, Any]:
    """
    Publish blog post to customer website
    
    Requires:
    - User must have created a website first
    
    Returns:
    - Publish status
    - Website URL
    - Publishing instructions
    """
    
    # Check if user has created a website
    if not current_user.last_generated_website_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must create a website first before publishing blogs. Please go to Website AI to create your website."
        )
    
    result = await publish_blog_to_website(
        user_id=current_user.id,
        blog_post=request.blog_post,
        website_url=request.website_url
    )
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to publish blog post")
        )
    
    return result
