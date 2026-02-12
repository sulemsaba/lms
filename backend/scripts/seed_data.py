#!/usr/bin/env python
from __future__ import annotations

import asyncio
import uuid

from sqlalchemy import select

from app.database.session import AsyncSessionFactory
from app.models.iam import Institution, User
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
            db.add(
                User(
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
            )

        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
