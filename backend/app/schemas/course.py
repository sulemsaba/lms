from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CourseCreate(BaseModel):
    code: str
    title: str
    description: str | None = None


class CourseRead(BaseModel):
    id: UUID
    institution_id: UUID
    code: str
    title: str
    description: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
