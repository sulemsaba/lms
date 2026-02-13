#!/usr/bin/env python
from __future__ import annotations

import asyncio
import uuid

from sqlalchemy import select

from app.core.rbac import ROLE_DEFINITIONS_BY_CODE
from app.database.session import AsyncSessionFactory
from app.models.iam import Institution, Role, User
from app.services.rbac import RbacService
from app.utils.security import hash_password


async def seed() -> None:
    async with AsyncSessionFactory() as db:
        stmt = select(Institution).where(Institution.code == "UDSM")
        institution = (await db.execute(stmt)).scalar_one_or_none()
        if institution is None:
            institution = Institution(
                id=uuid.uuid4(),
                institution_id=None,
                name="University of Dar es Salaam",
                code="UDSM",
                domain="hub.udsm.ac.tz",
                settings={"seeded": True},
            )
            db.add(institution)
            await db.flush()
            institution.institution_id = institution.id

        user_stmt = select(User).where(User.email == "admin@udsm.ac.tz", User.institution_id == institution.id)
        admin = (await db.execute(user_stmt)).scalar_one_or_none()
        if admin is None:
            admin = User(
                institution_id=institution.id,
                created_by=None,
                email="admin@udsm.ac.tz",
                full_name="System Admin",
                reg_number="ADM-0001",
                phone="+255700000001",
                password_hash=hash_password("Admin123!"),
                verification_level="L3",
                status="active",
            )
            db.add(admin)
            await db.flush()

        super_admin_definition = ROLE_DEFINITIONS_BY_CODE["super_admin"]
        super_admin_role = (
            await db.execute(
                select(Role).where(
                    Role.institution_id == institution.id,
                    Role.code == super_admin_definition.code,
                    Role.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if super_admin_role is None:
            super_admin_role = Role(
                institution_id=institution.id,
                code=super_admin_definition.code,
                description=super_admin_definition.description,
            )
            db.add(super_admin_role)
            await db.flush()
        if admin is not None and super_admin_role is not None:
            await RbacService(db).ensure_role_binding(
                user=admin,
                role_code=super_admin_role.code,
                actor_id=admin.id,
                scope_type="institution",
                scope_id=None,
            )

        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
