from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.notification import UserNotification
from models.user import User
from schemas.notification_schema import NotificationActionResponse, NotificationListResponse, NotificationOut
from utils.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    limit: int = 50,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UserNotification).where(UserNotification.user_id == current_user.id)
    if unread_only:
        stmt = stmt.where(UserNotification.is_read.is_(False))

    stmt = stmt.order_by(desc(UserNotification.created_at)).limit(max(1, min(limit, 200)))
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    unread_stmt = select(UserNotification).where(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read.is_(False),
    )
    unread_result = await db.execute(unread_stmt)
    unread_count = len(unread_result.scalars().all())

    serialized_notifications = []
    for item in notifications:
        created_at = item.created_at or datetime.utcnow()
        serialized_notifications.append(
            NotificationOut.model_validate(
                {
                    "id": item.id,
                    "user_id": item.user_id,
                    "title": item.title,
                    "message": item.message,
                    "type": item.type,
                    "target_type": item.target_type,
                    "source": item.source,
                    "created_by": item.created_by,
                    "is_read": item.is_read,
                    "read_at": item.read_at,
                    "extra_data": item.extra_data,
                    "created_at": created_at,
                }
            )
        )

    return NotificationListResponse(
        notifications=serialized_notifications,
        total=len(notifications),
        unread_count=unread_count,
    )


@router.post("/{notification_id}/read", response_model=NotificationActionResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UserNotification).where(
        UserNotification.id == notification_id,
        UserNotification.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    notification = result.scalars().first()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        await db.commit()

    return NotificationActionResponse(success=True, message="Notification marked as read")


@router.post("/mark-all-read", response_model=NotificationActionResponse)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UserNotification).where(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read.is_(False),
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()

    await db.commit()

    return NotificationActionResponse(success=True, message="All notifications marked as read")