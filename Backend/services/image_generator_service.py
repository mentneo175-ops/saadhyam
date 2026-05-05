"""
Image Generator Service
Wrapper for Image Generation AI (FLUX and Stable Diffusion)
Uses Groq API for prompt enhancement and text overlay system
"""

import logging
import sys
from pathlib import Path
from typing import Dict, Any
from services.groq_prompt_enhancer import enhance_image_prompt
from services.poster_overlay_service import overlay_poster_text

logger = logging.getLogger(__name__)

# Output directory for images
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "output" / "images"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def generate_image(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate marketing images using FLUX or Stable Diffusion
    
    Args:
        data: Dictionary with keys:
            - business_type: str (e.g., "Salon", "Restaurant")
            - use_case: str ("poster" | "product" | "banner")
            - offer: str (e.g., "20% discount", "Grand Opening")
            - style: str ("modern" | "premium" | "vibrant")
            - model: str ("flux" | "sd")
    
    Returns:
        Dictionary with:
            - status: "success" | "error"
            - image_url: str (relative path to image)
            - model_used: str (if success)
            - message: error message (if error)
    """
    try:
        # Add content_creator app to path temporarily for imports
        CONTENT_CREATOR_PATH = Path(__file__).resolve().parents[1] / "ai_models" / "content_creator" / "app"
        if str(CONTENT_CREATOR_PATH) not in sys.path:
            sys.path.insert(0, str(CONTENT_CREATOR_PATH))
        
        # Import using importlib to avoid conflicts
        import importlib.util
        
        # Load flux_service
        flux_path = CONTENT_CREATOR_PATH / "services" / "flux_service.py"
        spec = importlib.util.spec_from_file_location("flux_service", flux_path)
        flux_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(flux_module)
        generate_flux_image = flux_module.generate_flux_image
        
        # Load sd_service
        sd_path = CONTENT_CREATOR_PATH / "services" / "sd_service.py"
        spec = importlib.util.spec_from_file_location("sd_service", sd_path)
        sd_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(sd_module)
        generate_sd_image = sd_module.generate_sd_image
        
        business_type = data.get("business_type", "Business")
        use_case = data.get("use_case", "poster")
        offer = data.get("offer", "")
        style = data.get("style", "modern")
        model = data.get("model", "flux").lower()
        
        # ============ GROQ PROMPT ENHANCEMENT ============
        # Use Groq API to enhance prompt and separate text from image
        logger.info(f"🤖 Enhancing prompt with Groq API...")
        enhanced = enhance_image_prompt(
            user_prompt=offer if offer else f"{business_type} {use_case}",
            business_type=business_type,
            style=style,
            use_case=use_case
        )
        
        image_prompt = enhanced["image_prompt"]
        negative_prompt = enhanced["negative_prompt"]
        headline = enhanced["headline"]
        subheadline = enhanced["subheadline"]
        cta = enhanced["cta"]
        
        logger.info(f"Generating image with {model.upper()} for {business_type}")
        logger.info(f"Image prompt (NO TEXT): {image_prompt[:100]}...")
        logger.info(f"Marketing text: {headline} | {subheadline} | {cta}")
        
        # ============ GENERATE BACKGROUND IMAGE (NO TEXT) ============
        if model == "flux":
            raw_image_path = generate_flux_image(
                prompt=image_prompt,
                business_type=business_type,
                output_dir=OUTPUT_DIR
            )
        elif model == "sd":
            raw_image_path = generate_sd_image(
                prompt=image_prompt,
                negative_prompt=negative_prompt,
                business_type=business_type,
                output_dir=OUTPUT_DIR
            )
        else:
            raise ValueError(f"Unsupported model: {model}. Use 'flux' or 'sd'")
        
        logger.info(f"✅ Background image generated: {raw_image_path}")
        
        # ============ ADD TEXT OVERLAY ============
        logger.info(f"📝 Adding text overlay...")
        final_image_path = overlay_poster_text(
            image_path=raw_image_path,
            headline=headline,
            subheadline=subheadline,
            cta=cta,
            style=style,
            output_dir=OUTPUT_DIR
        )
        
        # Convert paths to relative URL paths
        raw_image_path_obj = Path(raw_image_path)
        final_image_path_obj = Path(final_image_path)
        base_path = Path(__file__).resolve().parents[1]
        
        raw_relative = raw_image_path_obj.relative_to(base_path)
        final_relative = final_image_path_obj.relative_to(base_path)
        
        raw_image_url = f"/{str(raw_relative).replace(chr(92), '/')}"
        final_image_url = f"/{str(final_relative).replace(chr(92), '/')}"
        
        logger.info(f"✅ Final poster created successfully!")
        
        return {
            "status": "success",
            "raw_image_url": raw_image_url,
            "final_image_url": final_image_url,
            "image_url": final_image_url,  # Backward compatibility
            "model_used": model,
            "enhanced_prompt": image_prompt,
            "negative_prompt": negative_prompt,
            "headline": headline,
            "subheadline": subheadline,
            "cta": cta
        }
        
    except Exception as e:
        logger.error(f"Image generation failed: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Image generation failed: {str(e)}"
        }
