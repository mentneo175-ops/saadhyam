"""
Content Creator Service
Wrapper for Content Creator AI (Smart Groq-based Generator)
"""

import logging
from typing import Dict, Any
from services.smart_content_generator import generate_smart_content

logger = logging.getLogger(__name__)


def generate_content(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate marketing content (caption, hashtags, script) for social media
    
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
    
    try:
        logger.info(f"Generating smart content for: {user_input}")
        
        # Use smart content generator with Groq API
        result = generate_smart_content(
            user_input=user_input,
            business_type=business_type,
            platform=platform,
            goal=goal,
            tone=tone,
            language=language
        )
        
        # Format response to match expected structure
        return {
            "status": "success",
            "content": {
                "headline": result["headline"],
                "caption": result["caption"],
                "subtext": result["subtext"],
                "cta": result["cta"],
                "hashtags": result["hashtags"],
                "script": result["subtext"] + " " + result["cta"]  # Use subtext + CTA instead of duplicating caption
            }
        }
        
    except Exception as e:
        logger.error(f"Content generation failed: {e}", exc_info=True)
        
        # This should not happen as smart_content_generator has its own fallback
        # But just in case, provide a basic fallback
        return {
            "status": "success",
            "content": {
                "headline": f"{business_type} Updates",
                "caption": f"Check out what's new at {business_type}!",
                "subtext": "Quality you can trust",
                "cta": "Visit us",
                "hashtags": [f"#{business_type.replace(' ', '')}", f"#{platform}"],
                "script": "Quality you can trust. Visit us"  # Use subtext + CTA
            }
        }
