"""
API request schemas
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class GenerateWebsiteRequest(BaseModel):
    """Request to generate a website"""

    business_name: str = Field(..., min_length=1, max_length=120, description="Business name")
    business_type: str = Field(..., min_length=1, max_length=80, description="Business type/industry")
    description: Optional[str] = Field(None, max_length=500, description="Business description")
    services: Optional[List[str]] = Field(None, description="List of services offered")
    target_audience: Optional[str] = Field(None, max_length=200, description="Target audience")
    tone: Optional[str] = Field(None, max_length=80, description="Brand tone")
    branding_style: Optional[str] = Field(None, max_length=120, description="Branding style")
    contact_email: Optional[str] = Field(None, description="Contact email")
    contact_phone: Optional[str] = Field(None, description="Contact phone")
    website_url: Optional[str] = Field(None, description="Existing website URL")

    theme: str = Field(..., description="Template theme to use")
    theme_config: Optional[Dict[str, Any]] = Field(None, description="Theme configuration from main app")

    @field_validator("business_name", "business_type")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty")
        return cleaned

    class Config:
        json_schema_extra = {
            "example": {
                "business_name": "Acme Corp",
                "business_type": "SaaS",
                "description": "Cloud-based project management software",
                "services": ["Project Management", "Team Collaboration", "Time Tracking"],
                "target_audience": "Small to medium businesses",
                "tone": "Professional and friendly",
                "branding_style": "Modern and clean",
                "theme": "hero-split",
                "theme_config": {
                    "colors": {
                        "primary": "#0066CC",
                        "secondary": "#FF6B35"
                    }
                }
            }
        }


class UpdateContentRequest(BaseModel):
    """Request to update website content"""

    content: Dict[str, Any] = Field(..., description="Updated content data")
    theme: Optional[str] = Field(None, description="Theme name")

    class Config:
        json_schema_extra = {
            "example": {
                "content": {
                    "hero_title": "Welcome to Acme Corp",
                    "about_text": "We provide innovative solutions..."
                },
                "theme": "hero-split"
            }
        }
