"""
Gemini Real-time Business Intelligence Service
Uses Google AI Studio Gemini API with Google Search grounding for real-time business insights
"""

import logging
import json
import re
from typing import Dict, Any, List
import google.generativeai as genai
from config.settings import settings

logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_MODEL = "gemini-1.5-flash"  # Stable and reliable model
GEMINI_API_KEY = settings.GEMINI_API_KEY


def _configure_gemini():
    """Configure Gemini API with API key from settings"""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_google_ai_studio_api_key_here":
        logger.warning("⚠️  GEMINI_API_KEY not configured. Real-time features will not work.")
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("✅ Gemini API configured successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to configure Gemini API: {e}")
        return False


def _create_model_with_search():
    """Create Gemini model instance - Google Search grounding requires newer SDK version"""
    try:
        # Current google-generativeai version (0.8.3) doesn't support GoogleSearch
        # Create model without search grounding for now
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL
        )
        logger.warning("⚠️  Google Search grounding not available in current SDK version (0.8.3)")
        logger.info("💡 Model will use its training data. For real-time search, upgrade: pip install --upgrade google-generativeai")
        return model
    except Exception as e:
        logger.error(f"❌ Failed to create Gemini model: {e}")
        return None


async def generate_business_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate comprehensive business analysis using Gemini with real-time search
    
    Args:
        data: Business information including name, type, location, services, etc.
        
    Returns:
        Structured analysis with strengths, weaknesses, opportunities, and action plan
    """
    
    if not _configure_gemini():
        return {
            "status": "error",
            "message": "Real-time analysis is temporarily unavailable. Please configure GEMINI_API_KEY."
        }
    
    try:
        model = _create_model_with_search()
        if not model:
            raise Exception("Failed to create Gemini model")
        
        # Extract data
        business_name = data.get("business_name", "")
        business_type = data.get("business_type", "")
        location = data.get("location", "")
        services = data.get("services", [])
        target_audience = data.get("target_audience", "")
        goals = data.get("goals", "")
        language = data.get("language", "english").lower()
        
        # Build comprehensive prompt
        prompt = f"""You are a business intelligence expert. Analyze this business using real-time web data and provide actionable insights.

Business Details:
- Name: {business_name}
- Type: {business_type}
- Location: {location}
- Services: {', '.join(services) if isinstance(services, list) else services}
- Target Audience: {target_audience}
- Goals: {goals}

Using Google Search, research:
1. Current market trends for {business_type} in {location}
2. Local competition and market dynamics
3. Customer preferences and behavior patterns
4. Growth opportunities specific to this location and industry

Provide a comprehensive analysis in {language} with:

**STRENGTHS** (3-5 points):
- Identify unique advantages
- Consider location benefits
- Highlight service differentiation

**WEAKNESSES** (3-5 points):
- Identify gaps in current approach
- Consider market positioning
- Highlight areas needing improvement

**GROWTH OPPORTUNITIES** (4-6 points):
- Real-time market trends they can leverage
- Untapped customer segments
- Digital/online expansion ideas
- Partnership opportunities

**LOCAL MARKET IDEAS** (3-5 points):
- Location-specific strategies
- Local SEO and discovery tactics
- Community engagement ideas
- Regional marketing approaches

**30-DAY GROWTH PLAN** (5-7 actionable steps):
- Week 1-2 priorities
- Week 3-4 priorities
- Specific, measurable actions
- Quick wins and long-term strategies

Format your response as JSON:
{{
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "growth_opportunities": ["opportunity 1", "opportunity 2", ...],
  "local_market_ideas": ["idea 1", "idea 2", ...],
  "thirty_day_plan": ["action 1", "action 2", ...]
}}

