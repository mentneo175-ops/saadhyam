"""
AI Audience Engine
AI-powered audience targeting recommendations using Gemini
"""

import os
import logging
import google.generativeai as genai
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from models.user import User
from models.meta_ads import AudienceInsight

logger = logging.getLogger(__name__)


class AIAudienceService:
    """AI-powered audience recommendation service"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        
        genai.configure(api_key=api_key)
        # Use gemini-1.5-pro-latest or gemini-pro as fallback
        # Note: If this fails, fallback recommendations will be used
        try:
            # Try gemini-1.5-pro-latest first
            self.model = genai.GenerativeModel('gemini-1.5-pro-latest')
            logger.info("✅ Gemini model initialized: gemini-1.5-pro-latest")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize gemini-1.5-pro-latest: {e}")
            try:
                # Fallback to gemini-pro
                self.model = genai.GenerativeModel('gemini-pro')
                logger.info("✅ Gemini model initialized: gemini-pro (fallback)")
            except Exception as e2:
                logger.warning(f"⚠️ Failed to initialize gemini-pro: {e2}")
                logger.info("ℹ️ Will use fallback recommendations")
                self.model = None
    
    async def generate_audience_recommendations(
        self,
        db: Session,
        user: User,
        post_caption: Optional[str] = None,
        post_hashtags: Optional[List[str]] = None,
        campaign_objective: str = "OUTCOME_ENGAGEMENT",
    ) -> Dict[str, Any]:
        """
        Generate AI-powered audience targeting recommendations
        
        Analyzes:
        - Business category
        - Business location
        - Post content
        - Campaign objective
        
        Returns:
        - Recommended age groups
        - Recommended genders
        - Recommended locations
        - Recommended interests
        - Estimated reach
        - Confidence score
        """
        try:
            # Build context
            context = self._build_context(user, post_caption, post_hashtags, campaign_objective)
            
            # Check if model is available
            if not self.model:
                logger.info("ℹ️ Gemini model not available, using fallback recommendations")
                fallback = self._get_fallback_recommendations(user)
                return {
                    "success": True,
                    "recommendations": fallback,
                    "is_fallback": True,
                    "error_message": "Using default recommendations (Gemini unavailable)",
                }
            
            # Generate recommendations
            prompt = f"""You are an expert Meta Ads targeting specialist. Analyze the following business and campaign context, then provide precise audience targeting recommendations.

BUSINESS CONTEXT:
{context}

TASK:
Generate optimal audience targeting recommendations for a Meta Ads campaign.

PROVIDE YOUR RESPONSE IN THIS EXACT JSON FORMAT:
{{
    "recommended_age_min": <number between 18-65>,
    "recommended_age_max": <number between 18-65>,
    "recommended_genders": ["male", "female", or "all"],
    "recommended_locations": [
        {{
            "type": "city" or "region" or "country",
            "name": "<location name>",
            "radius_km": <number or null>
        }}
    ],
    "recommended_interests": [
        {{
            "name": "<interest name>",
            "category": "<category>",
            "relevance": "high" or "medium"
        }}
    ],
    "estimated_reach_min": <number>,
    "estimated_reach_max": <number>,
    "estimated_engagement_rate": <decimal between 0-1>,
    "confidence_score": <decimal between 0-1>,
    "reasoning": "<brief explanation of recommendations>"
}}

