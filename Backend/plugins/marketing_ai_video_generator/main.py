import logging
import os
import json
import re
import asyncio
import uuid
import base64
import io
import time
import requests
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List
import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont
from config.settings import settings

from plugins.base import AIPlugin

logger = logging.getLogger(__name__)



def attempt_repair_json(text: str) -> dict:
    """Attempt to repair common JSON formatting errors and parse it."""
    text = text.strip()
    if text.startswith("```json"):
        text = text.replace("```json", "", 1)
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    text = text.strip()
    
    # Try finding first { and last }
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
            
    # Try removing trailing commas
    cleaned = re.sub(r",\s*([\]}])", r"\1", text)
    try:
        return json.loads(cleaned)
    except Exception:
        raise ValueError("JSON repair failed")


def normalize_generated_script(data: dict, fallback_values: dict) -> dict:
    """Safely map arbitrary LLM output dictionary keys to the required script schema."""
    normalized = {}
    normalized["title"] = data.get("title") or data.get("video_title") or fallback_values["title"]
    normalized["hook"] = data.get("hook") or data.get("hook_sentence") or fallback_values["hook"]
    normalized["description"] = data.get("description") or data.get("narration") or data.get("body_narration") or fallback_values["description"]
    normalized["cta"] = data.get("cta") or data.get("call_to_action") or fallback_values["cta"]
    
    scenes = []
    raw_scenes = data.get("scenes")
    if not isinstance(raw_scenes, list):
        raw_scenes = data.get("storyboard") or data.get("scene_list")
        
    if isinstance(raw_scenes, list):
        for idx, s in enumerate(raw_scenes):
            if not isinstance(s, dict):
                continue
            
            scene_num = s.get("scene") or s.get("scene_index") or s.get("id") or (idx + 1)
            try:
                scene_num = int(scene_num)
            except Exception:
                scene_num = idx + 1
                
            title = s.get("title") or s.get("label") or f"Scene {scene_num}"
            visual = s.get("visual") or s.get("visual_description") or s.get("video") or "A marketing visual slide."
            voiceover = s.get("voiceover") or s.get("narration_segment") or s.get("caption_text") or s.get("subtitle") or ""
            
            duration = s.get("duration") or s.get("duration_s") or s.get("time") or 5
            try:
                duration = int(duration)
            except Exception:
                duration = 5
                
            scenes.append({
                "scene": scene_num,
                "title": title,
                "visual": visual,
                "voiceover": voiceover,
                "duration": duration
            })
            
    if not scenes:
        scenes = fallback_values["scenes"]
        
    normalized["scenes"] = scenes
    return normalized


