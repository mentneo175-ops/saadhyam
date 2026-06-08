import json
import os
import random
import re
from functools import lru_cache
from typing import Any

from pydantic import ValidationError

from ai_models.website_ai.app.config import settings
from ai_models.website_ai.app.models.schema import WebsiteContent, WebsiteProfile, WebsiteRequest


DEFAULT_MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2"


def _strip_json_wrappers(raw_text: str) -> str:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned


def _build_profile_prompt(data: WebsiteRequest) -> str:
    return f"""
You are a senior brand strategist and website planner.
Infer the missing business details from the minimal input.
Return only valid JSON. Do not include markdown, commentary, or code fences.

Minimal input:
- Business name: {data.business_name}
- Business type: {data.business_type}

The JSON schema must be exactly:
{{
  "services": ["service 1", "service 2", "service 3"],
  "target_audience": "short audience summary",
  "tone": "brand tone phrase",
  "branding_style": "branding style phrase"
}}

Generate 3 to 6 services. Keep the services specific to the business type.
""".strip()


def _build_content_prompt(profile: WebsiteProfile) -> str:
    services = ", ".join(profile.services)
    description_line = f"- Description: {profile.description}\n" if getattr(profile, "description", None) else ""
    return f"""
You are a professional website copywriter.
Return only valid JSON. Do not include markdown, commentary, or code fences.

Create website content for:
- Business name: {profile.business_name}
- Business type: {profile.business_type}
{description_line}- Services: {services}
- Target audience: {profile.target_audience}
- Tone: {profile.tone}
- Branding style: {profile.branding_style}

The JSON schema must be exactly:
{{
  "about": "short compelling paragraph",
  "audience": "audience summary",
  "tone": "tone summary",
  "branding_style": "branding style summary",
  "services": [
    {{"name": "service name", "description": "one sentence service benefit"}}
  ],
  "faq": [
    {{"question": "customer question", "answer": "concise helpful answer"}}
  ],
  "contact": "short contact call to action"
}}

Create one service card for each supplied service. Include 3 FAQ objects.
""".strip()


def _service_list(seed: str) -> list[str]:
    normalized = seed.lower()
    if any(keyword in normalized for keyword in ("salon", "spa", "beauty", "hair")):
        return ["Signature styling", "Personalized consultations", "Express refresh", "Event-ready looks"]
    if any(keyword in normalized for keyword in ("hotel", "hospitality", "resort", "travel")):
        return ["Luxury suites", "Concierge service", "Event hosting", "Dining experiences"]
    if any(keyword in normalized for keyword in ("medical", "health", "clinic", "care")):
        return ["Primary care", "Diagnostics", "Virtual visits", "Preventive programs"]
    if any(keyword in normalized for keyword in ("consult", "strategy", "agency", "advisory", "studio")):
        return ["Discovery workshops", "Strategy planning", "Execution support", "Performance reviews"]
    if any(keyword in normalized for keyword in ("restaurant", "cafe", "food", "bistro", "diner")):
        return ["Chef-led menus", "Private dining", "Catering", "Seasonal specials"]
    return ["Core service one", "Core service two", "Core service three", "Core service four"]


def _fallback_profile(data: WebsiteRequest) -> WebsiteProfile:
    normalized = data.business_type.lower()
    if any(keyword in normalized for keyword in ("salon", "spa", "beauty", "hair")):
        target_audience = "style-conscious clients, professionals, and event guests"
        tone = "warm, polished, and confident"
        branding_style = "premium beauty and wellness"
    elif any(keyword in normalized for keyword in ("hotel", "hospitality", "resort", "travel")):
        target_audience = "premium travelers, corporate guests, and event planners"
        tone = "elegant, welcoming, and refined"
        branding_style = "luxury hospitality"
    elif any(keyword in normalized for keyword in ("medical", "health", "clinic", "care")):
        target_audience = "families, professionals, and organizations seeking trusted care"
        tone = "reassuring, professional, and clear"
        branding_style = "trusted healthcare"
    elif any(keyword in normalized for keyword in ("consult", "strategy", "agency", "advisory")):
        target_audience = "executive teams and growth-focused leadership"
        tone = "authoritative, strategic, and forward-looking"
        branding_style = "executive consulting"
    else:
        target_audience = "customers looking for a reliable, modern brand experience"
        tone = "professional, engaging, and trustworthy"
        branding_style = "modern business"

    services = _service_list(normalized)
    random.shuffle(services)
    return WebsiteProfile(
        business_name=data.business_name,
        business_type=data.business_type,
        services=services[:4],
        target_audience=target_audience,
        tone=tone,
        branding_style=branding_style,
    )


