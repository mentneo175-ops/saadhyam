"""
Prompt Enhancer Service
Converts simple user prompts into detailed, high-quality image generation prompts
Uses TinyLlama model for enhancement with timeout fallback
"""

import logging
from typing import Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

logger = logging.getLogger(__name__)

# Thread pool for running model inference
_executor = ThreadPoolExecutor(max_workers=1)


def enhance_prompt(user_input: str, context: Dict[str, Any] = None, timeout_seconds: int = 10) -> str:
    """
    Enhance a simple user prompt into a detailed image generation prompt
    
    Args:
        user_input: Simple user prompt (e.g., "salon poster", "gym ad")
        context: Optional context with business_type, use_case, style
        timeout_seconds: Maximum time to wait for AI enhancement (default: 10s)
    
    Returns:
        Enhanced detailed prompt optimized for image generation
    """
    try:
        # Try AI enhancement with timeout
        future = _executor.submit(_ai_enhance, user_input, context)
        try:
            enhanced = future.result(timeout=timeout_seconds)
            if enhanced and len(enhanced) >= 10:
                return enhanced
        except FuturesTimeoutError:
            logger.warning(f"⏱️ AI enhancement timed out after {timeout_seconds}s, using fallback")
        except Exception as e:
            logger.warning(f"⚠️ AI enhancement failed: {e}, using fallback")
        
        # Use fallback if AI fails or times out
        return _fallback_enhance(user_input, context)
        
    except Exception as e:
        logger.error(f"❌ Prompt enhancement failed: {e}", exc_info=True)
        return _fallback_enhance(user_input, context)


def _ai_enhance(user_input: str, context: Dict[str, Any] = None) -> str:
    """
    AI-powered enhancement using TinyLlama
    Runs in separate thread to allow timeout
    """
    try:
        # Import TinyLlama model
        from ai_models.review_reply_ai.model_loader import get_model, get_tokenizer, is_model_loaded
        import torch
        
        if not is_model_loaded():
            logger.warning("⚠️ TinyLlama not loaded")
            return None
        
        model = get_model()
        tokenizer = get_tokenizer()
        
        if model is None or tokenizer is None:
            logger.warning("⚠️ Model/tokenizer not available")
            return None
        
        # Extract context
        business_type = context.get("business_type", "") if context else ""
        use_case = context.get("use_case", "") if context else ""
        style = context.get("style", "") if context else ""
        
        # Build concise system prompt
        system_prompt = """You are a prompt engineer for AI image generation. Convert simple input into detailed prompts.

Rules:
- Add lighting, composition, style details
- Use professional photography terms
- NO text, logos, or words in image
- Max 40 words
- Return ONLY the enhanced prompt

Example:
Input: "gym poster"
Output: "muscular athlete lifting dumbbells in modern gym, dramatic lighting, high contrast, cinematic composition, professional fitness photography, 4k quality"
"""
        
        # Build user message
        context_parts = []
        if business_type:
            context_parts.append(f"Business: {business_type}")
        if use_case:
            context_parts.append(f"Use: {use_case}")
        if style:
            context_parts.append(f"Style: {style}")
        
        context_str = ", ".join(context_parts) if context_parts else ""
        user_message = f"Input: {user_input}"
        if context_str:
            user_message += f" ({context_str})"
        user_message += "\nOutput:"
        
        # Format for TinyLlama
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=400
        ).to(model.device)
        
        logger.info(f"🎨 Enhancing prompt with AI: '{user_input[:50]}'")
        
        # Generate with reduced tokens for speed
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=60,  # Reduced for speed
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        enhanced = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract generated part
        if "<|assistant|>" in enhanced:
            enhanced = enhanced.split("<|assistant|>")[-1].strip()
        elif "Output:" in enhanced:
            enhanced = enhanced.split("Output:")[-1].strip()
        
        enhanced = enhanced.strip().strip('"').strip("'")
        
        if len(enhanced) < 10 or len(enhanced) > 500:
            logger.warning(f"⚠️ Enhanced prompt length unusual ({len(enhanced)} chars)")
            return None
        
        logger.info(f"✅ AI enhanced: '{enhanced[:60]}...'")
        return enhanced
        
    except Exception as e:
        logger.error(f"❌ AI enhancement error: {e}")
        return None


def _fallback_enhance(user_input: str, context: Dict[str, Any] = None) -> str:
    """
    Fast template-based enhancement
    Used when AI is unavailable or times out
    """
    business_type = context.get("business_type", "business") if context else "business"
    use_case = context.get("use_case", "poster") if context else "poster"
    style = context.get("style", "modern") if context else "modern"
    
    # Clean user input
    user_input_clean = user_input.lower().strip()
    
    # Template-based enhancement
    templates = {
        "poster": f"{style} {use_case} for {business_type}, {user_input_clean}, professional marketing visual, high quality, eye-catching design, dramatic lighting, commercial photography style, 4k resolution, no text, no logo",
        "product": f"{style} product photography for {business_type}, {user_input_clean}, clean background, professional lighting, high detail, commercial quality, sharp focus, 4k resolution, no text",
        "banner": f"{style} banner design for {business_type}, {user_input_clean}, wide composition, professional visual, vibrant colors, high impact, commercial photography, 4k quality, no text, no logo"
    }
    
    template = templates.get(use_case, templates["poster"])
    
    logger.info(f"✅ Using fast template enhancement")
    return template
