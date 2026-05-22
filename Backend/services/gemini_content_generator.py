"""
Gemini Content Generator for Social Media
Uses Google's Gemini API for high-quality marketing content
"""

import logging
import os
import json
from typing import Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv
from config.settings import settings

load_dotenv()

logger = logging.getLogger(__name__)


def generate_gemini_content(
    user_input: str,
    business_type: str = "",
    platform: str = "instagram",
    goal: str = "promotion",
    tone: str = "friendly",
    language: str = "english"
) -> Dict[str, Any]:
    """
    Generate high-quality marketing content using Gemini API
    
    Args:
        user_input: User's raw input describing what they want
        business_type: Type of business
        platform: Social media platform
        goal: Content goal
        tone: Content tone
        language: Content language
    
    Returns:
        {
            "headline": "Short catchy headline",
            "caption": "Main content",
            "subtext": "Supporting line",
            "cta": "Call to action",
            "hashtags": ["#tag1", "#tag2", ...]
        }
    """
    try:
        # Get API keys and remove duplicates
        raw_keys = [
            os.getenv("GEMINI_API_KEY"),
            os.getenv("GEMINI_API_KEY_2"),
            os.getenv("GEMINI_API_KEY_3")
        ]
        api_keys = []
        _seen = set()
        for key in raw_keys:
            if key and key not in _seen:
                api_keys.append(key)
                _seen.add(key)
        
        if not api_keys:
            logger.warning("⚠️ No Gemini API keys found")
            return None
        
        logger.info(f"🔑 Found {len(api_keys)} unique Gemini API key(s)")
        
        # Extract context
        context = _extract_context(user_input, business_type, platform, goal)
        
        # Build system prompt
        system_prompt = """You are an expert marketing copywriter for small businesses in India.

Your job is to generate HIGH-CONVERTING social media content based on user input.

CRITICAL: You MUST return ONLY valid JSON. No explanations, no markdown, no extra text.

STRICT RULES:
1. Understand the business type and event (festival, offer, etc.)
2. Make content SPECIFIC, not generic
3. Include:
   - Clear offer or value proposition
   - Festival/event context (if any)
   - Emotional hook
   - Strong call-to-action
4. Avoid generic words like 'amazing', 'wonderful', 'great'
5. Do NOT repeat words unnecessarily
6. Use simple, real business language (not corporate jargon)
7. Keep it short and impactful
8. For Indian context: Use festival relevance (Diwali, Holi, etc.) and local tone

OUTPUT FORMAT - RETURN ONLY THIS JSON STRUCTURE:
{
  "headline": "Short catchy headline (3-6 words)",
  "caption": "Main content (2-3 sentences, specific and engaging)",
  "subtext": "Supporting line (1 sentence, adds value)",
  "cta": "Clear action (2-4 words)",
  "hashtags": ["#relevant", "#specific", "#notgeneric"]
}

EXAMPLES:

For "bike showroom Diwali offer":
{
  "headline": "Diwali Bike Bonanza 🪔",
  "caption": "This Diwali, ride home your dream bike with exclusive festive offers! Limited-time deals available now.",
  "subtext": "Special discounts + easy finance options",
  "cta": "Visit our showroom today",
  "hashtags": ["#DiwaliOffer", "#BikeSale", "#ShowroomDeals", "#FestiveOffers"]
}

For "salon hair treatment discount":
{
  "headline": "Hair Transformation Sale",
  "caption": "Get salon-quality hair treatments at unbeatable prices. Book your appointment and experience the difference.",
  "subtext": "Limited slots available this week",
  "cta": "Book now",
  "hashtags": ["#SalonDeals", "#HairTreatment", "#BeautyOffer", "#SalonLife"]
}

REMEMBER: Return ONLY the JSON object. No other text."""

        # Build user message
        user_message = f"""User input: "{user_input}"

Context:
- Business type: {context['business_type']}
- Platform: {context['platform']}
- Event/Festival: {context['event']}
- Intent: {context['intent']}
- Language: {language}
- Tone: {tone}

CRITICAL INSTRUCTION: The user has provided specific content above. You MUST use the details, offers, and context from their input. Do NOT generate generic business content. If they mention:
- Specific products (handbags, watches, accessories) → Include those exact products
- Specific discounts (30% OFF) → Include that exact discount
- Specific events (Weekend Sale) → Include that exact event
- Specific details → Use those exact details

Generate content in {language} language with {tone} tone that DIRECTLY relates to what the user provided.
Return ONLY the JSON response with headline, caption, subtext, cta, and hashtags.

If language is not English, translate the content appropriately while keeping hashtags in English for better reach."""

        # Try each API key
        for i, api_key in enumerate(api_keys):
            try:
                logger.info(f"🤖 Trying Gemini API key {i+1}/{len(api_keys)}")
                
                # Configure Gemini
                genai.configure(api_key=api_key)
                
                # Get model name from settings
                model_name = settings.GEMINI_CONTENT_MODEL
                logger.info(f"📦 Using Gemini model: {model_name}")
                
                model = genai.GenerativeModel(model_name)
                
                # Generate content
                full_prompt = f"{system_prompt}\n\n{user_message}"
                response = model.generate_content(full_prompt)
                
                # Extract text
                content = response.text.strip()
                logger.info(f"🤖 Raw Gemini response: {content[:200]}...")
                
                # Extract JSON
                json_content = content
                
                # Try to find JSON in code blocks
                if "```json" in content:
                    json_content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    json_content = content.split("```")[1].split("```")[0].strip()
                
                # Try to find JSON object in the text
                if not json_content.startswith("{"):
                    start = content.find("{")
                    end = content.rfind("}") + 1
                    if start != -1 and end > start:
                        json_content = content[start:end]
                
                # Parse JSON
                result = json.loads(json_content)
                
                # Validate required fields
                required_fields = ["headline", "caption", "subtext", "cta", "hashtags"]
                for field in required_fields:
                    if field not in result:
                        raise ValueError(f"Missing required field: {field}")
                
                logger.info(f"✅ Gemini content generated successfully")
                logger.info(f"   Headline: {result['headline']}")
                
                return result
                
            except Exception as e:
                logger.warning(f"⚠️ Gemini API key {i+1} failed: {e}")
                if i < len(api_keys) - 1:
                    logger.info(f"🔄 Trying next API key...")
                continue
        
        # All keys failed
        logger.warning("⚠️ All Gemini API keys failed")
        return None
        
    except Exception as e:
        logger.error(f"❌ Gemini content generation failed: {e}", exc_info=True)
        return None


