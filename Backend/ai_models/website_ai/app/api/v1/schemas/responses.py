"""
API response schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class GenerateWebsiteResponse(BaseModel):
    """Response for website generation request"""

    job_id: str = Field(..., description="Job ID for tracking")
    status: str = Field(..., description="Initial job status")
    message: str = Field(..., description="Status message")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "abc-123-def-456",
                "status": "pending",
                "message": "Website generation started. Use job_id to check status."
            }
        }


class JobStatusResponse(BaseModel):
    """Response for job status check"""

    job_id: str = Field(..., description="Job ID")
    status: str = Field(..., description="Current status: pending, processing, completed, failed")
    progress: int = Field(..., description="Progress percentage (0-100)")
    created_at: datetime = Field(..., description="Job creation time")
    started_at: Optional[datetime] = Field(None, description="Job start time")
    completed_at: Optional[datetime] = Field(None, description="Job completion time")
    error_message: Optional[str] = Field(None, description="Error message if failed")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "abc-123-def-456",
                "status": "processing",
                "progress": 60,
                "created_at": "2024-01-15T10:00:00Z",
                "started_at": "2024-01-15T10:00:05Z",
                "completed_at": None,
                "error_message": None
            }
        }


class JobResultResponse(BaseModel):
    """Response for job result"""

    job_id: str = Field(..., description="Job ID")
    website_id: str = Field(..., description="Generated website ID")
    html_url: str = Field(..., description="URL to HTML file")
    preview_url: str = Field(..., description="Preview URL")
    theme: str = Field(..., description="Theme used")
    completed_at: datetime = Field(..., description="Completion time")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "abc-123-def-456",
                "website_id": "xyz-789-ghi-012",
                "html_url": "https://cdn.example.com/websites/acme-corp_hero-split.html",
                "preview_url": "https://preview.example.com/xyz-789-ghi-012",
                "theme": "hero-split",
                "completed_at": "2024-01-15T10:05:00Z"
            }
        }


class ContentUpdateResponse(BaseModel):
    """Response for content update"""

    success: bool = Field(..., description="Update success status")
    website_id: str = Field(..., description="Website ID")
    version: int = Field(..., description="Content version")
    updated_at: datetime = Field(..., description="Update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "website_id": "xyz-789-ghi-012",
                "version": 2,
                "updated_at": "2024-01-15T11:00:00Z"
            }
        }
