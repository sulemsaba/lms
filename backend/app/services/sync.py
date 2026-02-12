from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academics import AssessmentAttempt
from app.models.offline import OfflineOutbox, SyncConflict
from app.schemas.sync import SyncActionEnvelope, SyncBatchResult
from app.services.receipt import ReceiptService
from app.utils.idempotency import check_idempotency, store_idempotency


class SyncService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.receipt_service = ReceiptService(db)

    async def process_batch(
        self,
        *,
        institution_id: UUID,
        user_id: UUID,
        actions: list[SyncActionEnvelope],
    ) -> list[SyncBatchResult]:
        results: list[SyncBatchResult] = []

        for action in actions:
            cached = await check_idempotency(action.idempotency_key)
            if cached is not None:
                results.append(SyncBatchResult(**cached))
                continue

            result = await self._process_action(
                institution_id=institution_id,
                user_id=user_id,
                action=action,
            )
            results.append(result)
            await store_idempotency(action.idempotency_key, result.model_dump())

        await self.db.commit()
        return results

    async def _process_action(self, *, institution_id: UUID, user_id: UUID, action: SyncActionEnvelope) -> SyncBatchResult:
        if action.entity_type == "assessment_attempt" and action.action == "submit":
            return await self._handle_assessment_submit(institution_id, user_id, action)

        outbox = OfflineOutbox(
            institution_id=institution_id,
            created_by=user_id,
            aggregate_id=uuid4(),
            event_type=f"{action.entity_type}.{action.action}",
            payload=action.payload,
            idempotency_key=action.idempotency_key,
            status="processed",
            processed_at=datetime.now(timezone.utc),
        )
        self.db.add(outbox)
        await self.db.flush()

        receipt = await self.receipt_service.generate_receipt(
            institution_id=institution_id,
            user_id=user_id,
            entity_id=outbox.id,
            entity_type=action.entity_type,
            action=action.action,
            payload=action.payload,
        )
        return SyncBatchResult(
            id=action.id,
            success=True,
            receipt_code=receipt.receipt_code,
            server_entity_id=outbox.id,
        )

    async def _handle_assessment_submit(
        self,
        institution_id: UUID,
        user_id: UUID,
        action: SyncActionEnvelope,
    ) -> SyncBatchResult:
        attempt_id_raw = action.payload.get("attempt_id")
        if not isinstance(attempt_id_raw, str):
            return SyncBatchResult(id=action.id, success=False, error="attempt_id missing")

        attempt_id = UUID(attempt_id_raw)
        attempt_stmt = select(AssessmentAttempt).where(
            AssessmentAttempt.id == attempt_id,
            AssessmentAttempt.institution_id == institution_id,
        )
        attempt = (await self.db.execute(attempt_stmt)).scalar_one_or_none()

        if attempt is None:
            conflict = SyncConflict(
                institution_id=institution_id,
                created_by=user_id,
                outbox_id=uuid4(),
                user_id=user_id,
                entity_type="assessment_attempt",
                local_payload=action.payload,
                server_payload={"error": "attempt_not_found"},
            )
            self.db.add(conflict)
            await self.db.flush()
            return SyncBatchResult(
                id=action.id,
                success=False,
                conflict={"type": "not_found", "conflict_id": str(conflict.id)},
                error="attempt not found",
            )

        if attempt.server_received_at and attempt.server_received_at > action.client_created_at:
            conflict = SyncConflict(
                institution_id=institution_id,
                created_by=user_id,
                outbox_id=uuid4(),
                user_id=user_id,
                entity_type="assessment_attempt",
                local_payload=action.payload,
                server_payload={"attempt_id": str(attempt.id), "server_received_at": attempt.server_received_at.isoformat()},
            )
            self.db.add(conflict)
            await self.db.flush()
            return SyncBatchResult(
                id=action.id,
                success=False,
                conflict={
                    "type": "optimistic_lock",
                    "conflict_id": str(conflict.id),
                    "resolution": "server_wins",
                },
                error="conflict detected",
            )

        attempt.status = "submitted"
        attempt.submitted_at = datetime.now(timezone.utc)
        attempt.server_received_at = datetime.now(timezone.utc)

        receipt = await self.receipt_service.generate_receipt(
            institution_id=institution_id,
            user_id=user_id,
            entity_id=attempt.id,
            entity_type="assessment_attempt",
            action="submit",
            payload=action.payload,
        )
        return SyncBatchResult(id=action.id, success=True, receipt_code=receipt.receipt_code, server_entity_id=attempt.id)

    async def resolve_conflict(self, conflict_id: UUID, resolver_id: UUID, strategy: str) -> SyncConflict | None:
        stmt = select(SyncConflict).where(SyncConflict.id == conflict_id)
        conflict = (await self.db.execute(stmt)).scalar_one_or_none()
        if conflict is None:
            return None

        conflict.resolution_status = strategy
        conflict.resolved_by = resolver_id
        conflict.resolved_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(conflict)
        return conflict
