from __future__ import annotations

from dataclasses import dataclass

from app.models.schema import ImageGenerationRequest


DEFAULT_SD_NEGATIVE_PROMPT = (
    "low quality, blurry, distorted, deformed, bad anatomy, extra limbs,"
    " worst quality, low resolution, watermark, text, logo, cropped, out of frame"
)


@dataclass(frozen=True)
class PromptBundle:
    prompt: str
    negative_prompt: str


def build_prompt(data: ImageGenerationRequest) -> PromptBundle:
    core_prompt = (
        f"{data.style} {data.use_case} for {data.business_type}, "
        f"{data.prompt.strip()}, premium lighting, high quality, instagram ad style"
    )
    return PromptBundle(prompt=core_prompt.strip(), negative_prompt=DEFAULT_SD_NEGATIVE_PROMPT)
