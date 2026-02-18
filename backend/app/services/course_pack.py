from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import CoursePack, Resource, ResourceVersion
from app.services.storage import signed_manifest


class CoursePackService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_course_pack(self, institution_id, actor_id, course_id):
        resource_stmt = select(Resource).where(Resource.course_id == course_id, Resource.institution_id == institution_id)
        resources = (await self.db.execute(resource_stmt)).scalars().all()

        entries = []
        for resource in resources:
            version_stmt = (
                select(ResourceVersion)
                .where(ResourceVersion.resource_id == resource.id, ResourceVersion.institution_id == institution_id)
                .order_by(ResourceVersion.created_at.desc())
                .limit(1)
            )
            version = (await self.db.execute(version_stmt)).scalar_one_or_none()
            if version:
                entries.append({"resource_id": str(resource.id), "version_id": str(version.id), "checksum": version.checksum})

        manifest = {
            "course_id": str(course_id),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "entries": entries,
        }
        manifest_hash = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()
        signed = signed_manifest(manifest)

        pack = CoursePack(
            institution_id=institution_id,
            created_by=actor_id,
            course_id=course_id,
            version="v1",
            manifest_hash=manifest_hash,
            signed_manifest=json.dumps(signed),
            storage_key=f"packs/{course_id}/{manifest_hash}.json",
            published_at=datetime.now(timezone.utc),
        )
        self.db.add(pack)
        await self.db.commit()
        await self.db.refresh(pack)
        return pack
