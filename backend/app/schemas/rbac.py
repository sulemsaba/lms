from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RoleBindingRead(BaseModel):
    role_code: str
    scope_type: str
    scope_id: UUID | None
    start_at: datetime | None
    end_at: datetime | None
    active: bool


class CurrentAuthzResponse(BaseModel):
    user_id: UUID
    institution_id: UUID
    roles: list[RoleBindingRead]
    permissions: list[str]


class RoleMatrixItem(BaseModel):
    role_code: str
    description: str
    scope_type: str
    permissions: list[str]
