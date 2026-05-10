"""
Influencer Search Service
Database-first search with intelligent ranking
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from models.influencer import Influencer
from config.database import SyncSessionLocal as SessionLocal
import logging
import json

logger = logging.getLogger(__name__)


class InfluencerSearchService:
    """
    Search influencers from persistent database
    Fast, accurate, and intelligent matching
    """

    @staticmethod
    def search_by_industry(
        industry: str,
        location: Optional[str] = None,
        min_followers: int = 10000,
        max_followers: Optional[int] = None,
        min_engagement: float = 0.0,
        verified_only: bool = False,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search influencers by industry from database
        """
        db: Session = SessionLocal()
        try:
            logger.info(f"🔍 Searching database for {industry} influencers...")
            
            # Build query
            query = db.query(Influencer).filter(
                and_(
                    Influencer.primary_niche == industry.lower(),
                    Influencer.is_active == True,
                    Influencer.followers >= min_followers,
                    Influencer.engagement_rate >= min_engagement
                )
            )
            
            # Add optional filters
            if max_followers:
                query = query.filter(Influencer.followers <= max_followers)
            
            if verified_only:
                query = query.filter(Influencer.is_verified == True)
            
            if location:
                # Search in location, state, or city
                location_filter = or_(
                    Influencer.location.ilike(f"%{location}%"),
                    Influencer.state.ilike(f"%{location}%"),
                    Influencer.city.ilike(f"%{location}%")
                )
                query = query.filter(location_filter)
            
            # Order by relevance and quality
            query = query.order_by(
                desc(Influencer.relevance_score),
                desc(Influencer.quality_score),
                desc(Influencer.engagement_rate)
            )
            
            # Execute query
            influencers = query.limit(limit).all()
            
            logger.info(f"✅ Found {len(influencers)} influencers in database")
            
            # Convert to dict
            results = []
            for inf in influencers:
                inf_dict = inf.to_dict()
                
                # Parse JSON fields
                if inf_dict.get("hashtags") and isinstance(inf_dict["hashtags"], str):
                    try:
                        inf_dict["hashtags"] = json.loads(inf_dict["hashtags"])
                    except:
                        inf_dict["hashtags"] = []
                
                if inf_dict.get("secondary_niches") and isinstance(inf_dict["secondary_niches"], str):
                    try:
                        inf_dict["secondary_niches"] = json.loads(inf_dict["secondary_niches"])
                    except:
                        inf_dict["secondary_niches"] = []
                
                results.append(inf_dict)
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Database search error: {str(e)}")
            return []
        finally:
            db.close()

    @staticmethod
    def search_by_keywords(
        keywords: List[str],
        industry: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search influencers by keywords in bio/username
        """
        db: Session = SessionLocal()
        try:
            logger.info(f"🔍 Searching by keywords: {keywords}")
            
            # Build keyword filters
            keyword_filters = []
            for keyword in keywords:
                keyword_filters.append(
                    or_(
                        Influencer.bio.ilike(f"%{keyword}%"),
                        Influencer.username.ilike(f"%{keyword}%"),
                        Influencer.display_name.ilike(f"%{keyword}%")
                    )
                )
            
            # Build query
            query = db.query(Influencer).filter(
                and_(
                    Influencer.is_active == True,
                    or_(*keyword_filters)
                )
            )
            
            # Add industry filter if provided
            if industry:
                query = query.filter(Influencer.primary_niche == industry.lower())
            
            # Order by relevance
            query = query.order_by(
                desc(Influencer.relevance_score),
                desc(Influencer.quality_score)
            )
            
            # Execute
            influencers = query.limit(limit).all()
            
            logger.info(f"✅ Found {len(influencers)} influencers matching keywords")
            
            return [inf.to_dict() for inf in influencers]
            
        except Exception as e:
            logger.error(f"❌ Keyword search error: {str(e)}")
            return []
        finally:
            db.close()

    @staticmethod
    def get_influencer_by_username(username: str) -> Optional[Dict[str, Any]]:
        """
        Get specific influencer by username
        """
        db: Session = SessionLocal()
        try:
            influencer = db.query(Influencer).filter(
                Influencer.username == username.lower()
            ).first()
            
            if influencer:
                return influencer.to_dict()
            return None
            
        except Exception as e:
            logger.error(f"❌ Error fetching influencer: {str(e)}")
            return None
        finally:
            db.close()

    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """
        Get statistics about influencer database
        """
        db: Session = SessionLocal()
        try:
            total = db.query(Influencer).count()
            active = db.query(Influencer).filter(Influencer.is_active == True).count()
            verified = db.query(Influencer).filter(Influencer.is_verified == True).count()
            
            # Count by industry
            industries = {}
            for industry in ["food", "travel", "fitness", "fashion", "beauty", "real-estate", "tech", "lifestyle"]:
                count = db.query(Influencer).filter(
                    Influencer.primary_niche == industry
                ).count()
                industries[industry] = count
            
            return {
                "total_influencers": total,
                "active_influencers": active,
                "verified_influencers": verified,
                "by_industry": industries
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting stats: {str(e)}")
            return {}
        finally:
            db.close()

    @staticmethod
    def calculate_match_score(
        influencer: Dict[str, Any],
        business_industry: str,
        target_audience: str,
        location: str
    ) -> float:
        """
        Calculate how well an influencer matches business requirements
        """
        score = 0.0
        
        # Industry match (40 points)
        if influencer.get("primary_niche", "").lower() == business_industry.lower():
            score += 40
        
        # Use existing relevance score (30 points)
        relevance = influencer.get("relevance_score", 0)
        score += (relevance / 100) * 30
        
        # Use existing quality score (20 points)
        quality = influencer.get("quality_score", 0)
        score += (quality / 100) * 20
        
        # Location match (10 points)
        inf_location = (influencer.get("location", "") or "").lower()
        if location.lower() in inf_location:
            score += 10
        elif influencer.get("country", "").lower() == "india":
            score += 5
        
        return min(100.0, score)
