import os
import json
import logging
import google.generativeai as genai
from typing import Dict, Any, List
from config.settings import settings

logger = logging.getLogger(__name__)

# Configure Google Generative AI (Gemini)
gemini_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
if gemini_key and gemini_key != "your_google_ai_studio_api_key_here":
    genai.configure(api_key=gemini_key)
else:
    logger.warning("⚠️ GEMINI_API_KEY is not set. YouTube AI service will run in fallback mode.")


class YouTubeAIService:
    """Service for YouTube AI content optimization using Gemini."""

    def __init__(self):
        self.model_name = getattr(settings, "GEMINI_CONTENT_MODEL", "gemini-2.5-flash")

    def _has_api_key(self) -> bool:
        return bool(gemini_key and gemini_key != "your_google_ai_studio_api_key_here")

    async def generate_titles(self, topic: str, description: str, business_context: str = "") -> List[str]:
        """Generate 5 catchy, SEO-optimized title options (under 100 characters)."""
        if not self._has_api_key():
            logger.info("Using fallback title options (no Gemini API key)")
            return [
                f"How to grow your business using {topic}",
                f"Secret {topic} strategies for {business_context or 'your business'}",
                f"Ultimate {topic} guide: Boost your sales",
                f"Why {topic} is the future of marketing",
                f"{topic} Tutorial for beginners in 2026",
            ]

        try:
            prompt = (
                f"You are a YouTube SEO expert. Generate 5 catchy, high-CTR, SEO-optimized title options for a YouTube video.\n"
                f"Each title must be under 100 characters.\n\n"
                f"Video Topic: {topic}\n"
                f"Video Description / Overview: {description}\n"
                f"Business Context: {business_context}\n\n"
                f"Respond ONLY with a JSON array of strings containing the 5 title options. No additional comments or markdown formatting."
            )

            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            text = response.text.strip()
            
            # Remove potential markdown block markers
            if text.startswith("```json"):
                text = text.replace("```json", "", 1)
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            text = text.strip()
            
            titles = json.loads(text)
            if isinstance(titles, list):
                return [str(t) for t in titles[:5]]
            return [text]
        except Exception as e:
            logger.error(f"❌ Error generating YouTube titles with Gemini: {e}")
            return [f"Ultimate guide to {topic}", f"Boost your business with {topic}"]

    async def generate_description(self, title: str, business_context: str = "", cta_link: str = "") -> str:
        """Generate a complete SEO-optimized description with timestamps, CTA, and tags."""
        if not self._has_api_key():
            logger.info("Using fallback description (no Gemini API key)")
            return (
                f"Welcome back to our channel!\n\n"
                f"In this video, we're talking about '{title}'.\n"
                f"Discover strategies to take your brand to the next level.\n\n"
                f"👉 Visit our website: {cta_link or 'https://www.sadhyam.com'}\n\n"
                f"#marketing #business #growth"
            )

        try:
            prompt = (
                f"You are a YouTube SEO writer. Write a comprehensive, highly engaging, and SEO-optimized YouTube video description.\n"
                f"Include:\n"
                f"1. A strong, keyword-rich introduction paragraph summarizing the video.\n"
                f"2. A brief list of key topics covered (outline/chapters placeholder).\n"
                f"3. A clear Call to Action (CTA) pointing to {cta_link or 'our website'}.\n"
                f"4. 3-5 relevant, trending hashtags.\n\n"
                f"Video Title: {title}\n"
                f"Business Context: {business_context}\n\n"
                f"Write the description directly. Do not include placeholders like '[Insert Date]' or meta comments."
            )

            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"❌ Error generating YouTube description with Gemini: {e}")
            return f"Learn more about {title} and how we can support you."

    async def generate_tags(self, title: str, description: str) -> List[str]:
        """Generate 10-15 highly relevant SEO tags for the video."""
        if not self._has_api_key():
            logger.info("Using fallback tags (no Gemini API key)")
            return ["marketing", "business", "ai tool", "tutorial", "success"]

        try:
            prompt = (
                f"Identify 12 highly relevant SEO keywords/tags for this YouTube video.\n"
                f"Title: {title}\n"
                f"Description: {description[:500]}...\n\n"
                f"Respond ONLY with a JSON array of strings containing the tags. No markdown formatting."
            )

            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            text = response.text.strip()
            
            if text.startswith("```json"):
                text = text.replace("```json", "", 1)
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            text = text.strip()
            
            tags = json.loads(text)
            if isinstance(tags, list):
                return [str(tag) for tag in tags]
            return [text]
        except Exception as e:
            logger.error(f"❌ Error generating YouTube tags with Gemini: {e}")
            return ["growth", "video", "marketing"]

    async def generate_thumbnail_prompt(self, title: str, description: str) -> str:
        """Generate a prompt to create a high-CTR YouTube thumbnail using AI image generators."""
        if not self._has_api_key():
            logger.info("Using fallback thumbnail prompt (no Gemini API key)")
            return f"A bold, high-contrast, modern graphic showing an AI interface with glowing elements and the text '{title[:15]}'"

        try:
            prompt = (
                f"Create a detailed, creative image generation prompt for a YouTube thumbnail.\n"
                f"The thumbnail needs to be visually stunning, high-contrast, text-readable, and optimized for clicks.\n\n"
                f"Video Title: {title}\n"
                f"Summary: {description[:300]}...\n\n"
                f"Provide ONLY the visual prompt description suitable for FLUX or Midjourney. No preamble or notes."
            )

            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"❌ Error generating YouTube thumbnail prompt: {e}")
            return f"Stunning YouTube thumbnail graphic for: {title}"


youtube_ai_service = YouTubeAIService()
