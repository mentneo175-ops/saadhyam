"""
Content Creator Service
Priority chain: Gemini → Mistral → Groq → Template
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


def generate_content(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate marketing content (caption, hashtags, script) for social media
    Uses priority fallback chain:
    1. Gemini API (Google) - Primary, free tier with 3 API keys
    2. Mistral with adapter (HuggingFace) - Fallback 1
    3. Groq API - Fallback 2
    4. Template-based - Fallback 3
    
    Args:
        data: Dictionary with keys:
            - business_type: str (e.g., "Salon", "Restaurant")
            - platform: str ("instagram" | "facebook" | "reels")
            - goal: str ("promotion" | "engagement" | "branding")
            - tone: str ("professional" | "friendly" | "local")
            - language: str ("english" | "hindi" | "telugu")
            - user_input: str (optional, raw user description)
    
    Returns:
        Dictionary with:
            - status: "success"
            - content: {headline, caption, subtext, cta, hashtags}
    """
    business_type = data.get("business_type", "Business")
    platform = data.get("platform", "instagram")
    goal = data.get("goal", "promotion")
    tone = data.get("tone", "friendly")
    language = data.get("language", "english")
    user_input = data.get("user_input", "")
    
    # If no user input, create a basic one from parameters
    if not user_input:
        user_input = f"{business_type} {goal} content for {platform}"
    
    # PRIORITY 1: Try Gemini API (Google)
    try:
        logger.info(f"🎯 PRIORITY 1: Trying Gemini API for: {user_input}")
        from services.gemini_content_generator import generate_gemini_content
        
        result = generate_gemini_content(
            user_input=user_input,
            business_type=business_type,
            platform=platform,
            goal=goal,
            tone=tone,
            language=language
        )
        
        if result and "headline" in result:
            logger.info(f"✅ SUCCESS: Gemini API generated content")
            logger.info(f"   Headline: {result['headline']}")
            
            return {
                "status": "success",
                "content": {
                    "headline": result["headline"],
                    "caption": result["caption"],
                    "subtext": result["subtext"],
                    "cta": result["cta"],
                    "hashtags": result["hashtags"],
                    "script": result["subtext"] + " " + result["cta"]
                }
            }
        else:
            logger.warning("⚠️ Gemini API returned no result")
            
    except Exception as e:
        logger.warning(f"⚠️ Gemini API failed: {e}")
    
    logger.info("🔄 Falling back to Mistral...")
    
    # PRIORITY 2: Try Mistral with adapter (HuggingFace)
    try:
        logger.info(f"🎯 PRIORITY 2: Trying Mistral with adapter for: {user_input}")
        from ai_models.content_creator.app.services.mistral_content_service import generate_content as mistral_generate
        
        result = mistral_generate(
            business_type=business_type,
            platform=platform,
            goal=goal,
            tone=tone,
            language=language,
            user_input=user_input
        )
        
        if result and "headline" in result and result["headline"] != f"{business_type} Deals":
            logger.info(f"✅ SUCCESS: Mistral adapter generated content")
            logger.info(f"   Headline: {result['headline']}")
            
            return {
                "status": "success",
                "content": {
                    "headline": result["headline"],
                    "caption": result["caption"],
                    "subtext": result["subtext"],
                    "cta": result["cta"],
                    "hashtags": result["hashtags"],
                    "script": result["subtext"] + " " + result["cta"]
                }
            }
        else:
            logger.warning("⚠️ Mistral adapter returned template fallback")
            
    except Exception as e:
        logger.warning(f"⚠️ Mistral adapter failed: {e}")
    
    logger.info("🔄 Falling back to Groq...")
    
    # PRIORITY 3: Try Groq API
    try:
        logger.info(f"🎯 PRIORITY 3: Trying Groq API for: {user_input}")
        from services.smart_content_generator import generate_smart_content
        
        result = generate_smart_content(
            user_input=user_input,
            business_type=business_type,
            platform=platform,
            goal=goal,
            tone=tone,
            language=language
        )
        
        if result and "headline" in result:
            logger.info(f"✅ SUCCESS: Groq API generated content")
            logger.info(f"   Headline: {result['headline']}")
            
            return {
                "status": "success",
                "content": {
                    "headline": result["headline"],
                    "caption": result["caption"],
                    "subtext": result["subtext"],
                    "cta": result["cta"],
                    "hashtags": result["hashtags"],
                    "script": result["subtext"] + " " + result["cta"]
                }
            }
            
    except Exception as e:
        logger.warning(f"⚠️ Groq API failed: {e}")
    
    logger.info("🔄 Using final template fallback...")
    
    # PRIORITY 4: Final template fallback
    logger.info(f"🎯 PRIORITY 4: Using template fallback")
    return {
        "status": "success",
        "content": {
            "headline": f"{business_type} Updates",
            "caption": f"Check out what's new at {business_type}! Quality service and great value.",
            "subtext": "Visit us today for exclusive offers",
            "cta": "Contact us now",
            "hashtags": [f"#{business_type.replace(' ', '')}", f"#{platform}", "#LocalBusiness"],
            "script": "Visit us today for exclusive offers. Contact us now"
        }
    }
