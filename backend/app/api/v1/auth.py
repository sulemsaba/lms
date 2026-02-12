from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import sha256
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant, get_request_institution_id
from app.models.iam import DeviceTrustToken, Institution, User
from app.schemas.auth import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    LoginRequest,
    OfflinePinSetRequest,
    OfflinePinVerifyRequest,
    OfflinePinVerifyResponse,
    RefreshRequest,
    TokenPair,
)
from app.services.auth import AuthService
from app.utils.security import decode_token

router = APIRouter()


@router.post("/sso/callback", response_model=TokenPair)
async def sso_callback(
    payload: LoginRequest,
    institution_id: UUID = Depends(get_request_institution_id),
    db: AsyncSession = Depends(get_db_with_tenant),
) -> TokenPair:
    service = AuthService(db)
    user = await service.authenticate_user(payload.email, payload.password, institution_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access, refresh = await service.issue_token_pair(user)
    return TokenPair(access_token=access, refresh_token=refresh, expires_in=15 * 60)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db_with_tenant)) -> TokenPair:
    try:
        token_data = decode_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong token type")

    user_stmt = select(User).where(User.id == UUID(str(token_data["sub"])))
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    service = AuthService(db)
    access = await service.refresh_access_token(user, UUID(str(token_data["device_id"])) if token_data.get("device_id") else None)
    _, refresh = await service.issue_token_pair(user)
    return TokenPair(access_token=access, refresh_token=refresh, expires_in=15 * 60)


@router.post("/device/register", response_model=DeviceRegisterResponse)
async def register_device(
    payload: DeviceRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_with_tenant),
) -> DeviceRegisterResponse:
    device, token, expires_at = await AuthService(db).register_device(current_user, payload)
    return DeviceRegisterResponse(device_id=device.id, device_trust_token=token, expires_at=expires_at)


@router.post("/device/revoke")
async def revoke_device(
    device_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_with_tenant),
) -> dict:
    stmt = select(DeviceTrustToken).where(
        DeviceTrustToken.device_id == device_id,
        DeviceTrustToken.institution_id == current_user.institution_id,
        DeviceTrustToken.revoked_at.is_(None),
    )
    records = (await db.execute(stmt)).scalars().all()
    now = datetime.now(timezone.utc)
    for record in records:
        record.revoked_at = now
    await db.commit()
    return {"revoked": len(records)}


@router.post("/offline-pin/set")
async def set_offline_pin(
    payload: OfflinePinSetRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_with_tenant),
) -> dict:
    await AuthService(db).set_offline_pin(current_user, payload.pin)
    return {"status": "ok"}


@router.post("/offline-pin/verify", response_model=OfflinePinVerifyResponse)
async def verify_offline_pin(
    payload: OfflinePinVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_with_tenant),
) -> OfflinePinVerifyResponse:
    valid = await AuthService(db).verify_offline_pin(current_user, payload.pin)
    cache_token = None
    if valid:
        raw = f"{current_user.id}:{datetime.now(timezone.utc).timestamp()}"
        cache_token = sha256(raw.encode()).hexdigest()
    return OfflinePinVerifyResponse(valid=valid, cache_token=cache_token)
