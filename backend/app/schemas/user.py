from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    full_name: str
    reg_number: str
    phone: str | None = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: UUID
    institution_id: UUID
    verification_level: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
