from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import Notification, NotificationDelivery, NotificationPreference, NotificationTemplate
from app.services.email import send_email_message
from app.services.sms import send_sms_message


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        *,
        institution_id,
        actor_id,
        user_id,
        channel: str,
        priority: str,
        payload: dict,
        template_id=None,
        require_all: bool = False,
    ) -> Notification:
        notification = Notification(
            institution_id=institution_id,
            created_by=actor_id,
            user_id=user_id,
            template_id=template_id,
            channel=channel,
            priority=priority,
            payload=payload,
            require_all=require_all,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def deliver_notification(self, notification: Notification) -> list[NotificationDelivery]:
        channels = ["in_app", "push", "email", "sms"]
        deliveries: list[NotificationDelivery] = []

        prefs_stmt = select(NotificationPreference).where(
            NotificationPreference.user_id == notification.user_id,
            NotificationPreference.institution_id == notification.institution_id,
        )
        prefs = (await self.db.execute(prefs_stmt)).scalars().all()
        enabled_channels = {pref.channel for pref in prefs if pref.enabled}

        for channel in channels:
            if enabled_channels and channel not in enabled_channels:
                continue

            success = True
            response_payload = {"message": "queued"}
            if channel == "email":
                success = await send_email_message("student@udsm.ac.tz", "UDSM Notification", str(notification.payload))
                response_payload = {"provider": "smtp", "accepted": success}
            elif channel == "sms":
                success = await send_sms_message("+255700000000", str(notification.payload))
                response_payload = {"provider": "africas_talking", "accepted": success}

            delivery = NotificationDelivery(
                institution_id=notification.institution_id,
                created_by=notification.created_by,
                notification_id=notification.id,
                channel=channel,
                status="sent" if success else "failed",
                provider_response=response_payload,
                attempts=1,
                delivered_at=datetime.now(timezone.utc) if success else None,
            )
            self.db.add(delivery)
            deliveries.append(delivery)

            if success and not notification.require_all and notification.priority != "P0":
                break

        notification.status = "sent"
        notification.sent_at = datetime.now(timezone.utc)
        await self.db.commit()
        return deliveries

    async def render_template(self, template_name: str, channel: str, language: str, context: dict) -> tuple[str | None, str]:
        stmt = select(NotificationTemplate).where(
            NotificationTemplate.name == template_name,
            NotificationTemplate.channel == channel,
            NotificationTemplate.language == language,
            NotificationTemplate.active.is_(True),
        )
        template = (await self.db.execute(stmt)).scalar_one_or_none()
        if template is None:
            return None, str(context)

        body = template.body
        for key, value in context.items():
            body = body.replace(f"{{{{{key}}}}}", str(value))
        return template.subject, body
