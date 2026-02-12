from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ReceiptRead(BaseModel):
    id: UUID
    receipt_code: str
    entity_id: UUID
    entity_type: str
    action: str
    user_id: UUID
    timestamp: datetime
    previous_receipt_hash: str | None
    receipt_hash: str
    payload: dict

    model_config = {"from_attributes": True}


class ReceiptVerifyResponse(BaseModel):
    valid: bool
    receipt_code: str
    receipt_hash: str
    previous_receipt_hash: str | None
