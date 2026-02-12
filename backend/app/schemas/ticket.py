from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TicketCreate(BaseModel):
    title: str
    description: str
    category: str = "general"
    priority: str = "normal"


class TicketRead(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: str
    category: str
    priority: str
    status: str
    opened_at: datetime
    closed_at: datetime | None

    model_config = {"from_attributes": True}
