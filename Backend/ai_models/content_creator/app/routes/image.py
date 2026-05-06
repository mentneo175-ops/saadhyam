from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.models.schema import ImageGenerationRequest, ImageGenerationResponse
from app.services.pipeline import OUTPUT_IMAGE_DIR, generate_image_pipeline


router = APIRouter(prefix="", tags=["image"])


@router.post("/generate-image", response_model=ImageGenerationResponse)
def generate_image(request: ImageGenerationRequest) -> ImageGenerationResponse:
    try:
        result = generate_image_pipeline(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    image_path = Path(result["image_path"])
    filename = image_path.name
    return ImageGenerationResponse(
        status="success",
        image_path=str(image_path),
        image_url=f"/image/{filename}",
        model_used=result["model_used"],
        filename=filename,
        generated_prompt=result.get("generated_prompt") or None,
        generated_caption=result.get("generated_caption") or None,
    )


@router.get("/image/{filename}")
def get_image(filename: str) -> FileResponse:
    requested_path = (OUTPUT_IMAGE_DIR / Path(filename).name).resolve()
    output_dir = OUTPUT_IMAGE_DIR.resolve()

    if output_dir not in requested_path.parents and requested_path != output_dir:
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if not requested_path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")

    return FileResponse(requested_path, media_type="image/png", filename=requested_path.name)
