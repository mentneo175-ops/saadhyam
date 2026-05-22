"""
Comprehensive Business Analysis Service
ONE Gemini API call to populate ALL features:
- Business Analysis (strengths, weaknesses, opportunities, local insights)
- Competitor Analysis
- Dashboard (30-day growth plan)
- Daily Ask (daily suggestions)
- SEO/Google Maps Feature

This avoids rate limit issues by making only ONE API call and storing everything in database
PLUS: Automatically stores in Pinecone for fast semantic retrieval
PLUS: Redis caching for ultra-fast retrieval
"""

import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from db.models import BusinessAnalysis
from models.user import User
from services.gemini_business_analysis_service import generate_realtime_business_analysis
from services.pinecone_business_store import pinecone_business_store
from services.competitor_search_service import search_competitors_combined, format_competitors_for_gemini
from services.comprehensive_cache_service import (
    generate_cache_key,
    get_cached,
    set_cached,
    delete_pattern,
    CACHE_PREFIX,
    CACHE_TTL
)
import asyncio

logger = logging.getLogger(__name__)


async def trigger_comprehensive_analysis(
    user: User,
    db: Session
) -> Dict[str, Any]:
    """
    Trigger comprehensive business analysis for a user
    Makes ONE Gemini API call and stores ALL results in database
    
    Args:
        user: User object with business profile
        db: Database session
    
    Returns:
        Dict with status and message
    """
    
    try:
        logger.info(f"[ComprehensiveAnalysis] Starting analysis for user {user.id}")
        
        # Check if user has business profile data
        if not user.business_type or not user.business_location:
            return {
                "status": "error",
                "message": "Please complete your business profile before analyzing"
            }
        
        # Check if analysis already exists and is recent
        existing_analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user.id
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        if existing_analysis and existing_analysis.analysis_status == 'analyzing':
            return {
                "status": "analyzing",
                "message": "Analysis is already in progress. Please wait..."
            }
        
        # Create or update analysis record with 'analyzing' status
        if existing_analysis:
            existing_analysis.analysis_status = 'analyzing'
            db.commit()
            analysis_id = existing_analysis.id
        else:
            new_analysis = BusinessAnalysis(
                user_id=user.id,
                analysis_status='analyzing',
                business_name=user.business_name or "",
                business_type=user.business_type or "",
                location=user.business_location or "",
                description=user.business_description or ""  # Add description field
            )
            db.add(new_analysis)
            db.commit()
            db.refresh(new_analysis)
            analysis_id = new_analysis.id
        
        logger.info(f"[ComprehensiveAnalysis] Set status to 'analyzing' for analysis {analysis_id}")
        
        # Build business profile from user data
        business_profile = {
            "business_name": user.business_name or "",
            "business_type": user.business_type or "",
            "location": user.business_location or "",
            "services": [],  # User model doesn't have services field
            "target_audience": "",  # User model doesn't have target_audience field
            "goals": "",  # User model doesn't have goals field
            "website_or_instagram": ""  # User model doesn't have website_or_instagram field
        }
        
        # If user has business_description, use it to infer some details
        if user.business_description:
            business_profile["description"] = user.business_description
        
        # 🆕 SEARCH FOR REAL COMPETITORS using Tavily + Serper
        logger.info(f"[ComprehensiveAnalysis] 🔍 Searching for real competitors...")
        competitors_data = []
        try:
            if user.business_type and user.business_location:
                competitors_data = search_competitors_combined(
                    business_type=user.business_type,
                    location=user.business_location
                )
                logger.info(f"[ComprehensiveAnalysis] ✅ Found {len(competitors_data)} competitors from web search")
        except Exception as search_error:
            logger.warning(f"[ComprehensiveAnalysis] ⚠️ Competitor search failed: {search_error}")
        
        # Add competitor data to business profile
        business_profile["competitors_found"] = competitors_data
        
        logger.info(f"[ComprehensiveAnalysis] Calling Gemini API for user {user.id}...")
        
        # Make ONE Gemini API call (now we can await it directly)
        analysis_result = await generate_realtime_business_analysis(business_profile)
        
        if analysis_result.get("status") == "error":
            # Update status to error
            analysis = db.query(BusinessAnalysis).filter(BusinessAnalysis.id == analysis_id).first()
            if analysis:
                analysis.analysis_status = 'error'
                analysis.last_analyzed_at = datetime.utcnow()
                db.commit()
            
            return {
                "status": "error",
                "message": "Unable to complete analysis right now"
            }
        
        logger.info(f"[ComprehensiveAnalysis] ✅ Gemini API call successful")
        
        # Store ALL results in database
        analysis = db.query(BusinessAnalysis).filter(BusinessAnalysis.id == analysis_id).first()
        if analysis:
            # Business details
            analysis.business_name = business_profile["business_name"]
            analysis.business_type = business_profile["business_type"]
            analysis.location = business_profile["location"]
            analysis.services = json.dumps(business_profile["services"])
            analysis.target_audience = business_profile["target_audience"]
            analysis.goals = business_profile["goals"]
            analysis.website_or_instagram = business_profile["website_or_instagram"]
            analysis.business_summary = analysis_result.get("business_details", {}).get("summary", "")
            
            # Analysis results
            analysis.strengths_data = json.dumps(analysis_result.get("strengths", []))
            analysis.weaknesses_data = json.dumps(analysis_result.get("weaknesses", []))
            analysis.growth_opportunities_data = json.dumps(analysis_result.get("growth_opportunities", []))
            
            # Local market insights
            analysis.local_market_insights = json.dumps(analysis_result.get("local_market_insights", {}))
            
            # Competitor analysis
            analysis.competitor_analysis = json.dumps(analysis_result.get("competitor_analysis", {}))
            
            # SEO & Google Maps tips
            analysis.seo_google_maps_tips = json.dumps(analysis_result.get("seo_google_maps_tips", {}))
            
            # 30-day growth plan
            analysis.thirty_day_growth_plan = json.dumps(analysis_result.get("thirty_day_growth_plan", {}))
            
            # Daily suggestions
            analysis.daily_suggestions = json.dumps(analysis_result.get("daily_suggestions", []))
            
            # Health score
            analysis.health_score = analysis_result.get("health_score", 0)
            
            # Metadata
            analysis.analysis_source = analysis_result.get("source", "google_ai_studio_gemini_search_grounding")
            analysis.last_analyzed_at = datetime.utcnow()
            analysis.analysis_status = "completed"
            
            db.commit()
            
            # 🆕 AUTOMATICALLY STORE IN PINECONE FOR FAST SEMANTIC RETRIEVAL
            logger.info(f"[ComprehensiveAnalysis] 📊 Storing analysis in Pinecone...")
            try:
                pinecone_success = await pinecone_business_store.store_business_analysis(
                    user_id=user.id,
                    analysis_data={
                        'id': analysis.id,
                        'business_name': analysis.business_name,
                        'business_type': analysis.business_type,
                        'location': analysis.location,
                        'business_summary': analysis.business_summary,
                        'strengths_data': analysis.strengths_data,
                        'weaknesses_data': analysis.weaknesses_data,
                        'growth_opportunities_data': analysis.growth_opportunities_data,
                        'local_market_insights': analysis.local_market_insights,
                        'competitor_analysis': analysis.competitor_analysis,
                        'seo_google_maps_tips': analysis.seo_google_maps_tips,
                        'thirty_day_growth_plan': analysis.thirty_day_growth_plan,
                        'daily_suggestions': analysis.daily_suggestions,
                        'health_score': analysis.health_score,
                        'last_analyzed_at': analysis.last_analyzed_at.isoformat() if analysis.last_analyzed_at else None
                    }
                )
                
                if pinecone_success:
                    logger.info(f"[ComprehensiveAnalysis] ✅ Analysis stored in Pinecone")
                else:
                    logger.warning(f"[ComprehensiveAnalysis] ⚠️ Failed to store in Pinecone (non-critical)")
            except Exception as pinecone_error:
                logger.error(f"[ComprehensiveAnalysis] ❌ Pinecone storage error: {pinecone_error}")
                # Don't fail the entire analysis if Pinecone fails
                pass
        
        logger.info(f"[ComprehensiveAnalysis] ✅ Analysis stored in database (ID: {analysis_id})")
        
        # 🆕 INVALIDATE CACHE after new analysis
        logger.info(f"[ComprehensiveAnalysis] 🗑️ Invalidating cache for user {user.id}...")
        try:
            # Invalidate competitor analysis cache
            comp_cache_key = generate_cache_key(
                CACHE_PREFIX["competitor"],
                "analysis_data",
                user_id=user.id
            )
            await delete_pattern(comp_cache_key)
            
            # Invalidate daily suggestions cache
            daily_cache_key = generate_cache_key(
                CACHE_PREFIX["content"],
                "daily_suggestions",
                user_id=user.id
            )
            await delete_pattern(daily_cache_key)
            
            # Invalidate business analysis cache
            biz_cache_key = generate_cache_key(
                CACHE_PREFIX["business_analysis"],
                "analysis_data",
                user_id=user.id
            )
            await delete_pattern(biz_cache_key)
            
            # Invalidate SEO & Google Maps cache
            seo_cache_key = generate_cache_key(
                CACHE_PREFIX["seo"],
                "google_maps_data",
                user_id=user.id
            )
            await delete_pattern(seo_cache_key)
            
            logger.info(f"[ComprehensiveAnalysis] ✅ Cache invalidated for user {user.id}")
        except Exception as cache_error:
            logger.warning(f"[ComprehensiveAnalysis] ⚠️ Cache invalidation error: {cache_error}")
        
        return {
            "status": "success",
            "message": "Comprehensive business analysis completed successfully",
            "analysis_id": analysis_id
        }
        
    except Exception as e:
        logger.error(f"[ComprehensiveAnalysis] ❌ Error: {e}", exc_info=True)
        
        # Update status to error if we have an analysis_id
        if 'analysis_id' in locals():
            try:
                analysis = db.query(BusinessAnalysis).filter(BusinessAnalysis.id == analysis_id).first()
                if analysis:
                    analysis.analysis_status = 'error'
                    analysis.last_analyzed_at = datetime.utcnow()
                    db.commit()
            except:
                pass
        
        return {
            "status": "error",
            "message": f"Analysis failed: {str(e)}"
        }


