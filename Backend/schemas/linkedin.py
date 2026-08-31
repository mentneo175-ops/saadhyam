"""
Pydantic Schemas for LinkedIn Marketing Store Solution
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LinkedInConnectionStatusResponse(BaseModel):
    connected: bool
    is_active: bool
    member_name: Optional[str] = None
    member_email: Optional[str] = None
    member_id: Optional[str] = None
    profile_picture: Optional[str] = None
    connected_at: Optional[str] = None
    expires_at: Optional[str] = None
    is_expired: bool = False


class LinkedInAuthUrlResponse(BaseModel):
    success: bool
    auth_url: str
    message: Optional[str] = None
    error: Optional[str] = None


class LinkedInPublishPostRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Post text content to publish on LinkedIn")
    topic: Optional[str] = Field(None, description="Optional topic category for history")
    hashtags: Optional[List[str]] = Field(default=[], description="Optional hashtags appended")


class LinkedInPublishPostResponse(BaseModel):
    success: bool
    message: str
    post_urn: Optional[str] = None
    post_id: Optional[int] = None
    published_at: Optional[str] = None
    error: Optional[str] = None


class LinkedInPostHistoryItem(BaseModel):
    id: int
    post_urn: Optional[str] = None
    content: str
    topic: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    published_at: Optional[str] = None
    created_at: Optional[str] = None


class LinkedInGeneratePostRequest(BaseModel):
    topic: str = Field(..., description="Main topic or subject of the post")
    goal: Optional[str] = Field("Brand Awareness", description="Post goal")
    tone: Optional[str] = Field("Professional", description="Tone of voice")
    company_name: Optional[str] = Field(None, description="Company name")
    brand_name: Optional[str] = Field(None, description="Brand name")
    industry: Optional[str] = Field(None, description="Industry sector")
    target_audience: Optional[str] = Field(None, description="Target audience")
    key_points: Optional[str] = Field(None, description="Key points or core value message to emphasize")
    call_to_action: Optional[str] = Field(None, description="Specific call to action prompt")
    desired_length: Optional[str] = Field("Medium", description="Post length: Short, Medium, Long")
    template: Optional[str] = Field("Thought Leadership", description="Template format")
    hashtag_count: Optional[int] = Field(5, description="Number of hashtags")



class LinkedInGeneratePostResponse(BaseModel):
    success: bool
    formatted_post: str
    headline: Optional[str] = None
    body: Optional[str] = None
    hashtags: List[str] = []
    message: Optional[str] = None


class LinkedInPluginConfigRequest(BaseModel):
    client_id: str = Field(..., min_length=1, description="LinkedIn OAuth Application Client ID")
    client_secret: str = Field(..., min_length=1, description="LinkedIn OAuth Application Client Secret")
    redirect_uri: Optional[str] = Field("http://localhost:8000/api/linkedin/oauth/callback", description="Authorized OAuth Redirect URI")
    is_active: Optional[bool] = Field(True, description="Enable or disable LinkedIn OAuth integration")


class LinkedInPluginConfigResponse(BaseModel):
    configured: bool
    plugin_key: str = "marketing_linkedin"
    client_id: Optional[str] = None
    redirect_uri: Optional[str] = None
    is_active: bool = True
    is_secret_set: bool = False
    updated_at: Optional[str] = None
    message: Optional[str] = None

