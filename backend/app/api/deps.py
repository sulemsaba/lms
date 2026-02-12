from __future__ import annotations

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db, set_tenant_context
from app.models.iam import RoleBinding, User
from app.utils.security import decode_token

security = HTTPBearer(auto_error=True)


async def get_request_institution_id(request: Request) -> UUID:
    value = request.headers.get("x-institution-id") or getattr(request.state, "institution_id", None)
    if value is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing institution context")
    try:
        return UUID(str(value))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid institution id") from exc


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user_id = payload.get("sub")
    institution_id = payload.get("institution_id") or request.headers.get("x-institution-id")
    if user_id is None or institution_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token")

    await set_tenant_context(db, str(institution_id))

    stmt = select(User).where(
        User.id == UUID(str(user_id)),
        User.institution_id == UUID(str(institution_id)),
        User.deleted_at.is_(None),
    )
    user = (await db.execute(stmt)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_db_with_tenant(
    institution_id: UUID = Depends(get_request_institution_id),
    db: AsyncSession = Depends(get_db),
) -> AsyncSession:
    await set_tenant_context(db, str(institution_id))
    return db


def require_permission(permission_code: str, scope_type: str | None = None) -> Callable:
    async def dependency(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db_with_tenant),
    ) -> None:
        stmt = (
            select(RoleBinding)
            .where(
                RoleBinding.user_id == current_user.id,
                RoleBinding.institution_id == current_user.institution_id,
                RoleBinding.active.is_(True),
            )
            .limit(1)
        )
        binding = (await db.execute(stmt)).scalar_one_or_none()
        if binding is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

        if scope_type is not None and binding.scope_type not in {scope_type, "institution"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Scope mismatch")

        if permission_code.startswith("admin") and binding.scope_type != "institution":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required")

    return dependency
