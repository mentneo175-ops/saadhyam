"""
Smart Content Generator using Groq API
Generates HIGH-QUALITY, CONTEXT-AWARE, CONVERSION-FOCUSED content
"""

import logging
import os
import json
import re
from typing import Dict, Any
from groq import Groq

logger = logging.getLogger(__name__)


def generate_smart_content(
    user_input: str,
    business_type: str = "",
    platform: str = "instagram",
    goal: str = "promotion",
    tone: str = "friendly",
    language: str = "english"
) -> Dict[str, Any]:
    """
    Generate high-quality marketing content using Groq API
    
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
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.warning("⚠️ GROQ_API_KEY not set, using fallback")
            return _fallback_content(user_input, business_type, platform, goal, tone, language)
        
        client = Groq(api_key=api_key)
        
        # Extract context from user input
        context = _extract_context(user_input, business_type, platform, goal)
        
        # Build system prompt
        system_prompt = """You are an expert marketing copywriter for small businesses in India.

Your job is to generate HIGH-CONVERTING social media content based on user input.

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

OUTPUT FORMAT:
Return ONLY valid JSON in this exact structure:
{
  "headline": "Short catchy headline (3-6 words)",
  "caption": "Main content (2-3 sentences, specific and engaging)",
  "subtext": "Supporting line (1 sentence, adds value)",
  "cta": "Clear action (2-4 words)",
  "hashtags": ["#relevant", "#specific", "#notgeneric"]
}

EXAMPLES:

Input: "bike showroom Diwali offer"
Output:
{
  "headline": "Diwali Bike Bonanza 🪔",
  "caption": "This Diwali, ride home your dream bike with exclusive festive offers! Limited-time deals available now.",
  "subtext": "Special discounts + easy finance options",
  "cta": "Visit our showroom today",
  "hashtags": ["#DiwaliOffer", "#BikeSale", "#ShowroomDeals", "#FestiveOffers"]
}

Input: "salon hair treatment discount"
Output:
{
  "headline": "Hair Transformation Sale",
  "caption": "Get salon-quality hair treatments at unbeatable prices. Book your appointment and experience the difference.",
  "subtext": "Limited slots available this week",
  "cta": "Book now",
  "hashtags": ["#SalonDeals", "#HairTreatment", "#BeautyOffer", "#SalonLife"]
}

Input: "restaurant new menu launch"
Output:
{
  "headline": "New Menu Alert 🍽️",
  "caption": "Discover our chef's latest creations! Fresh flavors, authentic recipes, and dishes you'll love. Come taste the difference.",
  "subtext": "Available for dine-in and takeaway",
  "cta": "Order now",
  "hashtags": ["#NewMenu", "#FoodLovers", "#RestaurantLife", "#FreshFlavors"]
}

Remember: Be SPECIFIC, not generic. Use real business language."""

        # Build user message with context
        user_message = f"""User input: "{user_input}"

Context:
- Business type: {context['business_type']}
- Platform: {context['platform']}
- Event/Festival: {context['event']}
- Intent: {context['intent']}
- Language: {language}

Generate the JSON response with headline, caption, subtext, cta, and hashtags.
Make it SPECIFIC to this business and event. Avoid generic phrases."""

        logger.info(f"🤖 Generating smart content with Groq API")
        logger.info(f"   Context: {context}")
        
        # Call Groq API
        try:
            response = client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=600,
                timeout=15
            )
        except Exception as e:
            logger.warning(f"⚠️ Primary model failed: {e}, trying fallback model")
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=600,
                timeout=10
            )
        
        # Parse response
        content = response.choices[0].message.content.strip()
        
        # Extract JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        result = json.loads(content)
        
        # Validate required fields
        required_fields = ["headline", "caption", "subtext", "cta", "hashtags"]
        for field in required_fields:
            if field not in result:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate quality
        if not _validate_quality(result, context):
            logger.warning("⚠️ Generated content failed quality check, using fallback")
            return _fallback_content(user_input, business_type, platform, goal, tone, language)
        
        logger.info(f"✅ Smart content generated successfully")
        logger.info(f"   Headline: {result['headline']}")
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON parsing failed: {e}")
        return _fallback_content(user_input, business_type, platform, goal, tone, language)
    except Exception as e:
        logger.error(f"❌ Smart content generation failed: {e}", exc_info=True)
        return _fallback_content(user_input, business_type, platform, goal, tone, language)


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


def _validate_quality(result: Dict[str, Any], context: Dict[str, str]) -> bool:
    """Validate content quality"""
    
    # Check for generic phrases
    generic_phrases = ["amazing", "wonderful", "great", "awesome", "fantastic"]
    caption_lower = result["caption"].lower()
    
    for phrase in generic_phrases:
        if phrase in caption_lower:
            logger.warning(f"⚠️ Generic phrase detected: {phrase}")
            return False
    
    # Check if business type is mentioned (if specific)
    if context["business_type"] != "Business":
        business_lower = context["business_type"].lower()
        # At least one of caption, headline, or subtext should reference the business
        combined = (result["headline"] + " " + result["caption"] + " " + result["subtext"]).lower()
        # Check for business-related keywords
        if not any(word in combined for word in business_lower.split()):
            logger.warning(f"⚠️ Business type not referenced")
            return False
    
    # Check if event is mentioned (if present)
    if context["event"] != "None":
        event_lower = context["event"].lower()
        combined = (result["headline"] + " " + result["caption"]).lower()
        if event_lower not in combined:
            logger.warning(f"⚠️ Event not mentioned: {context['event']}")
            return False
    
    # Check for duplicate hashtags
    hashtags = result["hashtags"]
    if len(hashtags) != len(set(hashtags)):
        logger.warning(f"⚠️ Duplicate hashtags detected")
        return False
    
    return True


def _fallback_content(
    user_input: str,
    business_type: str,
    platform: str,
    goal: str,
    tone: str,
    language: str
) -> Dict[str, Any]:
    """Generate fallback content using templates"""
    
    logger.info(f"✅ Using template-based fallback content")
    
    # Extract context
    context = _extract_context(user_input, business_type, platform, goal)
    business = context["business_type"]
    event = context["event"]
    intent = context["intent"]
    
    # Generate headline
    if event != "None":
        headline = f"{event} Special Offers"
    elif intent == "promotion":
        headline = f"{business} Deals"
    else:
        headline = f"Visit {business}"
    
    # Generate caption
    if event != "None":
        caption = f"Celebrate {event} with exclusive offers at {business}. Limited time deals you don't want to miss!"
    elif intent == "promotion":
        caption = f"Special discounts now available at {business}. Get the best deals on quality products and services."
    else:
        caption = f"Experience premium quality at {business}. Your trusted choice for excellence."
    
    # Generate subtext
    if event != "None":
        subtext = f"Festive offers valid for limited time"
    elif intent == "promotion":
        subtext = "Hurry, while stocks last"
    else:
        subtext = "Quality you can trust"
    
    # Generate CTA
    if intent == "promotion":
        cta = "Shop now"
    elif platform == "instagram":
        cta = "Visit us today"
    else:
        cta = "Learn more"
    
    # Generate hashtags
    hashtags = []
    if event != "None":
        hashtags.append(f"#{event}Offers")
        hashtags.append(f"#{event}Sale")
    
    hashtags.extend([
        f"#{business.replace(' ', '')}",
        f"#{intent.capitalize()}",
        "#LocalBusiness",
        "#ShopLocal"
    ])
    
    return {
        "headline": headline,
        "caption": caption,
        "subtext": subtext,
        "cta": cta,
        "hashtags": hashtags[:8]
    }
