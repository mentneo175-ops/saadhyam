"""
AI Budget Engine
AI-powered budget recommendations using Gemini
"""

import os
import logging
import google.generativeai as genai
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models.user import User
from models.meta_ads import BudgetRecommendation

logger = logging.getLogger(__name__)


class AIBudgetService:
    """AI-powered budget recommendation service"""
    
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
    
    async def generate_budget_recommendations(
        self,
        db: Session,
        user: User,
        campaign_objective: str = "OUTCOME_ENGAGEMENT",
        target_audience_size: Optional[int] = None,
        currency: str = "INR",
    ) -> Dict[str, Any]:
        """
        Generate AI-powered budget recommendations
        
        Analyzes:
        - Business type
        - Campaign objective
        - Target audience size
        - Local market rates
        
        Returns:
        - Recommended daily budget
        - Recommended campaign duration
        - Estimated impressions
        - Estimated clicks
        - Estimated reach
        - Cost estimates (CPC, CPM)
        """
        try:
            # Build context
            context = self._build_context(user, campaign_objective, target_audience_size, currency)
            
            # Check if model is available
            if not self.model:
                logger.info("ℹ️ Gemini model not available, using fallback recommendations")
                fallback = self._get_fallback_recommendations(currency)
                return {
                    "success": True,
                    "recommendations": fallback,
                    "currency": currency,
                    "is_fallback": True,
                    "error_message": "Using default recommendations (Gemini unavailable)",
                }
            
            # Generate recommendations
            prompt = f"""You are an expert Meta Ads budget strategist. Analyze the following business and campaign context, then provide optimal budget recommendations.

BUSINESS CONTEXT:
{context}

TASK:
Generate optimal budget recommendations for a Meta Ads campaign.

PROVIDE YOUR RESPONSE IN THIS EXACT JSON FORMAT:
{{
    "recommended_daily_budget": <number in {currency}>,
    "recommended_duration_days": <number between 3-30>,
    "recommended_total_budget": <number in {currency}>,
    "estimated_impressions_min": <number>,
    "estimated_impressions_max": <number>,
    "estimated_clicks_min": <number>,
    "estimated_clicks_max": <number>,
    "estimated_reach_min": <number>,
    "estimated_reach_max": <number>,
    "estimated_cpc": <number in {currency}>,
    "estimated_cpm": <number in {currency}>,
    "reasoning": "<brief explanation of budget recommendations>"
}}

GUIDELINES FOR {currency}:
1. Daily budget should be realistic for small-medium businesses
2. For INR: Minimum ₹100/day, typical range ₹300-₹2000/day
3. For USD: Minimum $5/day, typical range $10-$100/day
4. Duration should balance reach and budget efficiency
5. Estimates should be based on current market rates
6. CPC for India: ₹2-₹15, for US: $0.50-$3.00
7. CPM for India: ₹50-₹300, for US: $5-$20
8. Consider business type and objective when estimating

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting
- All fields are required
- Be realistic and actionable
- Consider local market dynamics
- Budget should be affordable for small businesses
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
            budget_rec = BudgetRecommendation(
                user_id=user.id,
                objective=campaign_objective,
                target_audience_size=target_audience_size,
                recommended_daily_budget=recommendations.get("recommended_daily_budget"),
                recommended_duration_days=recommendations.get("recommended_duration_days"),
                recommended_total_budget=recommendations.get("recommended_total_budget"),
                estimated_impressions_min=recommendations.get("estimated_impressions_min"),
                estimated_impressions_max=recommendations.get("estimated_impressions_max"),
                estimated_clicks_min=recommendations.get("estimated_clicks_min"),
                estimated_clicks_max=recommendations.get("estimated_clicks_max"),
                estimated_reach_min=recommendations.get("estimated_reach_min"),
                estimated_reach_max=recommendations.get("estimated_reach_max"),
                estimated_cpc=recommendations.get("estimated_cpc"),
                estimated_cpm=recommendations.get("estimated_cpm"),
                reasoning=recommendations.get("reasoning"),
            )
            
            db.add(budget_rec)
            db.commit()
            db.refresh(budget_rec)
            
            logger.info(f"✅ AI budget recommendations generated for user {user.id}")
            
            return {
                "success": True,
                "recommendations": recommendations,
                "recommendation_id": budget_rec.id,
                "currency": currency,
            }
            
        except Exception as e:
            logger.error(f"Failed to generate budget recommendations: {e}")
            
            # Return fallback recommendations with success=True
            fallback = self._get_fallback_recommendations(currency)
            
            return {
                "success": True,
                "recommendations": fallback,
                "currency": currency,
                "is_fallback": True,
                "error_message": "Using default recommendations",
            }
    
    def _build_context(
        self,
        user: User,
        campaign_objective: str,
        target_audience_size: Optional[int],
        currency: str,
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
        
        context_parts.append(f"Campaign Objective: {campaign_objective}")
        
        if target_audience_size:
            context_parts.append(f"Target Audience Size: {target_audience_size:,} people")
        
        context_parts.append(f"Currency: {currency}")
        
        return "\n".join(context_parts)
    
    def _get_fallback_recommendations(self, currency: str) -> Dict[str, Any]:
        """Fallback recommendations if AI fails"""
        if currency == "INR":
            return {
                "recommended_daily_budget": 100,  # Meta minimum is ₹95.31, use ₹100 as safe minimum
                "recommended_duration_days": 7,
                "recommended_total_budget": 700,
                "estimated_impressions_min": 3000,
                "estimated_impressions_max": 6000,
                "estimated_clicks_min": 60,
                "estimated_clicks_max": 150,
                "estimated_reach_min": 2500,
                "estimated_reach_max": 5000,
                "estimated_cpc": 8.0,
                "estimated_cpm": 150.0,
                "reasoning": "Minimum budget recommendations for Indian market (Meta requires minimum ₹95.31/day)",
            }
        else:  # USD
            return {
                "recommended_daily_budget": 5,  # Meta minimum is ~$1, use $5 as safe minimum
                "recommended_duration_days": 7,
                "recommended_total_budget": 35,
                "estimated_impressions_min": 1000,
                "estimated_impressions_max": 2500,
                "estimated_clicks_min": 25,
                "estimated_clicks_max": 75,
                "estimated_reach_min": 800,
                "estimated_reach_max": 2000,
                "estimated_cpc": 1.5,
                "estimated_cpm": 10.0,
                "reasoning": "Minimum budget recommendations for US market",
            }
    
    def format_budget_display(self, amount: float, currency: str) -> str:
        """Format budget for display"""
        if currency == "INR":
            return f"₹{amount:,.0f}"
        elif currency == "USD":
            return f"${amount:,.2f}"
        else:
            return f"{currency} {amount:,.2f}"
    
    def convert_to_cents(self, amount: float) -> int:
        """Convert currency amount to cents for Meta API"""
        return int(amount * 100)


# Singleton instance
ai_budget_service = AIBudgetService()
