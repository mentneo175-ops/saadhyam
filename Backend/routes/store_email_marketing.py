"""
Store Email Marketing AI Generation Route.
Provides local FLAN-T5 Seq2Seq inference for AI-assisted subject, body, and full email generation
for the Saadhyam Store Email Marketing workflow.

Model: likhitha7274/saadhyam_email_flan_t5_base
Completely independent from external LLM APIs and legacy plugins.
"""

import os
import re
import json
import logging
import asyncio
from functools import lru_cache
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("store_email_marketing")

router = APIRouter(prefix="/store/email-marketing", tags=["Store Email Marketing"])

HF_STORE_EMAIL_MARKETING_MODEL_ID = "likhitha7274/saadhyam_email_flan_t5_base"


# ==============================================================================
# Pydantic Schemas
# ==============================================================================

class StoreEmailMarketingAIGenerateRequest(BaseModel):
    mode: str = Field("full", description="Generation mode: 'subject', 'body', or 'full'")
    prompt: str = Field(..., min_length=1, description="Context, topic, or objective of the email")
    recipient: Optional[str] = Field("Recipient", description="Recipient name or audience")
    existing_subject: Optional[str] = Field(None, description="Existing subject line if already set")
    tone: Optional[str] = Field("Professional", description="Tone (e.g. Professional, Friendly, Urgent)")
    length: Optional[str] = Field("Medium", description="Length (e.g. Short, Medium, Detailed)")


class StoreEmailMarketingAIGenerateResponse(BaseModel):
    success: bool
    subject: Optional[str] = ""
    body: Optional[str] = ""
    message: str
    error: Optional[str] = None


# ==============================================================================
# Local Model Pipeline (In-Process Transformers Seq2Seq)
# ==============================================================================

@lru_cache(maxsize=1)
def _load_store_marketing_hf_pipeline():
    """Load and cache local transformers model and tokenizer for Store Email Marketing."""
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

    logger.info(
        f"[STORE EMAIL MARKETING] Loading local cached model for {HF_STORE_EMAIL_MARKETING_MODEL_ID}..."
    )
    try:
        tokenizer = AutoTokenizer.from_pretrained(
            HF_STORE_EMAIL_MARKETING_MODEL_ID,
            local_files_only=True,
        )
        logger.info("[STORE EMAIL MARKETING] Local tokenizer loaded.")

        model = AutoModelForSeq2SeqLM.from_pretrained(
            HF_STORE_EMAIL_MARKETING_MODEL_ID,
            local_files_only=True,
            low_cpu_mem_usage=False,
        )
        if hasattr(model, "generation_config") and model.generation_config is not None:
            model.generation_config.max_length = None
            model.generation_config.min_length = None
        logger.info("[STORE EMAIL MARKETING] Local model loaded.")
    except Exception as e:
        logger.error(
            f"[STORE EMAIL MARKETING] Failed to load local model files for {HF_STORE_EMAIL_MARKETING_MODEL_ID}: {e}"
        )
        raise RuntimeError(
            f"Store Email Marketing local model files are not available locally for '{HF_STORE_EMAIL_MARKETING_MODEL_ID}': {e}"
        ) from e

    logger.info("[STORE EMAIL MARKETING] Local model and tokenizer loaded successfully.")
    return tokenizer, model


def _run_store_marketing_hf_inference_sync(prompt_text: str, max_new_tokens: int = 350) -> str:
    """Run local FLAN-T5 model inference synchronously in worker thread."""
    logger.info(
        f"[STORE EMAIL MARKETING] Running local FLAN-T5 inference. Prompt length={len(prompt_text)}"
    )

    tokenizer, model = _load_store_marketing_hf_pipeline()

    inputs = tokenizer(
        prompt_text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )

    outputs = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        min_new_tokens=15,
        do_sample=False,
    )

    decoded = tokenizer.decode(
        outputs[0],
        skip_special_tokens=True,
    ).strip()

    if not decoded:
        raise RuntimeError("FLAN-T5 generated an empty response.")

    logger.info(
        f"[STORE EMAIL MARKETING] Inference completed successfully. Output length={len(decoded)}"
    )
    return decoded


# ==============================================================================
# Output Parsing & Formatting Helpers
# ==============================================================================

