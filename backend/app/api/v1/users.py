from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant, require_permission
from app.core.rbac import ROLE_DEFINITIONS_BY_CODE
from app.models.iam import User
from app.schemas.user import UserCreate, UserRead
from app.services.rbac import RbacService
from app.utils.security import hash_password

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return current_user


@router.get("/", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(require_permission("system.users_roles.manage")),
) -> list[UserRead]:
    stmt = select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())
    return (await db.execute(stmt)).scalars().all()


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("system.users_roles.manage")),
) -> UserRead:
    existing_stmt = select(User).where(User.institution_id == current_user.institution_id, User.email == payload.email)
    if (await db.execute(existing_stmt)).scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already exists")

    role_definition = ROLE_DEFINITIONS_BY_CODE.get(payload.role_code)
    if role_definition is None:
        raise HTTPException(status_code=400, detail="Unsupported role code")

    scope_type = payload.role_scope_type or role_definition.scope_type

    user = User(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        email=payload.email,
        full_name=payload.full_name,
        reg_number=payload.reg_number,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        status="active",
        verification_level="L1",
    )
    db.add(user)
    await db.flush()

    await RbacService(db).ensure_role_binding(
        user=user,
        role_code=payload.role_code,
        actor_id=current_user.id,
        scope_type=scope_type,
        scope_id=payload.role_scope_id,
    )

    await db.commit()
    await db.refresh(user)
    return user
