from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class GoogleBusinessOAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None


class GoogleBusinessAccountResponse(BaseModel):
    id: int
    account_id: str
    account_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoogleBusinessLocationResponse(BaseModel):
    id: int
    location_id: str
    location_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    primary_category: Optional[str] = None
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoogleBusinessReviewResponse(BaseModel):
    id: int
    reviewer_name: str
    reviewer_photo: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    reply_comment: Optional[str] = None
    reply_submitted_at: Optional[datetime] = None
    review_created_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoogleBusinessReviewReplyRequest(BaseModel):
    reply_comment: str


class GoogleBusinessPostCreateRequest(BaseModel):
    location_id: int  # Database ID
    summary: str
    media_url: Optional[str] = None
    action_type: Optional[str] = "LEARN_MORE"
    action_url: Optional[str] = None


class GoogleBusinessPostResponse(BaseModel):
    id: int
    summary: str
    media_url: Optional[str] = None
    action_type: str
    action_url: Optional[str] = None
    status: str
    post_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoogleBusinessAccountListResponse(BaseModel):
    accounts: List[GoogleBusinessAccountResponse]
    total: int


class GoogleBusinessLocationListResponse(BaseModel):
    locations: List[GoogleBusinessLocationResponse]
    total: int


class GoogleBusinessReviewListResponse(BaseModel):
    reviews: List[GoogleBusinessReviewResponse]
    total: int


class GoogleBusinessPostListResponse(BaseModel):
    posts: List[GoogleBusinessPostResponse]
    total: int
