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
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
        logger.info(f"🔑 GROQ_API_KEY status: {'SET' if api_key else 'NOT SET'}")
        if api_key:
            logger.info(f"🔑 API key length: {len(api_key)} characters")
            logger.info(f"🔑 API key starts with: {api_key[:10]}...")
        
        if not api_key:
            logger.warning("⚠️ GROQ_API_KEY not set, using fallback")
            return _fallback_content(user_input, business_type, platform, goal, tone, language)
        
        logger.info("🚀 Attempting GROQ API call...")
        logger.info(f"📝 Input: {user_input[:100]}...")
        client = Groq(api_key=api_key)
        logger.info("✅ Groq client initialized successfully")
        
        # Extract context from user input
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

        # Build user message with context
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
Make it SPECIFIC to this business and event. Avoid generic phrases.

If language is not English, translate the content appropriately while keeping hashtags in English for better reach."""

        logger.info(f"🤖 Generating smart content with Groq API")
        logger.info(f"   Context: {context}")
        
        # Call Groq API
        try:
            # Get model names from env
            primary_model = os.getenv("GROQ_CONTENT_MODEL", "llama-3.1-8b-instant")
            fallback_model = os.getenv("GROQ_CONTENT_MODEL_FALLBACK", "llama3-8b-8192")
            
            logger.info(f"🤖 Calling Groq API with model: {primary_model}")
            response = client.chat.completions.create(
                model=primary_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=600,
                timeout=15
            )
            logger.info("✅ Groq API call successful")
        except Exception as e:
            logger.warning(f"⚠️ Primary model ({primary_model}) failed: {e}")
            logger.info(f"🔄 Trying fallback model: {fallback_model}")
            response = client.chat.completions.create(
                model=fallback_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=600,
                timeout=10
            )
            logger.info("✅ Fallback model call successful")
        
        # Parse response
        content = response.choices[0].message.content.strip()
        logger.info(f"🤖 Raw API response: {content[:200]}...")
        
        # Extract JSON - improved extraction
        json_content = content
        
        # Try to find JSON in code blocks
        if "```json" in content:
            json_content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_content = content.split("```")[1].split("```")[0].strip()
        
        # Try to find JSON object in the text
        if not json_content.startswith("{"):
            # Look for the first { and last }
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                json_content = content[start:end]
        
        logger.info(f"🔍 Extracted JSON: {json_content[:200]}...")
        
        # Parse JSON
        try:
            result = json.loads(json_content)
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing failed, trying to clean content: {e}")
            # Try to clean the content
            json_content = json_content.replace('\n', ' ').replace('\r', ' ')
            # Remove any extra whitespace
            json_content = ' '.join(json_content.split())
            result = json.loads(json_content)
        
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
    
    # Check for generic phrases (less strict)
    generic_phrases = ["amazing", "wonderful", "awesome", "fantastic"]
    caption_lower = result["caption"].lower()
    
    generic_count = 0
    for phrase in generic_phrases:
        if phrase in caption_lower:
            generic_count += 1
    
    # Allow up to 1 generic phrase
    if generic_count > 1:
        logger.warning(f"⚠️ Too many generic phrases detected: {generic_count}")
        return False
    
    # Check if business type is mentioned (if specific) - more flexible
    if context["business_type"] != "Business":
        business_lower = context["business_type"].lower()
        combined = (result["headline"] + " " + result["caption"] + " " + result["subtext"]).lower()
        
        # Check for business-related keywords or general business terms
        business_keywords = business_lower.split() + ["business", "shop", "store", "service", "offer", "deal"]
        if not any(word in combined for word in business_keywords):
            logger.warning(f"⚠️ Business context not referenced")
            return False
    
    # Check if event is mentioned (if present) - more flexible
    if context["event"] != "None":
        event_lower = context["event"].lower()
        combined = (result["headline"] + " " + result["caption"] + " " + result["subtext"]).lower()
        # Also check for festival-related terms
        event_keywords = [event_lower, "festival", "celebration", "special", "offer"]
        if not any(keyword in combined for keyword in event_keywords):
            logger.warning(f"⚠️ Event context not mentioned: {context['event']}")
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
    
    logger.info(f"✅ Using template-based fallback content for {language}")
    
    # Extract context
    context = _extract_context(user_input, business_type, platform, goal)
    business = context["business_type"]
    event = context["event"]
    intent = context["intent"]
    
    # Language-specific content
    if language.lower() == "hindi":
        # Generate headline
        if event != "None":
            headline = f"{event} विशेष ऑफर"
        elif intent == "promotion":
            headline = f"{business} डील्स"
        else:
            headline = f"{business} में आएं"
        
        # Generate caption
        if event != "None":
            caption = f"{event} के इस खुशी के मौके पर {business} में विशेष छूट पाएं। सीमित समय के लिए बेहतरीन डील्स!"
        elif intent == "promotion":
            caption = f"{business} में अब विशेष छूट उपलब्ध है। गुणवत्तापूर्ण उत्पादों और सेवाओं पर बेहतरीन डील्स पाएं।"
        else:
            caption = f"{business} में प्रीमियम गुणवत्ता का अनुभव करें। उत्कृष्टता के लिए आपका भरोसेमंद विकल्प।"
        
        # Generate subtext
        if event != "None":
            subtext = "त्योहारी ऑफर सीमित समय के लिए"
        elif intent == "promotion":
            subtext = "जल्दी करें, स्टॉक सीमित है"
        else:
            subtext = "गुणवत्ता पर भरोसा करें"
        
        # Generate CTA
        if intent == "promotion":
            cta = "अभी खरीदें"
        else:
            cta = "आज ही आएं"
            
    elif language.lower() == "telugu":
        # Generate headline
        if event != "None":
            headline = f"{event} స్పెషల్ ఆఫర్స్"
        elif intent == "promotion":
            headline = f"{business} డీల్స్"
        else:
            headline = f"{business} రండి"
        
        # Generate caption
        if event != "None":
            caption = f"{event} సందర్భంగా {business} లో ప్రత్యేక ఆఫర్లు. పరిమిత కాలం డీల్స్ మిస్ చేయకండి!"
        elif intent == "promotion":
            caption = f"{business} లో ఇప్పుడు ప్రత్యేక డిస్కౌంట్లు అందుబాటులో. నాణ్యమైన ఉత్పత్తులు మరియు సేవలపై అత్యుత్తమ డీల్స్."
        else:
            caption = f"{business} లో ప్రీమియం నాణ్యతను అనుభవించండి. అత్యుత్తమత్వం కోసం మీ నమ్మకమైన ఎంపిక."
        
        # Generate subtext
        if event != "None":
            subtext = "పండుగ ఆఫర్లు పరిమిత కాలం వరకు"
        elif intent == "promotion":
            subtext = "త్వరపడండి, స్టాక్ పరిమితం"
        else:
            subtext = "నాణ్యతపై నమ్మకం"
        
        # Generate CTA
        if intent == "promotion":
            cta = "ఇప్పుడే కొనండి"
        else:
            cta = "ఈరోజే రండి"
    
    else:  # English (default)
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
    
    # Generate hashtags (always in English for better reach)
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
