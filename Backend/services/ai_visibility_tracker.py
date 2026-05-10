"""
AI Visibility Tracker Service
Tracks mentions and citations in AI engines
Uses mock data initially, ready for real tracking later
"""

import logging
import random
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from db.aeo_geo_models import AIVisibility, AEOContent
from models.user import User
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


async def track_ai_visibility(
    user: User,
    db: Session
) -> Dict[str, Any]:
    """
    Track AI visibility across engines
    
    Args:
        user: User object
        db: Database session
    
    Returns:
        Dict with visibility metrics
    """
    
    try:
        logger.info(f"[AIVisibilityTracker] Tracking visibility for user {user.id}")
        
        # Get user's content
        content_list = db.query(AEOContent).filter(
            AEOContent.user_id == user.id
        ).all()
        
        if not content_list:
            return {
                "status": "success",
                "message": "No content to track yet",
                "visibility_data": []
            }
        
        # Generate mock visibility data
        ai_engines = ['chatgpt', 'gemini', 'perplexity', 'claude', 'google_ai_overview']
        visibility_data = []
        
        for content in content_list[:5]:  # Track top 5 content pieces
            for engine in ai_engines:
                # Generate mock visibility
                is_mentioned = random.choice([True, False, False])  # 33% chance
                
                if is_mentioned:
                    visibility = AIVisibility(
                        user_id=user.id,
                        content_id=content.id,
                        ai_engine=engine,
                        query=content.question,
                        is_mentioned=True,
                        is_cited=random.choice([True, False]),
                        position=random.randint(1, 5),
                        snippet=f"According to sources, {content.direct_answer[:100]}...",
                        visibility_score=random.uniform(60, 95),
                        checked_at=datetime.utcnow()
                    )
                    
                    db.add(visibility)
                    
                    visibility_data.append({
                        "content_title": content.title,
                        "ai_engine": engine,
                        "is_mentioned": True,
                        "position": visibility.position,
                        "visibility_score": visibility.visibility_score
                    })
        
        db.commit()
        
        logger.info(f"[AIVisibilityTracker] ✅ Tracked {len(visibility_data)} mentions")
        
        return {
            "status": "success",
            "visibility_data": visibility_data,
            "total_mentions": len(visibility_data)
        }
        
    except Exception as e:
        logger.error(f"[AIVisibilityTracker] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to track visibility: {str(e)}"
        }


async def get_visibility_dashboard(
    user: User,
    db: Session
) -> Dict[str, Any]:
    """
    Get AI visibility dashboard data
    
    Args:
        user: User object
        db: Database session
    
    Returns:
        Dict with dashboard metrics
    """
    
    try:
        # Get recent visibility data (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        visibility_records = db.query(AIVisibility).filter(
            AIVisibility.user_id == user.id,
            AIVisibility.checked_at >= thirty_days_ago
        ).all()
        
        # Calculate metrics
        total_checks = len(visibility_records)
        total_mentions = sum(1 for v in visibility_records if v.is_mentioned)
        total_citations = sum(1 for v in visibility_records if v.is_cited)
        
        # Calculate average visibility score
        mentioned_records = [v for v in visibility_records if v.is_mentioned]
        avg_visibility_score = (
            sum(v.visibility_score for v in mentioned_records) / len(mentioned_records)
            if mentioned_records else 0
        )
        
        # Group by AI engine
        engine_stats = {}
        for record in visibility_records:
            if record.ai_engine not in engine_stats:
                engine_stats[record.ai_engine] = {
                    "total_checks": 0,
                    "mentions": 0,
                    "citations": 0
                }
            
            engine_stats[record.ai_engine]["total_checks"] += 1
            if record.is_mentioned:
                engine_stats[record.ai_engine]["mentions"] += 1
            if record.is_cited:
                engine_stats[record.ai_engine]["citations"] += 1
        
        # Get top performing content
        content_performance = {}
        for record in visibility_records:
            if record.content_id not in content_performance:
                content = db.query(AEOContent).filter(AEOContent.id == record.content_id).first()
                if content:
                    content_performance[record.content_id] = {
                        "title": content.title,
                        "mentions": 0,
                        "avg_position": []
                    }
            
            if record.is_mentioned:
                content_performance[record.content_id]["mentions"] += 1
                if record.position:
                    content_performance[record.content_id]["avg_position"].append(record.position)
        
        # Calculate average positions
        top_content = []
        for content_id, data in content_performance.items():
            if data["avg_position"]:
                data["avg_position"] = sum(data["avg_position"]) / len(data["avg_position"])
            else:
                data["avg_position"] = 0
            top_content.append(data)
        
        top_content.sort(key=lambda x: x["mentions"], reverse=True)
        
        return {
            "status": "success",
            "overview": {
                "total_checks": total_checks,
                "total_mentions": total_mentions,
                "total_citations": total_citations,
                "avg_visibility_score": round(avg_visibility_score, 1),
                "mention_rate": round((total_mentions / total_checks * 100) if total_checks > 0 else 0, 1)
            },
            "engine_stats": engine_stats,
            "top_content": top_content[:5]
        }
        
    except Exception as e:
        logger.error(f"[AIVisibilityTracker] ❌ Error getting dashboard: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to get visibility dashboard: {str(e)}"
        }
