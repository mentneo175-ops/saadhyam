from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class BusinessDetailsInput(BaseModel):
    """Input for detailed business information"""
    business_name: str = Field(..., min_length=1, max_length=120)
    business_type: str = Field(..., min_length=1, max_length=80)
    description: str = Field(..., min_length=10, max_length=500)
    services: list[str] = Field(..., min_length=1, max_length=10)
    target_audience: str = Field(..., min_length=1, max_length=200)
    tone: str = Field(..., min_length=1, max_length=80)
    branding_style: str = Field(..., min_length=1, max_length=120)
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website_url: Optional[str] = None

    @field_validator("business_name", "business_type", "description", "target_audience", "tone", "branding_style")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty.")
        return cleaned

    @field_validator("services")
    @classmethod
    def normalize_services(cls, value: list[str]) -> list[str]:
        cleaned = [service.strip() for service in value if service and service.strip()]
        if len(cleaned) < 1:
            raise ValueError("At least one service is required.")
        return cleaned[:10]


class WebsiteRequest(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=120)
    business_type: str = Field(..., min_length=1, max_length=80)
    theme: Optional[str] = None

    @field_validator("business_name", "business_type")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty.")
        return cleaned

    @field_validator("theme")
    @classmethod
    def strip_theme(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class WebsiteProfile(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=120)
    business_type: str = Field(..., min_length=1, max_length=80)
    services: list[str] = Field(..., min_length=3, max_length=8)
    target_audience: str = Field(..., min_length=1, max_length=180)
    tone: str = Field(..., min_length=1, max_length=80)
    branding_style: str = Field(..., min_length=1, max_length=120)

    @field_validator("business_name", "business_type", "target_audience", "tone", "branding_style")
    @classmethod
    def strip_profile_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty.")
        return cleaned

    @field_validator("services")
    @classmethod
    def normalize_services(cls, value: list[str]) -> list[str]:
        cleaned = [service.strip() for service in value if service and service.strip()]
        if len(cleaned) < 3:
            raise ValueError("At least three services are required.")
        return cleaned[:8]


class GeneratedService(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)


class GeneratedFAQ(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)


class WebsiteContent(BaseModel):
    about: str = Field(..., min_length=1)
    services: list[GeneratedService] = Field(..., min_length=1)
    faq: list[GeneratedFAQ] = Field(..., min_length=1)
    contact: str = Field(..., min_length=1)
    audience: str = Field(..., min_length=1)
    tone: str = Field(..., min_length=1)
    branding_style: str = Field(..., min_length=1)


class WebsiteResponse(BaseModel):
    theme: str
    url: str


class StoredWebsite(BaseModel):
    """Stored website record"""
    id: str
    business_name: str
    business_type: str
    description: str
    services: list[str]
    target_audience: str
    tone: str
    branding_style: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website_url: Optional[str] = None
    theme: str
    html_file: str
    created_at: str
    updated_at: str


class WebsiteListItem(BaseModel):
    """Item for website list"""
    id: str
    business_name: str
    business_type: str
    theme: str
    created_at: str
    html_file: str
