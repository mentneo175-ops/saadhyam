from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

# Try to import from the correct path depending on where this is called from
try:
    from app.models.schema import ImageGenerationRequest
except ImportError:
    # Fallback: create a minimal schema class if import fails
    from dataclasses import dataclass
    from typing import Optional
    
    @dataclass
    class ImageGenerationRequest:
        business_type: str = ""
        use_case: str = ""
        style: str = ""
        model: str = "flux"
        prompt: str = ""


logger = logging.getLogger(__name__)

ADAPTER_ROOT = Path(__file__).resolve().parents[2] / "mistral_adapter"


@dataclass(frozen=True)
class ContentCreatorOutput:
    image_prompt: str
    caption: str


def _build_prompt_text(data: ImageGenerationRequest) -> str:
    return (
        "You are an expert marketing content creator. Return valid JSON with keys image_prompt and caption only.\n\n"
        f"Business type: {data.business_type}\n"
        f"Use case: {data.use_case}\n"
        f"Style: {data.style}\n"
        f"Image model: {data.model}\n"
        f"Campaign brief: {data.prompt.strip()}\n\n"
        "Output strict JSON format: {\"image_prompt\": \"...\", \"caption\": \"...\"}"
    )


def _safe_fallback_content(data: ImageGenerationRequest) -> ContentCreatorOutput:
    """Last resort fallback using simple template"""
    image_prompt = (
        f"{data.style} {data.use_case} for {data.business_type}, {data.prompt.strip()}, "
        "studio composition, premium lighting, high detail, marketing visual"
    )
    caption = (
        f"{data.business_type.title()} just got a premium glow-up. "
        "Crafted to stop the scroll and convert attention into action."
    )
    return ContentCreatorOutput(image_prompt=image_prompt, caption=caption)


def _from_groq_fallback(data: ImageGenerationRequest) -> ContentCreatorOutput:
    """Groq API fallback - fast and reliable"""
    from groq import Groq
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GROQ_API_KEY")
    
    client = Groq(api_key=api_key)
    
    prompt = (
        f"Create marketing content for an image campaign.\n"
        f"Business type: {data.business_type}\n"
        f"Use case: {data.use_case}\n"
        f"Style: {data.style}\n"
        f"Image model: {data.model}\n"
        f"Campaign brief: {data.prompt.strip()}\n\n"
        "Return ONLY valid JSON with keys image_prompt and caption.\n"
        'Format: {"image_prompt": "...", "caption": "..."}'
    )
    
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",  # Updated to supported model
        messages=[
            {
                "role": "system",
                "content": "You are an expert marketing content creator. Return only valid JSON with image_prompt and caption keys."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_tokens=512,
        response_format={"type": "json_object"}
    )
    
    response_text = completion.choices[0].message.content
    payload = _extract_json_payload(response_text)
    
    if payload is None:
        raise RuntimeError("Groq response did not contain valid JSON payload")
    
    image_prompt = str(payload.get("image_prompt", "")).strip()
    caption = str(payload.get("caption", "")).strip()
    
    if not image_prompt or not caption:
        raise RuntimeError("Groq output missing image_prompt or caption")
    
    return ContentCreatorOutput(image_prompt=image_prompt, caption=caption)


@lru_cache(maxsize=1)
def _select_adapter_checkpoint() -> Path | None:
    if not ADAPTER_ROOT.exists():
        logger.warning("Mistral adapter directory not found at %s", ADAPTER_ROOT)
        return None

    checkpoints = [p for p in ADAPTER_ROOT.iterdir() if p.is_dir() and p.name.startswith("checkpoint-")]
    if not checkpoints:
        logger.warning("No adapter checkpoints found under %s", ADAPTER_ROOT)
        return None

    def _checkpoint_order(path: Path) -> int:
        match = re.search(r"(\d+)$", path.name)
        return int(match.group(1)) if match else -1

    return sorted(checkpoints, key=_checkpoint_order)[-1]


@lru_cache(maxsize=1)
def _load_local_generator():
    checkpoint_path = _select_adapter_checkpoint()
    if checkpoint_path is None:
        raise RuntimeError("No local Mistral adapter checkpoint available")

    from peft import AutoPeftModelForCausalLM
    from transformers import AutoTokenizer, pipeline

    tokenizer = AutoTokenizer.from_pretrained(str(checkpoint_path))
    model = AutoPeftModelForCausalLM.from_pretrained(str(checkpoint_path), device_map="auto", torch_dtype="auto")
    return pipeline("text-generation", model=model, tokenizer=tokenizer)


def _extract_json_payload(text: str) -> dict[str, str] | None:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        payload = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None

    if not isinstance(payload, dict):
        return None
    return payload


def _build_messages(data: ImageGenerationRequest) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You are an expert marketing content creator. "
                "Return valid JSON with keys image_prompt and caption only."
            ),
        },
        {
            "role": "user",
            "content": (
                "Create high-converting content for an image campaign.\\n"
                f"Business type: {data.business_type}\\n"
                f"Use case: {data.use_case}\\n"
                f"Style: {data.style}\\n"
                f"Image model: {data.model}\n"
                f"Campaign brief: {data.prompt.strip()}\\n\\n"
                "Output strict JSON format: "
                '{"image_prompt": "...", "caption": "..."}'
            ),
        },
    ]


