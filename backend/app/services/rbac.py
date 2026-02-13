from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.iam import Permission, Role, RoleBinding, RolePermission, User


class RbacService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _scope_matches(binding: RoleBinding, scope_type: str | None, scope_id: str | None) -> bool:
        if binding.scope_type == "institution":
            return True
        if scope_type is None:
            return True
        if binding.scope_type != scope_type:
            return False
        if scope_id is None:
            return True
        if binding.scope_id is None:
            return False
        return str(binding.scope_id) == scope_id

    async def ensure_role_binding(
        self,
        *,
        user: User,
        role_code: str,
        actor_id: UUID | None,
        scope_type: str,
        scope_id: UUID | None = None,
    ) -> RoleBinding:
        role_stmt = select(Role).where(
            Role.institution_id == user.institution_id,
            Role.code == role_code,
            Role.deleted_at.is_(None),
        )
        role = (await self.db.execute(role_stmt)).scalar_one_or_none()
        if role is None:
            raise ValueError(f"Role '{role_code}' is not defined for institution")

        existing_stmt = select(RoleBinding).where(
            RoleBinding.institution_id == user.institution_id,
            RoleBinding.user_id == user.id,
            RoleBinding.role_id == role.id,
            RoleBinding.scope_type == scope_type,
            RoleBinding.scope_id == scope_id,
            RoleBinding.deleted_at.is_(None),
        )
        existing = (await self.db.execute(existing_stmt)).scalar_one_or_none()
        if existing is not None:
            if not existing.active:
                existing.active = True
                await self.db.flush()
            return existing

        binding = RoleBinding(
            institution_id=user.institution_id,
            created_by=actor_id,
            user_id=user.id,
            role_id=role.id,
            scope_type=scope_type,
            scope_id=scope_id,
            active=True,
        )
        self.db.add(binding)
        await self.db.flush()
        return binding

    async def user_has_permission(
        self,
        *,
        user: User,
        permission_code: str,
        scope_type: str | None = None,
        scope_id: str | None = None,
    ) -> bool:
        now = datetime.now(datetime.UTC)
        stmt = (
            select(RoleBinding, Role.code)
            .join(
                Role,
                and_(
                    Role.id == RoleBinding.role_id,
                    Role.institution_id == RoleBinding.institution_id,
                    Role.deleted_at.is_(None),
                ),
            )
            .join(
                RolePermission,
                and_(
                    RolePermission.role_id == Role.id,
                    RolePermission.institution_id == Role.institution_id,
                    RolePermission.deleted_at.is_(None),
                ),
            )
            .join(
                Permission,
                and_(
                    Permission.id == RolePermission.permission_id,
                    Permission.institution_id == Role.institution_id,
                    Permission.deleted_at.is_(None),
                    Permission.code == permission_code,
                ),
            )
            .where(
                RoleBinding.institution_id == user.institution_id,
                RoleBinding.user_id == user.id,
                RoleBinding.active.is_(True),
                RoleBinding.deleted_at.is_(None),
                or_(RoleBinding.start_at.is_(None), RoleBinding.start_at <= now),
                or_(RoleBinding.end_at.is_(None), RoleBinding.end_at >= now),
            )
        )
        rows = (await self.db.execute(stmt)).all()
        for binding, role_code in rows:
            if role_code == "super_admin":
                return True
            if self._scope_matches(binding, scope_type, scope_id):
                return True
        return False

    async def get_user_permissions(self, *, user: User) -> list[str]:
        now = datetime.now(datetime.UTC)
        stmt = (
            select(Permission.code)
            .join(
                RolePermission,
                and_(
                    RolePermission.permission_id == Permission.id,
                    RolePermission.deleted_at.is_(None),
                ),
            )
            .join(Role, and_(Role.id == RolePermission.role_id, Role.deleted_at.is_(None)))
            .join(RoleBinding, and_(RoleBinding.role_id == Role.id, RoleBinding.deleted_at.is_(None)))
            .where(
                Permission.institution_id == user.institution_id,
                Role.institution_id == user.institution_id,
                RoleBinding.institution_id == user.institution_id,
                RoleBinding.user_id == user.id,
                RoleBinding.active.is_(True),
                or_(RoleBinding.start_at.is_(None), RoleBinding.start_at <= now),
                or_(RoleBinding.end_at.is_(None), RoleBinding.end_at >= now),
            )
            .distinct()
            .order_by(Permission.code.asc())
        )
        return [row[0] for row in (await self.db.execute(stmt)).all()]

    async def get_user_bindings(self, *, user: User) -> list[RoleBinding]:
        now = datetime.now(datetime.UTC)
        stmt = select(RoleBinding).where(
            RoleBinding.institution_id == user.institution_id,
            RoleBinding.user_id == user.id,
            RoleBinding.active.is_(True),
            RoleBinding.deleted_at.is_(None),
            or_(RoleBinding.start_at.is_(None), RoleBinding.start_at <= now),
            or_(RoleBinding.end_at.is_(None), RoleBinding.end_at >= now),
        )
        return (await self.db.execute(stmt)).scalars().all()
