from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant
from app.models.iam import User
from app.models.timetable import TimetableEvent

router = APIRouter()


@router.get("/")
async def list_events(
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(get_current_user),
) -> list[TimetableEvent]:
    stmt = select(TimetableEvent).where(TimetableEvent.deleted_at.is_(None)).order_by(TimetableEvent.starts_at.asc())
    return (await db.execute(stmt)).scalars().all()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_event(
    title: str,
    starts_at: datetime,
    ends_at: datetime,
    course_id: str | None = None,
    venue_id: str | None = None,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> TimetableEvent:
    event = TimetableEvent(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        title=title,
        starts_at=starts_at,
        ends_at=ends_at,
        event_type="lecture",
        course_id=course_id,
        venue_id=venue_id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event
