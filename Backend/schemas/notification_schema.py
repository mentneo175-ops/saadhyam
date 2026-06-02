from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    target_type: str
    source: str
    created_by: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    extra_data: Optional[dict] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationOut]
    total: int
    unread_count: int


class NotificationActionResponse(BaseModel):
    success: bool
    message: str