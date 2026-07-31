"""
Gmail Plugin Schemas
Defines request validation models using Pydantic
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class SendEmailRequest(BaseModel):
    to: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., description="Subject of the email")
    body: str = Field(..., description="Plain text or HTML body content of the email")
    cc: Optional[List[EmailStr]] = Field(None, description="List of CC recipient email addresses")
    bcc: Optional[List[EmailStr]] = Field(None, description="List of BCC recipient email addresses")

class ListEmailsRequest(BaseModel):
    max_results: Optional[int] = Field(10, ge=1, le=100, description="Maximum number of emails to retrieve")
    label_ids: Optional[List[str]] = Field(default_factory=lambda: ["INBOX"], description="Only list emails matching these label IDs")

class GetEmailRequest(BaseModel):
    email_id: str = Field(..., description="Unique message ID of the email to fetch")

class SearchEmailRequest(BaseModel):
    query: str = Field(..., description="Gmail search query string (e.g., 'from:someone@example.com is:unread')")
    max_results: Optional[int] = Field(10, ge=1, le=100, description="Maximum search results to retrieve")
