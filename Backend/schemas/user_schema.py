from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    """Schema for user registration."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ..., min_length=6, description="User password (minimum 6 characters)"
    )
    name: Optional[str] = Field(None, description="User full name")


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    """Schema for user response."""

    id: int
    email: str
    name: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    business_location: Optional[str] = None
    business_description: Optional[str] = None
    business_setup_completed: Optional[bool] = None
    selected_plan_key: Optional[str] = None
    selected_plan_name: Optional[str] = None
    selected_plan_price: Optional[str] = None
    selected_plan_payment_id: Optional[str] = None
    selected_plan_coupon_code: Optional[str] = None
    selected_plan_amount_paid: Optional[float] = None
    selected_plan_currency: Optional[str] = None
    selected_plan_status: Optional[str] = None
    selected_plan_purchased_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    id: int = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    name: Optional[str] = Field(None, description="User full name")
    created_at: datetime = Field(..., description="Account creation timestamp")


class TokenData(BaseModel):
    """Schema for token payload."""

    user_id: int
    email: str
