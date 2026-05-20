"""
Smart Business Analysis Service
Check Pinecone BEFORE calling Gemini API to avoid duplicate analysis
This saves costs and provides faster results for similar businesses
"""

import logging
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db.models import BusinessAnalysis
from models.user import User
from services.vector_storage_service import vector_storage
from config.pinecone_config import (
    NAMESPACE_BUSINESS_ANALYSIS,
    SIMILARITY_THRESHOLD
)

logger = logging.getLogger(__name__)

# Similarity threshold for reusing analysis (0-1, where 1 is exact match)
ANALYSIS_REUSE_THRESHOLD = 0.80
# Time to consider an analysis "fresh" (in days)
FRESH_ANALYSIS_DAYS = 30


class SmartAnalysisService:
    """
    Smart service for business analysis with intelligent caching
    1. Check if similar analysis exists in Pinecone
    2. Reuse if similarity is high + analysis is fresh
    3. Otherwise, generate new analysis with Gemini
    """
    
    @staticmethod
    async def get_or_create_analysis(
        user: User,
        db: Session,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Get business analysis - either cached/similar or newly generated
        
        Args:
            user: User object with business profile
            db: Database session
            force_regenerate: Force new analysis even if similar exists
        
        Returns:
            Dict with analysis data and source info
        """
        try:
            logger.info(f"[SmartAnalysis] Getting analysis for user {user.id} (force_regenerate={force_regenerate})")
            
            # Step 1: Check if user has recent analysis
            if not force_regenerate:
                recent_analysis = await SmartAnalysisService._get_recent_user_analysis(user.id, db)
                if recent_analysis:
                    logger.info(f"[SmartAnalysis] ✅ Found recent analysis for user {user.id} (age: {recent_analysis.get('age_days')} days)")
                    return {
                        "status": "success",
                        "source": "user_cache",
                        "analysis": recent_analysis.get("data"),
                        "age_days": recent_analysis.get("age_days")
                    }
            
            # Step 2: Search for similar analyses in Pinecone
            similar_analyses = await SmartAnalysisService._search_similar_analyses(
                business_type=user.business_type,
                location=user.business_location,
                top_k=5
            )
            
            if similar_analyses and not force_regenerate:
                best_match = similar_analyses[0]
                similarity_score = best_match.get("score", 0)
                
                logger.info(f"[SmartAnalysis] Found similar analysis (similarity: {similarity_score:.2%})")
                
                # If similarity is high enough, reuse the analysis
                if similarity_score >= ANALYSIS_REUSE_THRESHOLD:
                    reused_analysis = await SmartAnalysisService._adapt_analysis_for_user(
                        user,
                        best_match.get("analysis_data"),
                        best_match.get("source_user_id")
                    )
                    
                    logger.info(f"[SmartAnalysis] ✅ Reusing similar analysis (from user {best_match.get('source_user_id')})")
                    return {
                        "status": "success",
                        "source": "similar_cache",
                        "similarity_score": similarity_score,
                        "from_user_id": best_match.get("source_user_id"),
                        "analysis": reused_analysis
                    }
                else:
                    logger.info(f"[SmartAnalysis] Similarity too low ({similarity_score:.2%}), will generate new")
            
            # Step 3: No suitable match found, return info for new generation
            logger.info(f"[SmartAnalysis] No suitable match found, will generate new analysis")
            return {
                "status": "needs_generation",
                "source": "none",
                "message": "New analysis required"
            }
            
        except Exception as e:
            logger.error(f"[SmartAnalysis] ❌ Error: {e}", exc_info=True)
            return {
                "status": "error",
                "message": str(e),
                "source": "none"
            }
    
    @staticmethod
    async def _get_recent_user_analysis(
        user_id: int,
        db: Session,
        days: int = FRESH_ANALYSIS_DAYS
    ) -> Optional[Dict[str, Any]]:
        """Get recent analysis for this specific user"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            analysis = db.query(BusinessAnalysis).filter(
                BusinessAnalysis.user_id == user_id,
                BusinessAnalysis.analysis_status == 'completed',
                BusinessAnalysis.last_analyzed_at >= cutoff_date
            ).order_by(BusinessAnalysis.last_analyzed_at.desc()).first()
            
            if analysis:
                age_days = (datetime.utcnow() - analysis.last_analyzed_at).days
                return {
                    "data": SmartAnalysisService._serialize_analysis(analysis),
                    "age_days": age_days
                }
            
            return None
        except Exception as e:
            logger.warning(f"[SmartAnalysis] Could not get recent analysis: {e}")
            return None
    
    @staticmethod
    async def _search_similar_analyses(
        business_type: str,
        location: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Search Pinecone for similar business analyses"""
        try:
            if not business_type or not location:
                return []
            
            # Create search query combining business type and location
            search_query = f"Business type: {business_type} Location: {location}"
            
            # Search Pinecone
            results = vector_storage.search_similar(
                query_text=search_query,
                namespace=NAMESPACE_BUSINESS_ANALYSIS,
                top_k=top_k,
                min_score=SIMILARITY_THRESHOLD
            )
            
            logger.info(f"[SmartAnalysis] Found {len(results)} similar analyses in Pinecone")
            
            # Enrich results with actual analysis data
            enriched_results = []
            for result in results:
                enriched_result = {
                    "id": result.get("id"),
                    "score": result.get("score", 0),
                    "metadata": result.get("metadata", {}),
                    "analysis_id": result.get("metadata", {}).get("analysis_id"),
                    "source_user_id": result.get("metadata", {}).get("user_id"),
                }
                enriched_results.append(enriched_result)
            
            return enriched_results
            
        except Exception as e:
            logger.warning(f"[SmartAnalysis] Could not search similar analyses: {e}")
            return []
    
    @staticmethod
    async def _adapt_analysis_for_user(
        user: User,
        analysis_data: Dict[str, Any],
        source_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Adapt a similar analysis for the current user
        - Personalize with their business name, location, etc.
        - Add privacy notice
        """
        try:
            if not analysis_data:
                return analysis_data
            
            adapted = analysis_data.copy()
            
            # Add adaptation note
            adapted["_adaptation_note"] = f"Based on analysis pattern for similar {user.business_type} business"
            adapted["_personalized_for"] = user.business_name or "Your Business"
            adapted["_source_type"] = "adapted_from_similar"
            
            if source_user_id:
                adapted["_source_info"] = f"Pattern from similar business analysis (anonymized)"
            
            logger.info(f"[SmartAnalysis] Adapted analysis for user {user.id}")
            return adapted
            
        except Exception as e:
            logger.warning(f"[SmartAnalysis] Could not adapt analysis: {e}")
            return analysis_data
    
    @staticmethod
    def _serialize_analysis(analysis: BusinessAnalysis) -> Dict[str, Any]:
        """Convert BusinessAnalysis DB model to dict"""
        try:
            result = {
                "id": analysis.id,
                "business_name": analysis.business_name,
                "business_type": analysis.business_type,
                "location": analysis.location,
                "business_summary": analysis.business_summary,
                "health_score": analysis.health_score,
            }
            
            # Parse JSON fields if they exist
            json_fields = [
                'strengths_data', 'weaknesses_data', 'growth_opportunities_data',
                'local_market_insights', 'competitor_analysis', 'seo_google_maps_tips',
                'thirty_day_growth_plan', 'daily_suggestions'
            ]
            
            for field in json_fields:
                value = getattr(analysis, field, None)
                if value:
                    try:
                        result[field] = json.loads(value) if isinstance(value, str) else value
                    except:
                        result[field] = value
            
            return result
        except Exception as e:
            logger.warning(f"[SmartAnalysis] Could not serialize analysis: {e}")
            return {}


# Global instance
smart_analysis_service = SmartAnalysisService()
