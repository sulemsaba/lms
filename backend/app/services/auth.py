from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.iam import Device, DeviceTrustToken, User
from app.schemas.auth import DeviceRegisterRequest
from app.utils.security import create_access_token, create_refresh_token, hash_password, verify_password


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, email: str, password: str, institution_id: UUID) -> User | None:
        stmt = select(User).where(User.email == email, User.institution_id == institution_id, User.deleted_at.is_(None))
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if user is None:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    async def issue_token_pair(self, user: User, device_id: UUID | None = None) -> tuple[str, str]:
        extra = {
            "institution_id": str(user.institution_id),
            "verification_level": user.verification_level,
            "device_id": str(device_id) if device_id else None,
            "scope_hash": hashlib.sha256(f"{user.id}:{user.updated_at.timestamp()}".encode()).hexdigest(),
        }
        access = create_access_token(subject=str(user.id), extra=extra)
        refresh = create_refresh_token(subject=str(user.id), extra=extra)
        return access, refresh

    async def refresh_access_token(self, user: User, device_id: UUID | None = None) -> str:
        extra = {
            "institution_id": str(user.institution_id),
            "verification_level": user.verification_level,
            "device_id": str(device_id) if device_id else None,
            "scope_hash": hashlib.sha256(f"{user.id}:{user.updated_at.timestamp()}".encode()).hexdigest(),
        }
        return create_access_token(subject=str(user.id), extra=extra)

    async def register_device(self, user: User, payload: DeviceRegisterRequest) -> tuple[Device, str, datetime]:
        device = Device(
            institution_id=user.institution_id,
            created_by=user.id,
            user_id=user.id,
            public_key=payload.public_key,
            fingerprint=payload.fingerprint,
            last_seen=datetime.now(timezone.utc),
        )
        self.db.add(device)
        await self.db.flush()

        raw_token = hashlib.sha256(f"{device.id}:{datetime.now(timezone.utc).timestamp()}".encode()).hexdigest()
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        trust = DeviceTrustToken(
            institution_id=user.institution_id,
            created_by=user.id,
            device_id=device.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(trust)
        await self.db.commit()
        await self.db.refresh(device)
        return device, raw_token, expires_at

    async def verify_device_trust(self, device_id: UUID, token: str) -> bool:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        stmt = select(DeviceTrustToken).where(
            DeviceTrustToken.device_id == device_id,
            DeviceTrustToken.token_hash == token_hash,
            DeviceTrustToken.revoked_at.is_(None),
        )
        record = (await self.db.execute(stmt)).scalar_one_or_none()
        if record is None:
            return False
        return record.expires_at > datetime.now(timezone.utc)

    async def set_offline_pin(self, user: User, pin: str) -> None:
        user.offline_pin_hash = hash_password(pin)
        await self.db.commit()

    async def verify_offline_pin(self, user: User, pin: str) -> bool:
        if not user.offline_pin_hash:
            return False
        return verify_password(pin, user.offline_pin_hash)