def _fallback_content(profile: WebsiteProfile) -> WebsiteContent:
    services = [
        {
            "name": service,
            "description": f"Tailored {service.lower()} for {profile.target_audience}.",
        }
        for service in profile.services
    ]
    return WebsiteContent(
        about=(
            f"{profile.business_name} is a {profile.business_type} built for {profile.target_audience}. "
            f"The brand feels {profile.tone} and reflects {profile.branding_style}."
        ),
        audience=profile.target_audience,
        tone=profile.tone,
        branding_style=profile.branding_style,
        services=services,
        faq=[
            {
                "question": f"What makes {profile.business_name} different?",
                "answer": f"It blends {profile.branding_style} with a {profile.tone} customer experience.",
            },
            {
                "question": "How do I get started?",
                "answer": "Choose a service, reach out, and we will guide you through the next step.",
            },
            {
                "question": "Who is this for?",
                "answer": f"It is designed for {profile.target_audience}.",
            },
        ],
        contact=f"Contact {profile.business_name} to schedule a consultation or request a quote.",
    )


@lru_cache(maxsize=1)
def _load_generator() -> Any:
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, pipeline
    except ImportError as exc:
        raise RuntimeError(
            "AI dependencies are not installed. Run `pip install -r requirements.txt`."
        ) from exc

    model_id = settings.AI_MODEL_ID or DEFAULT_MODEL_ID
    token = settings.HF_TOKEN
    use_4bit = os.getenv("WEBSITE_AI_USE_4BIT", "true").lower() == "true" and torch.cuda.is_available()

    quantization_config = None
    if use_4bit:
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )

    tokenizer = AutoTokenizer.from_pretrained(model_id, token=token)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        token=token,
        device_map="auto",
        quantization_config=quantization_config,
    )

    return pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=settings.AI_MAX_TOKENS,
        temperature=settings.AI_TEMPERATURE,
        do_sample=True,
        return_full_text=False,
    )


def _extract_json(raw_text: str) -> dict[str, Any]:
    cleaned = _strip_json_wrappers(raw_text)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise ValueError("The AI response did not contain JSON.")
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise ValueError("The AI response contained malformed JSON.") from exc


def generate_website_profile(data: WebsiteRequest) -> WebsiteProfile:
    if settings.AI_USE_FAKE_LLM:
        return _fallback_profile(data)

    prompt = _build_profile_prompt(data)
    generator = _load_generator()
    response = generator(prompt)
    raw_text = response[0].get("generated_text", "") if response else ""

    try:
        parsed = _extract_json(raw_text)
        return WebsiteProfile.model_validate(
            {
                "business_name": data.business_name,
                "business_type": data.business_type,
                "services": parsed.get("services", []),
                "target_audience": parsed.get("target_audience", "customers seeking a tailored web presence"),
                "tone": parsed.get("tone", "professional and confident"),
                "branding_style": parsed.get("branding_style", "modern business"),
            }
        )
    except (ValueError, ValidationError):
        return _fallback_profile(data)


def generate_content(profile: WebsiteProfile) -> WebsiteContent:
    if settings.AI_USE_FAKE_LLM:
        return _fallback_content(profile)

    prompt = _build_content_prompt(profile)
    generator = _load_generator()
    response = generator(prompt)
    raw_text = response[0].get("generated_text", "") if response else ""

    try:
        parsed = _extract_json(raw_text)
        return WebsiteContent.model_validate(parsed)
    except (ValueError, ValidationError):
        return _fallback_content(profile)