def _clean_hallucinated_dates(text: str, user_prompt: str) -> str:
    """Strip artifact dates (e.g. August 13, 2026) if not provided in user prompt."""
    if not text:
        return ""
    has_date_in_prompt = bool(re.search(r"\b(202\d|January|February|March|April|May|June|July|August|September|October|November|December)\b", user_prompt, re.I))
    if not has_date_in_prompt:
        text = re.sub(r"\b(for\s+August,?\s*2026|on\s+August\s+13,?\s*2026|August\s+13,?\s*2026)\b", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def _parse_subject_from_output(raw_text: str, fallback_subject: str) -> str:
    """Extract a clean, concise subject line from model output."""
    text = raw_text.strip()
    
    # Strip JSON wrapper if present
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(text[start : end + 1])
            if isinstance(data, dict) and data.get("subject"):
                return str(data["subject"]).strip()
        except Exception:
            pass

    # Match 'Subject: ...'
    m = re.match(r"^Subject:\s*(.*?)(?=(?:\r?\n|Dear\b|Hi\b|Hello\b|Body:|$))", text, re.IGNORECASE)
    if m:
        extracted = m.group(1).strip().strip("\"'").rstrip(" ,-:")
        if extracted and len(extracted.split()) <= 15:
            return extracted

    # Fallback to first line cleaned
    first_line = text.split("\n")[0].strip()
    first_line = re.sub(r"^(subject\s*:\s*|[" + re.escape("\"'") + "]+|[" + re.escape("\"'") + "]+$)", "", first_line, flags=re.IGNORECASE).strip()
    if first_line and len(first_line.split()) <= 15:
        return first_line

    return fallback_subject


def _parse_full_email_from_output(
    raw_text: str,
    default_subject: str,
    recipient: str,
    user_prompt: str,
) -> tuple[str, str]:
    """Parse raw model output into clean (subject, body)."""
    text = _clean_hallucinated_dates(raw_text, user_prompt)
    
    # 1. JSON check
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            payload = json.loads(text[start : end + 1])
            if isinstance(payload, dict):
                subj = str(payload.get("subject") or default_subject).strip()
                b = str(payload.get("body") or payload.get("email") or payload.get("content") or "").strip()
                if b:
                    return subj, b
        except Exception:
            pass

    # 2. Subject Extraction
    subject = default_subject
    remainder = text

    if text.startswith("Subject:"):
        m = re.match(
            r"^Subject:\s*(.*?)(?=(?:\r?\n|Dear\b|Hi\b|Hello\b|Hey\b|Good\s+(?:morning|afternoon|evening)|Body:|$))",
            text,
            re.IGNORECASE,
        )
        if m:
            extracted_s = m.group(1).strip().rstrip(" ,-:")
            if extracted_s and len(extracted_s.split()) <= 14:
                subject = extracted_s
                remainder = text[m.end() :].strip()
            else:
                remainder = text[len("Subject:") :].strip()
        else:
            remainder = text[len("Subject:") :].strip()

    remainder = re.sub(r"^Body:\s*", "", remainder, flags=re.IGNORECASE).strip()
    remainder = re.sub(r"^[,\s:-]+", "", remainder).strip()

    # 3. Greeting Extraction
    greeting_match = re.match(
        r"^(Dear\s+[^,\n]+,|Hi\s+[^,\n]+,|Hello\s+[^,\n]+,|Hey\s+[^,\n]+,|Good\s+(?:morning|afternoon|evening)[^,\n]*,?)",
        remainder,
        re.IGNORECASE,
    )
    if greeting_match:
        greeting = greeting_match.group(1).strip()
        recip_name = recipient.split(",")[0].strip() if recipient else ""
        if recip_name and (recip_name.lower() not in greeting.lower() or greeting.lower() in ["dear team,", "dear colleague,"]):
            greeting = f"Dear {recip_name},"
        body_content = remainder[greeting_match.end() :].strip()
    else:
        recip_name = recipient.split(",")[0].strip() if recipient else "Team"
        greeting = f"Dear {recip_name},"
        body_content = remainder.strip()

    # 4. Closing Extraction
    closing_match = re.search(
        r"([,\s\n]+)(Best regards|Warm regards|Kind regards|Regards|Sincerely|Thanks and regards|Yours sincerely|With regards)[,\s]*(.*)$",
        body_content,
        re.IGNORECASE,
    )
    if closing_match:
        closing = closing_match.group(2).capitalize() + ","
        model_sign = closing_match.group(3).strip()
        main_body = body_content[: closing_match.start()].strip()
    else:
        closing = "Regards,"
        model_sign = "The Saadhyam Team"
        main_body = body_content.strip()

    # 5. Clean up body paragraphs
    main_body = re.sub(r"^[,\s:-]+", "", main_body).strip()
    if default_subject:
        main_body = re.sub(rf"^{re.escape(default_subject)}\s*[:-]\s*", "", main_body, flags=re.IGNORECASE).strip()

    # Split into clean paragraphs
    main_body = re.sub(r"([.!?])\s*([A-Z])", r"\1\n\n\2", main_body)
    raw_paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", main_body) if p.strip()]
    cleaned_paragraphs = []
    for p in raw_paragraphs:
        cleaned_p = re.sub(r"\s*-\s*$", "", p).strip()
        cleaned_p = re.sub(r"^[,\s:-]+", "", cleaned_p).strip()
        if cleaned_p:
            cleaned_paragraphs.append(cleaned_p)

    formatted_body_content = "\n\n".join(cleaned_paragraphs) if cleaned_paragraphs else main_body
    final_sig = model_sign or "The Saadhyam Team"

    full_email = f"{greeting}\n\n{formatted_body_content}\n\n{closing}\n{final_sig}"
    return subject, full_email


# ==============================================================================
# Endpoint Handler
# ==============================================================================

@router.post("/generate-ai", response_model=StoreEmailMarketingAIGenerateResponse)
async def generate_store_email_marketing_ai(
    request: StoreEmailMarketingAIGenerateRequest,
):
    """
    Generate AI-assisted subject line, body, or full email for the Store Email Marketing flow.
    Uses local FLAN-T5 Seq2Seq model exclusively (likhitha7274/saadhyam_email_flan_t5_base).
    """
    try:
        mode = (request.mode or "full").lower().strip()
        prompt_text = request.prompt.strip()
        recipient = (request.recipient or "Recipient").strip()
        tone = (request.tone or "Professional").strip()
        length = (request.length or "Medium").strip()
        existing_subject = (request.existing_subject or "").strip()

        if not prompt_text:
            raise HTTPException(status_code=400, detail="Prompt context is required.")

        # Default fallback subject derived from prompt
        words = prompt_text.split()
        brief_topic = " ".join(words[:6]).title()
        default_subject = existing_subject or f"Update: {brief_topic}"

        # Construct prompt matching training dataset structure
        prompt_parts = [
            f"Audience: {recipient}",
            f"Context: {prompt_text}",
            f"Tone: {tone}",
            f"Length: {length}",
        ]
        if existing_subject:
            prompt_parts.append(f"Subject: {existing_subject}")

        if mode == "subject":
            prompt_parts.append(f"Request: Generate a concise {tone.lower()} subject line regarding {prompt_text}")
        elif mode == "body":
            prompt_parts.append(f"Request: Compose a {tone.lower()} email body regarding {prompt_text}")
        else:  # "full"
            prompt_parts.append(f"Request: Compose a {tone.lower()} email regarding {prompt_text}")

        full_prompt = " | ".join(prompt_parts)

        # Run local FLAN-T5 inference
        raw_output = await asyncio.to_thread(_run_store_marketing_hf_inference_sync, full_prompt)

        # Mode-specific parsing
        if mode == "subject":
            generated_subject = _parse_subject_from_output(raw_output, default_subject)
            return StoreEmailMarketingAIGenerateResponse(
                success=True,
                subject=generated_subject,
                body="",
                message="Subject line generated successfully",
            )

        elif mode == "body":
            _, full_email = _parse_full_email_from_output(
                raw_output, default_subject, recipient, prompt_text
            )
            return StoreEmailMarketingAIGenerateResponse(
                success=True,
                subject=existing_subject or "",
                body=full_email,
                message="Email body generated successfully",
            )

        else:  # mode == "full"
            generated_subject, full_email = _parse_full_email_from_output(
                raw_output, default_subject, recipient, prompt_text
            )
            return StoreEmailMarketingAIGenerateResponse(
                success=True,
                subject=generated_subject,
                body=full_email,
                message="Email content generated successfully",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STORE EMAIL MARKETING] Generation error: {e}", exc_info=True)
        return StoreEmailMarketingAIGenerateResponse(
            success=False,
            subject="",
            body="",
            message=f"Failed to generate email content: {str(e)}",
            error=str(e),
        )