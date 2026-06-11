"""
AI Budget Engine
AI-powered budget recommendations using Gemini
"""

import os
import logging
import inspect
import google.generativeai as genai
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models.user import User
from models.meta_ads import BudgetRecommendation

logger = logging.getLogger(__name__)


class AIBudgetService:
    """AI-powered budget recommendation service"""

    UNSUPPORTED_MODELS = {"gemini-1.5-pro", "gemini-1.5-flash"}
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        
        genai.configure(api_key=api_key)
        # Prefer a currently supported model, with fallbacks for older environments.
        model_candidates = [
            os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-flash"),
            os.getenv("GEMINI_CONTENT_MODEL", "gemini-2.5-flash"),
            "gemini-2.0-flash",
            "gemini-pro",
        ]

        model_candidates = [
            model_name
            for model_name in model_candidates
            if model_name and model_name not in self.UNSUPPORTED_MODELS
        ]

        if not model_candidates:
            model_candidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"]

        self.model = None
        for model_name in model_candidates:
            try:
                self.model = genai.GenerativeModel(model_name)
                logger.info(f"✅ Gemini model initialized: {model_name}")
                break
            except Exception as e:
                logger.warning(f"⚠️ Failed to initialize {model_name}: {e}")

        if not self.model:
            logger.info("ℹ️ Will use fallback recommendations")
    
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
            
            try:
                response = self.model.generate_content(prompt)
                result_text = response.text.strip()
            except Exception as gemini_err:
                logger.warning(f"⚠️ Gemini generation failed for budget: {gemini_err}. Trying Groq fallback...")
                from groq import Groq
                groq_api_key = os.getenv("GROQ_API_KEY")
                if not groq_api_key:
                    from config.settings import settings
                    groq_api_key = settings.GROQ_API_KEY
                
                if groq_api_key:
                    try:
                        client = Groq(api_key=groq_api_key)
                        model_name = os.getenv("GROQ_CONTENT_MODEL", "llama-3.3-70b-versatile")
                        logger.info(f"🚀 Calling Groq API with model {model_name} as fallback for budget recommendations...")
                        chat_completion = client.chat.completions.create(
                            messages=[
                                {"role": "system", "content": f"You are a professional Meta Ads budget specialist. Return ONLY valid JSON in the currency requested and no markdown formatting."},
                                {"role": "user", "content": prompt}
                            ],
                            model=model_name,
                            temperature=0.2,
                            response_format={"type": "json_object"}
                        )
                        result_text = chat_completion.choices[0].message.content.strip()
                        logger.info("✅ Groq API budget recommendations fallback successful!")
                    except Exception as groq_err:
                        logger.error(f"❌ Groq fallback failed for budget: {groq_err}")
                        raise gemini_err
                else:
                    logger.warning("⚠️ Groq API key not configured, cannot fall back to Groq.")
                    raise gemini_err
            
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
            
            # Save to database when possible, but don't fail the recommendation flow if persistence breaks.
            recommendation_id = None
            try:
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
                commit_result = db.commit()
                if inspect.isawaitable(commit_result):
                    await commit_result

                refresh_result = db.refresh(budget_rec)
                if inspect.isawaitable(refresh_result):
                    await refresh_result

                recommendation_id = budget_rec.id
            except Exception as save_error:
                logger.warning(f"⚠️ Could not save budget recommendation, returning recommendations anyway: {save_error}")
                rollback_result = db.rollback()
                if inspect.isawaitable(rollback_result):
                    await rollback_result
            
            logger.info(f"✅ AI budget recommendations generated for user {user.id}")
            
            return {
                "success": True,
                "recommendations": recommendations,
                "recommendation_id": recommendation_id,
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
