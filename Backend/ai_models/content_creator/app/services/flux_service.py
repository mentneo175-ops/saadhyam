from __future__ import annotations

import io
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Final

from huggingface_hub import InferenceClient
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

MODEL_ID: Final[str] = "black-forest-labs/FLUX.1-schnell"
REQUEST_TIMEOUT_SECONDS: Final[int] = 300


def _safe_business_type(business_type: str) -> str:
    cleaned = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in business_type.lower()).strip("_")
    return cleaned or "image"


def _build_filename(business_type: str) -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    return f"{_safe_business_type(business_type)}_{timestamp}.png"


def _create_fallback_image(prompt: str, business_type: str, output_dir: Path) -> str:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / _build_filename(business_type)

    width, height = 1024, 1024
    image = Image.new("RGB", (width, height), color=(12, 18, 33))
    draw = ImageDraw.Draw(image)

    for index, shade in enumerate(range(28, 72, 4)):
        draw.rectangle([0, index * 24, width, index * 24 + 24], fill=(shade, shade + 8, shade + 20))

    title_font = ImageFont.load_default()
    body_font = ImageFont.load_default()

    draw.rounded_rectangle([72, 88, width - 72, height - 88], radius=36, outline=(124, 227, 255), width=4)
    draw.text((108, 132), "FLUX via API", fill=(124, 227, 255), font=title_font)
    draw.text((108, 170), f"Business: {business_type}", fill=(245, 247, 251), font=body_font)

    wrapped_prompt = [prompt.strip()[i : i + 42] for i in range(0, len(prompt.strip()), 42)]
    y_position = 252
    draw.text((108, y_position - 44), "Prompt", fill=(155, 255, 178), font=title_font)
    for line in wrapped_prompt[:16]:
        draw.text((108, y_position), line, fill=(245, 247, 251), font=body_font)
        y_position += 28

    draw.text(
        (108, height - 180),
        "Fallback: API call failed or model is loading.",
        fill=(206, 214, 224),
        font=body_font,
    )

    image.save(output_path, format="PNG")
    return str(output_path)


def generate_flux_image(
    prompt: str,
    *,
    business_type: str = "image",
    output_dir: Path | None = None,
) -> str:
    if output_dir is None:
        output_dir = Path(__file__).resolve().parents[2] / "output" / "images"

    token = os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN")
    if not token:
        logger.error("HUGGINGFACE_TOKEN not set, falling back to placeholder image")
        return _create_fallback_image(prompt, business_type, output_dir)

    try:
        logger.info(f"Calling HF Inference API for {MODEL_ID} with prompt: {prompt[:50]}...")
        client = InferenceClient(token=token)
        image = client.text_to_image(prompt, model=MODEL_ID)
    except Exception as exc:
        logger.error(f"HF Inference API request failed: {exc}")
        return _create_fallback_image(prompt, business_type, output_dir)

    try:
        # InferenceClient returns PIL Image directly, not bytes
        if not isinstance(image, Image.Image):
            image = Image.open(io.BytesIO(image)).convert("RGB")
        else:
            image = image.convert("RGB")
        
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / _build_filename(business_type)
        image.save(output_path, format="PNG")
        logger.info(f"Image saved to {output_path}")
        return str(output_path)
    except Exception as exc:
        logger.error(f"Failed to process image: {exc}")
        return _create_fallback_image(prompt, business_type, output_dir)