def _from_hf_inference(data: ImageGenerationRequest) -> ContentCreatorOutput:
    from huggingface_hub import InferenceClient

    token = os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN")
    if not token:
        raise RuntimeError("Missing HUGGINGFACE_TOKEN or HF_TOKEN")

    model_name = (
        os.getenv("MISTRAL_ENDPOINT_URL", "").strip()
        or os.getenv("MISTRAL_TEXT_MODEL", "").strip()
        or "mistralai/Mistral-7B-Instruct-v0.3"
    )
    client = InferenceClient(token=token)
    prompt_text = _build_prompt_text(data)
    text = client.text_generation(
        prompt=prompt_text,
        model=model_name,
        max_new_tokens=280,
        temperature=0.7,
        do_sample=True,
        return_full_text=False,
    )
    payload = _extract_json_payload(text)
    if payload is None:
        raise RuntimeError("Mistral response did not contain valid JSON payload")

    image_prompt = str(payload.get("image_prompt", "")).strip()
    caption = str(payload.get("caption", "")).strip()
    if not image_prompt or not caption:
        raise RuntimeError("Mistral output missing image_prompt or caption")
    return ContentCreatorOutput(image_prompt=image_prompt, caption=caption)


def _from_local_adapter(data: ImageGenerationRequest) -> ContentCreatorOutput:
    generator = _load_local_generator()
    output = generator(
        _build_messages(data),
        max_new_tokens=280,
        return_full_text=False,
        temperature=0.7,
        do_sample=True,
    )
    generated_text = output[0].get("generated_text", "") if output else ""

    if isinstance(generated_text, list):
        generated_text = generated_text[-1].get("content", "") if generated_text else ""

    payload = _extract_json_payload(str(generated_text))
    if payload is None:
        raise RuntimeError("Local adapter output did not contain valid JSON payload")

    image_prompt = str(payload.get("image_prompt", "")).strip()
    caption = str(payload.get("caption", "")).strip()
    if not image_prompt or not caption:
        raise RuntimeError("Local adapter output missing image_prompt or caption")
    return ContentCreatorOutput(image_prompt=image_prompt, caption=caption)


def generate_content_with_mistral_adapter(data: ImageGenerationRequest) -> ContentCreatorOutput:
    """
    Generate content with fallback chain:
    1. HuggingFace Mistral API (primary)
    2. Groq API (fast fallback)
    3. Local adapter (if available)
    4. Safe template (last resort)
    """
    preferred_mode = os.getenv("MISTRAL_CONTENT_MODE", "api").strip().lower()

    if preferred_mode == "local":
        try:
            logger.info("🤖 Trying local Mistral adapter...")
            return _from_local_adapter(data)
        except Exception as exc:
            logger.warning("Local Mistral adapter failed: %s", exc)
            # Fall through to API mode
    
    # Try HuggingFace API first
    try:
        logger.info("🤖 Trying HuggingFace Mistral API...")
        return _from_hf_inference(data)
    except Exception as hf_exc:
        logger.warning("HuggingFace Mistral failed: %s", hf_exc)
        
        # Try Groq as fallback
        try:
            logger.info("🚀 Falling back to Groq API...")
            return _from_groq_fallback(data)
        except Exception as groq_exc:
            logger.warning("Groq API failed: %s", groq_exc)
            
            # Try local adapter if not already tried
            if preferred_mode != "local":
                try:
                    logger.info("🔄 Trying local adapter as last resort...")
                    return _from_local_adapter(data)
                except Exception as local_exc:
                    logger.warning("Local adapter failed: %s", local_exc)
            
            # Final fallback to safe template
            logger.warning("All methods failed, using safe template fallback")
            return _safe_fallback_content(data)


def generate_content(business_type: str, platform: str, goal: str, tone: str, language: str, user_input: str) -> dict:
    """
    Wrapper function to match the expected interface from content_creator_service.py
    Converts the parameters to ImageGenerationRequest and returns a dict format
    """
    try:
        # Create a mock ImageGenerationRequest-like object
        class MockRequest:
            def __init__(self, business_type, platform, goal, tone, language, user_input):
                self.business_type = business_type
                self.use_case = goal
                self.style = tone
                self.model = "flux"  # default
                self.prompt = user_input
        
        mock_data = MockRequest(business_type, platform, goal, tone, language, user_input)
        
        # Generate content using the existing function
        result = generate_content_with_mistral_adapter(mock_data)
        
        # Convert to expected format
        return {
            "headline": f"{business_type} - {goal.title()}",
            "caption": result.caption,
            "subtext": result.image_prompt[:100] + "..." if len(result.image_prompt) > 100 else result.image_prompt,
            "cta": "Learn more!",
            "hashtags": f"#{business_type.lower().replace(' ', '')} #{platform} #{goal}"
        }
        
    except Exception as e:
        logger.error(f"Mistral wrapper failed: {e}")
        # Return template fallback
        return {
            "headline": f"{business_type} Deals",
            "caption": f"Discover amazing {business_type.lower()} deals and offers!",
            "subtext": f"Perfect for your {goal} needs",
            "cta": "Shop now!",
            "hashtags": f"#{business_type.lower().replace(' ', '')} #{platform}"
        }
