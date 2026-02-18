from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_with_tenant, require_permission
from app.models.content import Resource
from app.models.iam import User
from app.services.storage import create_presigned_upload_url, object_key_for_resource
from app.services.course_pack import CoursePackService

router = APIRouter()


@router.get("/resources")
async def list_resources(
    course_id: UUID | None = None,
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(require_permission("content.read")),
):
    stmt = select(Resource).where(Resource.deleted_at.is_(None))
    if course_id:
        stmt = stmt.where(Resource.course_id == course_id)
    return (await db.execute(stmt)).scalars().all()


@router.post("/resources/upload-url", status_code=status.HTTP_201_CREATED)
async def create_upload_url(
    resource_id: UUID,
    filename: str,
    _: User = Depends(require_permission("content.write")),
) -> dict:
    key = object_key_for_resource(str(resource_id), filename)
    return {"key": key, "url": create_presigned_upload_url(key)}


@router.post("/packs/generate", status_code=status.HTTP_201_CREATED)
async def generate_pack(
    course_id: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("content.write")),
) -> dict:
    pack = await CoursePackService(db).generate_course_pack(current_user.institution_id, current_user.id, course_id)
    return {
        "id": str(pack.id),
        "course_id": str(pack.course_id),
        "version": pack.version,
        "manifest_hash": pack.manifest_hash,
        "signed_manifest": pack.signed_manifest,
        "storage_key": pack.storage_key,
        "published_at": pack.published_at.isoformat() if pack.published_at else None,
    }