def _extract_context(user_input: str, business_type: str, platform: str, goal: str) -> Dict[str, str]:
    """Extract context from user input"""
    input_lower = user_input.lower()
    
    # Detect business type from input if not provided
    if not business_type or business_type == "Business":
        business_keywords = {
            "bike": "Motorcycle Showroom",
            "motorcycle": "Motorcycle Showroom",
            "salon": "Salon",
            "spa": "Spa",
            "restaurant": "Restaurant",
            "cafe": "Cafe",
            "gym": "Gym",
            "fitness": "Fitness Center",
            "shop": "Shop",
            "store": "Store",
            "hotel": "Hotel"
        }
        for keyword, biz_type in business_keywords.items():
            if keyword in input_lower:
                business_type = biz_type
                break
    
    # Detect event/festival
    event = ""
    if "diwali" in input_lower or "deepavali" in input_lower:
        event = "Diwali"
    elif "holi" in input_lower:
        event = "Holi"
    elif "christmas" in input_lower or "xmas" in input_lower:
        event = "Christmas"
    elif "new year" in input_lower:
        event = "New Year"
    elif "eid" in input_lower:
        event = "Eid"
    elif "pongal" in input_lower:
        event = "Pongal"
    elif "onam" in input_lower:
        event = "Onam"
    
    # Detect intent
    intent = goal
    if "offer" in input_lower or "discount" in input_lower or "sale" in input_lower:
        intent = "promotion"
    elif "new" in input_lower or "launch" in input_lower:
        intent = "announcement"
    elif "event" in input_lower:
        intent = "event"
    
    return {
        "business_type": business_type if business_type else "Business",
        "platform": platform,
        "event": event if event else "None",
        "intent": intent
    }
