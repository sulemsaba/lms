from __future__ import annotations

import asyncio
from uuid import UUID

from app.database.session import AsyncSessionFactory
from app.services.pack import PackService
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.pack.generate_offline_pack")
def generate_offline_pack(course_id: str, institution_id: str, actor_id: str) -> dict:
    async def _run() -> dict:
        async with AsyncSessionFactory() as db:
            pack = await PackService(db).generate_course_pack(UUID(institution_id), UUID(actor_id), UUID(course_id))
            return {"pack_id": str(pack.id), "manifest_hash": pack.manifest_hash}

    return asyncio.run(_run())
