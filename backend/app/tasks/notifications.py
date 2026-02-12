from __future__ import annotations

import asyncio
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import AsyncSessionFactory
from app.models.communication import Notification
from app.services.notification import NotificationService
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.notifications.send_notification")
def send_notification(notification_id: str) -> dict:
    async def _run() -> dict:
        async with AsyncSessionFactory() as db:  # type: AsyncSession
            stmt = select(Notification).where(Notification.id == UUID(notification_id))
            notification = (await db.execute(stmt)).scalar_one_or_none()
            if notification is None:
                return {"status": "not_found"}
            deliveries = await NotificationService(db).deliver_notification(notification)
            return {"status": "sent", "deliveries": len(deliveries)}

    return asyncio.run(_run())


@celery_app.task(name="app.tasks.notifications.process_digest")
def process_digest() -> dict:
    async def _run() -> dict:
        async with AsyncSessionFactory() as db:
            stmt = select(Notification).where(Notification.status == "queued").limit(100)
            notifications = (await db.execute(stmt)).scalars().all()
            service = NotificationService(db)
            count = 0
            for notification in notifications:
                await service.deliver_notification(notification)
                count += 1
            return {"processed": count}

    return asyncio.run(_run())
