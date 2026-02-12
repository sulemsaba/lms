from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db as get_db_session
from app.models.academics import Course
from app.models.iam import Institution
from app.models.receipts import Receipt
from app.models.student_success import Quote
from app.models.timetable import Venue
from app.services.receipt import ReceiptService
from app.services.quote import QuoteService

router = APIRouter()


async def _default_institution_id(db: AsyncSession) -> UUID | None:
    stmt = select(Institution.id).order_by(Institution.created_at.asc()).limit(1)
    return (await db.execute(stmt)).scalar_one_or_none()


@router.get("/courses")
async def public_courses(db: AsyncSession = Depends(get_db_session)):
    institution_id = await _default_institution_id(db)
    stmt = select(Course).where(Course.institution_id == institution_id, Course.status == "active", Course.deleted_at.is_(None))
    return (await db.execute(stmt)).scalars().all()


@router.get("/venues")
async def public_venues(db: AsyncSession = Depends(get_db_session)):
    institution_id = await _default_institution_id(db)
    stmt = select(Venue).where(Venue.institution_id == institution_id, Venue.deleted_at.is_(None))
    return (await db.execute(stmt)).scalars().all()


@router.get("/quote/today")
async def quote_today(db: AsyncSession = Depends(get_db_session)):
    institution_id = await _default_institution_id(db)
    if institution_id is None:
        return {"quote": None}

    quote = await QuoteService(db).quote_of_the_day(institution_id)
    if quote is None:
        quote = Quote(
            institution_id=institution_id,
            text="Discipline is the bridge between goals and accomplishment.",
            author="Ubuntu Wisdom",
            language="en",
            active=True,
        )
        db.add(quote)
        await db.commit()
        await db.refresh(quote)
    return {"id": str(quote.id), "text": quote.text, "author": quote.author, "language": quote.language}


@router.get("/demo/receipt")
async def demo_receipt(db: AsyncSession = Depends(get_db_session)):
    institution_id = await _default_institution_id(db)
    if institution_id is None:
        return {"error": "No institution configured"}

    receipt = await ReceiptService(db).generate_receipt(
        institution_id=institution_id,
        user_id=uuid4(),
        entity_id=uuid4(),
        entity_type="demo",
        action="preview",
        payload={"date": date.today().isoformat()},
    )
    await db.commit()
    return {"receipt_code": receipt.receipt_code, "receipt_hash": receipt.receipt_hash}
