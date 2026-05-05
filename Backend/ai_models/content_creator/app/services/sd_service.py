from __future__ import annotations

import base64
import io
from datetime import datetime
from pathlib import Path
from typing import Final

import requests
from PIL import Image


SD_API_URL: Final[str] = "http://127.0.0.1:7860/sdapi/v1/txt2img"
DEFAULT_STEPS: Final[int] = 25
DEFAULT_WIDTH: Final[int] = 1024
DEFAULT_HEIGHT: Final[int] = 1024
REQUEST_TIMEOUT_SECONDS: Final[int] = 600


def _ensure_output_dir(output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def _build_filename(business_type: str) -> str:
    safe_business_type = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in business_type.lower()).strip("_")
    if not safe_business_type:
        safe_business_type = "image"
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    return f"{safe_business_type}_{timestamp}.png"


def generate_sd_image(
    prompt: str,
    negative_prompt: str = "",
    *,
    business_type: str = "image",
    output_dir: Path | None = None,
    steps: int = DEFAULT_STEPS,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
) -> str:
    if output_dir is None:
        output_dir = Path(__file__).resolve().parents[2] / "output" / "images"

    payload = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "steps": steps,
        "width": width,
        "height": height,
    }

    try:
        response = requests.post(SD_API_URL, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(
            "Stable Diffusion API request failed. Make sure Automatic1111 is running at http://127.0.0.1:7860."
        ) from exc

    data = response.json()
    images = data.get("images") or []
    if not images:
        raise RuntimeError("Stable Diffusion API returned no images.")

    image_bytes = base64.b64decode(images[0])
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    output_path = _ensure_output_dir(output_dir) / _build_filename(business_type)
    image.save(output_path, format="PNG")
    return str(output_path)