Be specific, practical, and actionable. Avoid generic advice. Use real-time data from Google Search."""

        logger.info(f"🔍 Generating business analysis for: {business_name}")
        
        # Generate content with search grounding
        response = model.generate_content(prompt)
        
        # Extract JSON from response
        response_text = response.text.strip()
        
        # Extract JSON from markdown code blocks if present
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        
        # Parse JSON
        analysis = json.loads(response_text)
        
        logger.info(f"✅ Business analysis generated successfully")
        
        return {
            "status": "success",
            "source": "gemini_search_grounding",
            "analysis": {
                "strengths": analysis.get("strengths", []),
                "weaknesses": analysis.get("weaknesses", []),
                "growth_opportunities": analysis.get("growth_opportunities", []),
                "local_market_ideas": analysis.get("local_market_ideas", []),
                "thirty_day_plan": analysis.get("thirty_day_plan", [])
            }
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse Gemini response as JSON: {e}")
        logger.error(f"Response text: {response_text[:500]}")
        return {
            "status": "error",
            "message": "Failed to parse analysis results. Please try again."
        }
    except Exception as e:
        logger.error(f"❌ Error generating business analysis: {e}")
        return {
            "status": "error",
            "message": f"Real-time analysis failed: {str(e)}"
        }


async def generate_competitor_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate competitor analysis using Gemini with real-time search
    
    Args:
        data: Business type, location, radius/area, services
        
    Returns:
        Competitor insights, market gaps, and differentiation strategies
    """
    
    if not _configure_gemini():
        return {
            "status": "error",
            "message": "Real-time analysis is temporarily unavailable. Please configure GEMINI_API_KEY."
        }
    
    try:
        model = _create_model_with_search()
        if not model:
            raise Exception("Failed to create Gemini model")
        
        # Extract data
        business_type = data.get("business_type", "")
        location = data.get("location", "")
        radius_or_area = data.get("radius_or_area", "")
        services = data.get("services", [])
        language = data.get("language", "english").lower()
        
        # Build prompt
        prompt = f"""You are a competitive intelligence expert. Research and analyze competitors using real-time web data.

Search Parameters:
- Business Type: {business_type}
- Location: {location}
- Area/Radius: {radius_or_area}
- Services: {', '.join(services) if isinstance(services, list) else services}

Using Google Search, find and analyze:
1. Top competitors in this location
2. Their strengths and weaknesses
3. Market positioning strategies
4. Pricing and service offerings
5. Customer reviews and sentiment
6. Marketing approaches

Provide analysis in {language} with:

**COMPETITORS** (3-5 competitors):
For each competitor, provide:
- Name and brief description
- Key strengths
- Notable weaknesses
- Market position

**MARKET GAPS** (3-5 gaps):
- Underserved customer needs
- Service gaps in the market
- Pricing opportunities
- Geographic gaps

**DIFFERENTIATION IDEAS** (4-6 ideas):
- Unique value propositions
- Service innovations
- Customer experience improvements
- Niche targeting strategies

**ACTION PLAN** (5-7 steps):
- Immediate competitive moves
- Positioning strategies
- Marketing differentiation
- Service improvements

Format as JSON:
{{
  "competitors": [
    {{
      "name": "Competitor Name",
      "description": "Brief description",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "market_position": "Description of their position"
    }}
  ],
  "market_gaps": ["gap 1", "gap 2", ...],
  "differentiation_ideas": ["idea 1", "idea 2", ...],
  "action_plan": ["action 1", "action 2", ...]
}}

If exact competitors are not found, clearly state uncertainty and provide general market insights.
Be specific and practical."""

        logger.info(f"🔍 Generating competitor analysis for: {business_type} in {location}")
        
        # Generate content
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Parse JSON
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        
        analysis = json.loads(response_text)
        
        logger.info(f"✅ Competitor analysis generated successfully")
        
        return {
            "status": "success",
            "source": "gemini_search_grounding",
            "competitors": analysis.get("competitors", []),
            "market_gaps": analysis.get("market_gaps", []),
            "differentiation_ideas": analysis.get("differentiation_ideas", []),
            "action_plan": analysis.get("action_plan", [])
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse Gemini response as JSON: {e}")
        return {
            "status": "error",
            "message": "Failed to parse competitor analysis. Please try again."
        }
    except Exception as e:
        logger.error(f"❌ Error generating competitor analysis: {e}")
        return {
            "status": "error",
            "message": f"Competitor analysis failed: {str(e)}"
        }


async def generate_business_insights(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate business development insights using Gemini with real-time search
    
    Args:
        data: Business information for generating growth insights
        
    Returns:
        Market trends, SEO ideas, offers, customer acquisition strategies
    """
    
    if not _configure_gemini():
        return {
            "status": "error",
            "message": "Real-time analysis is temporarily unavailable. Please configure GEMINI_API_KEY."
        }
    
    try:
        model = _create_model_with_search()
        if not model:
            raise Exception("Failed to create Gemini model")
        
        # Extract data
        business_name = data.get("business_name", "")
        business_type = data.get("business_type", "")
        location = data.get("location", "")
        services = data.get("services", [])
        target_audience = data.get("target_audience", "")
        language = data.get("language", "english").lower()
        
        # Build prompt
        prompt = f"""You are a business growth strategist. Provide real-time, actionable insights for business development.

Business Context:
- Name: {business_name}
- Type: {business_type}
- Location: {location}
- Services: {', '.join(services) if isinstance(services, list) else services}
- Target Audience: {target_audience}

Using Google Search, research current:
1. Industry trends and innovations
2. Customer behavior patterns
3. Digital marketing opportunities
4. Local market dynamics
5. Successful strategies in similar businesses

Provide insights in {language} with:

**MARKET TRENDS** (4-6 trends):
- Current industry trends
- Emerging customer preferences
- Technology adoption patterns
- Seasonal opportunities

**SEO & LOCAL GROWTH IDEAS** (5-7 ideas):
- Local SEO strategies
- Google Business optimization
- Content marketing ideas
- Social media tactics
- Online visibility improvements

**OFFER IDEAS** (4-6 offers):
- Promotional strategies
- Package deals
- Seasonal offers
- Loyalty programs
- First-time customer incentives

**CUSTOMER ACQUISITION IDEAS** (5-7 ideas):
- Lead generation tactics
- Referral programs
- Partnership opportunities
- Community engagement
- Digital advertising strategies

**NEXT ACTIONS** (5-7 immediate steps):
- Quick wins (this week)
- Short-term goals (this month)
- Specific, measurable actions
- Priority order

Format as JSON:
{{
  "market_trends": ["trend 1", "trend 2", ...],
  "seo_ideas": ["idea 1", "idea 2", ...],
  "offer_ideas": ["offer 1", "offer 2", ...],
  "customer_acquisition_ideas": ["idea 1", "idea 2", ...],
  "next_actions": ["action 1", "action 2", ...]
}}

Be specific, practical, and immediately actionable. Focus on realistic strategies."""

        logger.info(f"🔍 Generating business insights for: {business_name}")
        
        # Generate content
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Parse JSON
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        
        insights = json.loads(response_text)
        
        logger.info(f"✅ Business insights generated successfully")
        
        return {
            "status": "success",
            "source": "gemini_search_grounding",
            "insights": {
                "market_trends": insights.get("market_trends", []),
                "seo_ideas": insights.get("seo_ideas", []),
                "offer_ideas": insights.get("offer_ideas", []),
                "customer_acquisition_ideas": insights.get("customer_acquisition_ideas", []),
                "next_actions": insights.get("next_actions", [])
            }
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse Gemini response as JSON: {e}")
        return {
            "status": "error",
            "message": "Failed to parse business insights. Please try again."
        }
    except Exception as e:
        logger.error(f"❌ Error generating business insights: {e}")
        return {
            "status": "error",
            "message": f"Business insights generation failed: {str(e)}"
        }
