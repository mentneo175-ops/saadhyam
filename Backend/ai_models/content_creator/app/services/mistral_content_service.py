from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from app.models.schema import ImageGenerationRequest


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
    image_prompt = (
        f"{data.style} {data.use_case} for {data.business_type}, {data.prompt.strip()}, "
        "studio composition, premium lighting, high detail, marketing visual"
    )
    caption = (
        f"{data.business_type.title()} just got a premium glow-up. "
        "Crafted to stop the scroll and convert attention into action."
    )
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
    preferred_mode = os.getenv("MISTRAL_CONTENT_MODE", "api").strip().lower()

    if preferred_mode == "local":
        try:
            return _from_local_adapter(data)
        except Exception as exc:
            logger.warning("Local Mistral adapter failed, falling back to API mode: %s", exc)
            try:
                return _from_hf_inference(data)
            except Exception as api_exc:
                logger.warning("HF Mistral content generation failed, using safe template fallback: %s", api_exc)
                return _safe_fallback_content(data)

    try:
        return _from_hf_inference(data)
    except Exception as exc:
        logger.warning("HF Mistral content generation failed, using safe template fallback: %s", exc)
        return _safe_fallback_content(data)
