from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models import TenantBase


class Resource(TenantBase):
    __tablename__ = "resources"

    course_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=True, index=True)
    module_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("modules.id"), nullable=True, index=True)
    topic_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("topics.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False, default="document")
    visibility: Mapped[str] = mapped_column(String(32), nullable=False, default="enrolled")


class ResourceVersion(TenantBase):
    __tablename__ = "resource_versions"

    resource_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("resources.id"), nullable=False, index=True)
    version_label: Mapped[str] = mapped_column(String(64), nullable=False)
    checksum: Mapped[str] = mapped_column(String(128), nullable=False)
    is_current: Mapped[bool] = mapped_column(nullable=False, default=True)
    manifest: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class ResourceBlob(TenantBase):
    __tablename__ = "resource_blobs"

    version_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("resource_versions.id"), nullable=False, index=True)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(128), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    variant: Mapped[str | None] = mapped_column(String(64), nullable=True)


class CoursePack(TenantBase):
    __tablename__ = "course_packs"

    course_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(32), nullable=False, default="v1")
    manifest_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    signed_manifest: Mapped[str] = mapped_column(Text, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UserPin(TenantBase):
    __tablename__ = "user_pins"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    pin_type: Mapped[str] = mapped_column(String(32), nullable=False, default="favorite")
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    label: Mapped[str | None] = mapped_column(String(255), nullable=True)
