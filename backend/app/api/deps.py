from __future__ import annotations

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db, set_tenant_context
from app.models.iam import User
from app.services.rbac import RbacService
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
        request: Request,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db_with_tenant),
    ) -> User:
        requested_scope_type = scope_type or request.headers.get("x-scope-type")
        requested_scope_id = request.headers.get("x-scope-id")

        service = RbacService(db)
        has_permission = await service.user_has_permission(
            user=current_user,
            permission_code=permission_code,
            scope_type=requested_scope_type,
            scope_id=requested_scope_id,
        )
        if not has_permission:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

        if scope_type is not None and requested_scope_type is not None and requested_scope_type != scope_type:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Scope mismatch")

        return current_user

    return dependency
