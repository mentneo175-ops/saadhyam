from __future__ import annotations

from pathlib import Path

from app.models.schema import ImageGenerationRequest
from app.services.flux_service import generate_flux_image
from app.services.mistral_content_service import generate_content_with_mistral_adapter
from app.services.prompt_builder import build_prompt
from app.services.sd_service import generate_sd_image


OUTPUT_IMAGE_DIR = Path(__file__).resolve().parents[2] / "output" / "images"


def generate_image_pipeline(data: ImageGenerationRequest) -> dict[str, str]:
    prompt_bundle = build_prompt(data)
    generated_prompt = None
    generated_caption = None

    final_prompt = prompt_bundle.prompt
    if data.use_content_creator:
        content = generate_content_with_mistral_adapter(data)
        generated_prompt = content.image_prompt
        generated_caption = content.caption
        final_prompt = content.image_prompt

    if data.model == "flux":
        image_path = generate_flux_image(
            final_prompt,
            business_type=data.business_type,
            output_dir=OUTPUT_IMAGE_DIR,
        )
    elif data.model == "sd":
        image_path = generate_sd_image(
            final_prompt,
            prompt_bundle.negative_prompt,
            business_type=data.business_type,
            output_dir=OUTPUT_IMAGE_DIR,
        )
    else:
        raise ValueError(f"Unsupported model '{data.model}'. Expected 'flux' or 'sd'.")

    return {
        "status": "success",
        "image_path": image_path,
        "model_used": data.model,
        "generated_prompt": generated_prompt or "",
        "generated_caption": generated_caption or "",
    }
