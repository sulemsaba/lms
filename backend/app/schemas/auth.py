from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str
    institution_code: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class DeviceRegisterRequest(BaseModel):
    fingerprint: str
    public_key: str


class DeviceRegisterResponse(BaseModel):
    device_id: UUID
    device_trust_token: str
    expires_at: datetime


class OfflinePinSetRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=12)


class OfflinePinVerifyRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=12)


class OfflinePinVerifyResponse(BaseModel):
    valid: bool
    cache_token: str | None = None
