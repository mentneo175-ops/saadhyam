"""
Reply Generator for Review Reply AI
Generates professional replies to customer reviews using TinyLlama

NOTE: This version uses improved prompts since LoRA adapters are disabled.
Optimized for TinyLlama fast CPU inference.
"""

import logging
from typing import Dict, Any, Optional
from .model_loader import get_model, get_tokenizer

logger = logging.getLogger(__name__)


def generate_reply(
    review: str,
    rating: int,
    business_type: str,
    tone: str = "professional",
    max_tokens: int = 150
) -> Dict[str, Any]:
    """
    Generate a professional reply to a customer review
    
    Args:
        review: Customer review text
        rating: Rating (1-5 stars)
        business_type: Type of business
        tone: Tone of reply
        max_tokens: Maximum tokens to generate (default 150)
    
    Returns:
        Dict with generated reply and metadata
    """
    
    try:
        import torch
        
        logger.info(f"🔄 Generating reply for {business_type} review (rating: {rating})")
        
        # Get model and tokenizer
        model = get_model()
        tokenizer = get_tokenizer()
        
        if model is None or tokenizer is None:
            logger.error("❌ Model or tokenizer not loaded")
            return {
                "success": False,
                "error": "Model not loaded",
                "reply": None
            }
        
        # Build improved prompt (replaces LoRA)
        logger.info("📝 Building structured prompt...")
        prompt = f"""You are a professional business owner.

Write a polite and engaging reply to this customer review:

Review: {review}
Rating: {rating}/5 stars
Business: {business_type}
Tone: {tone}

Keep it friendly and concise."""
        
        # Tokenize with truncation for memory efficiency
        logger.info("🔤 Tokenizing input...")
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=512  # Reduced from 2048 for memory efficiency
        ).to(model.device)
        
        # Generate with optimized settings for TinyLlama
        logger.info("🧠 Generating reply (2-5 seconds on TinyLlama)...")
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=150,  # Optimized for TinyLlama
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                num_beams=1  # Fast greedy decoding
            )
        
        # Decode
        logger.info("📖 Decoding output...")
        full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract reply (remove prompt from response)
        reply = _extract_reply(full_response, prompt)
        
        # Clean reply
        reply = _clean_reply(reply)
        
        logger.info(f"✅ Reply generated successfully")
        logger.info(f"📊 Reply length: {len(reply)} characters")
        
        return {
            "success": True,
            "reply": reply,
            "business_type": business_type,
            "rating": rating,
            "tone": tone,
            "error": None
        }
        
    except RuntimeError as e:
        if "out of memory" in str(e).lower() or "paging file" in str(e).lower():
            logger.error(f"❌ Out of memory error: {e}")
            return {
                "success": False,
                "error": "Insufficient memory to generate reply",
                "reply": None
            }
        else:
            logger.error(f"❌ Runtime error: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "reply": None
            }
    except Exception as e:
        logger.error(f"❌ Error generating reply: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "reply": None
        }


def _extract_reply(full_response: str, prompt: str) -> str:
    """
    Extract the generated reply from the full model output
    Removes the prompt from the response
    """
    
    # Find where the prompt ends
    if prompt in full_response:
        # Get text after prompt
        reply = full_response.split(prompt)[-1].strip()
    else:
        # If prompt not found, take last part
        reply = full_response.strip()
    
    return reply


def _clean_reply(reply: str) -> str:
    """
    Clean the generated reply
    - Remove extra whitespace
    - Remove incomplete sentences
    - Limit to reasonable length
    """
    
    # Remove extra whitespace
    reply = " ".join(reply.split())
    
    # Remove common model artifacts
    artifacts = [
        "[INST]", "[/INST]",
        "<s>", "</s>",
        "[BOS]", "[EOS]",
        "###", "---",
        "[PAD]", "[UNK]"
    ]
    
    for artifact in artifacts:
        reply = reply.replace(artifact, "").strip()
    
    # Ensure reply ends with proper punctuation
    if reply and reply[-1] not in ".!?":
        # Find last sentence
        sentences = reply.split(".")
        if len(sentences) > 1:
            # Keep complete sentences
            reply = ".".join(sentences[:-1]) + "."
        else:
            reply = reply.rstrip() + "."
    
    # Limit to reasonable length (max 500 chars)
    if len(reply) > 500:
        # Truncate at last complete sentence
        truncated = reply[:500]
        last_period = truncated.rfind(".")
        if last_period > 100:  # Ensure minimum length
            reply = truncated[:last_period + 1]
        else:
            reply = truncated + "."
    
    return reply.strip()



def generate_batch_replies(
    reviews: list,
    business_type: str,
    tone: str = "professional"
) -> list:
    """
    Generate replies for multiple reviews
    
    Args:
        reviews: List of dicts with 'review' and 'rating' keys
        business_type: Type of business
        tone: Tone of replies
    
    Returns:
        List of generated replies
    """
    
    logger.info(f"🔄 Generating {len(reviews)} replies...")
    results = []
    
    for i, review_data in enumerate(reviews, 1):
        logger.info(f"Processing review {i}/{len(reviews)}")
        
        result = generate_reply(
            review=review_data.get("review", ""),
            rating=review_data.get("rating", 3),
            business_type=business_type,
            tone=tone
        )
        
        results.append(result)
    
    logger.info(f"✅ Batch generation complete")
    return results
