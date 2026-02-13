from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_with_tenant, require_permission
from app.models.iam import User
from app.models.timetable import TimetableEvent

router = APIRouter()


def _event_to_dict(event: TimetableEvent) -> dict:
    return {
        "id": str(event.id),
        "course_id": str(event.course_id) if event.course_id else None,
        "venue_id": str(event.venue_id) if event.venue_id else None,
        "title": event.title,
        "event_type": event.event_type,
        "starts_at": event.starts_at.isoformat(),
        "ends_at": event.ends_at.isoformat(),
        "recurring_rule": event.recurring_rule,
    }


@router.get("/")
async def list_events(
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(require_permission("timetable.read")),
) -> list[dict]:
    stmt = select(TimetableEvent).where(TimetableEvent.deleted_at.is_(None)).order_by(TimetableEvent.starts_at.asc())
    events = (await db.execute(stmt)).scalars().all()
    return [_event_to_dict(event) for event in events]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_event(
    title: str,
    starts_at: datetime,
    ends_at: datetime,
    course_id: str | None = None,
    venue_id: str | None = None,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("timetable.write")),
) -> dict:
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
    return _event_to_dict(event)
