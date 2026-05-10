"""
Influencer Ranking Service
Ranks and scores influencers based on relevance and compatibility
"""

from typing import List, Dict, Any


class InfluencerRankingService:
    """
    Ranks influencers based on multiple factors
    NO fake data generation - only ranking real influencers
    """
    
    @staticmethod
    def calculate_city_relevance(
        influencer_location: str,
        target_city: str,
        search_level_info: Dict[str, Any] = None
    ) -> float:
        """
        Calculate city relevance score with fuzzy matching (0-1)
        
        Args:
            influencer_location: Influencer's location
            target_city: Target city
            search_level_info: Search level information (optional)
            
        Returns:
            Relevance score between 0 and 1
        """
        from services.location_intelligence_service import LocationIntelligenceService
        
        if not influencer_location or not target_city:
            return 0.5
        
        # If search level info provided, use it for scoring
        if search_level_info:
            score = LocationIntelligenceService.calculate_location_relevance(
                influencer_location=influencer_location,
                target_location=target_city,
                search_level=search_level_info
            )
            return score / 100.0  # Convert to 0-1 scale
        
        # Fallback to original logic
        location_lower = influencer_location.lower()
        city_lower = target_city.lower()
        
        # Exact match
        if city_lower in location_lower:
            return 1.0
        
        # Get location info for fuzzy matching
        target_info = LocationIntelligenceService.get_location_info(target_city)
        
        # Check nearby cities
        for nearby in target_info.get("nearby_cities", []):
            if nearby.lower() in location_lower:
                return 0.8
        
        # Regional matches
        regional_matches = {
            "kakinada": ["andhra pradesh", "coastal andhra", "east godavari"],
            "vizag": ["visakhapatnam", "andhra pradesh", "coastal andhra"],
            "visakhapatnam": ["vizag", "andhra pradesh", "coastal andhra"],
            "hyderabad": ["telangana", "secunderabad"],
            "vijayawada": ["andhra pradesh", "krishna district"],
        }
        
        for city, regions in regional_matches.items():
            if city in city_lower:
                for region in regions:
                    if region in location_lower:
                        return 0.7
        
        # State match
        if target_info.get("state", "").lower() in location_lower:
            return 0.6
        
        # Region match
        if target_info.get("region", "").lower() in location_lower:
            return 0.5
        
        # India match
        if "india" in location_lower:
            return 0.4
        
        return 0.3
    
    @staticmethod
    def calculate_niche_relevance(
        influencer_bio: str,
        influencer_niche: str,
        target_industry: str
    ) -> float:
        """
        Calculate niche relevance score (0-1)
        
        Args:
            influencer_bio: Influencer's bio
            influencer_niche: Influencer's niche
            target_industry: Target industry
            
        Returns:
            Relevance score between 0 and 1
        """
        if not influencer_bio:
            return 0.5
        
        bio_lower = influencer_bio.lower()
        niche_lower = influencer_niche.lower()
        industry_lower = target_industry.lower()
        
        # Industry keywords
        industry_keywords = {
            "food": ["food", "restaurant", "chef", "cooking", "recipe", "cuisine", "foodie", "culinary"],
            "fashion": ["fashion", "style", "outfit", "clothing", "designer", "model", "wardrobe"],
            "travel": ["travel", "tourism", "wanderlust", "adventure", "explore", "trip", "destination"],
            "tech": ["tech", "technology", "gadget", "software", "coding", "developer", "digital"],
            "fitness": ["fitness", "gym", "workout", "health", "yoga", "training", "exercise"],
            "beauty": ["beauty", "makeup", "skincare", "cosmetic", "hair", "nail"],
            "real-estate": ["real estate", "property", "home", "architecture", "interior"],
        }
        
        keywords = industry_keywords.get(industry_lower, [industry_lower])
        
        # Count keyword matches
        matches = sum(1 for keyword in keywords if keyword in bio_lower or keyword in niche_lower)
        
        if matches >= 3:
            return 1.0
        elif matches == 2:
            return 0.8
        elif matches == 1:
            return 0.6
        else:
            return 0.3
    
    @staticmethod
    def calculate_platform_score(platform: str) -> float:
        """
        Calculate platform preference score (0-1)
        Instagram and YouTube are preferred for influencer marketing
        """
        platform_scores = {
            "Instagram": 1.0,
            "YouTube": 0.9,
            "Twitter": 0.7,
            "Facebook": 0.6,
            "Website": 0.5,
        }
        return platform_scores.get(platform, 0.5)
    
    @staticmethod
    def calculate_follower_score(followers: int) -> float:
        """
        Calculate follower count score (0-1)
        Sweet spot: 10K-500K followers
        """
        if not followers or followers == 0:
            return 0.5  # Unknown follower count
        
        if 10000 <= followers <= 500000:
            return 1.0  # Sweet spot for engagement
        elif 5000 <= followers < 10000:
            return 0.8  # Micro-influencers
        elif 500000 < followers <= 1000000:
            return 0.9  # Large following
        elif followers > 1000000:
            return 0.7  # Mega influencers (expensive, lower engagement)
        else:
            return 0.4  # Too small
    
    @staticmethod
    def calculate_overall_score(
        influencer: Dict[str, Any],
        target_city: str,
        target_industry: str
    ) -> float:
        """
        Calculate overall relevance score (0-100)
        
        Args:
            influencer: Influencer dict
            target_city: Target city
            target_industry: Target industry
            
        Returns:
            Overall score between 0 and 100
        """
        # Get search level info if available
        search_level_info = None
        if "search_level" in influencer:
            search_level_info = {
                "level": influencer.get("search_level", 1),
                "type": influencer.get("search_type", "exact"),
                "location": influencer.get("location", ""),
                "confidence": influencer.get("location_confidence", "Exact Match"),
                "confidence_score": influencer.get("location_confidence_score", 100)
            }
        
        # Calculate individual scores
        city_score = InfluencerRankingService.calculate_city_relevance(
            influencer.get("location", ""),
            target_city,
            search_level_info
        )
        
        niche_score = InfluencerRankingService.calculate_niche_relevance(
            influencer.get("bio", ""),
            influencer.get("niche", ""),
            target_industry
        )
        
        platform_score = InfluencerRankingService.calculate_platform_score(
            influencer.get("platform", "")
        )
        
        follower_score = InfluencerRankingService.calculate_follower_score(
            influencer.get("followers", 0)
        )
        
        search_score = influencer.get("search_score", 0.5)
        
        # Weighted average
        overall_score = (
            city_score * 0.30 +      # 30% weight on location
            niche_score * 0.35 +     # 35% weight on niche relevance
            platform_score * 0.15 +  # 15% weight on platform
            follower_score * 0.10 +  # 10% weight on followers
            search_score * 0.10      # 10% weight on search relevance
        )
        
        # Convert to 0-100 scale
        return round(overall_score * 100, 1)
    
    @staticmethod
    def rank_influencers(
        influencers: List[Dict[str, Any]],
        target_city: str,
        target_industry: str
    ) -> List[Dict[str, Any]]:
        """
        Rank influencers by relevance
        
        Args:
            influencers: List of influencer dicts
            target_city: Target city
            target_industry: Target industry
            
        Returns:
            Sorted list of influencers with scores
        """
        print(f"🎯 Ranking {len(influencers)} influencers...")
        
        # Calculate scores
        for influencer in influencers:
            score = InfluencerRankingService.calculate_overall_score(
                influencer=influencer,
                target_city=target_city,
                target_industry=target_industry
            )
            influencer["match_score"] = score
        
        # Sort by score (highest first)
        ranked = sorted(influencers, key=lambda x: x.get("match_score", 0), reverse=True)
        
        print(f"✅ Ranking complete. Top score: {ranked[0]['match_score'] if ranked else 0}")
        
        return ranked
    
    @staticmethod
    def filter_low_quality(
        influencers: List[Dict[str, Any]],
        min_score: float = 40.0
    ) -> List[Dict[str, Any]]:
        """
        Filter out low-quality matches
        
        Args:
            influencers: List of influencer dicts
            min_score: Minimum match score threshold
            
        Returns:
            Filtered list of influencers
        """
        filtered = [inf for inf in influencers if inf.get("match_score", 0) >= min_score]
        
        print(f"🔍 Filtered: {len(influencers)} → {len(filtered)} (min score: {min_score})")
        
        return filtered