def get_business_analysis_data(
    user_id: int,
    db: Session
) -> Optional[Dict[str, Any]]:
    """
    Get business analysis data for Business Analysis page
    Shows: strengths, weaknesses, opportunities, local market insights
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        Dict with analysis data or None
    """
    
    try:
        # First try to get completed analysis
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user_id,
            BusinessAnalysis.analysis_status == 'completed'
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        # If no completed analysis, try to get any analysis with data (even if status is error)
        if not analysis:
            logger.info(f"[BusinessAnalysisData] No completed analysis found, checking for any analysis with data...")
            analysis = db.query(BusinessAnalysis).filter(
                BusinessAnalysis.user_id == user_id,
                BusinessAnalysis.strengths_data.isnot(None)  # Has some data
            ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
            
            if analysis:
                logger.info(f"[BusinessAnalysisData] ✅ Found analysis with data (status: {analysis.analysis_status})")
        
        if not analysis:
            return None
        
        return {
            "status": "success",
            "business_details": {
                "business_name": analysis.business_name,
                "business_type": analysis.business_type,
                "location": analysis.location,
                "services": json.loads(analysis.services) if analysis.services else [],
                "summary": analysis.business_summary
            },
            "strengths": json.loads(analysis.strengths_data) if analysis.strengths_data else [],
            "weaknesses": json.loads(analysis.weaknesses_data) if analysis.weaknesses_data else [],
            "growth_opportunities": json.loads(analysis.growth_opportunities_data) if analysis.growth_opportunities_data else [],
            "local_market_insights": json.loads(analysis.local_market_insights) if analysis.local_market_insights else {},
            "health_score": analysis.health_score,
            "last_updated": analysis.last_analyzed_at.isoformat() if analysis.last_analyzed_at else None,
            "note": "Retrieved from previous analysis" if analysis.analysis_status != 'completed' else None
        }
        
    except Exception as e:
        logger.error(f"[BusinessAnalysisData] ❌ Error: {e}", exc_info=True)
        return None


async def get_competitor_analysis_data(
    user_id: int,
    db: Session
) -> Optional[Dict[str, Any]]:
    """
    Get competitor analysis data for Competitor Analysis page
    WITH REDIS CACHING for ultra-fast retrieval
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        Dict with competitor analysis data or None
    """
    
    try:
        # Generate cache key
        cache_key = generate_cache_key(
            CACHE_PREFIX["competitor"],
            "analysis_data",
            user_id=user_id
        )
        
        # Try cache first
        cached = await get_cached(cache_key)
        if cached:
            logger.info(f"[CompetitorAnalysisData] 🚀 Cache HIT for user {user_id}")
            return cached.get("data")
        
        logger.info(f"[CompetitorAnalysisData] 💾 Cache MISS - fetching from database")
        
        # Cache miss - fetch from database
        # First try to get completed analysis
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user_id,
            BusinessAnalysis.analysis_status == 'completed'
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        # If no completed analysis, try to get any analysis with competitor data
        if not analysis:
            logger.info(f"[CompetitorAnalysisData] No completed analysis found, checking for any analysis with competitor data...")
            analysis = db.query(BusinessAnalysis).filter(
                BusinessAnalysis.user_id == user_id,
                BusinessAnalysis.competitor_analysis.isnot(None)  # Has competitor data
            ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
            
            if analysis:
                logger.info(f"[CompetitorAnalysisData] ✅ Found analysis with competitor data (status: {analysis.analysis_status})")
        
        if not analysis:
            return None
        
        result = {
            "status": "success",
            "competitor_analysis": json.loads(analysis.competitor_analysis) if analysis.competitor_analysis else {},
            "last_updated": analysis.last_analyzed_at.isoformat() if analysis.last_analyzed_at else None,
            "note": "Retrieved from previous analysis" if analysis.analysis_status != 'completed' else None
        }
        
        # Cache the result
        await set_cached(cache_key, result, CACHE_TTL["competitor_search"])
        logger.info(f"[CompetitorAnalysisData] ✅ Cached for user {user_id}")
        
        return result
        
    except Exception as e:
        logger.error(f"[CompetitorAnalysisData] ❌ Error: {e}", exc_info=True)
        return None


def get_growth_plan_data(
    user_id: int,
    db: Session
) -> Optional[Dict[str, Any]]:
    """
    Get 30-day growth plan data for Dashboard
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        Dict with growth plan data or None
    """
    
    try:
        # First try to get completed analysis
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user_id,
            BusinessAnalysis.analysis_status == 'completed'
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        # If no completed analysis, try to get any analysis with growth plan data
        if not analysis:
            logger.info(f"[GrowthPlanData] No completed analysis found, checking for any analysis with growth plan...")
            analysis = db.query(BusinessAnalysis).filter(
                BusinessAnalysis.user_id == user_id,
                BusinessAnalysis.thirty_day_growth_plan.isnot(None)  # Has growth plan
            ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
            
            if analysis:
                logger.info(f"[GrowthPlanData] ✅ Found analysis with growth plan (status: {analysis.analysis_status})")
        
        if not analysis:
            return None
        
        return {
            "status": "success",
            "thirty_day_growth_plan": json.loads(analysis.thirty_day_growth_plan) if analysis.thirty_day_growth_plan else {},
            "last_updated": analysis.last_analyzed_at.isoformat() if analysis.last_analyzed_at else None,
            "note": "Retrieved from previous analysis" if analysis.analysis_status != 'completed' else None
        }
        
    except Exception as e:
        logger.error(f"[GrowthPlanData] ❌ Error: {e}", exc_info=True)
        return None


async def get_daily_suggestions_data(
    user_id: int,
    db: Session
) -> Optional[Dict[str, Any]]:
    """
    Get daily suggestions data for Daily Ask feature
    WITH REDIS CACHING for ultra-fast retrieval
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        Dict with daily suggestions data or None
    """
    
    try:
        # Generate cache key
        cache_key = generate_cache_key(
            CACHE_PREFIX["content"],
            "daily_suggestions",
            user_id=user_id
        )
        
        # Try cache first
        cached = await get_cached(cache_key)
        if cached:
            logger.info(f"[DailySuggestionsData] 🚀 Cache HIT for user {user_id}")
            return cached.get("data")
        
        logger.info(f"[DailySuggestionsData] 💾 Cache MISS - fetching from database")
        
        # Cache miss - fetch from database
        # First try to get completed analysis
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user_id,
            BusinessAnalysis.analysis_status == 'completed'
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        # If no completed analysis, try to get any analysis with daily suggestions
        if not analysis:
            logger.info(f"[DailySuggestionsData] No completed analysis found, checking for any analysis with daily suggestions...")
            analysis = db.query(BusinessAnalysis).filter(
                BusinessAnalysis.user_id == user_id,
                BusinessAnalysis.daily_suggestions.isnot(None)  # Has daily suggestions
            ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
            
            if analysis:
                logger.info(f"[DailySuggestionsData] ✅ Found analysis with daily suggestions (status: {analysis.analysis_status})")
        
        if not analysis:
            return None
        
        result = {
            "status": "success",
            "daily_suggestions": json.loads(analysis.daily_suggestions) if analysis.daily_suggestions else [],
            "last_updated": analysis.last_analyzed_at.isoformat() if analysis.last_analyzed_at else None,
            "note": "Retrieved from previous analysis" if analysis.analysis_status != 'completed' else None
        }
        
        # Cache the result
        await set_cached(cache_key, result, CACHE_TTL["content_suggestions"])
        logger.info(f"[DailySuggestionsData] ✅ Cached for user {user_id}")
        
        return result
        
    except Exception as e:
        logger.error(f"[DailySuggestionsData] ❌ Error: {e}", exc_info=True)
        return None


async def get_seo_google_maps_data(
    user_id: int,
    db: Session
) -> Optional[Dict[str, Any]]:
    """
    Get SEO & Google Maps tips data for SEO/Google Maps feature
    WITH REDIS CACHING for ultra-fast retrieval
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        Dict with SEO tips data or None
    """
    
    try:
        # Generate cache key
        cache_key = generate_cache_key(
            CACHE_PREFIX["seo"],
            "google_maps_data",
            user_id=user_id
        )
        
        # Try cache first
        cached = await get_cached(cache_key)
        if cached:
            logger.info(f"[SEOGoogleMapsData] 🚀 Cache HIT for user {user_id}")
            return cached.get("data")
        
        logger.info(f"[SEOGoogleMapsData] 💾 Cache MISS - fetching from database")
        
        # Cache miss - fetch from database
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user_id,
            BusinessAnalysis.analysis_status == 'completed'
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        if not analysis:
            return None
        
        result = {
            "status": "success",
            "seo_google_maps_tips": json.loads(analysis.seo_google_maps_tips) if analysis.seo_google_maps_tips else {},
            "last_updated": analysis.last_analyzed_at.isoformat() if analysis.last_analyzed_at else None
        }
        
        # Cache the result
        await set_cached(cache_key, result, CACHE_TTL["seo_keywords"])
        logger.info(f"[SEOGoogleMapsData] ✅ Cached for user {user_id}")
        
        return result
        
    except Exception as e:
        logger.error(f"[SEOGoogleMapsData] ❌ Error: {e}", exc_info=True)
        return None


def get_analysis_status(
    user_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    Get current analysis status for a user
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        Dict with status information
    """
    
    try:
        analysis = db.query(BusinessAnalysis).filter(
            BusinessAnalysis.user_id == user_id
        ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
        
        if not analysis:
            return {
                "status": "not_started",
                "message": "No analysis found. Click 'Analyze Business' to start."
            }
        
        return {
            "status": analysis.analysis_status,
            "last_analyzed_at": analysis.last_analyzed_at.isoformat() if analysis.last_analyzed_at else None,
            "message": {
                "pending": "Analysis not started yet",
                "analyzing": "Analysis in progress... This may take 2-3 minutes",
                "completed": "Analysis completed successfully",
                "error": "Analysis failed. Please try again."
            }.get(analysis.analysis_status, "Unknown status")
        }
        
    except Exception as e:
        logger.error(f"[AnalysisStatus] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to get analysis status: {str(e)}"
        }
