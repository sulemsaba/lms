from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy import delete, func, select

from app.database.session import AsyncSessionFactory
from app.models.analytics import AnalyticsRollup
from app.models.student_success import EngagementEvent
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.analytics.process_engagement_batch")
def process_engagement_batch() -> dict:
    async def _run() -> dict:
        async with AsyncSessionFactory() as db:
            day = datetime.now(timezone.utc).date()
            stmt = (
                select(
                    EngagementEvent.institution_id,
                    EngagementEvent.event_type,
                    func.count(EngagementEvent.id),
                )
                .group_by(EngagementEvent.institution_id, EngagementEvent.event_type)
            )
            rows = (await db.execute(stmt)).all()

            inserted = 0
            for institution_id, event_type, count in rows:
                rollup = AnalyticsRollup(
                    institution_id=institution_id,
                    day=day,
                    metric_name=f"events.{event_type}",
                    metric_value=float(count),
                    rollup_metadata={"source": "celery"},
                )
                db.add(rollup)
                inserted += 1

            await db.execute(delete(EngagementEvent).where(EngagementEvent.occurred_at < datetime.now(timezone.utc)))
            await db.commit()
            return {"rollups": inserted}

    return asyncio.run(_run())
