from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant
from app.models.iam import User
from app.models.receipts import Receipt
from app.schemas.receipt import ReceiptRead, ReceiptVerifyResponse
from app.services.receipt import ReceiptService

router = APIRouter()


@router.get("/", response_model=list[ReceiptRead])
async def list_receipts(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Receipt).where(Receipt.user_id == current_user.id).order_by(Receipt.timestamp.desc())
    return (await db.execute(stmt)).scalars().all()


@router.get("/{code}", response_model=ReceiptRead)
async def get_receipt(
    code: str,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Receipt).where(Receipt.receipt_code == code, Receipt.institution_id == current_user.institution_id)
    receipt = (await db.execute(stmt)).scalar_one_or_none()
    if receipt is None:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt


@router.get("/{code}/verify", response_model=ReceiptVerifyResponse)
async def verify_receipt(
    code: str,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Receipt).where(Receipt.receipt_code == code, Receipt.institution_id == current_user.institution_id)
    receipt = (await db.execute(stmt)).scalar_one_or_none()
    if receipt is None:
        raise HTTPException(status_code=404, detail="Receipt not found")
    valid = ReceiptService.verify_receipt(receipt)
    return ReceiptVerifyResponse(
        valid=valid,
        receipt_code=receipt.receipt_code,
        receipt_hash=receipt.receipt_hash,
        previous_receipt_hash=receipt.previous_receipt_hash,
    )


@router.get("/chain/{user_id}", response_model=list[ReceiptRead])
async def get_chain(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(get_current_user),
):
    stmt = select(Receipt).where(Receipt.user_id == user_id).order_by(Receipt.chain_position.asc())
    return (await db.execute(stmt)).scalars().all()
