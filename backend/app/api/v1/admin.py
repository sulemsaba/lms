from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_with_tenant, require_permission
from app.models.iam import User
from app.models.offline import SyncConflict
from app.models.receipts import Receipt
from app.services.sync import SyncService

router = APIRouter()


@router.get("/conflicts")
async def admin_list_conflicts(
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(require_permission("admin.conflicts")),
):
    stmt = select(SyncConflict).order_by(SyncConflict.created_at.desc())
    return (await db.execute(stmt)).scalars().all()


@router.post("/conflicts/{conflict_id}/resolve")
async def admin_resolve_conflict(
    conflict_id: UUID,
    strategy: str,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("admin.conflicts")),
):
    conflict = await SyncService(db).resolve_conflict(conflict_id=conflict_id, resolver_id=current_user.id, strategy=strategy)
    if conflict is None:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return conflict


@router.get("/receipts/chain/{user_id}")
async def admin_receipt_chain(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(require_permission("admin.receipts")),
):
    stmt = select(Receipt).where(Receipt.user_id == user_id).order_by(Receipt.chain_position.asc())
    return (await db.execute(stmt)).scalars().all()
