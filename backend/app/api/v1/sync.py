from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant
from app.models.iam import User
from app.models.offline import SyncConflict
from app.schemas.sync import SyncBatchRequest, SyncBatchResult
from app.services.auth import AuthService
from app.services.sync import SyncService

router = APIRouter()


@router.post("/batch", response_model=list[SyncBatchResult])
async def batch_sync(
    payload: SyncBatchRequest,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    if not await AuthService(db).verify_device_trust(payload.device_id, payload.device_trust_token):
        raise HTTPException(status_code=401, detail="Invalid device trust token")

    return await SyncService(db).process_batch(
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        actions=payload.actions,
    )


@router.get("/conflicts")
async def list_conflicts(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = select(SyncConflict).where(
        SyncConflict.user_id == current_user.id,
        SyncConflict.resolution_status == "unresolved",
    )
    return (await db.execute(stmt)).scalars().all()


@router.post("/conflicts/{conflict_id}/resolve")
async def resolve_conflict(
    conflict_id: UUID,
    strategy: str,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    conflict = await SyncService(db).resolve_conflict(conflict_id=conflict_id, resolver_id=current_user.id, strategy=strategy)
    if conflict is None:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return conflict
