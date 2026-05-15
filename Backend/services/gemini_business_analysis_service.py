"""
Gemini Business Analysis Service
Uses Google AI Studio Gemini API with Google Search grounding for real-time business analysis
This REPLACES the old TinyLlama local model for Business Analysis
"""

import logging
import json
import re
from typing import Dict, Any
from datetime import datetime
import google.generativeai as genai
from config.settings import settings

logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_MODEL_PRIMARY = "models/gemini-2.5-flash"  # Primary model - Gemini Flash 2.5 - best quality
GEMINI_MODEL_FALLBACK = "models/gemini-2.0-flash"  # Fallback model - Gemini Flash 2.0 - high availability
GEMINI_API_KEY = settings.GEMINI_API_KEY


def _configure_gemini():
    """Configure Gemini API with API key from settings"""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_google_ai_studio_api_key_here":
        logger.warning("⚠️  GEMINI_API_KEY not configured. Business Analysis will not work.")
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("✅ Gemini API configured successfully for Business Analysis")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to configure Gemini API: {e}")
        return False


async def generate_realtime_business_analysis(business_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate comprehensive real-time business analysis using Gemini with Google Search grounding
    
    Args:
        business_profile: Dict containing:
            - business_name: str
            - business_type: str
            - location: str
            - services: List[str] (optional)
            - target_audience: str (optional)
            - goals: str (optional)
            - website_or_instagram: str (optional)
    
    Returns:
        Dict with structured business analysis or error
    """
    
    logger.info("[BusinessAnalysis] Using Google AI Studio Gemini Search Grounding")
    
    configured = _configure_gemini()
    if not configured:
        return {
            "status": "error",
            "source": "google_ai_studio_gemini_search_grounding",
            "message": "Real-time business analysis is temporarily unavailable. GEMINI_API_KEY not configured."
        }
    
    try:
        # Extract business profile data
        business_name = business_profile.get("business_name", "")
        business_type = business_profile.get("business_type", "")
        location = business_profile.get("location", "")
        services = business_profile.get("services", [])
        target_audience = business_profile.get("target_audience", "")
        goals = business_profile.get("goals", "")
        website_or_instagram = business_profile.get("website_or_instagram", "")
        competitors_found = business_profile.get("competitors_found", [])
        
        logger.info(f"[BusinessAnalysis] Analyzing: {business_name} ({business_type}) in {location}")
        
        # Format competitor data if available
        competitor_context = ""
        if competitors_found:
            from services.competitor_search_service import format_competitors_for_gemini
            competitor_context = format_competitors_for_gemini(competitors_found)
            logger.info(f"[BusinessAnalysis] Using {len(competitors_found)} real competitors from web search")
        
        # Build comprehensive Gemini prompt with Google Search grounding
        prompt = f"""You are a business intelligence expert with access to real-time web data through Google Search.

**STEP 1 - SEARCH FOR REAL COMPETITORS THAT ACTUALLY EXIST:**
You MUST use Google Search to find REAL businesses that are PHYSICALLY OPERATING in {location}.

{competitor_context}

Search Google NOW with these exact queries:
1. "{business_type} in {location}"
2. "{business_type} near {location}"
3. "best {business_type} {location}"
4. "{location} {business_type} list"

Find businesses that:
- Have a real business name (not generic like "Competitor 1")
- Have a physical address or area in {location}
- Are currently operating (not closed)
- Are the same type as {business_type}

You MUST find at least 3-5 REAL competitor businesses before proceeding.

**STEP 2 - ANALYZE THE BUSINESS:**
Analyze this business using current market data, local trends, and the REAL competitors you found:

**Business Details:**
- Name: {business_name}
- Type: {business_type}
- Location: {location}
- Services: {', '.join(services) if isinstance(services, list) else services}
- Target Audience: {target_audience}
- Goals: {goals}
- Online Presence: {website_or_instagram}

**Your Task:**
Use Google Search to research:
1. **CRITICAL - FIND REAL NEARBY COMPETITORS**: You MUST search Google for actual {business_type} businesses in {location}. Search queries like "{business_type} in {location}", "coworking spaces in {location}", "competitors of {business_name}". Find at least 3-5 real business names with their actual locations. This is MANDATORY.
2. Current market trends for {business_type} businesses in {location}
3. Local competition and market dynamics
4. Customer preferences and behavior in this area
5. Successful strategies used by similar businesses
6. Local SEO and visibility opportunities
7. Growth opportunities specific to {location}

**IMPORTANT - NEARBY COMPETITORS MUST BE REAL BUSINESSES:**
You MUST use Google Search to find businesses that ACTUALLY EXIST in {location}.

DO NOT make up names. DO NOT use generic names like "Competitor A" or "Local Business 1".
DO use Google Search to find REAL business names like:
- For coworking spaces in Kakinada: "Regus Kakinada", "WorkHub Kakinada", "91Springboard", etc.
- For restaurants in Mumbai: "Britannia & Co", "Cafe Mondegar", "Leopold Cafe", etc.
- For gyms in Bangalore: "Cult.fit", "Gold's Gym", "Fitness First", etc.

Steps to find REAL competitors:
1. Search Google: "{business_type} in {location}"
2. Look at Google Maps results
3. Look at business directories
4. Find 3-5 businesses with real names and addresses
5. Include them in "nearby_competitors" array with their ACTUAL names

Example search queries to use RIGHT NOW:
- "coworking spaces in Kakinada"
- "shared office spaces Kakinada"
- "{business_type} near {location}"
- "best {business_type} in {location}"

Provide a comprehensive, data-driven analysis in this EXACT JSON format:

{{
  "business_details": {{
    "business_name": "{business_name}",
    "business_type": "{business_type}",
    "location": "{location}",
    "services": ["List 3-5 specific services this {business_type} business likely offers based on industry standards and local market"],
    "summary": "2-3 sentence AI-generated summary of the business and its market position"
  }},
  "strengths": [
    "Specific strength 1 based on real data",
    "Specific strength 2 based on real data",
    "Specific strength 3 based on real data"
  ],
  "weaknesses": [
    "Specific weakness 1 based on market analysis",
    "Specific weakness 2 based on market analysis",
    "Specific weakness 3 based on market analysis"
  ],
  "growth_opportunities": [
    "Specific opportunity 1 with real market data",
    "Specific opportunity 2 with real market data",
    "Specific opportunity 3 with real market data",
    "Specific opportunity 4 with real market data"
  ],
  "local_market_insights": {{
    "local_demand": "Description of current demand for {business_type} in {location}",
    "customer_behavior": "Description of customer behavior patterns in this area",
    "competition_level": "Low/Medium/High with explanation",
    "trending_services": ["Service 1", "Service 2", "Service 3"]
  }},
  "competitor_analysis": {{
    "nearby_competitors": [
      {{
        "name": "REAL Business Name from Google Search (e.g., 'Regus Kakinada', 'WorkHub Kakinada', '91Springboard Kakinada')",
        "location": "ACTUAL address or area from Google Maps (e.g., 'Main Road, Kakinada', 'Suryarao Pet, Kakinada')",
        "type": "Business type (e.g., 'Coworking Space', 'Shared Office', 'Business Center')",
        "strengths": "What they do well based on Google reviews or website (e.g., 'Premium location, 24/7 access, meeting rooms')",
        "weaknesses": "What they lack based on analysis (e.g., 'High pricing, limited parking, no community events')"
      }},
      {{
        "name": "REAL Business Name 2 from Google Search",
        "location": "ACTUAL address or area from Google Maps",
        "type": "Business type",
        "strengths": "What they do well",
        "weaknesses": "What they lack"
      }},
      {{
        "name": "REAL Business Name 3 from Google Search",
        "location": "ACTUAL address or area from Google Maps",
        "type": "Business type",
        "strengths": "What they do well",
        "weaknesses": "What they lack"
      }}
    ],
    "competitor_patterns": [
      "Pattern 1 observed in local competitors",
      "Pattern 2 observed in local competitors"
    ],
    "market_gaps": [
      "Gap 1 in the local market",
      "Gap 2 in the local market"
    ],
    "differentiation_ideas": [
      "Differentiation idea 1",
      "Differentiation idea 2",
      "Differentiation idea 3"
    ]
  }},
  "seo_google_maps_tips": {{
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "ranking_tips": [
      "Tip 1 for Google Maps ranking",
      "Tip 2 for Google Maps ranking",
      "Tip 3 for Google Maps ranking"
    ],
    "local_visibility_ideas": [
      "Visibility idea 1",
      "Visibility idea 2",
      "Visibility idea 3"
    ]
  }},
  "thirty_day_growth_plan": {{
    "week_1": [
      "Action 1 for week 1",
      "Action 2 for week 1"
    ],
    "week_2": [
      "Action 1 for week 2",
      "Action 2 for week 2"
    ],
    "week_3": [
      "Action 1 for week 3",
      "Action 2 for week 3"
    ],
    "week_4": [
      "Action 1 for week 4",
      "Action 2 for week 4"
    ]
  }},
  "daily_suggestions": [
    "Daily action 1",
    "Daily action 2",
    "Daily action 3",
    "Daily action 4",
    "Daily action 5"
  ],
  "health_score": 75
}}

**CRITICAL REQUIREMENTS:**
1. **NEARBY COMPETITORS MUST BE REAL BUSINESSES THAT EXIST**: You MUST use Google Search RIGHT NOW to find actual businesses operating in {location}. Search "{business_type} in {location}" on Google and list the REAL business names you find. DO NOT make up names. DO NOT use generic placeholders. The "nearby_competitors" array MUST contain at least 3 REAL business names with their ACTUAL locations from Google Search or Google Maps. If you cannot find any, search harder with different queries like "best {business_type} {location}" or "{location} {business_type} directory".
2. Use REAL data from Google Search - no generic advice
3. Be specific to {location} and {business_type}
4. Include actual market trends and competitor insights
5. Provide actionable, measurable recommendations
6. Health score (0-100) based on analysis
7. Return ONLY valid JSON, no markdown formatting
8. VERIFY: Before returning, check that "nearby_competitors" has real business names, not generic ones

**VERIFY BEFORE RETURNING:**
Check that "nearby_competitors" contains REAL business names from Google Search, not made-up names.
Each competitor must have:
- A real business name (searchable on Google)
- An actual location/address in {location}
- Real strengths and weaknesses based on online information

Generate the analysis now:"""

        logger.info("[BusinessAnalysis] Sending request to Gemini API...")
        
        # Try primary model first (gemini-2.0-flash-exp - Gemini Flash 2.5)
        try:
            logger.info(f"[BusinessAnalysis] Trying primary model: {GEMINI_MODEL_PRIMARY}")
            model = genai.GenerativeModel(GEMINI_MODEL_PRIMARY)
            response = model.generate_content(prompt)
            logger.info(f"[BusinessAnalysis] ✅ Success with primary model: {GEMINI_MODEL_PRIMARY}")
            
        except Exception as primary_error:
            error_str = str(primary_error)
            
            # Check if it's a 503 (high demand) or unavailable error
            if "503" in error_str or "UNAVAILABLE" in error_str or "high demand" in error_str.lower() or "overloaded" in error_str.lower():
                logger.warning(f"[BusinessAnalysis] ⚠️ Primary model unavailable (high demand): {GEMINI_MODEL_PRIMARY}")
                logger.info(f"[BusinessAnalysis] 🔄 Falling back to: {GEMINI_MODEL_FALLBACK}")
                
                # Retry with fallback model (gemini-2.0-flash-exp-8b - Gemini Flash 2.0)
                try:
                    model = genai.GenerativeModel(GEMINI_MODEL_FALLBACK)
                    response = model.generate_content(prompt)
                    logger.info(f"[BusinessAnalysis] ✅ Success with fallback model: {GEMINI_MODEL_FALLBACK}")
                    
                except Exception as fallback_error:
                    logger.error(f"[BusinessAnalysis] ❌ Fallback model also failed: {fallback_error}")
                    raise fallback_error
            else:
                # Not a high demand error, raise the original error
                logger.error(f"[BusinessAnalysis] ❌ Primary model failed: {primary_error}")
                raise primary_error
        
        response_text = response.text.strip()
        
        logger.info("[BusinessAnalysis] Received response from Gemini")
        
        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        
        # Parse JSON
        analysis_data = json.loads(response_text)
        
        logger.info(f"[BusinessAnalysis] ✅ Analysis completed successfully")
        logger.info(f"[BusinessAnalysis] Health Score: {analysis_data.get('health_score', 'N/A')}")
        
        # Return structured response
        return {
            "status": "success",
            "source": "google_ai_studio_gemini_search_grounding",
            "business_details": analysis_data.get("business_details", {}),
            "strengths": analysis_data.get("strengths", []),
            "weaknesses": analysis_data.get("weaknesses", []),
            "growth_opportunities": analysis_data.get("growth_opportunities", []),
            "local_market_insights": analysis_data.get("local_market_insights", {}),
            "competitor_analysis": analysis_data.get("competitor_analysis", {}),
            "seo_google_maps_tips": analysis_data.get("seo_google_maps_tips", {}),
            "thirty_day_growth_plan": analysis_data.get("thirty_day_growth_plan", {}),
            "daily_suggestions": analysis_data.get("daily_suggestions", []),
            "health_score": analysis_data.get("health_score", 0),
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"[BusinessAnalysis] ❌ Failed to parse Gemini response as JSON: {e}")
        logger.error(f"[BusinessAnalysis] Response text: {response_text[:500]}")
        return {
            "status": "error",
            "source": "google_ai_studio_gemini_search_grounding",
            "message": "Failed to parse analysis results. Please try again."
        }
    except Exception as e:
        error_message = str(e)
        logger.error(f"[BusinessAnalysis] ❌ Error generating business analysis: {e}", exc_info=True)
        
        # Check for rate limit error
        if "429" in error_message or "quota" in error_message.lower() or "rate limit" in error_message.lower():
            return {
                "status": "error",
                "source": "google_ai_studio_gemini_search_grounding",
                "message": "Rate limit exceeded. The free tier allows 5 requests per minute. Please wait a moment and try again.",
                "error_type": "rate_limit"
            }
        
        return {
            "status": "error",
            "source": "google_ai_studio_gemini_search_grounding",
            "message": f"Real-time business analysis failed: {error_message}"
        }
