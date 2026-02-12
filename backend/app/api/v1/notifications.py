from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant
from app.models.communication import Notification
from app.models.iam import User
from app.schemas.notification import NotificationCreate, NotificationRead
from app.services.notification import NotificationService

router = APIRouter()


@router.get("/", response_model=list[NotificationRead])
async def list_notifications(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    return (await db.execute(stmt)).scalars().all()


@router.post("/", response_model=NotificationRead)
async def create_notification(
    payload: NotificationCreate,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    notification = await service.create_notification(
        institution_id=current_user.institution_id,
        actor_id=current_user.id,
        user_id=payload.user_id,
        channel=payload.channel,
        priority=payload.priority,
        payload=payload.payload,
        template_id=payload.template_id,
        require_all=payload.require_all,
    )
    await service.deliver_notification(notification)
    return notification
