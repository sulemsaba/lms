from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.receipts import Receipt


class ReceiptService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_receipt(
        self,
        *,
        institution_id: UUID,
        user_id: UUID,
        entity_id: UUID,
        entity_type: str,
        action: str,
        payload: dict,
    ) -> Receipt:
        last_stmt = (
            select(Receipt)
            .where(Receipt.institution_id == institution_id, Receipt.user_id == user_id)
            .order_by(Receipt.timestamp.desc())
            .limit(1)
        )
        previous = (await self.db.execute(last_stmt)).scalar_one_or_none()
        previous_hash = previous.receipt_hash if previous else None

        canonical_payload = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        now = datetime.now(timezone.utc)
        code_seed = f"{institution_id}-{user_id}-{entity_type}-{action}-{now.timestamp()}"
        receipt_code = f"UDSM-{hashlib.sha256(code_seed.encode()).hexdigest()[:12].upper()}"
        chain_data = f"{canonical_payload}:{previous_hash or 'GENESIS'}"
        receipt_hash = hashlib.sha256(chain_data.encode()).hexdigest()

        chain_position_stmt = select(func.count(Receipt.id)).where(
            Receipt.institution_id == institution_id,
            Receipt.user_id == user_id,
        )
        chain_position = int((await self.db.execute(chain_position_stmt)).scalar_one()) + 1

        receipt = Receipt(
            institution_id=institution_id,
            created_by=user_id,
            user_id=user_id,
            receipt_code=receipt_code,
            entity_id=entity_id,
            entity_type=entity_type,
            action=action,
            timestamp=now,
            previous_receipt_hash=previous_hash,
            receipt_hash=receipt_hash,
            payload=payload,
            chain_position=chain_position,
        )
        self.db.add(receipt)
        await self.db.flush()
        return receipt

    @staticmethod
    def verify_receipt(receipt: Receipt) -> bool:
        canonical_payload = json.dumps(receipt.payload, sort_keys=True, separators=(",", ":"))
        chain_data = f"{canonical_payload}:{receipt.previous_receipt_hash or 'GENESIS'}"
        expected = hashlib.sha256(chain_data.encode()).hexdigest()
        return expected == receipt.receipt_hash
