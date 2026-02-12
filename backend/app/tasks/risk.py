from __future__ import annotations

import asyncio
from uuid import UUID

from sqlalchemy import select

from app.database.session import AsyncSessionFactory
from app.models.iam import Institution
from app.services.risk import RiskService
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.risk.compute_all_risk_scores")
def compute_all_risk_scores() -> dict:
    async def _run() -> dict:
        async with AsyncSessionFactory() as db:
            institutions = (await db.execute(select(Institution.id))).scalars().all()
            total = 0
            service = RiskService(db)
            for institution_id in institutions:
                scores = await service.compute_all_users(UUID(str(institution_id)))
                total += len(scores)
            return {"scores_computed": total}

    return asyncio.run(_run())
