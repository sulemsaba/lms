from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_with_tenant, require_permission
from app.core.rbac import ROLE_DEFINITIONS
from app.models.iam import Role, RoleBinding, User
from app.schemas.rbac import CurrentAuthzResponse, RoleBindingRead, RoleMatrixItem
from app.services.rbac import RbacService

router = APIRouter()


@router.get("/me", response_model=CurrentAuthzResponse)
async def get_my_authorization_state(
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(get_current_user),
) -> CurrentAuthzResponse:
    service = RbacService(db)
    bindings = await service.get_user_bindings(user=current_user)
    role_ids = [binding.role_id for binding in bindings]

    role_code_by_id: dict = {}
    if role_ids:
        roles_stmt = select(Role).where(
            Role.id.in_(role_ids),
            Role.institution_id == current_user.institution_id,
            Role.deleted_at.is_(None),
        )
        role_code_by_id = {role.id: role.code for role in (await db.execute(roles_stmt)).scalars().all()}

    permissions = await service.get_user_permissions(user=current_user)
    return CurrentAuthzResponse(
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        roles=[
            RoleBindingRead(
                role_code=role_code_by_id.get(binding.role_id, "unknown"),
                scope_type=binding.scope_type,
                scope_id=binding.scope_id,
                start_at=binding.start_at,
                end_at=binding.end_at,
                active=binding.active,
            )
            for binding in bindings
        ],
        permissions=permissions,
    )


@router.get("/matrix", response_model=list[RoleMatrixItem])
async def get_role_permission_matrix(
    db: AsyncSession = Depends(get_db_with_tenant),
    _: User = Depends(require_permission("system.users_roles.manage")),
) -> list[RoleMatrixItem]:
    return [
        RoleMatrixItem(
            role_code=role.code,
            description=role.description,
            scope_type=role.scope_type,
            permissions=sorted(role.permissions),
        )
        for role in ROLE_DEFINITIONS
    ]


@router.get("/users/{user_id}", response_model=CurrentAuthzResponse)
async def get_user_authorization_state(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("system.users_roles.manage")),
) -> CurrentAuthzResponse:
    user_stmt = select(User).where(
        User.id == user_id,
        User.institution_id == current_user.institution_id,
        User.deleted_at.is_(None),
    )
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    service = RbacService(db)
    bindings = await service.get_user_bindings(user=user)
    permissions = await service.get_user_permissions(user=user)

    roles_stmt = (
        select(RoleBinding, Role.code)
        .join(Role, and_(Role.id == RoleBinding.role_id, Role.deleted_at.is_(None)))
        .where(
            RoleBinding.user_id == user.id,
            RoleBinding.institution_id == user.institution_id,
            RoleBinding.deleted_at.is_(None),
        )
    )
    role_rows = (await db.execute(roles_stmt)).all()

    return CurrentAuthzResponse(
        user_id=user.id,
        institution_id=user.institution_id,
        roles=[
            RoleBindingRead(
                role_code=role_code,
                scope_type=binding.scope_type,
                scope_id=binding.scope_id,
                start_at=binding.start_at,
                end_at=binding.end_at,
                active=binding.active,
            )
            for binding, role_code in role_rows
        ],
        permissions=permissions,
    )
