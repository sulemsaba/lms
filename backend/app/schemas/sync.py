from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SyncActionEnvelope(BaseModel):
    id: UUID
    entity_type: str
    action: str
    payload: dict
    idempotency_key: str
    client_created_at: datetime


class SyncBatchRequest(BaseModel):
    device_id: UUID
    device_trust_token: str
    actions: list[SyncActionEnvelope] = Field(default_factory=list)


class SyncBatchResult(BaseModel):
    id: UUID
    success: bool
    receipt_code: str | None = None
    server_entity_id: UUID | None = None
    conflict: dict | None = None
    error: str | None = None
