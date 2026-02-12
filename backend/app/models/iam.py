from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, String, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import TenantBase


class VerificationLevel(str, enum.Enum):
    L0 = "L0"
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"


class UserStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"


class ScopeType(str, enum.Enum):
    INSTITUTION = "institution"
    COLLEGE = "college"
    DEPARTMENT = "department"
    COURSE = "course"


class Institution(TenantBase):
    __tablename__ = "institutions"

    institution_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("institutions.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    domain: Mapped[str | None] = mapped_column(String(100), nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class User(TenantBase):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("institution_id", "email", name="uq_user_email_per_inst"),
        UniqueConstraint("institution_id", "reg_number", name="uq_user_reg_per_inst"),
    )

    email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    reg_number: Mapped[str] = mapped_column(String(64), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    offline_pin_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_level: Mapped[str] = mapped_column(String(4), nullable=False, default=VerificationLevel.L0.value)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=UserStatus.PENDING.value)


class ExternalIdentity(TenantBase):
    __tablename__ = "external_identities"
    __table_args__ = (UniqueConstraint("institution_id", "provider", "subject", name="uq_external_identity"),)

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)


class IdentityVerification(TenantBase):
    __tablename__ = "identity_verifications"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(4), nullable=False)
    authority: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class IdentityDocument(TenantBase):
    __tablename__ = "identity_documents"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="uploaded")


class Device(TenantBase):
    __tablename__ = "devices"
    __table_args__ = (UniqueConstraint("institution_id", "fingerprint", name="uq_device_fingerprint_per_inst"),)

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    public_key: Mapped[str] = mapped_column(String(4096), nullable=False)
    fingerprint: Mapped[str] = mapped_column(String(255), nullable=False)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DeviceTrustToken(TenantBase):
    __tablename__ = "device_trust_tokens"
    __table_args__ = (Index("ix_device_trust_token_hash", "token_hash"),)

    device_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("devices.id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Role(TenantBase):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("institution_id", "code", name="uq_role_code_per_inst"),)

    code: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Permission(TenantBase):
    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint("institution_id", "code", name="uq_permission_code_per_inst"),)

    code: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class RolePermission(TenantBase):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("institution_id", "role_id", "permission_id", name="uq_role_permission"),)

    role_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("roles.id"), nullable=False, index=True)
    permission_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("permissions.id"), nullable=False, index=True)


class RoleBinding(TenantBase):
    __tablename__ = "role_bindings"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    role_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("roles.id"), nullable=False, index=True)
    scope_type: Mapped[str] = mapped_column(String(32), nullable=False, default=ScopeType.INSTITUTION.value)
    scope_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Consent(TenantBase):
    __tablename__ = "consents"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    consent_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="granted")
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
