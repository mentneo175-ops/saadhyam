"""Internal notification endpoints used by trusted services."""

import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.notification import UserNotification
from models.user import User
from services.realtime_service import realtime_service

router = APIRouter(prefix="/api/admin", tags=["internal-notifications"])
INTERNAL_NOTIFICATION_TOKEN = os.getenv("ADMIN_INTERNAL_NOTIFICATION_TOKEN", "dev-admin-notification-token")


class InternalNotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    email: Optional[EmailStr] = None
    target_user_id: Optional[int] = None
    target_type: str = "user"
    source: str = "admin"
    created_by: Optional[int] = None
    support_request_id: Optional[int] = None


@router.post("/broadcast-notification")
async def broadcast_notification(
    payload: InternalNotificationCreate,
    x_internal_token: Optional[str] = Header(default=None, alias="X-Internal-Token"),
    db: AsyncSession = Depends(get_db),
):
    if x_internal_token != INTERNAL_NOTIFICATION_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal token")

    user_id = payload.target_user_id
    if user_id is None:
        if not payload.email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email or target_user_id is required")

        user_result = await db.execute(select(User).where(User.email == payload.email))
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user_id = user.id

    notification = UserNotification(
        user_id=user_id,
        title=payload.title.strip(),
        message=payload.message.strip(),
        type=payload.type.strip() or "info",
        target_type=(payload.target_type or "user").strip() or "user",
        source=(payload.source or "admin").strip() or "admin",
        created_by=payload.created_by,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        extra_data={
            "support_request_id": payload.support_request_id,
            "source": payload.source,
            "target_type": payload.target_type,
        },
    )

    db.add(notification)
    await db.flush()
    await db.commit()
    await db.refresh(notification)

    try:
        await realtime_service.notify_user(
            user_id,
            {
                "id": notification.id,
                "user_id": notification.user_id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.type,
                "target_type": notification.target_type,
                "source": notification.source,
                "created_by": notification.created_by,
                "is_read": notification.is_read,
                "read_at": notification.read_at.isoformat() if notification.read_at else None,
                "extra_data": notification.extra_data,
                "created_at": notification.created_at.isoformat() if notification.created_at else datetime.utcnow().isoformat(),
            },
        )
    except Exception:
        pass

    return {"success": True, "notification_id": notification.id}