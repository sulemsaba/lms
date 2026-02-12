from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: UUID
    template_id: UUID | None = None
    channel: str = "in_app"
    priority: str = "P2"
    payload: dict = {}
    require_all: bool = False


class NotificationRead(BaseModel):
    id: UUID
    user_id: UUID
    template_id: UUID | None
    channel: str
    priority: str
    status: str
    sent_at: datetime | None

    model_config = {"from_attributes": True}
