"""
Influencer Validation Service
Strict validation to ensure only real creator profiles are accepted
"""

import re
from typing import Dict, Any, Optional


class InfluencerValidationService:
    """
    Validates influencer profiles with strict quality checks
    Rejects generic pages, incomplete profiles, and low-quality results
    """
    
    @staticmethod
    def has_creator_indicators(bio: str, content: str, title: str) -> bool:
        """
        Check if profile has creator/influencer indicators
        
        Args:
            bio: Profile bio
            content: Page content
            title: Page title
            
        Returns:
            True if creator indicators found
        """
        text = f"{bio} {content} {title}".lower()
        
        creator_keywords = [
            "influencer", "blogger", "vlogger", "creator", "content creator",
            "youtuber", "instagrammer", "digital creator", "social media",
            "brand ambassador", "content", "photography", "videography",
            "traveler", "foodie", "fashionista", "stylist", "artist",
            "photographer", "filmmaker", "writer", "journalist",
            "entrepreneur", "founder", "ceo", "coach", "trainer",
            "reviewer", "critic", "enthusiast", "expert", "specialist"
        ]
        
        return any(keyword in text for keyword in creator_keywords)
    
    @staticmethod
    def has_niche_relevance(bio: str, content: str, target_industry: str) -> bool:
        """
        Check if profile is relevant to target industry
        
        Args:
            bio: Profile bio
            content: Page content
            target_industry: Target industry
            
        Returns:
            True if niche relevant
        """
        text = f"{bio} {content}".lower()
        industry_lower = target_industry.lower()
        
        industry_keywords = {
            "food": ["food", "restaurant", "chef", "cooking", "recipe", "cuisine", "foodie", "culinary", "dining", "eat"],
            "fashion": ["fashion", "style", "outfit", "clothing", "designer", "model", "wardrobe", "apparel", "wear", "dress"],
            "travel": ["travel", "tourism", "wanderlust", "adventure", "explore", "trip", "destination", "journey", "vacation"],
            "tech": ["tech", "technology", "gadget", "software", "coding", "developer", "digital", "innovation", "startup"],
            "fitness": ["fitness", "gym", "workout", "health", "yoga", "training", "exercise", "wellness", "nutrition"],
            "beauty": ["beauty", "makeup", "skincare", "cosmetic", "hair", "nail", "spa", "salon", "grooming"],
            "lifestyle": ["lifestyle", "life", "daily", "routine", "living", "home", "decor", "family"],
            "real-estate": ["real estate", "property", "home", "architecture", "interior", "house", "apartment"],
            "education": ["education", "learning", "teaching", "student", "school", "college", "university", "course"],
        }
        
        keywords = industry_keywords.get(industry_lower, [industry_lower])
        
        # Must have at least 2 keyword matches for strong relevance
        matches = sum(1 for keyword in keywords if keyword in text)
        return matches >= 2
    
    @staticmethod
    def has_location_relevance(location: str, bio: str, content: str, target_city: str) -> bool:
        """
        Check if profile has location relevance
        
        Args:
            location: Extracted location
            bio: Profile bio
            content: Page content
            target_city: Target city
            
        Returns:
            True if location relevant
        """
        text = f"{location} {bio} {content}".lower()
        city_lower = target_city.lower()
        
        # Direct city match
        if city_lower in text:
            return True
        
        # Regional matches for Indian cities
        regional_matches = {
            "kakinada": ["andhra pradesh", "coastal andhra", "east godavari", "ap"],
            "vizag": ["visakhapatnam", "andhra pradesh", "coastal andhra", "ap"],
            "visakhapatnam": ["vizag", "andhra pradesh", "coastal andhra", "ap"],
            "hyderabad": ["telangana", "secunderabad", "ts"],
            "vijayawada": ["andhra pradesh", "krishna district", "ap"],
            "bangalore": ["bengaluru", "karnataka", "ka"],
            "bengaluru": ["bangalore", "karnataka", "ka"],
            "mumbai": ["maharashtra", "bombay", "mh"],
            "delhi": ["new delhi", "ncr", "dl"],
            "chennai": ["tamil nadu", "madras", "tn"],
            "kolkata": ["west bengal", "calcutta", "wb"],
            "pune": ["maharashtra", "mh"],
        }
        
        for city, regions in regional_matches.items():
            if city in city_lower:
                for region in regions:
                    if region in text:
                        return True
        
        # India match (weak but acceptable)
        if "india" in text or "indian" in text:
            return True
        
        return False
    
    @staticmethod
    def has_profile_completeness(influencer: Dict[str, Any]) -> bool:
        """
        Check if profile has minimum required data
        
        Args:
            influencer: Influencer dict
            
        Returns:
            True if profile is complete enough
        """
        # Must have name
        if not influencer.get("name") or influencer.get("name") == "Unknown Creator":
            return False
        
        # Must have username
        if not influencer.get("username"):
            return False
        
        # Must have bio
        if not influencer.get("bio") or len(influencer.get("bio", "")) < 20:
            return False
        
        # Must have platform
        if not influencer.get("platform"):
            return False
        
        # Must have profile URL
        if not influencer.get("profile_url"):
            return False
        
        return True
    
    @staticmethod
    def calculate_quality_score(influencer: Dict[str, Any], target_industry: str, target_city: str) -> float:
        """
        Calculate overall quality score for influencer profile
        
        Args:
            influencer: Influencer dict
            target_industry: Target industry
            target_city: Target city
            
        Returns:
            Quality score (0-100)
        """
        score = 0.0
        
        # Creator indicators (20 points)
        if InfluencerValidationService.has_creator_indicators(
            influencer.get("bio", ""),
            influencer.get("bio", ""),  # Using bio as content proxy
            influencer.get("name", "")
        ):
            score += 20
        
        # Niche relevance (25 points)
        if InfluencerValidationService.has_niche_relevance(
            influencer.get("bio", ""),
            influencer.get("bio", ""),
            target_industry
        ):
            score += 25
        
        # Location relevance (20 points)
        if InfluencerValidationService.has_location_relevance(
            influencer.get("location", ""),
            influencer.get("bio", ""),
            influencer.get("bio", ""),
            target_city
        ):
            score += 20
        
        # Profile completeness (15 points)
        if InfluencerValidationService.has_profile_completeness(influencer):
            score += 15
        
        # Has follower count (10 points)
        if influencer.get("followers") and influencer.get("followers") > 0:
            score += 10
        
        # Platform preference (10 points)
        platform = influencer.get("platform", "")
        if platform == "Instagram":
            score += 10
        elif platform == "YouTube":
            score += 8
        elif platform == "Twitter":
            score += 6
        
        return min(score, 100.0)
    
    @staticmethod
    def validate_influencer(
        influencer: Dict[str, Any],
        target_industry: str,
        target_city: str,
        min_quality_score: float = 40.0  # Reduced from 50 to 40
    ) -> tuple[bool, float, str]:
        """
        Validate influencer profile with balanced checks
        
        Args:
            influencer: Influencer dict
            target_industry: Target industry
            target_city: Target city
            min_quality_score: Minimum quality score threshold
            
        Returns:
            Tuple of (is_valid, quality_score, rejection_reason)
        """
        # Calculate quality score
        quality_score = InfluencerValidationService.calculate_quality_score(
            influencer, target_industry, target_city
        )
        
        # Check minimum score
        if quality_score < min_quality_score:
            return False, quality_score, f"Quality score too low: {quality_score:.1f}"
        
        # Check creator indicators (relaxed - not mandatory for regional matches)
        has_creator_indicators = InfluencerValidationService.has_creator_indicators(
            influencer.get("bio", ""),
            influencer.get("bio", ""),
            influencer.get("name", "")
        )
        
        # Check profile completeness
        is_complete = InfluencerValidationService.has_profile_completeness(influencer)
        
        # For regional/state matches, be more lenient
        search_level = influencer.get("search_level", 1)
        if search_level >= 3:  # District/State/Regional level
            # Only require profile completeness
            if not is_complete:
                return False, quality_score, "Incomplete profile data"
        else:
            # For exact/nearby matches, require creator indicators
            if not has_creator_indicators:
                return False, quality_score, "No creator indicators found"
            if not is_complete:
                return False, quality_score, "Incomplete profile data"
        
        # Passed all checks
        return True, quality_score, "Valid"
    
    @staticmethod
    def batch_validate_influencers(
        influencers: list[Dict[str, Any]],
        target_industry: str,
        target_city: str,
        min_quality_score: float = 40.0  # Reduced from 50 to 40
    ) -> list[Dict[str, Any]]:
        """
        Validate multiple influencers and filter out invalid ones
        
        Args:
            influencers: List of influencer dicts
            target_industry: Target industry
            target_city: Target city
            min_quality_score: Minimum quality score threshold
            
        Returns:
            List of validated influencers with quality scores
        """
        validated = []
        rejected_count = 0
        
        print(f"🔍 Validating {len(influencers)} influencer profiles...")
        
        for influencer in influencers:
            is_valid, quality_score, reason = InfluencerValidationService.validate_influencer(
                influencer, target_industry, target_city, min_quality_score
            )
            
            if is_valid:
                influencer["quality_score"] = quality_score
                validated.append(influencer)
                print(f"  ✅ Valid: {influencer.get('name')} (score: {quality_score:.1f})")
            else:
                rejected_count += 1
                print(f"  ❌ Rejected: {influencer.get('name', 'Unknown')} - {reason}")
        
        print(f"✅ Validation complete: {len(validated)} valid, {rejected_count} rejected")
        
        return validated
