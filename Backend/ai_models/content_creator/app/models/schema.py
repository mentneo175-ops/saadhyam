from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Primary user prompt")
    business_type: str = Field(..., min_length=1, description="Business category")
    use_case: Literal["poster", "product", "banner"]
    style: Literal["modern", "premium", "vibrant"]
    model: Literal["flux", "sd"]
    use_content_creator: bool = Field(
        default=True,
        description="Generate image prompt and caption with the Mistral adapter before image generation.",
    )


class ImageGenerationResponse(BaseModel):
    status: Literal["success"]
    image_path: str
    image_url: str
    model_used: Literal["flux", "sd"]
    filename: str
    generated_prompt: str | None = None
    generated_caption: str | None = None