GUIDELINES:
1. Age range should be realistic for the business type
2. Gender targeting should be based on business category and product
3. Locations should include the business location and nearby areas
4. Interests should be highly relevant to the business and post content
5. Reach estimates should be realistic for the location and targeting
6. Engagement rate should consider industry benchmarks
7. Confidence score should reflect data quality and specificity

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting
- All fields are required
- Be specific and actionable
- Consider local market dynamics
"""
            
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean markdown formatting if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            # Parse JSON
            import json
            recommendations = json.loads(result_text)
            
            # Save to database
            insight = AudienceInsight(
                user_id=user.id,
                business_category=user.business_type,
                business_location=user.business_location,
                post_caption=post_caption,
                post_hashtags=post_hashtags,
                recommended_age_min=recommendations.get("recommended_age_min"),
                recommended_age_max=recommendations.get("recommended_age_max"),
                recommended_genders=recommendations.get("recommended_genders"),
                recommended_locations=recommendations.get("recommended_locations"),
                recommended_interests=recommendations.get("recommended_interests"),
                recommended_radius_km=recommendations.get("recommended_locations", [{}])[0].get("radius_km") if recommendations.get("recommended_locations") else None,
                estimated_reach_min=recommendations.get("estimated_reach_min"),
                estimated_reach_max=recommendations.get("estimated_reach_max"),
                estimated_engagement_rate=recommendations.get("estimated_engagement_rate"),
                confidence_score=recommendations.get("confidence_score"),
                reasoning=recommendations.get("reasoning"),
            )
            
            db.add(insight)
            db.commit()
            db.refresh(insight)
            
            logger.info(f"✅ AI audience recommendations generated for user {user.id}")
            
            return {
                "success": True,
                "recommendations": recommendations,
                "insight_id": insight.id,
            }
            
        except Exception as e:
            logger.error(f"Failed to generate audience recommendations: {e}")
            
            # Return fallback recommendations with success=True
            fallback = self._get_fallback_recommendations(user)
            
            return {
                "success": True,
                "recommendations": fallback,
                "is_fallback": True,
                "error_message": "Using default recommendations",
            }
    
    def _build_context(
        self,
        user: User,
        post_caption: Optional[str],
        post_hashtags: Optional[List[str]],
        campaign_objective: str,
    ) -> str:
        """Build context string for AI"""
        context_parts = []
        
        if user.business_name:
            context_parts.append(f"Business Name: {user.business_name}")
        
        if user.business_type:
            context_parts.append(f"Business Category: {user.business_type}")
        
        if user.business_location:
            context_parts.append(f"Business Location: {user.business_location}")
        
        if user.business_description:
            context_parts.append(f"Business Description: {user.business_description}")
        
        if post_caption:
            context_parts.append(f"Post Caption: {post_caption}")
        
        if post_hashtags:
            context_parts.append(f"Post Hashtags: {', '.join(post_hashtags)}")
        
        context_parts.append(f"Campaign Objective: {campaign_objective}")
        
        return "\n".join(context_parts)
    
    def _get_fallback_recommendations(self, user: User) -> Dict[str, Any]:
        """Fallback recommendations if AI fails"""
        return {
            "recommended_age_min": 18,
            "recommended_age_max": 65,
            "recommended_genders": ["all"],
            "recommended_locations": [
                {
                    "type": "city",
                    "name": user.business_location or "Local Area",
                    "radius_km": 25,
                }
            ],
            "recommended_interests": [
                {
                    "name": user.business_type or "General",
                    "category": "Business",
                    "relevance": "high",
                }
            ],
            "estimated_reach_min": 10000,
            "estimated_reach_max": 50000,
            "estimated_engagement_rate": 0.02,
            "confidence_score": 0.5,
            "reasoning": "Default recommendations based on business profile",
        }
    
    def convert_to_meta_targeting(self, recommendations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert AI recommendations to Meta Ads targeting spec
        
        Returns Meta-compatible targeting object
        """
        targeting = {
            "age_min": recommendations.get("recommended_age_min", 18),
            "age_max": recommendations.get("recommended_age_max", 65),
            "geo_locations": {},
            "publisher_platforms": ["facebook", "instagram"],
            "facebook_positions": ["feed", "story"],
            "instagram_positions": ["stream", "story", "explore"],
        }
        
        # Gender
        genders = recommendations.get("recommended_genders", ["all"])
        if "all" not in genders:
            if "male" in genders and "female" not in genders:
                targeting["genders"] = [1]  # Male only
            elif "female" in genders and "male" not in genders:
                targeting["genders"] = [2]  # Female only
            # If both, don't specify (targets all)
        
        # Locations - Use country-level targeting for reliability
        # Meta API requires specific location IDs or coordinates for custom_locations
        # For simplicity and reliability, we'll use country targeting
        locations = recommendations.get("recommended_locations", [])
        if locations:
            # Default to India for now (can be made dynamic based on user location)
            targeting["geo_locations"]["countries"] = ["IN"]  # India
            
            # Note: For more precise targeting, you would need to:
            # 1. Use Meta's location search API to get location IDs
            # 2. Or use latitude/longitude with custom_locations
            # 3. Or use predefined city/region keys from Meta's location database
        else:
            # Default to India if no location specified
            targeting["geo_locations"]["countries"] = ["IN"]
        
        # Interests - REMOVED TEMPORARILY
        # Meta API requires interest IDs, not just names
        # To implement properly, need to use Meta Targeting Search API:
        # GET /search?type=adinterest&q={interest_name}
        # Then use the returned ID instead of name
        #
        # For now, we use broad targeting without interests
        # This still works effectively as Meta's algorithm optimizes delivery
        
        logger.info(f"📊 Generated Meta targeting: {targeting}")
        
        return targeting


# Singleton instance
ai_audience_service = AIAudienceService()
