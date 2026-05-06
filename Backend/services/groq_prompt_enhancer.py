"""
Groq-based Prompt Enhancer for Image Generation
Uses Groq API to generate clean image prompts WITHOUT text
Separates visual background from marketing text overlay
"""

import logging
import os
import json
from typing import Dict, Any
from groq import Groq

logger = logging.getLogger(__name__)


def enhance_image_prompt(
    user_prompt: str,
    business_type: str = "",
    style: str = "modern",
    use_case: str = "poster"
) -> Dict[str, Any]:
    """
    Use Groq API to enhance user prompt into:
    1. Clean image prompt (visual background ONLY, NO text)
    2. Negative prompt (strongly excludes text)
    3. Separate marketing text for overlay
    
    Args:
        user_prompt: Simple user input (e.g., "bike showroom Diwali offer")
        business_type: Type of business
        style: Visual style (modern, premium, vibrant)
        use_case: poster, product, banner
    
    Returns:
        {
            "image_prompt": "detailed visual description without text",
            "negative_prompt": "text, letters, words, logo...",
            "headline": "Main headline",
            "subheadline": "Supporting text",
            "cta": "Call to action"
        }
    """
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.warning("⚠️ GROQ_API_KEY not set, using fallback")
            return _fallback_enhance(user_prompt, business_type, style, use_case)
        
        client = Groq(api_key=api_key)
        
        # Build system prompt
        system_prompt = """You are an expert AI image prompt engineer and ad creative director.

Your task: Convert user input into TWO separate things:
1. A detailed IMAGE GENERATION PROMPT for visual background ONLY
2. Separate MARKETING TEXT for overlay

CRITICAL RULES FOR IMAGE PROMPT:
- The image prompt must NEVER ask the model to generate text, letters, logos, banners, typography, words, brand names, watermarks, or readable text
- Describe ONLY: subject, environment, lighting, camera angle, style, mood, composition, colors
- Include "empty space at top for text overlay" or "clean composition with space for text"
- Focus on visual elements only
- High quality, professional, commercial photography style

NEGATIVE PROMPT MUST INCLUDE:
text, letters, words, logo, watermark, typography, blurry text, distorted text, misspelled text, signage, banner text, written text, readable text

MARKETING TEXT:
- Create separate headline, subheadline, and CTA
- These will be overlaid on the image using proper typography
- Keep headline short and impactful (3-6 words)
- Subheadline should be descriptive (8-12 words)
- CTA should be action-oriented (2-3 words)

Return ONLY valid JSON in this exact format:
{
  "image_prompt": "detailed visual description here",
  "negative_prompt": "text, letters, words, logo, watermark, typography, blurry text, distorted text, misspelled text, signage, other unwanted elements",
  "headline": "Main Headline Here",
  "subheadline": "Supporting descriptive text here",
  "cta": "Action Text"
}"""

        # Build user message
        context_parts = []
        if business_type:
            context_parts.append(f"Business: {business_type}")
        context_parts.append(f"Style: {style}")
        context_parts.append(f"Use case: {use_case}")
        
        context_str = ", ".join(context_parts)
        user_message = f"""User input: "{user_prompt}"
Context: {context_str}

Generate the JSON response with image_prompt (NO TEXT IN IMAGE), negative_prompt, headline, subheadline, and cta."""

        logger.info(f"🤖 Calling Groq API for prompt enhancement: '{user_prompt}'")
        
        # Call Groq API with primary model
        try:
            response = client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=800,
                timeout=15
            )
        except Exception as e:
            logger.warning(f"⚠️ Primary model failed: {e}, trying fallback model")
            # Fallback to faster model
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=800,
                timeout=10
            )
        
        # Parse response
        content = response.choices[0].message.content.strip()
        
        # Extract JSON from response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        result = json.loads(content)
        
        # Validate required fields
        required_fields = ["image_prompt", "negative_prompt", "headline", "subheadline", "cta"]
        for field in required_fields:
            if field not in result:
                raise ValueError(f"Missing required field: {field}")
        
        # Ensure negative prompt includes text-related terms
        if "text" not in result["negative_prompt"].lower():
            result["negative_prompt"] = "text, letters, words, logo, watermark, typography, " + result["negative_prompt"]
        
        logger.info(f"✅ Groq enhancement successful")
        logger.info(f"   Image prompt: {result['image_prompt'][:80]}...")
        logger.info(f"   Headline: {result['headline']}")
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON parsing failed: {e}")
        logger.error(f"   Response content: {content[:200]}")
        return _fallback_enhance(user_prompt, business_type, style, use_case)
    except Exception as e:
        logger.error(f"❌ Groq API enhancement failed: {e}", exc_info=True)
        return _fallback_enhance(user_prompt, business_type, style, use_case)


def _fallback_enhance(
    user_prompt: str,
    business_type: str = "",
    style: str = "modern",
    use_case: str = "poster"
) -> Dict[str, Any]:
    """
    Fallback template-based enhancement when Groq API fails
    """
    logger.info(f"✅ Using fallback template enhancement")
    
    # Extract key information from prompt
    prompt_lower = user_prompt.lower()
    
    # Detect occasion/theme
    occasion = ""
    if "diwali" in prompt_lower or "deepavali" in prompt_lower:
        occasion = "Diwali"
        theme_desc = "decorated for Diwali festival, warm festive lighting, diyas and decorations"
    elif "christmas" in prompt_lower or "xmas" in prompt_lower:
        occasion = "Christmas"
        theme_desc = "decorated for Christmas, festive lights, holiday atmosphere"
    elif "new year" in prompt_lower:
        occasion = "New Year"
        theme_desc = "celebratory atmosphere, elegant lighting, festive mood"
    elif "sale" in prompt_lower or "offer" in prompt_lower or "discount" in prompt_lower:
        occasion = "Special Offer"
        theme_desc = "premium commercial setting, professional lighting, attractive display"
    else:
        theme_desc = "professional commercial setting, modern lighting, clean composition"
    
    # Build image prompt (NO TEXT)
    business_desc = business_type if business_type else "business"
    
    image_prompt = f"{style} {business_desc} interior, {theme_desc}, high-quality commercial photography, cinematic lighting, empty space at top for text overlay, professional composition, no text, no logo, no watermark, realistic, 4k quality"
    
    # Strong negative prompt
    negative_prompt = "text, letters, words, logo, watermark, typography, blurry text, distorted text, misspelled text, signage, banner text, written text, readable text, low quality, blurry, distorted"
    
    # Generate marketing text
    if occasion:
        headline = f"{occasion} Special"
        subheadline = f"Exclusive offers on {business_desc} this {occasion} season"
        cta = "Shop Now"
    else:
        headline = f"{business_desc.title()} Offers"
        subheadline = f"Discover amazing deals and premium quality"
        cta = "Explore Now"
    
    return {
        "image_prompt": image_prompt,
        "negative_prompt": negative_prompt,
        "headline": headline,
        "subheadline": subheadline,
        "cta": cta
    }
