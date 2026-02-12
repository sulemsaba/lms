from __future__ import annotations

import asyncio
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import AsyncSessionFactory
from app.services.grading import GradingService
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.grading.grade_assessment")
def grade_assessment(attempt_id: str) -> dict:
    async def _run() -> dict:
        async with AsyncSessionFactory() as db:  # type: AsyncSession
            result = await GradingService(db).grade_attempt(UUID(attempt_id))
            return {"result_id": str(result.id), "score": result.total_score, "percentage": result.percentage}

    return asyncio.run(_run())