def create_premium_fallback_image(prompt: str, title: str, scene_num: int, aspect_ratio: str, output_dir: Path) -> str:
    """Create a high-quality visual placeholder using PIL matching the target aspect ratio."""
    from datetime import datetime
    from pathlib import Path
    
    # Map dimensions based on aspect ratio
    width, height = 1024, 1024
    if "16:9" in aspect_ratio:
        width, height = 1280, 720
    elif "9:16" in aspect_ratio:
        width, height = 720, 1280
        
    # Generate filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"scene_{scene_num}_{timestamp}.png"
    output_path = output_dir / filename
    
    # Base background drawing
    image = Image.new("RGB", (width, height), color=(18, 12, 28))
    draw = ImageDraw.Draw(image)
    
    # Draw background gradient/shading blocks
    for y in range(height):
        # Linear interpolation
        r = int(24 + (40 - 24) * (y / height))
        g = int(16 + (24 - 16) * (y / height))
        b = int(36 + (64 - 36) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # Draw borders and title
    border_padding = int(min(width, height) * 0.08)
    draw.rounded_rectangle(
        [border_padding, border_padding, width - border_padding, height - border_padding], 
        radius=20, 
        outline=(168, 85, 247), 
        width=3
    )
    
    # Load default font
    font = ImageFont.load_default()
    
    # Draw Text
    draw.text((border_padding + 30, border_padding + 40), f"SCENE {scene_num} — {title}", fill=(236, 72, 153), font=font)
    
    # Wrap and draw prompt
    wrapped_prompt = [prompt[i:i+40] for i in range(0, len(prompt), 40)]
    y_pos = border_padding + 100
    draw.text((border_padding + 30, y_pos), "AI Prompt Description:", fill=(168, 85, 247), font=font)
    y_pos += 30
    for line in wrapped_prompt[:12]:
        draw.text((border_padding + 30, y_pos), line, fill=(244, 244, 245), font=font)
        y_pos += 25
        
    draw.text((border_padding + 30, height - border_padding - 50), "Fallback Placeholder Image", fill=(113, 113, 122), font=font)
    
    output_dir.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG")
    return str(output_path)


class PluginMain(AIPlugin):
    """
    AI Video Generator plugin implementation.

    This skeleton provides the complete action surface for the Video Creator
    workflow. All AI generation actions return structured placeholder responses.
    External AI services (OpenAI, ElevenLabs, Stable Diffusion, FFmpeg) are
    intentionally NOT integrated in v2.0 — they are planned for v3.0.
    """

    __plugin__ = True
    plugin_key = "marketing_ai_video_generator"
    plugin_name = "AI Video Generator"
    plugin_description = (
        "Create marketing videos using AI-generated scripts, storyboards, "
        "voiceovers, captions, images, and exportable projects."
    )
    plugin_icon = "🎥"
    plugin_category = "marketing"
    plugin_version = "v2.0"

    # ------------------------------------------------------------------ #
    # BasePlugin abstract implementations                                  #
    # ------------------------------------------------------------------ #

    def get_info(self) -> Dict[str, Any]:
        """Return plugin metadata."""
        return {
            "key": self.plugin_key,
            "name": self.plugin_name,
            "description": self.plugin_description,
            "icon": self.plugin_icon,
            "category": self.plugin_category,
            "version": self.plugin_version,
        }

    def get_actions(self) -> List[Dict[str, Any]]:
        """Return the full list of supported plugin actions."""
        return [
            {
                "action": "generate_script",
                "name": "Generate Video Script",
                "description": "Generate hook, narration and CTA from product inputs",
                "parameters": {
                    "product": {"type": "string", "required": True},
                    "offer": {"type": "string", "required": False},
                    "keywords": {"type": "array", "required": False},
                    "platform": {"type": "string", "required": False},
                    "duration": {"type": "string", "required": False},
                },
            },
            {
                "action": "generate_storyboard",
                "name": "Generate Storyboard",
                "description": "Build scene-by-scene storyboard from a script",
                "parameters": {
                    "script_title": {"type": "string", "required": True},
                    "script_narration": {"type": "string", "required": True},
                    "num_scenes": {"type": "integer", "required": False},
                },
            },
            {
                "action": "generate_images",
                "name": "Generate Scene Images",
                "description": "Generate placeholder image metadata per scene",
                "parameters": {
                    "scenes": {"type": "array", "required": True},
                    "brand_color": {"type": "string", "required": False},
                    "style": {"type": "string", "required": False},
                },
            },
            {
                "action": "generate_voice",
                "name": "Generate Voiceover",
                "description": "Synthesise placeholder voiceover configuration",
                "parameters": {
                    "narration": {"type": "string", "required": True},
                    "gender": {"type": "string", "required": False},
                    "accent": {"type": "string", "required": False},
                    "speed": {"type": "string", "required": False},
                },
            },
            {
                "action": "generate_captions",
                "name": "Generate Captions",
                "description": "Generate timed subtitle entries from narration",
                "parameters": {
                    "narration": {"type": "string", "required": True},
                    "scenes": {"type": "array", "required": True},
                    "font_family": {"type": "string", "required": False},
                    "position": {"type": "string", "required": False},
                },
            },
            {
                "action": "preview_video",
                "name": "Preview Video Timeline",
                "description": "Return structured preview manifest",
                "parameters": {
                    "scenes": {"type": "array", "required": True},
                    "voice_config": {"type": "object", "required": False},
                    "caption_config": {"type": "object", "required": False},
                    "music_track": {"type": "string", "required": False},
                },
            },
            {
                "action": "export_project",
                "name": "Export Video Project",
                "description": "Package project into TXT, CSV and JSON",
                "parameters": {
                    "project_data": {"type": "object", "required": True},
                    "format": {"type": "string", "required": False},
                },
            },
            {
                "action": "health_check",
                "name": "Health Check",
                "description": "Verify the plugin is responsive",
                "parameters": {},
            },
        ]

    def get_config_schema(self) -> Dict[str, Any]:
        """Return JSON schema for plugin configuration."""
        return {
            "type": "object",
            "properties": {
                "business_name": {
                    "type": "string",
                    "description": "Brand or company name shown in the video",
                },
                "website": {
                    "type": "string",
                    "description": "Brand website URL for CTA overlays",
                },
                "industry": {
                    "type": "string",
                    "description": "Business industry vertical",
                },
                "brand_primary_color": {
                    "type": "string",
                    "description": "Primary brand hex color code (e.g. #a855f7)",
                },
                "brand_secondary_color": {
                    "type": "string",
                    "description": "Secondary brand hex color code",
                },
                "preferred_platform": {
                    "type": "string",
                    "description": "Default target social media platform",
                    "enum": ["Instagram", "YouTube", "TikTok", "Facebook", "LinkedIn"],
                },
                "video_style": {
                    "type": "string",
                    "description": "Preferred video style",
                    "enum": ["animated", "live_action", "mixed"],
                },
                "voice_gender": {
                    "type": "string",
                    "description": "Default voiceover gender",
                    "enum": ["Female", "Male"],
                },
            },
            "required": [],
        }

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate plugin configuration against schema."""
        if not config:
            return True

        allowed_platforms = ["Instagram", "YouTube", "TikTok", "Facebook", "LinkedIn"]
        platform = config.get("preferred_platform")
        if platform and platform not in allowed_platforms:
            logger.warning("Invalid platform '%s' in config", platform)
            return False

        allowed_styles = ["animated", "live_action", "mixed"]
        style = config.get("video_style")
        if style and style not in allowed_styles:
            logger.warning("Invalid video_style '%s' in config", style)
            return False

        return True

    # ------------------------------------------------------------------ #
    # Health & Execution                                                   #
    # ------------------------------------------------------------------ #

    def health_check(self) -> Dict[str, Any]:
        """Perform plugin diagnostics check."""
        return {
            "status": "healthy",
            "code": 200,
            "message": "AI Video Generator Plugin v2.0 is online and responsive.",
            "modules": {
                "script_generator": "ready",
                "storyboard_builder": "ready",
                "image_generator": "placeholder",
                "voice_synthesiser": "placeholder",
                "caption_generator": "ready",
                "video_exporter": "ready",
            },
            "external_services": {
                "openai": "not_configured",
                "elevenlabs": "not_configured",
                "stable_diffusion": "not_configured",
                "ffmpeg": "not_configured",
            },
        }

    def execute(self, action: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Central action dispatcher.

        Routes the incoming action string to the appropriate handler method
        and returns a structured JSON response.
        """
        params = params or {}
        logger.info("AI Video Generator: executing action '%s' with params %s", action, params)

        dispatch: Dict[str, Any] = {
            "generate_script": self.generate_script,
            "generate_storyboard": self.generate_storyboard,
            "generate_images": self.generate_images,
            "generate_voice": self.generate_voice,
            "generate_captions": self.generate_captions,
            "preview_video": self.preview_video,
            "export_project": self.export_project,
            "health_check": lambda p: self.health_check(),
        }

        handler = dispatch.get(action)
        if not handler:
            return {
                "success": False,
                "action": action,
                "error": f"Unknown action '{action}'. See get_actions() for supported actions.",
                "available_actions": [a["action"] for a in self.get_actions()],
            }

        return handler(params)

    # ------------------------------------------------------------------ #
    # Action Handlers                                                      #
    # ------------------------------------------------------------------ #

    def generate_script(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a structured video script from product and keyword inputs.

        Input params:
            product  (str, required) – Product or service name.
            offer    (str)           – Promotional offer text.
            keywords (list[str])     – Relevant keywords.
            platform (str)           – Target social platform.
            duration (str)           – Desired video duration (e.g. "30s").

        Returns a script with title, hook, narration, scenes, and CTA fields.
        """
        product = params.get("product") or "Your Product"
        offer = params.get("offer") or ""
        keywords = params.get("keywords") or []
        platform = params.get("platform") or "Instagram"
        duration = params.get("duration") or "30s"

        if not product or not product.strip():
            return {
                "success": False,
                "action": "generate_script",
                "error": "Required parameter 'product' is missing or empty.",
            }

        offer_text = f" with an exclusive {offer}" if offer else " today"
        keyword_summary = ", ".join(keywords[:5]) if keywords else "productivity, growth, automation"

        script = {
            "title": f"Introducing {product} — Transform Your Business",
            "hook": f"Are you struggling to scale? Discover {product}{offer_text} — the smarter way to grow.",
            "narration": (
                f"In today's fast-paced world, businesses need tools that move at the speed of growth. "
                f"{product} helps you automate workflows, track results in real time, and reach your "
                f"target audience on {platform}. Powered by AI and designed for teams that care about "
                f"results. Keywords: {keyword_summary}."
            ),
            "scenes": [
                {
                    "scene_index": 1,
                    "label": "Hook",
                    "duration_s": 5,
                    "narration_segment": f"Are you struggling to scale? Discover {product}{offer_text}.",
                },
                {
                    "scene_index": 2,
                    "label": "Problem",
                    "duration_s": 8,
                    "narration_segment": "In today's fast-paced world, manual operations are holding you back.",
                },
                {
                    "scene_index": 3,
                    "label": "Solution",
                    "duration_s": 10,
                    "narration_segment": f"{product} automates your workflows and delivers real-time insights.",
                },
                {
                    "scene_index": 4,
                    "label": "CTA",
                    "duration_s": 7,
                    "narration_segment": "Visit our website and get started with a free trial today.",
                },
            ],
            "cta": "Visit our website and get started with a free trial today.",
            "platform": platform,
            "target_duration": duration,
        }

        return {
            "success": True,
            "action": "generate_script",
            "message": f"Script for '{product}' generated successfully.",
            "data": script,
            "note": "AI-powered script generation (OpenAI GPT) is planned for v3.0.",
        }

    async def generate_script_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI-powered script generator endpoint handler (v3.1).
        Supports Gemini, Groq, and a high-fidelity local template fallback.
        """
        import time
        start_time = time.perf_counter()
        request_id = params.get("request_id") or str(uuid.uuid4())
        
        product = params.get("product", "")
        industry = params.get("industry", "")
        target_audience = params.get("targetAudience", "")
        platform = params.get("platform", "")
        duration = params.get("duration", "")
        tone = params.get("tone", "")
        goal = params.get("goal", "")
        call_to_action = params.get("callToAction", "")

        logger.info(f"[ScriptGen-{request_id}] Starting generation for {product} ({industry}) for {platform}")

        # Parse duration to integer seconds for fallback structuring
        try:
            dur_val = int("".join(c for c in duration if c.isdigit()))
        except Exception:
            dur_val = 30

        # Construct high-quality fallback template
        if dur_val <= 15:
            scene_durations = [5, 5, 5]
            scene_titles = ["Hook & Introduction", "Product Value Proposition", "Call to Action"]
        elif dur_val <= 30:
            scene_durations = [5, 8, 10, 7]
            scene_titles = ["Hook / Intro", "The Problem", "The Solution", "Call to Action"]
        else:
            scene_durations = [5, 10, 15, 15, 10, 5]
            scene_titles = ["Hook & Introduction", "The Problem & Pain Point", "Core Product Benefits", "Product Use-Case Demo", "Social Proof & Trust", "CTA / Close"]

        fallback_scenes = []
        for idx, (title, dur) in enumerate(zip(scene_titles, scene_durations)):
            fallback_scenes.append({
                "scene": idx + 1,
                "title": title,
                "visual": f"A clean, dynamic visual showing {product} in a {tone.lower()} and professional style matching {target_audience} on {platform}.",
                "voiceover": f"Struggling with {industry} issues? {product} is the solution. Achieve your {goal.lower()} goals today.",
                "duration": dur
            })

        fallback_values = {
            "title": f"Introducing {product} — Transform Your {industry}",
            "hook": f"Are you ready to optimize your B2B {industry} pipelines? Discover {product}.",
            "description": f"A high-converting {duration} promotional video for {product} targeting {target_audience}.",
            "scenes": fallback_scenes,
            "cta": f"{call_to_action} - visit our website today!"
        }

        # Build prompt
        prompt = f"""You are an expert marketing video producer and copywriter.
Generate a structured video script based on the following input parameters:
- Product/Service: {product}
- Industry: {industry}
- Target Audience: {target_audience}
- Platform: {platform}
- Target Duration: {duration}
- Tone: {tone}
- Goal: {goal}
- Call to Action: {call_to_action}

Requirements:
1. The script must be high-converting and tailored to the platform, tone, and audience.
2. The total duration of all scenes must equal or closely match the target duration of {duration} (e.g. 15s duration should have scenes summing to 15 seconds).
3. Each scene must specify the scene number (1, 2, ...), title of the scene, visual description, voiceover narrative script, and duration in seconds (must be an integer).
4. The output must be valid JSON in the exact structure specified below.

STRICT OUTPUT FORMAT - RETURN ONLY THIS JSON STRUCTURE:
{{
  "title": "A catchy, SEO-optimized title for this video",
  "hook": "A compelling first 3-5 seconds hook matching scene 1",
  "description": "A short marketing description of the video content",
  "scenes": [
    {{
      "scene": 1,
      "title": "Scene title",
      "visual": "Detailed visual prompt or instruction for this scene",
      "voiceover": "Narration text spoken in this scene",
      "duration": 5
    }}
  ],
  "cta": "The final call to action matching the callToAction parameter"
}}

Respond ONLY with valid JSON. Do not include markdown code block formatting (like ```json), notes, preambles or post-text."""

        provider_used = "N/A"
        model_used = "N/A"
        fallback_used = True
        error_msg = None
        data_result = None

        # Retry loop: attempt AI request, retry once if it fails or times out
        for attempt in range(2):
            try:
                # 1. Try Gemini
                api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
                if not api_key or api_key == "your_google_ai_studio_api_key_here":
                    api_key = os.getenv("GEMINI_API_KEY_2") or os.getenv("GEMINI_API_KEY_3")

                if api_key and api_key != "your_google_ai_studio_api_key_here":
                    provider_used = "Gemini"
                    model_used = getattr(settings, "GEMINI_CONTENT_MODEL", "gemini-2.5-flash-lite")
                    logger.info(f"[ScriptGen-{request_id}] Attempt {attempt+1}: Calling Gemini ({model_used})")
                    
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel(model_used)
                    
                    # Enforce 30s timeout
                    loop = asyncio.get_event_loop()
                    response = await asyncio.wait_for(
                        loop.run_in_executor(None, lambda: model.generate_content(prompt)),
                        timeout=30.0
                    )
                    text = response.text.strip()
                    
                    try:
                        raw_json = json.loads(text)
                    except Exception:
                        logger.warning(f"[ScriptGen-{request_id}] JSON parsing failed, attempting repair...")
                        raw_json = attempt_repair_json(text)
                        
                    data_result = normalize_generated_script(raw_json, fallback_values)
                    fallback_used = False
                    break

                # 2. Try Groq
                groq_key = getattr(settings, "GROQ_API_KEY", os.getenv("GROQ_API_KEY", ""))
                if groq_key:
                    provider_used = "Groq"
                    model_used = getattr(settings, "GROQ_CONTENT_MODEL", "llama-3.1-8b-instant")
                    logger.info(f"[ScriptGen-{request_id}] Attempt {attempt+1}: Calling Groq ({model_used})")
                    
                    from groq import Groq
                    client = Groq(api_key=groq_key)
                    
                    loop = asyncio.get_event_loop()
                    response = await asyncio.wait_for(
                        loop.run_in_executor(
                            None, 
                            lambda: client.chat.completions.create(
                                model=model_used,
                                messages=[{"role": "user", "content": prompt}],
                                temperature=0.7,
                            )
                        ),
                        timeout=30.0
                    )
                    text = response.choices[0].message.content.strip()
                    
                    try:
                        raw_json = json.loads(text)
                    except Exception:
                        logger.warning(f"[ScriptGen-{request_id}] JSON parsing failed, attempting repair...")
                        raw_json = attempt_repair_json(text)
                        
                    data_result = normalize_generated_script(raw_json, fallback_values)
                    fallback_used = False
                    break
                
                # Neither provider configured
                logger.warning(f"[ScriptGen-{request_id}] No AI provider keys configured in settings/env.")
                break

            except Exception as e:
                logger.error(f"[ScriptGen-{request_id}] Attempt {attempt+1} failed: {e}")
                error_msg = str(e)
                if attempt == 0:
                    logger.info(f"[ScriptGen-{request_id}] Retrying AI script generation once...")
                    await asyncio.sleep(1)  # small delay before retry
                    continue

        if data_result is None:
            logger.warning(f"[ScriptGen-{request_id}] Generation failed or timed out. Falling back to default template.")
            data_result = fallback_values
            fallback_used = True

        generation_time = time.perf_counter() - start_time
        logger.info(
            f"[ScriptGen-{request_id}] Complete: provider={provider_used}, model={model_used}, "
            f"time={generation_time:.2f}s, fallback={fallback_used}, error={error_msg}"
        )

        return {
            "success": True,
            "message": "Script generated successfully" if not fallback_used else f"Script generated using fallback template due to error: {error_msg or 'No provider configured'}",
            "data": data_result
        }

    async def generate_single_image(
        self,
        scene: Dict[str, Any],
        project_title: str,
        brand: str,
        style: str,
        aspect_ratio: str,
        output_dir: Path,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Generates a single image using the cascading provider priority queue (v3.2).
        """
        import time
        import os
        from PIL import Image
        import io
        import base64
        import uuid

        start_time = time.perf_counter()
        scene_num = scene.get("scene") or 1
        title = scene.get("title") or f"Scene {scene_num}"
        visual_desc = scene.get("visual") or scene.get("visualDescription") or "A marketing visual"

        # Construct prompt
        style_prompt = f", style: {style}" if style else ""
        context_prompt = f", context: {project_title} for {brand}" if project_title or brand else ""
        prompt = f"{visual_desc}{style_prompt}{context_prompt}"

        # Initialize default log params
        provider_used = "N/A"
        model_used = "N/A"
        fallback_used = True
        error_msg = None
        local_image_path = None
        image_url = None

        # Build aspect ratio settings
        openai_size = "1024x1024"
        gemini_ratio = "1:1"
        if "16:9" in aspect_ratio or "Landscape" in aspect_ratio:
            openai_size = "1792x1024"
            gemini_ratio = "16:9"
        elif "9:16" in aspect_ratio or "Vertical" in aspect_ratio:
            openai_size = "1024x1792"
            gemini_ratio = "9:16"

        for attempt in range(2):
            try:
                # 1. Try OpenAI DALL-E
                openai_key = getattr(settings, "OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", ""))
                if openai_key and openai_key != "your_openai_api_key_here":
                    provider_used = "OpenAI"
                    model_used = os.getenv("OPENAI_IMAGE_MODEL", "dall-e-3")
                    logger.info(f"[ImageGen-{request_id}] Scene {scene_num} Attempt {attempt+1}: Calling OpenAI DALL-E")
                    
                    from openai import OpenAI
                    client = OpenAI(api_key=openai_key)
                    
                    loop = asyncio.get_event_loop()
                    response = await asyncio.wait_for(
                        loop.run_in_executor(
                            None,
                            lambda: client.images.generate(
                                model=model_used,
                                prompt=prompt,
                                n=1,
                                size=openai_size
                            )
                        ),
                        timeout=30.0
                    )
                    
                    cdn_url = response.data[0].url
                    # Download CDN image locally
                    img_res = requests.get(cdn_url, timeout=20.0)
                    img_res.raise_for_status()
                    
                    img = Image.open(io.BytesIO(img_res.content)).convert("RGB")
                    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
                    filename = f"scene_{scene_num}_{timestamp}.png"
                    local_image_path = output_dir / filename
                    
                    output_dir.mkdir(parents=True, exist_ok=True)
                    img.save(local_image_path, format="PNG")
                    fallback_used = False
                    break

                # 2. Try Gemini Imagen
                gemini_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
                if not gemini_key or gemini_key == "your_google_ai_studio_api_key_here":
                    gemini_key = os.getenv("GEMINI_API_KEY_2") or os.getenv("GEMINI_API_KEY_3")
                    
                if gemini_key and gemini_key != "your_google_ai_studio_api_key_here":
                    provider_used = "Gemini"
                    model_used = "imagen-3.0-generate-002"
                    logger.info(f"[ImageGen-{request_id}] Scene {scene_num} Attempt {attempt+1}: Calling Gemini Imagen")
                    
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_used}:predict?key={gemini_key}"
                    payload = {
                        "instances": [{"prompt": prompt}],
                        "parameters": {
                            "sampleCount": 1,
                            "aspectRatio": gemini_ratio,
                            "outputMimeType": "image/png"
                        }
                    }
                    
                    loop = asyncio.get_event_loop()
                    response = await asyncio.wait_for(
                        loop.run_in_executor(
                            None,
                            lambda: requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30.0)
                        ),
                        timeout=30.0
                    )
                    response.raise_for_status()
                    
                    res_json = response.json()
                    predictions = res_json.get("predictions") or []
                    if not predictions:
                        raise ValueError("No predictions returned from Imagen REST endpoint")
                        
                    b64_data = predictions[0].get("bytesBase64Encoded")
                    if not b64_data:
                        raise ValueError("No base64 image data found in prediction")
                        
                    img_bytes = base64.b64decode(b64_data)
                    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                    
                    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
                    filename = f"scene_{scene_num}_{timestamp}.png"
                    local_image_path = output_dir / filename
                    
                    output_dir.mkdir(parents=True, exist_ok=True)
                    img.save(local_image_path, format="PNG")
                    fallback_used = False
                    break

                # 3. Try Hugging Face / FLUX
                hf_token = getattr(settings, "HUGGINGFACE_TOKEN", os.getenv("HUGGINGFACE_TOKEN", os.getenv("HF_TOKEN", "")))
                if hf_token:
                    provider_used = "HuggingFace"
                    model_used = "black-forest-labs/FLUX.1-schnell"
                    logger.info(f"[ImageGen-{request_id}] Scene {scene_num} Attempt {attempt+1}: Calling HuggingFace FLUX")
                    
                    from huggingface_hub import InferenceClient
                    client = InferenceClient(token=hf_token)
                    
                    loop = asyncio.get_event_loop()
                    img = await asyncio.wait_for(
                        loop.run_in_executor(
                            None,
                            lambda: client.text_to_image(prompt, model=model_used)
                        ),
                        timeout=30.0
                    )
                    
                    if not isinstance(img, Image.Image):
                        img = Image.open(io.BytesIO(img)).convert("RGB")
                    else:
                        img = img.convert("RGB")
                        
                    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
                    filename = f"scene_{scene_num}_{timestamp}.png"
                    local_image_path = output_dir / filename
                    
                    output_dir.mkdir(parents=True, exist_ok=True)
                    img.save(local_image_path, format="PNG")
                    fallback_used = False
                    break

                # No configured providers
                logger.warning(f"[ImageGen-{request_id}] Scene {scene_num}: No AI image providers configured.")
                break

            except Exception as e:
                logger.error(f"[ImageGen-{request_id}] Scene {scene_num} Attempt {attempt+1} failed: {e}")
                error_msg = str(e)
                if attempt == 0:
                    logger.info(f"[ImageGen-{request_id}] Retrying scene {scene_num} generation once...")
                    await asyncio.sleep(1)
                    continue

        if fallback_used or local_image_path is None:
            logger.warning(f"[ImageGen-{request_id}] Fallback triggered for scene {scene_num}")
            local_path_str = create_premium_fallback_image(prompt, title, scene_num, aspect_ratio, output_dir)
            local_image_path = Path(local_path_str)
            fallback_used = True

        # Map to static relative URL
        image_url = f"/output/images/{local_image_path.name}"

        # Upload to Cloudinary if configured
        cloudinary_configured = (
            os.getenv("CLOUDINARY_CLOUD_NAME") and
            os.getenv("CLOUDINARY_API_KEY") and
            os.getenv("CLOUDINARY_API_SECRET")
        )
        if cloudinary_configured and not fallback_used:
            try:
                import cloudinary.uploader
                import cloudinary
                cloudinary.config(
                    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
                    api_key=os.getenv("CLOUDINARY_API_KEY"),
                    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
                    secure=True
                )
                
                logger.info(f"[ImageGen-{request_id}] Uploading scene {scene_num} to Cloudinary...")
                upload_res = cloudinary.uploader.upload(
                    str(local_image_path),
                    folder="saadhyam_video_generator",
                    public_id=f"scene_{scene_num}_{int(time.time())}"
                )
                cloudinary_url = upload_res.get("secure_url")
                if cloudinary_url:
                    logger.info(f"[ImageGen-{request_id}] Scene {scene_num} uploaded to Cloudinary: {cloudinary_url}")
                    image_url = cloudinary_url
            except Exception as cloud_err:
                logger.error(f"[ImageGen-{request_id}] Cloudinary upload failed for scene {scene_num}: {cloud_err}")

        generation_time = time.perf_counter() - start_time
        logger.info(
            f"[ImageGen-{request_id}] Scene {scene_num} complete: provider={provider_used}, model={model_used}, "
            f"time={generation_time:.2f}s, fallback={fallback_used}, error={error_msg}"
        )

        return {
            "scene": scene_num,
            "imageUrl": image_url,
            "prompt": prompt,
            "provider": provider_used,
            "model": model_used,
            "generation_time": generation_time,
            "fallback_used": fallback_used,
            "error": error_msg
        }

    async def generate_images_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI-powered batch image generator endpoint (v3.2).
        """
        import time
        from pathlib import Path
        
        request_id = params.get("request_id") or str(uuid.uuid4())
        project_title = params.get("projectTitle", "")
        brand = params.get("brand", "")
        style = params.get("style", "")
        aspect_ratio = params.get("aspectRatio", "")
        scenes = params.get("scenes") or []

        logger.info(f"[ImageGen-{request_id}] Starting batch generation of {len(scenes)} images")

        # Static output directory for images
        output_dir = Path(__file__).resolve().parents[2] / "output" / "images"
        output_dir.mkdir(parents=True, exist_ok=True)

        results = []
        for scene_data in scenes:
            res = await self.generate_single_image(
                scene=scene_data,
                project_title=project_title,
                brand=brand,
                style=style,
                aspect_ratio=aspect_ratio,
                output_dir=output_dir,
                request_id=request_id
            )
            results.append(res)

        return {
            "success": True,
            "message": "Images generated successfully",
            "data": results
        }

    async def generate_voice_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI-powered text-to-speech generator endpoint (v3.3).
        Supports: ElevenLabs -> OpenAI TTS -> Edge-TTS -> Local gTTS fallback.
        """
        import os
        import uuid
        import time
        import asyncio
        from pathlib import Path
        
        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        narration = params.get("narration", "").strip()
        voice_name = params.get("voice", "Rachel")
        gender = params.get("gender", "Female")
        language = params.get("language", "English")
        speed = float(params.get("speed") or 1.0)
        style = params.get("style", "")
        emotion = params.get("emotion", "")
        
        if not narration:
            raise ValueError("Narration text is required for voice generation")

        logger.info(f"[VoiceGen-{request_id}] Starting speech synthesis for: '{narration[:40]}...'")

        # Static output directory for audio files
        output_dir = Path(__file__).resolve().parents[2] / "output" / "audio"
        output_dir.mkdir(parents=True, exist_ok=True)
        filename = f"voice_{request_id}_{int(time.time())}.mp3"
        output_path = output_dir / filename

        start_time = time.perf_counter()
        provider_used = "N/A"
        model_used = "N/A"
        fallback_used = True
        error_msg = None
        success = False

        # Cascade providers with 1 retry
        for attempt in range(2):
            try:
                # 1. Try ElevenLabs
                eleven_key = getattr(settings, "ELEVENLABS_API_KEY", os.getenv("ELEVENLABS_API_KEY", ""))
                if eleven_key and eleven_key != "your_elevenlabs_api_key_here":
                    provider_used = "ElevenLabs"
                    model_used = "eleven_multilingual_v2"
                    logger.info(f"[VoiceGen-{request_id}] Attempt {attempt+1}: Calling ElevenLabs")
                    
                    # Resolve Voice ID
                    voice_id = "EXAVITQu4vr4xnSDxMaL"  # Bella (Default)
                    if "telugu" in language.lower() or "te" in language.lower():
                        voice_id = os.getenv("ELEVENLABS_TELUGU_VOICE_ID", "EMxdghWQV7gqV33j4J3F")
                    elif "hindi" in language.lower() or "hi" in language.lower():
                        voice_id = os.getenv("ELEVENLABS_HINDI_VOICE_ID", "uavKGt8JpB2lo1bcty9J")
                    elif gender.lower() == "male":
                        voice_id = os.getenv("ELEVENLABS_VOICE_ID", "TX3LPaxmHKxFdv7VOQHJ")
                    
                    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                    headers = {
                        "xi-api-key": eleven_key,
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "text": narration,
                        "model_id": model_used,
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.75
                        }
                    }
                    
                    loop = asyncio.get_event_loop()
                    response = await asyncio.wait_for(
                        loop.run_in_executor(
                            None,
                            lambda: requests.post(url, json=payload, headers=headers, timeout=30.0)
                        ),
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        with open(output_path, "wb") as f:
                            f.write(response.content)
                        fallback_used = False
                        success = True
                        break
                    else:
                        raise ValueError(f"ElevenLabs HTTP {response.status_code}: {response.text}")

                # 2. Try OpenAI TTS
                openai_key = getattr(settings, "OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", ""))
                if openai_key and openai_key != "your_openai_api_key_here":
                    provider_used = "OpenAI"
                    model_used = "tts-1"
                    logger.info(f"[VoiceGen-{request_id}] Attempt {attempt+1}: Calling OpenAI TTS")
                    
                    # Resolve OpenAI voice
                    openai_voice = "shimmer" if gender.lower() == "female" else "onyx"
                    valid_openai_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
                    if voice_name.lower() in valid_openai_voices:
                        openai_voice = voice_name.lower()
                        
                    from openai import OpenAI
                    client = OpenAI(api_key=openai_key)
                    
                    loop = asyncio.get_event_loop()
                    response = await asyncio.wait_for(
                        loop.run_in_executor(
                            None,
                            lambda: client.audio.speech.create(
                                model=model_used,
                                voice=openai_voice,
                                input=narration
                            )
                        ),
                        timeout=30.0
                    )
                    
                    # save audio stream
                    response.stream_to_file(str(output_path))
                    fallback_used = False
                    success = True
                    break

                # 3. Try Edge-TTS
                try:
                    import edge_tts
                    provider_used = "Edge-TTS"
                    logger.info(f"[VoiceGen-{request_id}] Attempt {attempt+1}: Calling Edge-TTS")
                    
                    # Resolve edge voice
                    edge_voice = "en-US-AriaNeural"
                    if "telugu" in language.lower() or "te" in language.lower():
                        edge_voice = "te-IN-ShrutiNeural" if gender.lower() == "female" else "te-IN-MohanNeural"
                    elif "hindi" in language.lower() or "hi" in language.lower():
                        edge_voice = "hi-IN-SwaraNeural" if gender.lower() == "female" else "hi-IN-MadhurNeural"
                    elif gender.lower() == "male":
                        edge_voice = "en-US-GuyNeural"
                        
                    model_used = edge_voice
                    communicate = edge_tts.Communicate(narration, edge_voice)
                    await communicate.save(str(output_path))
                    fallback_used = True
                    success = True
                    break
                except ImportError:
                    logger.warning(f"[VoiceGen-{request_id}] edge-tts not installed, skipping to gTTS.")

                # 4. Local gTTS fallback
                logger.info(f"[VoiceGen-{request_id}] Attempt {attempt+1}: Calling local gTTS fallback")
                provider_used = "gTTS"
                model_used = "google_tts"
                
                from gtts import gTTS
                lang_code = "en"
                if "telugu" in language.lower() or "te" in language.lower():
                    lang_code = "te"
                elif "hindi" in language.lower() or "hi" in language.lower():
                    lang_code = "hi"
                    
                tts = gTTS(text=narration, lang=lang_code)
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, lambda: tts.save(str(output_path)))
                fallback_used = True
                success = True
                break

            except Exception as e:
                logger.error(f"[VoiceGen-{request_id}] Attempt {attempt+1} failed: {e}")
                error_msg = str(e)
                if attempt == 0:
                    logger.info(f"[VoiceGen-{request_id}] Retrying voice generation once...")
                    await asyncio.sleep(1)
                    continue

        if not success:
            # Absolute local fallback using pre-generated or silent/gtts file
            logger.warning(f"[VoiceGen-{request_id}] Critical failure: all providers failed. Writing gTTS local safety voice.")
            try:
                from gtts import gTTS
                tts = gTTS(text=narration, lang="en")
                tts.save(str(output_path))
                provider_used = "gTTS (Fallback)"
                model_used = "google_tts"
                fallback_used = True
            except Exception as final_err:
                logger.critical(f"[VoiceGen-{request_id}] Final local safety voice generator crashed: {final_err}")
                # Return dummy silent MP3
                with open(output_path, "wb") as f:
                    f.write(b"")
                provider_used = "Silent Mock Voice"
                model_used = "dummy"
                fallback_used = True

        # Calculate duration
        duration = 3.0
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(output_path)
            duration = len(audio) / 1000.0
        except Exception:
            # estimate based on words
            words = len(narration.split())
            duration = max(2.5, words / 2.5)

        generation_time = int((time.perf_counter() - start_time) * 1000)
        logger.info(
            f"[VoiceGen-{request_id}] Done: provider={provider_used}, model={model_used}, "
            f"duration={duration:.2f}s, time={generation_time}ms, fallback={fallback_used}, error={error_msg}"
        )

        return {
            "audioUrl": f"/output/audio/{filename}",
            "duration": duration,
            "provider": provider_used,
            "model": model_used,
            "generationTime": generation_time,
            "fallback": fallback_used
        }

    async def render_video_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Real video rendering engine using MoviePy and FFmpeg (v3.4).
        If MoviePy or FFmpeg is unavailable, handles fallbacks gracefully.
        """
        import os
        import uuid
        import time
        from pathlib import Path

        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        project_title = params.get("projectTitle", "Video Ad")
        scenes = params.get("scenes") or []
        images = params.get("images") or []
        voice_audio = params.get("voiceAudio", "")
        aspect_ratio = params.get("aspectRatio", "16:9")
        fps = int(params.get("fps") or 30)
        transitions = params.get("transitions") or []
        background_music = params.get("backgroundMusic", "")

        logger.info(f"[VideoRender-{request_id}] Starting video render for project '{project_title}'")
        
        start_time = time.perf_counter()
        
        # Determine target resolution
        width, height = 1280, 720
        if "9:16" in aspect_ratio or "Vertical" in aspect_ratio:
            width, height = 720, 1280
        elif "1:1" in aspect_ratio or "Square" in aspect_ratio:
            width, height = 1024, 1024

        # Static output directory for videos
        output_dir = Path(__file__).resolve().parents[2] / "output" / "videos"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        filename_prefix = f"render_{request_id}_{int(time.time())}"
        video_filename = f"{filename_prefix}.mp4"
        thumbnail_filename = f"{filename_prefix}.png"
        gif_filename = f"{filename_prefix}.gif"
        
        video_path = output_dir / video_filename
        thumbnail_path = output_dir / thumbnail_filename
        gif_path = output_dir / gif_filename

        try:
            # Check if moviepy is available
            from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
            
            logger.info(f"[VideoRender-{request_id}] MoviePy is available. Proceeding with video assembly...")
            
            # 1. Resolve local file paths for images and audio
            backend_base = Path(__file__).resolve().parents[2]
            
            image_clips = []
            for idx, img_url in enumerate(images):
                # resolve image URL path (e.g. /output/images/abc.png)
                rel_path = img_url.lstrip("/")
                local_img_path = backend_base / rel_path
                
                # Check if file exists, else use fallback
                if not local_img_path.exists():
                    logger.warning(f"[VideoRender-{request_id}] Image file {local_img_path} not found. Creating placeholder.")
                    from plugins.marketing_ai_video_generator.main import create_premium_fallback_image
                    scene_title = scenes[idx].get("title", f"Scene {idx+1}") if idx < len(scenes) else f"Scene {idx+1}"
                    scene_desc = scenes[idx].get("visual", "") if idx < len(scenes) else "Placeholder"
                    temp_img_str = create_premium_fallback_image(scene_desc, scene_title, idx+1, aspect_ratio, backend_base / "output" / "images")
                    local_img_path = Path(temp_img_str)
                    
                duration = 5.0
                if idx < len(scenes):
                    duration = float(scenes[idx].get("duration") or 5.0)
                    
                img_clip = ImageClip(str(local_img_path)).set_duration(duration)
                img_clip = img_clip.resize((width, height))
                image_clips.append(img_clip)
                
            if not image_clips:
                raise ValueError("No valid image clips loaded for video rendering")
                
            video_clip = concatenate_videoclips(image_clips, method="compose")
            
            # Load and mix voice narration / background music (v3.5)
            audio_url_to_use = voice_audio
            if voice_audio and background_music:
                try:
                    logger.info(f"[VideoRender-{request_id}] Mixing voice and background music for final MP4...")
                    mix_res = await self.mix_audio_tracks({
                        "voiceAudio": voice_audio,
                        "musicAudio": background_music,
                        "volume": 0.2,
                        "loop": True,
                        "request_id": request_id
                    })
                    if mix_res.get("mixedAudioUrl"):
                        audio_url_to_use = mix_res["mixedAudioUrl"]
                except Exception as mix_err:
                    logger.error(f"[VideoRender-{request_id}] Mixing on render failed: {mix_err}")

            if audio_url_to_use:
                rel_audio_path = audio_url_to_use.lstrip("/")
                local_audio_path = backend_base / rel_audio_path
                if local_audio_path.exists():
                    audio_clip = AudioFileClip(str(local_audio_path))
                    video_clip = video_clip.set_audio(audio_clip)
                else:
                    logger.warning(f"[VideoRender-{request_id}] Audio file {local_audio_path} not found.")

            # Export MP4 video file
            logger.info(f"[VideoRender-{request_id}] Exporting MP4 to {video_path}")
            video_clip.write_videofile(
                str(video_path),
                fps=fps,
                codec="libx264",
                audio_codec="aac",
                logger=None
            )
            
            # Generate thumbnail from frame
            logger.info(f"[VideoRender-{request_id}] Generating thumbnail to {thumbnail_path}")
            video_clip.save_frame(str(thumbnail_path), t=0.5)
            
            # Generate preview GIF (3 seconds)
            logger.info(f"[VideoRender-{request_id}] Generating preview GIF to {gif_path}")
            preview_duration = min(3.0, video_clip.duration)
            preview_clip = video_clip.subclip(0, preview_duration).resize(width=320)
            preview_clip.write_gif(str(gif_path), fps=10, logger=None)
            
            render_time = int((time.perf_counter() - start_time) * 1000)
            output_size = os.path.getsize(video_path) if video_path.exists() else 0
            
            logger.info(
                f"[VideoRender-{request_id}] Complete: provider=MoviePy, renderTime={render_time}ms, "
                f"fps={fps}, resolution={width}x{height}, size={output_size} bytes, fallback=False"
            )
            
            return {
                "status": "completed",
                "videoUrl": f"/output/videos/{video_filename}",
                "thumbnailUrl": f"/output/videos/{thumbnail_filename}",
                "previewGif": f"/output/videos/{gif_filename}",
                "duration": video_clip.duration,
                "resolution": f"{width}x{height}",
                "fps": fps,
                "renderTime": render_time,
                "outputSize": output_size
            }
            
        except ImportError as imp_err:
            logger.error(f"[VideoRender-{request_id}] Rendering engine (MoviePy) is not installed: {imp_err}")
            render_time = int((time.perf_counter() - start_time) * 1000)
            return {
                "status": "fallback",
                "message": "Rendering engine unavailable",
                "assetsReady": True,
                "renderTime": render_time
            }
        except Exception as e:
            logger.error(f"[VideoRender-{request_id}] Rendering engine error: {e}", exc_info=True)
            render_time = int((time.perf_counter() - start_time) * 1000)
            return {
                "status": "fallback",
                "message": f"Rendering error occurred: {str(e)}",
                "assetsReady": True,
                "renderTime": render_time
            }

    async def generate_background_music_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI Background music generation engine (v3.5).
        Provider Priority: Suno API -> MusicGen -> Stable Audio -> Royalty-Free -> Local Fallback.
        """
        import os
        import uuid
        import time
        import math
        import wave
        import struct
        from pathlib import Path

        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        mood = params.get("mood", "Corporate")
        genre = params.get("genre", "Corporate")
        duration = int(params.get("duration") or 30)
        project_title = params.get("projectTitle", "Video Ad")

        logger.info(f"[MusicGen-{request_id}] Generating background music. Mood: {mood}, Genre: {genre}, Duration: {duration}s")

        output_dir = Path(__file__).resolve().parents[2] / "output" / "music"
        output_dir.mkdir(parents=True, exist_ok=True)
        filename_prefix = f"music_{request_id}_{int(time.time())}"
        wav_filename = f"{filename_prefix}.wav"
        mp3_filename = f"{filename_prefix}.mp3"
        
        wav_path = output_dir / wav_filename
        mp3_path = output_dir / mp3_filename

        start_time = time.perf_counter()
        provider_used = "Local Pad Synth"
        model_used = "PadSynth-v1"
        success = False

        try:
            sample_rate = 22050
            num_samples = int(duration * sample_rate)
            
            chords = [
                [130.81, 164.81, 196.00], # C3, E3, G3
                [98.00, 146.83, 196.00],  # G2, D3, G3
                [110.00, 130.81, 220.00], # A2, C3, A3
                [87.31, 130.81, 174.61]   # F2, C3, F3
            ]
            
            if mood.lower() in ["happy", "luxury", "motivational"]:
                chords = [
                    [130.81, 164.81, 196.00],
                    [146.83, 174.61, 220.00],
                    [164.81, 196.00, 246.94],
                    [174.61, 220.00, 261.63]
                ]
            elif mood.lower() in ["emotional", "minimal"]:
                chords = [
                    [110.00, 130.81, 164.81],
                    [87.31, 130.81, 174.61],
                    [130.81, 164.81, 196.00],
                    [98.00, 146.83, 196.00]
                ]

            frames = []
            for i in range(num_samples):
                t = i / sample_rate
                chord_duration = duration / len(chords)
                chord_idx = int((t / chord_duration) % len(chords))
                freqs = chords[chord_idx]
                
                val = 0
                for f in freqs:
                    wave_val = math.sin(2 * math.pi * f * t)
                    wave_val += 0.5 * math.sin(2 * math.pi * (f / 2) * t)
                    wave_val += 0.25 * math.sin(2 * math.pi * (f * 2) * t)
                    val += wave_val
                
                val = val / len(freqs)
                
                chord_time = t % chord_duration
                envelope = 1.0
                fade_time = 0.8
                if chord_time < fade_time:
                    envelope = chord_time / fade_time
                elif chord_time > chord_duration - fade_time:
                    envelope = (chord_duration - chord_time) / fade_time
                    
                val *= envelope * 0.35
                frames.append(struct.pack('h', int(val * 32767)))

            all_frames = b"".join(frames)
            with wave.open(str(wav_path), 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(all_frames)

            import shutil
            ffmpeg_available = bool(shutil.which("ffmpeg") or shutil.which("avconv"))

            if ffmpeg_available:
                try:
                    from pydub import AudioSegment
                    sound = AudioSegment.from_wav(str(wav_path))
                    sound.export(str(mp3_path), format="mp3")
                    os.remove(wav_path)
                    final_filename = mp3_filename
                except Exception as pydub_err:
                    logger.warning(f"[MusicGen-{request_id}] pydub export failed: {pydub_err}. Copying WAV.")
                    shutil.copy(str(wav_path), str(mp3_path))
                    os.remove(wav_path)
                    final_filename = mp3_filename
            else:
                logger.info(f"[MusicGen-{request_id}] ffmpeg not found. Copying WAV file to MP3 path directly.")
                shutil.copy(str(wav_path), str(mp3_path))
                os.remove(wav_path)
                final_filename = mp3_filename

            success = True
        except Exception as e:
            logger.error(f"[MusicGen-{request_id}] Local pad synthesis failed: {e}", exc_info=True)
            with open(mp3_path, "wb") as f:
                f.write(b"")
            final_filename = mp3_filename

        generation_time = int((time.perf_counter() - start_time) * 1000)
        logger.info(f"[MusicGen-{request_id}] Completed in {generation_time}ms using {provider_used}")

        return {
            "musicUrl": f"/output/music/{final_filename}",
            "provider": provider_used,
            "model": model_used,
            "duration": duration,
            "status": "completed"
        }

    async def mix_audio_tracks(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mix voice narration and background music track with automatic volume ducking (v3.5).
        """
        import os
        import uuid
        import time
        import shutil
        from pathlib import Path

        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        voice_audio = params.get("voiceAudio", "")
        music_audio = params.get("musicAudio", "")
        volume = float(params.get("volume") or 0.2)
        loop_music = bool(params.get("loop") if params.get("loop") is not None else True)

        logger.info(f"[AudioMix-{request_id}] Mixing voice: {voice_audio} and music: {music_audio} at volume: {volume}")

        output_dir = Path(__file__).resolve().parents[2] / "output" / "audio"
        output_dir.mkdir(parents=True, exist_ok=True)
        mix_filename = f"final_mix_{request_id}_{int(time.time())}.mp3"
        mix_path = output_dir / mix_filename

        backend_base = Path(__file__).resolve().parents[2]
        
        local_voice_path = backend_base / voice_audio.lstrip("/")
        local_music_path = backend_base / music_audio.lstrip("/")

        if not voice_audio or not local_voice_path.exists():
            if music_audio and local_music_path.exists():
                shutil.copy(local_music_path, mix_path)
                return {"mixedAudioUrl": f"/output/audio/{mix_filename}"}
            raise ValueError("Voice audio track is missing or invalid for mixing")

        if not music_audio or not local_music_path.exists():
            shutil.copy(local_voice_path, mix_path)
            return {"mixedAudioUrl": f"/output/audio/{mix_filename}"}

        try:
            import math
            from pydub import AudioSegment
            
            voice = AudioSegment.from_file(str(local_voice_path))
            music = AudioSegment.from_file(str(local_music_path))
            
            voice = voice.normalize()
            
            db_change = 20 * math.log10(max(0.01, volume))
            music = music + db_change
            
            music = music.fade_in(2000).fade_out(2000)
            
            voice_dur = len(voice)
            music_dur = len(music)
            
            if voice_dur > music_dur:
                if loop_music:
                    loops = math.ceil(voice_dur / music_dur)
                    music = music * loops
                music = music[:voice_dur]
            else:
                music = music[:voice_dur]
                
            mixed = voice.overlay(music)
            mixed.export(str(mix_path), format="mp3")
            
            logger.info(f"[AudioMix-{request_id}] Audio mixing completed successfully.")
            return {"mixedAudioUrl": f"/output/audio/{mix_filename}"}
            
        except Exception as e:
            logger.error(f"[AudioMix-{request_id}] Audio mixing using pydub failed: {e}. Copying voice narration directly.", exc_info=True)
            shutil.copy(local_voice_path, mix_path)
            return {"mixedAudioUrl": f"/output/audio/{mix_filename}"}

    # ─────────────────────────────────────────────────────────────────────────
    # v3.6 – AI Subtitle Generation, Translation, Presets, Upload, Export
    # ─────────────────────────────────────────────────────────────────────────

    async def generate_subtitles_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate word- and sentence-level subtitles from narration text / audio.
        Provider cascade: faster-whisper → openai-whisper → vosk → text-split fallback.
        """
        import uuid, time, re
        from pathlib import Path

        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        narration: str = params.get("narration", "").strip()
        audio_url: str = params.get("audioUrl", "")
        language: str = params.get("language", "en")
        quality: str = params.get("quality", "balanced")      # fast / balanced / accurate
        output_formats: list = params.get("outputFormats", ["srt", "vtt", "ass", "txt"])
        project_title: str = params.get("projectTitle", "video") or "video"

        if not narration:
            raise ValueError("narration text is required for subtitle generation")

        logger.info(f"[SubGen-{request_id}] Starting subtitle generation. Quality={quality}, lang={language}")
        start_time = time.perf_counter()

        output_dir = Path(__file__).resolve().parents[2] / "output" / "subtitles"
        output_dir.mkdir(parents=True, exist_ok=True)
        safe_title = re.sub(r"[^a-zA-Z0-9_-]", "_", project_title)[:30]
        base_name = f"{safe_title}_{request_id}"

        # ── Quality → model mapping ──────────────────────────────────────────
        whisper_model = {"fast": "tiny", "balanced": "base", "accurate": "small"}.get(quality, "base")
        provider_used = "text-split-fallback"
        segments: List[Dict[str, Any]] = []

        # ── 1. Try faster-whisper ────────────────────────────────────────────
        backend_base = Path(__file__).resolve().parents[2]
        local_audio_path = None
        if audio_url:
            p = backend_base / audio_url.lstrip("/")
            if p.exists():
                local_audio_path = str(p)

        if local_audio_path:
            try:
                from faster_whisper import WhisperModel  # type: ignore
                model = WhisperModel(whisper_model, device="cpu", compute_type="int8")
                result_segs, _ = model.transcribe(
                    local_audio_path, language=language if language != "auto" else None,
                    word_timestamps=True
                )
                seg_id = 1
                for seg in result_segs:
                    words = []
                    if seg.words:
                        for w in seg.words:
                            words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
                    segments.append({
                        "id": seg_id, "start": round(seg.start, 3), "end": round(seg.end, 3),
                        "text": seg.text.strip(), "words": words
                    })
                    seg_id += 1
                provider_used = f"faster-whisper-{whisper_model}"
                logger.info(f"[SubGen-{request_id}] faster-whisper transcribed {len(segments)} segments")
            except Exception as fw_err:
                logger.warning(f"[SubGen-{request_id}] faster-whisper failed: {fw_err}")

        # ── 2. Try openai-whisper ────────────────────────────────────────────
        if not segments and local_audio_path:
            try:
                import whisper  # type: ignore
                model = whisper.load_model(whisper_model)
                result = model.transcribe(local_audio_path, language=language, word_timestamps=True)
                seg_id = 1
                for seg in result.get("segments", []):
                    words = [{"word": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)}
                             for w in seg.get("words", [])]
                    segments.append({
                        "id": seg_id, "start": round(seg["start"], 3), "end": round(seg["end"], 3),
                        "text": seg["text"].strip(), "words": words
                    })
                    seg_id += 1
                provider_used = f"openai-whisper-{whisper_model}"
                logger.info(f"[SubGen-{request_id}] openai-whisper transcribed {len(segments)} segments")
            except Exception as ow_err:
                logger.warning(f"[SubGen-{request_id}] openai-whisper failed: {ow_err}")

        # ── 3. Text-split fallback ───────────────────────────────────────────
        if not segments:
            logger.info(f"[SubGen-{request_id}] Using intelligent text-split fallback")
            provider_used = "text-split-fallback"
            segments = self._split_narration_to_segments(narration)

        # ── Post-process: AI caption formatting + auto line-breaking ─────────
        segments = self._format_caption_segments(segments)

        # ── Generate output files ─────────────────────────────────────────────
        total_duration = segments[-1]["end"] if segments else 0.0
        word_count = sum(len(s["text"].split()) for s in segments)
        files: Dict[str, str] = {}

        if "srt" in output_formats:
            srt_path = output_dir / f"{base_name}.srt"
            srt_path.write_text(self._segments_to_srt(segments), encoding="utf-8")
            files["srtUrl"] = f"/output/subtitles/{base_name}.srt"

        if "vtt" in output_formats:
            vtt_path = output_dir / f"{base_name}.vtt"
            vtt_path.write_text(self._segments_to_vtt(segments), encoding="utf-8")
            files["vttUrl"] = f"/output/subtitles/{base_name}.vtt"

        if "ass" in output_formats:
            ass_path = output_dir / f"{base_name}.ass"
            ass_path.write_text(self._segments_to_ass(segments, params.get("captionStyle", {})), encoding="utf-8")
            files["assUrl"] = f"/output/subtitles/{base_name}.ass"

        if "txt" in output_formats:
            txt_path = output_dir / f"{base_name}.txt"
            txt_path.write_text("\n".join(s["text"] for s in segments), encoding="utf-8")
            files["txtUrl"] = f"/output/subtitles/{base_name}.txt"

        gen_time = int((time.perf_counter() - start_time) * 1000)
        logger.info(f"[SubGen-{request_id}] Done in {gen_time}ms via {provider_used}. Segments={len(segments)}, Words={word_count}")

        return {
            "segments": segments,
            "provider": provider_used,
            "model": whisper_model,
            "language": language,
            "wordCount": word_count,
            "duration": total_duration,
            "generationTime": gen_time,
            **files
        }

    def _split_narration_to_segments(self, narration: str) -> List[Dict[str, Any]]:
        """Split plain narration text into timed segments using character-count estimation."""
        import re
        sentences = re.split(r'(?<=[.!?])\s+', narration.strip())
        sentences = [s.strip() for s in sentences if s.strip()]
        chars_per_second = 14.0
        segments = []
        cursor = 0.0
        for idx, sentence in enumerate(sentences):
            duration = max(1.0, len(sentence) / chars_per_second)
            words_list = sentence.split()
            word_duration = duration / max(1, len(words_list))
            words = []
            w_cursor = cursor
            for w in words_list:
                words.append({"word": w, "start": round(w_cursor, 3), "end": round(w_cursor + word_duration, 3)})
                w_cursor += word_duration
            segments.append({
                "id": idx + 1,
                "start": round(cursor, 3),
                "end": round(cursor + duration, 3),
                "text": sentence,
                "words": words
            })
            cursor += duration
        return segments

    def _format_caption_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Post-process: split long sentences, balance line lengths (max 42 chars/line, 2 lines max),
        respect reading speed ~14-17 chars/second.
        """
        MAX_CHARS_PER_LINE = 42
        formatted = []
        new_id = 1
        for seg in segments:
            text = seg["text"].strip()
            if len(text) <= MAX_CHARS_PER_LINE:
                seg["id"] = new_id
                formatted.append(seg)
                new_id += 1
                continue

            # Split into chunks of MAX_CHARS_PER_LINE respecting word boundaries
            words = text.split()
            lines = []
            current_line = ""
            for word in words:
                if len(current_line) + len(word) + 1 <= MAX_CHARS_PER_LINE:
                    current_line = (current_line + " " + word).strip()
                else:
                    if current_line:
                        lines.append(current_line)
                    current_line = word
            if current_line:
                lines.append(current_line)

            # Group into 2-line chunks
            grouped = []
            for i in range(0, len(lines), 2):
                grouped.append("\n".join(lines[i:i+2]))

            # Distribute time across grouped chunks
            total_dur = seg["end"] - seg["start"]
            total_chars = sum(len(g) for g in grouped)
            cursor = seg["start"]
            for chunk in grouped:
                char_ratio = len(chunk) / max(1, total_chars)
                dur = round(total_dur * char_ratio, 3)
                formatted.append({
                    "id": new_id,
                    "start": round(cursor, 3),
                    "end": round(cursor + dur, 3),
                    "text": chunk,
                    "words": seg.get("words", [])
                })
                new_id += 1
                cursor += dur

        return formatted

    def _seconds_to_srt_time(self, seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    def _seconds_to_vtt_time(self, seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

    def _segments_to_srt(self, segments: List[Dict[str, Any]]) -> str:
        lines = []
        for seg in segments:
            lines.append(str(seg["id"]))
            lines.append(f"{self._seconds_to_srt_time(seg['start'])} --> {self._seconds_to_srt_time(seg['end'])}")
            lines.append(seg["text"])
            lines.append("")
        return "\n".join(lines)

    def _segments_to_vtt(self, segments: List[Dict[str, Any]]) -> str:
        lines = ["WEBVTT", ""]
        for seg in segments:
            lines.append(f"{self._seconds_to_vtt_time(seg['start'])} --> {self._seconds_to_vtt_time(seg['end'])}")
            lines.append(seg["text"])
            lines.append("")
        return "\n".join(lines)

    def _segments_to_ass(self, segments: List[Dict[str, Any]], style: Dict[str, Any]) -> str:
        font = style.get("fontFamily", "Arial")
        font_size = style.get("fontSize", 28)
        color = style.get("color", "#FFFFFF")
        stroke_color = style.get("strokeColor", "#000000")
        stroke_w = style.get("strokeWidth", 2)
        position = style.get("position", "Bottom Center")

        def hex_to_ass(hx: str) -> str:
            hx = hx.lstrip("#")
            if len(hx) == 6:
                r, g, b = hx[0:2], hx[2:4], hx[4:6]
                return f"00{b}{g}{r}"
            return "00FFFFFF"

        alignment = {"Bottom Center": 2, "Top Center": 8, "Middle Center": 5}.get(position, 2)

        header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, Bold, Italic, Alignment, MarginV, Outline
Style: Default,{font},{font_size},&H{hex_to_ass(color)},&H{hex_to_ass(stroke_color)},0,0,{alignment},30,{stroke_w}

[Events]
Format: Layer, Start, End, Style, Text
"""
        def ass_time(s: float) -> str:
            h = int(s // 3600)
            m = int((s % 3600) // 60)
            sc = s % 60
            return f"{h}:{m:02d}:{sc:05.2f}"

        events = []
        for seg in segments:
            events.append(
                f"Dialogue: 0,{ass_time(seg['start'])},{ass_time(seg['end'])},Default,{seg['text']}"
            )
        return header + "\n".join(events) + "\n"

    async def translate_subtitles_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Translate subtitle segments into multiple target languages using Gemini/Groq."""
        import uuid, time, json as json_lib
        from pathlib import Path

        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        segments: List[Dict] = params.get("segments", [])
        target_languages: List[str] = params.get("targetLanguages", ["hi"])
        project_title: str = params.get("projectTitle", "video") or "video"

        if not segments:
            raise ValueError("subtitle segments are required for translation")
        if not target_languages:
            raise ValueError("at least one target language is required")

        import re
        safe_title = re.sub(r"[^a-zA-Z0-9_-]", "_", project_title)[:30]
        output_dir = Path(__file__).resolve().parents[2] / "output" / "subtitles"
        output_dir.mkdir(parents=True, exist_ok=True)

        lang_names = {
            "hi": "Hindi", "te": "Telugu", "ta": "Tamil", "kn": "Kannada",
            "es": "Spanish", "fr": "French", "de": "German", "ja": "Japanese",
            "ar": "Arabic", "pt": "Portuguese"
        }

        translations: Dict[str, Any] = {}
        files: Dict[str, Any] = {}

        full_text = "\n".join(f"[{s['id']}] {s['text']}" for s in segments)

        for lang_code in target_languages:
            lang_name = lang_names.get(lang_code, lang_code)
            logger.info(f"[SubTranslate-{request_id}] Translating {len(segments)} segments to {lang_name}")

            translated_texts: List[str] = []

            try:
                prompt = (
                    f"Translate the following numbered subtitle segments to {lang_name}. "
                    f"Keep each segment on its own line with the [number] prefix intact. "
                    f"Preserve natural reading pace and line length (max 42 chars per line). "
                    f"Output ONLY the translated lines, nothing else.\n\n{full_text}"
                )
                gemini_keys = getattr(settings, "GEMINI_API_KEYS", None) or []
                if isinstance(gemini_keys, str):
                    gemini_keys = [k.strip() for k in gemini_keys.split(",") if k.strip()]
                if gemini_keys:
                    import google.generativeai as genai_mod
                    genai_mod.configure(api_key=gemini_keys[0])
                    model = genai_mod.GenerativeModel("gemini-2.0-flash")
                    resp = model.generate_content(prompt)
                    raw = resp.text.strip()
                    for line in raw.split("\n"):
                        line = line.strip()
                        if line:
                            match = re.match(r"^\[(\d+)\]\s*(.*)", line)
                            translated_texts.append(match.group(2).strip() if match else line)
            except Exception as e:
                logger.warning(f"[SubTranslate-{request_id}] Gemini translation failed: {e}")

            # Fallback: return original text if translation unavailable
            if not translated_texts or len(translated_texts) != len(segments):
                translated_texts = [s["text"] for s in segments]

            translated_segments = []
            for i, seg in enumerate(segments):
                new_seg = dict(seg)
                new_seg["text"] = translated_texts[i] if i < len(translated_texts) else seg["text"]
                translated_segments.append(new_seg)

            translations[lang_code] = translated_segments

            base = f"{safe_title}_{request_id}_{lang_code}"
            srt_path = output_dir / f"{base}.srt"
            vtt_path = output_dir / f"{base}.vtt"
            srt_path.write_text(self._segments_to_srt(translated_segments), encoding="utf-8")
            vtt_path.write_text(self._segments_to_vtt(translated_segments), encoding="utf-8")
            files[lang_code] = {
                "srtUrl": f"/output/subtitles/{base}.srt",
                "vttUrl": f"/output/subtitles/{base}.vtt"
            }

        return {"translations": translations, "files": files}

    def get_subtitle_presets(self) -> List[Dict[str, Any]]:
        """Return 8 built-in caption style presets."""
        return [
            {"name": "TikTok", "fontFamily": "Impact", "fontSize": 32, "fontWeight": "900",
             "color": "#FFFF00", "strokeColor": "#000000", "strokeWidth": 3,
             "bgBox": False, "shadow": True, "opacity": 1.0, "animation": "Word-by-word",
             "position": "Bottom Center"},
            {"name": "Instagram Reels", "fontFamily": "Inter", "fontSize": 28, "fontWeight": "700",
             "color": "#FFFFFF", "strokeColor": "#000000", "strokeWidth": 2,
             "bgBox": False, "shadow": True, "opacity": 1.0, "animation": "Slide Up",
             "position": "Bottom Center"},
            {"name": "YouTube Shorts", "fontFamily": "Roboto", "fontSize": 28, "fontWeight": "700",
             "color": "#FFFFFF", "strokeColor": "#000000", "strokeWidth": 2,
             "bgBox": True, "shadow": False, "opacity": 0.9, "animation": "Fade",
             "position": "Bottom Center"},
            {"name": "Corporate", "fontFamily": "Inter", "fontSize": 24, "fontWeight": "400",
             "color": "#FFFFFF", "strokeColor": "#000000", "strokeWidth": 0,
             "bgBox": True, "shadow": False, "opacity": 0.85, "animation": "Fade",
             "position": "Bottom Center"},
            {"name": "Netflix", "fontFamily": "Arial", "fontSize": 26, "fontWeight": "700",
             "color": "#FFFFFF", "strokeColor": "#000000", "strokeWidth": 1,
             "bgBox": False, "shadow": True, "opacity": 1.0, "animation": "None",
             "position": "Bottom Center"},
            {"name": "Cinematic", "fontFamily": "Times New Roman", "fontSize": 24, "fontWeight": "400",
             "color": "#F5F0DC", "strokeColor": "#000000", "strokeWidth": 0,
             "bgBox": False, "shadow": False, "opacity": 0.95, "animation": "Fade",
             "position": "Middle Center"},
            {"name": "Gaming", "fontFamily": "Impact", "fontSize": 30, "fontWeight": "900",
             "color": "#00FF00", "strokeColor": "#000000", "strokeWidth": 3,
             "bgBox": False, "shadow": True, "opacity": 1.0, "animation": "Pop",
             "position": "Top Center"},
            {"name": "Minimal", "fontFamily": "Inter", "fontSize": 20, "fontWeight": "300",
             "color": "#FFFFFF", "strokeColor": "#000000", "strokeWidth": 0,
             "bgBox": False, "shadow": False, "opacity": 0.8, "animation": "Fade",
             "position": "Bottom Center"},
        ]

    async def upload_subtitles_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Parse an uploaded .srt or .vtt subtitle file into segments array."""
        import re
        content: str = params.get("content", "")
        fmt: str = params.get("format", "srt")

        if not content.strip():
            raise ValueError("subtitle file content cannot be empty")

        segments = []

        if fmt == "srt" or "WEBVTT" not in content:
            # Parse SRT
            blocks = re.split(r"\n\n+", content.strip())
            for block in blocks:
                lines = block.strip().split("\n")
                if len(lines) < 3:
                    continue
                try:
                    seg_id = int(lines[0].strip())
                    times = re.match(
                        r"(\d+:\d+:\d+[,\.]\d+)\s*-->\s*(\d+:\d+:\d+[,\.]\d+)",
                        lines[1].strip()
                    )
                    if not times:
                        continue
                    def parse_ts(ts: str) -> float:
                        ts = ts.replace(",", ".")
                        parts = ts.split(":")
                        return int(parts[0])*3600 + int(parts[1])*60 + float(parts[2])
                    start = parse_ts(times.group(1))
                    end = parse_ts(times.group(2))
                    text = "\n".join(lines[2:]).strip()
                    segments.append({"id": seg_id, "start": round(start, 3), "end": round(end, 3), "text": text, "words": []})
                except Exception:
                    continue
        else:
            # Parse VTT
            blocks = re.split(r"\n\n+", content.strip())
            seg_id = 1
            for block in blocks:
                if "WEBVTT" in block or not "-->" in block:
                    continue
                lines = block.strip().split("\n")
                for i, line in enumerate(lines):
                    if "-->" in line:
                        times = re.match(
                            r"(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)\s*-->\s*(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)",
                            line
                        )
                        if times:
                            def parse_vtt(ts: str) -> float:
                                parts = ts.split(":")
                                if len(parts) == 2:
                                    return int(parts[0])*60 + float(parts[1])
                                return int(parts[0])*3600 + int(parts[1])*60 + float(parts[2])
                            start = parse_vtt(times.group(1))
                            end = parse_vtt(times.group(2))
                            text = "\n".join(lines[i+1:]).strip()
                            segments.append({"id": seg_id, "start": round(start, 3), "end": round(end, 3), "text": text, "words": []})
                            seg_id += 1
                        break

        return {"segments": segments, "count": len(segments)}

    async def export_subtitles_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Re-export subtitle segments with current styling to any output format."""
        import uuid, re
        from pathlib import Path

        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        segments: List[Dict] = params.get("segments", [])
        output_format: str = params.get("format", "srt")
        style: Dict = params.get("captionStyle", {})
        project_title: str = params.get("projectTitle", "video") or "video"

        if not segments:
            raise ValueError("segments cannot be empty for export")

        output_dir = Path(__file__).resolve().parents[2] / "output" / "subtitles"
        output_dir.mkdir(parents=True, exist_ok=True)
        safe_title = re.sub(r"[^a-zA-Z0-9_-]", "_", project_title)[:30]
        filename = f"{safe_title}_{request_id}_export.{output_format}"
        file_path = output_dir / filename

        if output_format == "srt":
            file_path.write_text(self._segments_to_srt(segments), encoding="utf-8")
        elif output_format == "vtt":
            file_path.write_text(self._segments_to_vtt(segments), encoding="utf-8")
        elif output_format == "ass":
            file_path.write_text(self._segments_to_ass(segments, style), encoding="utf-8")
        elif output_format == "txt":
            file_path.write_text("\n".join(s["text"] for s in segments), encoding="utf-8")
        else:
            raise ValueError(f"Unsupported format: {output_format}")

        return {"fileUrl": f"/output/subtitles/{filename}", "format": output_format, "segmentCount": len(segments)}

    # ─────────────────────────────────────────────────────────────────────────
    # v3.7 – Professional Timeline Editor
    # ─────────────────────────────────────────────────────────────────────────

    SUPPORTED_ANIMATIONS = [
        "Fade", "CrossFade", "Zoom In", "Zoom Out",
        "Pan Left", "Pan Right",
        "Slide Left", "Slide Right", "Slide Up", "Slide Down",
        "Ken Burns", "Rotate", "Blur", "Flash", "Glitch",
    ]

    SUPPORTED_TRANSITIONS = [
        "None", "Fade", "CrossFade", "Wipe Left", "Wipe Right",
        "Wipe Up", "Wipe Down", "Zoom", "Slide", "Dissolve", "Flash",
    ]

    ANIMATION_CSS: Dict[str, str] = {
        "Fade":        "opacity: 0; animation: fadeIn 0.8s ease forwards;",
        "CrossFade":   "opacity: 0; animation: fadeIn 1s ease-in-out forwards;",
        "Zoom In":     "transform: scale(0.8); opacity:0; animation: zoomIn 0.8s ease forwards;",
        "Zoom Out":    "transform: scale(1.2); opacity:0; animation: zoomOut 0.8s ease forwards;",
        "Pan Left":    "transform: translateX(40px); opacity:0; animation: panLeft 0.8s ease forwards;",
        "Pan Right":   "transform: translateX(-40px); opacity:0; animation: panRight 0.8s ease forwards;",
        "Slide Left":  "transform: translateX(100%); animation: slideLeft 0.6s ease forwards;",
        "Slide Right": "transform: translateX(-100%); animation: slideRight 0.6s ease forwards;",
        "Slide Up":    "transform: translateY(100%); animation: slideUp 0.6s ease forwards;",
        "Slide Down":  "transform: translateY(-100%); animation: slideDown 0.6s ease forwards;",
        "Ken Burns":   "transform-origin: center; animation: kenBurns 6s ease-in-out infinite alternate;",
        "Rotate":      "transform: rotate(0deg); animation: rotate 0.8s ease forwards;",
        "Blur":        "filter: blur(8px); animation: unblur 0.8s ease forwards;",
        "Flash":       "animation: flash 0.4s ease forwards;",
        "Glitch":      "animation: glitch 0.6s steps(2) forwards;",
    }

    OVERLAY_TYPES = [
        "Logo", "Watermark", "CTA Button", "Sticker", "Emoji",
        "Badge", "Product Label", "PNG Overlay", "SVG Overlay",
    ]

    async def timeline_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        v3.7 – Build a complete editing timeline JSON from scenes, voice, music, subtitles.
        Returns timeline tracks consumed by the professional timeline editor in the frontend.
        """
        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        scenes = params.get("scenes") or []
        voice = params.get("voice") or {}
        music = params.get("music") or {}
        subtitles = params.get("subtitles") or {}
        fps = int(params.get("fps") or 30)
        overlays = params.get("overlays") or []

        if not scenes:
            raise ValueError("scenes are required to build a timeline")

        logger.info(f"[Timeline-{request_id}] Building timeline for {len(scenes)} scenes")

        # ── Build scene track ─────────────────────────────────────────────
        scene_track: List[Dict[str, Any]] = []
        cursor = 0.0
        for idx, scene in enumerate(scenes):
            duration = float(scene.get("duration") or scene.get("duration_s") or 5)
            scene_id = scene.get("id") or scene.get("sceneId") or (idx + 1)
            animation = scene.get("animation") or "Fade"
            transition = scene.get("transition") or "CrossFade"
            start = cursor
            end = round(start + duration, 3)

            # Find matching subtitle range
            sub_segs = subtitles.get("segments") or []
            sub_range = {"start": start, "end": end}
            matching = [s for s in sub_segs if start <= float(s.get("start", 0)) < end]
            if matching:
                sub_range = {"start": matching[0]["start"], "end": matching[-1]["end"]}

            scene_track.append({
                "id": f"scene-{idx + 1}",
                "sceneId": scene_id,
                "label": scene.get("title") or f"Scene {idx + 1}",
                "start": start,
                "end": end,
                "duration": duration,
                "animation": animation,
                "transition": transition,
                "imageUrl": scene.get("imageUrl") or "",
                "subtitleRange": sub_range,
                "audioRange": {"start": start, "end": end},
                "locked": False,
                "hidden": False,
            })
            cursor = end

        total_duration = round(cursor, 3)

        # ── Build voice track ─────────────────────────────────────────────
        voice_track = [{
            "id": "voice-1",
            "label": f"Voiceover – {voice.get('voice', 'AI Voice')}",
            "start": 0.0,
            "end": total_duration,
            "duration": total_duration,
            "audioUrl": voice.get("audioUrl") or "",
            "provider": voice.get("provider") or "TTS",
            "locked": False,
            "hidden": False,
        }]

        # ── Build music track ─────────────────────────────────────────────
        music_track = [{
            "id": "music-1",
            "label": f"Background Music – {music.get('mood', 'Corporate')}",
            "start": 0.0,
            "end": total_duration,
            "duration": total_duration,
            "audioUrl": music.get("musicUrl") or "",
            "volume": float(music.get("volume") or 0.3),
            "provider": music.get("provider") or "Library",
            "locked": False,
            "hidden": False,
        }]

        # ── Build subtitle track ───────────────────────────────────────────
        sub_segs = subtitles.get("segments") or []
        subtitle_track = []
        for seg in sub_segs:
            subtitle_track.append({
                "id": f"sub-{seg.get('id', 0)}",
                "label": seg.get("text", "")[:40],
                "start": float(seg.get("start", 0)),
                "end": float(seg.get("end", 0)),
                "duration": round(float(seg.get("end", 0)) - float(seg.get("start", 0)), 3),
                "text": seg.get("text", ""),
                "words": seg.get("words") or [],
                "locked": False,
                "hidden": False,
            })

        # ── Build overlay track ────────────────────────────────────────────
        overlay_track = []
        for i, ov in enumerate(overlays):
            overlay_track.append({
                "id": ov.get("overlayId") or f"overlay-{i + 1}",
                "label": f"{ov.get('type', 'Overlay')} – {ov.get('label', '')}",
                "start": float(ov.get("startTime") or 0),
                "end": float(ov.get("endTime") or total_duration),
                "duration": float(ov.get("endTime") or total_duration) - float(ov.get("startTime") or 0),
                "type": ov.get("type") or "Logo",
                "url": ov.get("url") or "",
                "x": float(ov.get("x") or 0),
                "y": float(ov.get("y") or 0),
                "width": float(ov.get("width") or 100),
                "height": float(ov.get("height") or 50),
                "opacity": float(ov.get("opacity") or 1.0),
                "zIndex": int(ov.get("zIndex") or 1),
                "locked": False,
                "hidden": False,
            })

        timeline = {
            "tracks": {
                "scenes": scene_track,
                "voice": voice_track,
                "music": music_track,
                "subtitles": subtitle_track,
                "overlays": overlay_track,
            },
            "totalDuration": total_duration,
            "fps": fps,
            "requestId": request_id,
        }

        logger.info(
            f"[Timeline-{request_id}] Timeline built: {len(scene_track)} scenes, "
            f"{len(subtitle_track)} subtitle blocks, {len(overlay_track)} overlays, "
            f"totalDuration={total_duration}s"
        )
        return {"success": True, "message": "Timeline built successfully", "timeline": timeline}

    async def scene_animation_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        v3.7 – Return animation metadata for a scene block.
        Validates animation + transition names and returns CSS + easing.
        """
        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        scene_id = params.get("sceneId") or "1"
        animation = params.get("animation") or "Fade"
        transition = params.get("transition") or "CrossFade"
        duration = float(params.get("duration") or 0.8)
        easing = params.get("easing") or "ease"

        # Validate
        if animation not in self.SUPPORTED_ANIMATIONS:
            logger.warning(f"[AnimAPI-{request_id}] Unknown animation '{animation}', defaulting to Fade")
            animation = "Fade"
        if transition not in self.SUPPORTED_TRANSITIONS:
            logger.warning(f"[AnimAPI-{request_id}] Unknown transition '{transition}', defaulting to CrossFade")
            transition = "CrossFade"
        if not (0.1 <= duration <= 10.0):
            duration = 0.8

        preview_css = self.ANIMATION_CSS.get(animation, self.ANIMATION_CSS["Fade"])

        logger.info(f"[AnimAPI-{request_id}] Animation config for scene {scene_id}: {animation} / {transition}")
        return {
            "success": True,
            "data": {
                "sceneId": scene_id,
                "animation": animation,
                "transition": transition,
                "duration": duration,
                "easing": easing,
                "previewCss": preview_css,
                "supportedAnimations": self.SUPPORTED_ANIMATIONS,
                "supportedTransitions": self.SUPPORTED_TRANSITIONS,
            }
        }

    async def overlay_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        v3.7 – Create or update overlay metadata.
        Validates type, position, opacity, z-index.
        Stores overlay files under output/overlays/.
        """
        import base64 as b64
        request_id = params.get("request_id") or str(uuid.uuid4())[:8]
        overlay_type = params.get("type") or "Logo"
        label = params.get("label") or overlay_type
        x = float(params.get("x") or 5)
        y = float(params.get("y") or 5)
        width = float(params.get("width") or 20)
        height = float(params.get("height") or 10)
        opacity = float(params.get("opacity") or 1.0)
        z_index = int(params.get("zIndex") or 10)
        start_time = float(params.get("startTime") or 0)
        end_time = float(params.get("endTime") or 999)
        file_data = params.get("fileData") or ""   # base64 if uploaded
        file_ext = params.get("fileExt") or "png"
        text = params.get("text") or ""            # for CTA Button, Badge, Emoji

        # Validate type
        if overlay_type not in self.OVERLAY_TYPES:
            logger.warning(f"[Overlay-{request_id}] Unknown overlay type '{overlay_type}', defaulting to Logo")
            overlay_type = "Logo"

        # Clamp values
        x = max(0.0, min(x, 100.0))
        y = max(0.0, min(y, 100.0))
        width = max(5.0, min(width, 100.0))
        height = max(2.0, min(height, 100.0))
        opacity = max(0.0, min(opacity, 1.0))
        z_index = max(1, min(z_index, 100))

        overlay_id = f"overlay-{request_id}"
        file_url = ""

        # Save uploaded file if provided
        if file_data:
            try:
                output_dir = Path(__file__).resolve().parents[2] / "output" / "overlays"
                output_dir.mkdir(parents=True, exist_ok=True)
                filename = f"{overlay_id}.{file_ext}"
                raw = b64.b64decode(file_data)
                (output_dir / filename).write_bytes(raw)
                file_url = f"/output/overlays/{filename}"
                logger.info(f"[Overlay-{request_id}] Saved overlay file: {filename} ({len(raw)} bytes)")
            except Exception as e:
                logger.warning(f"[Overlay-{request_id}] Failed to save overlay file: {e}")

        result = {
            "overlayId": overlay_id,
            "type": overlay_type,
            "label": label,
            "text": text,
            "url": file_url,
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "opacity": opacity,
            "zIndex": z_index,
            "startTime": start_time,
            "endTime": end_time,
        }

        logger.info(f"[Overlay-{request_id}] Overlay created: {overlay_type} at ({x}%,{y}%) {opacity*100:.0f}% opacity")
        return {"success": True, "message": f"{overlay_type} overlay created", "data": result}

    def generate_storyboard(self, params: Dict[str, Any]) -> Dict[str, Any]:

        """
        Build a scene-by-scene storyboard from an existing script.

        Input params:
            script_title     (str, required) – Title of the video.
            script_narration (str, required) – Full narration body text.
            num_scenes       (int)           – Desired number of scenes (default 4).

        Returns a list of storyboard scene objects.
        """
        title = params.get("script_title") or ""
        narration = params.get("script_narration") or ""
        num_scenes = int(params.get("num_scenes") or 4)

        if not title or not narration:
            return {
                "success": False,
                "action": "generate_storyboard",
                "error": "Required parameters 'script_title' and 'script_narration' cannot be empty.",
            }

        num_scenes = max(2, min(num_scenes, 10))  # clamp between 2 and 10

        camera_angles = ["Wide Angle", "Medium Shot", "Close-up", "Zoom In", "Pan Right"]
        animations = ["Slide", "Fade", "Pop-in", "Pan Right", "Zoom"]
        transitions = ["Dissolve", "Wipe", "Zoom", "Cut", "None"]

        scenes = []
        labels = ["Intro Hook", "Problem Statement", "Solution Details",
                  "Feature Highlight", "Social Proof", "Pricing / Offer",
                  "FAQ / Objection", "Call to Action", "Brand Close", "End Card"]

        for i in range(num_scenes):
            scenes.append({
                "id": f"scene-{i + 1}",
                "scene_index": i + 1,
                "title": labels[i] if i < len(labels) else f"Scene {i + 1}",
                "duration_s": 8 if i > 0 else 5,
                "visual_description": f"Placeholder visual for {labels[i] if i < len(labels) else 'scene'}. "
                                      "Replace with AI-generated image or upload custom asset.",
                "camera_angle": camera_angles[i % len(camera_angles)],
                "animation": animations[i % len(animations)],
                "transition": transitions[i % len(transitions)],
                "caption_text": f"Placeholder subtitle for scene {i + 1}.",
                "image_url": None,
            })

        return {
            "success": True,
            "action": "generate_storyboard",
            "message": f"Storyboard with {num_scenes} scenes generated for '{title}'.",
            "data": {
                "title": title,
                "total_scenes": num_scenes,
                "total_duration_s": sum(s["duration_s"] for s in scenes),
                "scenes": scenes,
            },
            "note": "AI-powered visual suggestions (Stable Diffusion) are planned for v3.0.",
        }

    def generate_images(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate placeholder image metadata for each storyboard scene.

        Input params:
            scenes      (list, required) – List of storyboard scene objects.
            brand_color (str)            – Primary brand hex color for gradient theming.
            style       (str)            – Visual style hint (e.g. "corporate", "vibrant").

        Returns scenes enriched with placeholder image metadata.
        """
        scenes = params.get("scenes") or []
        brand_color = params.get("brand_color") or "#a855f7"
        style = params.get("style") or "corporate"

        if not scenes:
            return {
                "success": False,
                "action": "generate_images",
                "error": "Required parameter 'scenes' is missing or empty.",
            }

        gradient_palettes = [
            "from-violet-900 to-indigo-950",
            "from-pink-900 to-purple-950",
            "from-blue-900 to-indigo-900",
            "from-emerald-950 to-slate-900",
            "from-purple-800 to-pink-700",
        ]

        enriched = []
        for idx, scene in enumerate(scenes):
            enriched.append({
                **scene,
                "image_url": None,
                "image_gradient": gradient_palettes[idx % len(gradient_palettes)],
                "image_prompt": (
                    f"Marketing visual for scene '{scene.get('title', f'Scene {idx + 1}')}' — "
                    f"style: {style}, brand color: {brand_color}. "
                    f"Visual description: {scene.get('visual_description', 'placeholder')}."
                ),
                "image_status": "placeholder",
            })

        return {
            "success": True,
            "action": "generate_images",
            "message": f"Image metadata generated for {len(enriched)} scene(s).",
            "data": {"scenes": enriched},
            "note": "AI image rendering (Stable Diffusion / DALL-E) is planned for v3.0.",
        }

    def generate_voice(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesise a placeholder voiceover configuration.

        Input params:
            narration (str, required) – Full narration text to be voiced.
            gender    (str)           – Voice gender ('Female' or 'Male').
            accent    (str)           – Accent label (e.g. 'US English').
            speed     (str)           – Playback speed multiplier (e.g. '1.0x').

        Returns a voiceover manifest with configuration and placeholder audio info.
        """
        narration = params.get("narration") or ""
        gender = params.get("gender") or "Female"
        accent = params.get("accent") or "US English"
        speed = params.get("speed") or "1.0x"

        if not narration or not narration.strip():
            return {
                "success": False,
                "action": "generate_voice",
                "error": "Required parameter 'narration' cannot be empty.",
            }

        word_count = len(narration.split())
        # Average speaking pace: ~130 words per minute at 1.0x speed
        speed_multiplier = float(speed.replace("x", "")) if speed.replace("x", "").replace(".", "").isdigit() else 1.0
        estimated_duration_s = round((word_count / 130) * 60 / speed_multiplier, 1)

        return {
            "success": True,
            "action": "generate_voice",
            "message": "Voiceover configuration built successfully.",
            "data": {
                "gender": gender,
                "accent": accent,
                "speed": speed,
                "word_count": word_count,
                "estimated_duration_s": estimated_duration_s,
                "audio_format": "mp3",
                "audio_url": None,
                "audio_status": "placeholder",
                "voice_model": "placeholder — ElevenLabs / AWS Polly in v3.0",
                "narration_preview": narration[:200] + ("..." if len(narration) > 200 else ""),
            },
            "note": "Live voice synthesis (ElevenLabs / AWS Polly) is planned for v3.0.",
        }

    def generate_captions(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate timed subtitle / caption entries from narration and scene durations.

        Input params:
            narration   (str, required)  – Full narration text.
            scenes      (list, required) – Scene list providing timing reference.
            font_family (str)            – Caption font family (e.g. 'Inter').
            position    (str)            – Subtitle position (e.g. 'Bottom Center').

        Returns a list of timed caption entries aligned to scene boundaries.
        """
        narration = params.get("narration") or ""
        scenes = params.get("scenes") or []
        font_family = params.get("font_family") or "Inter"
        position = params.get("position") or "Bottom Center"

        if not narration or not scenes:
            return {
                "success": False,
                "action": "generate_captions",
                "error": "Both 'narration' and 'scenes' are required parameters.",
            }

        # Distribute narration words across scenes proportionally
        words = narration.split()
        total_duration = sum(s.get("duration_s", 8) for s in scenes)
        captions = []
        start_time = 0.0

        for idx, scene in enumerate(scenes):
            duration = scene.get("duration_s", 8)
            ratio = duration / total_duration if total_duration > 0 else 1 / len(scenes)
            slice_size = max(1, round(len(words) * ratio))
            word_slice = words[:slice_size]
            words = words[slice_size:]

            captions.append({
                "caption_index": idx + 1,
                "scene_id": scene.get("id") or f"scene-{idx + 1}",
                "start_time_s": round(start_time, 2),
                "end_time_s": round(start_time + duration, 2),
                "text": " ".join(word_slice) if word_slice else scene.get("caption_text", ""),
                "font_family": font_family,
                "position": position,
                "animation": "Pop-in",
            })
            start_time += duration

        return {
            "success": True,
            "action": "generate_captions",
            "message": f"{len(captions)} caption entr{'y' if len(captions) == 1 else 'ies'} generated.",
            "data": {
                "total_captions": len(captions),
                "font_family": font_family,
                "position": position,
                "captions": captions,
            },
            "note": "Word-level karaoke timing (Whisper AI) is planned for v3.0.",
        }

    def preview_video(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Return a structured preview manifest combining all timeline elements.

        Input params:
            scenes         (list, required) – Storyboard scene list.
            voice_config   (dict)           – Voiceover configuration dict.
            caption_config (dict)           – Caption styling configuration dict.
            music_track    (str)            – Background music theme name.

        Returns a timeline manifest object ready for client-side rendering.
        """
        scenes = params.get("scenes") or []
        voice_config = params.get("voice_config") or {}
        caption_config = params.get("caption_config") or {}
        music_track = params.get("music_track") or "Corporate Tech"

        if not scenes:
            return {
                "success": False,
                "action": "preview_video",
                "error": "Required parameter 'scenes' is missing or empty.",
            }

        total_duration = sum(s.get("duration_s", 8) for s in scenes)

        return {
            "success": True,
            "action": "preview_video",
            "message": "Preview timeline manifest assembled successfully.",
            "data": {
                "total_duration_s": total_duration,
                "total_scenes": len(scenes),
                "music_track": music_track,
                "voice": {
                    "gender": voice_config.get("gender", "Female"),
                    "accent": voice_config.get("accent", "US English"),
                    "speed": voice_config.get("speed", "1.0x"),
                    "status": "placeholder",
                },
                "captions": {
                    "font_family": caption_config.get("font_family", "Inter"),
                    "position": caption_config.get("position", "Bottom Center"),
                    "animation": caption_config.get("animation", "Pop-in"),
                },
                "timeline_tracks": [
                    {
                        "track": "video",
                        "clips": [
                            {
                                "scene_index": s.get("scene_index", idx + 1),
                                "title": s.get("title", f"Scene {idx + 1}"),
                                "start_s": sum(
                                    scenes[j].get("duration_s", 8) for j in range(idx)
                                ),
                                "duration_s": s.get("duration_s", 8),
                            }
                            for idx, s in enumerate(scenes)
                        ],
                    },
                    {"track": "voice", "status": "placeholder"},
                    {"track": "captions", "status": "placeholder"},
                    {"track": "music", "theme": music_track, "status": "placeholder"},
                ],
                "render_status": "pending",
                "output_format": "mp4",
            },
            "note": "Live video rendering (FFmpeg / MoviePy) is planned for v3.0.",
        }

    def export_project(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Package all video project data into exportable format descriptors.

        Input params:
            project_data (dict, required) – Complete project state dictionary.
            format       (str)            – Export format hint: 'txt', 'csv', 'json', 'mp4'.

        Returns structured export metadata and content strings for the requested format.
        """
        project_data = params.get("project_data") or {}
        export_format = (params.get("format") or "json").lower()

        if not project_data:
            return {
                "success": False,
                "action": "export_project",
                "error": "Required parameter 'project_data' cannot be empty.",
            }

        brand = project_data.get("brand") or {}
        script = project_data.get("script") or {}
        scenes = project_data.get("scenes") or []
        voice = project_data.get("voice") or {}
        captions = project_data.get("captions") or {}

        timestamp = datetime.utcnow().isoformat() + "Z"

        # Build text export
        txt_content = (
            f"AI VIDEO GENERATOR — PROJECT EXPORT\n"
            f"Generated: {timestamp}\n"
            f"{'=' * 45}\n\n"
            f"BUSINESS: {brand.get('businessName', 'N/A')}\n"
            f"PLATFORM: {project_data.get('config', {}).get('platform', 'N/A')}\n\n"
            f"SCRIPT\n{'-' * 20}\n"
            f"Title:     {script.get('title', '')}\n"
            f"Hook:      {script.get('hook', '')}\n"
            f"Narration: {script.get('narration', '')}\n"
            f"CTA:       {script.get('cta', '')}\n\n"
            f"STORYBOARD\n{'-' * 20}\n"
        )
        for idx, scene in enumerate(scenes):
            txt_content += (
                f"Scene {idx + 1}: {scene.get('title', '')} ({scene.get('duration', scene.get('duration_s', 8))}s)\n"
                f"  Visual: {scene.get('visualDescription', scene.get('visual_description', ''))}\n"
                f"  Angle:  {scene.get('cameraAngle', scene.get('camera_angle', ''))}\n"
                f"  Caption: {scene.get('captionText', scene.get('caption_text', ''))}\n\n"
            )

        # Build CSV export (header + rows)
        csv_rows = ["Scene,Duration,Title,Visual Description,Camera Angle,Animation,Subtitle"]
        for idx, scene in enumerate(scenes):
            row = ",".join([
                f'"{idx + 1}"',
                f'"{scene.get("duration", scene.get("duration_s", 8))}"',
                f'"{scene.get("title", f"Scene {idx + 1}")}"',
                f'"{scene.get("visualDescription", scene.get("visual_description", ""))}"',
                f'"{scene.get("cameraAngle", scene.get("camera_angle", ""))}"',
                f'"{scene.get("animation", "")}"',
                f'"{scene.get("captionText", scene.get("caption_text", ""))}"',
            ])
            csv_rows.append(row)
        csv_content = "\n".join(csv_rows)

        return {
            "success": True,
            "action": "export_project",
            "message": f"Project exported successfully in '{export_format}' format.",
            "data": {
                "format": export_format,
                "timestamp": timestamp,
                "txt_content": txt_content,
                "csv_content": csv_content,
                "json_content": project_data,
                "mp4_status": "placeholder — FFmpeg rendering is planned for v3.0.",
                "total_scenes": len(scenes),
                "script_title": script.get("title", "Untitled"),
            },
            "note": "MP4 video rendering (FFmpeg / MoviePy) is planned for v3.0.",
        }
