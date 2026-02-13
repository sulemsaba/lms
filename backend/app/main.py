from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import date
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from redis.asyncio import Redis
from sqlalchemy import select, text

from app.api import api_router
from app.config import get_settings
from app.core.middleware import RateLimitMiddleware, RequestContextMiddleware
from app.core.rbac import PERMISSION_DEFINITIONS, ROLE_DEFINITIONS_BY_CODE
from app.database import Base
from app.database.session import AsyncSessionFactory, engine
from app.models.iam import Institution, Permission, Role, RoleBinding, RolePermission, User
from app.models.student_success import Badge, Quote
from app.utils.logging import configure_logging

settings = get_settings()


async def _bootstrap_rbac(institution: Institution) -> None:
    async with AsyncSessionFactory() as db:
        roles_by_code: dict[str, Role] = {}
        for role_code, definition in ROLE_DEFINITIONS_BY_CODE.items():
            existing_role = (
                await db.execute(
                    select(Role).where(
                        Role.institution_id == institution.id,
                        Role.code == role_code,
                        Role.deleted_at.is_(None),
                    )
                )
            ).scalar_one_or_none()
            if existing_role is None:
                existing_role = Role(
                    institution_id=institution.id,
                    code=role_code,
                    description=definition.description,
                )
                db.add(existing_role)
                await db.flush()
            roles_by_code[role_code] = existing_role

        permissions_by_code: dict[str, Permission] = {}
        for permission_code, description in PERMISSION_DEFINITIONS.items():
            existing_permission = (
                await db.execute(
                    select(Permission).where(
                        Permission.institution_id == institution.id,
                        Permission.code == permission_code,
                        Permission.deleted_at.is_(None),
                    )
                )
            ).scalar_one_or_none()
            if existing_permission is None:
                existing_permission = Permission(
                    institution_id=institution.id,
                    code=permission_code,
                    description=description,
                )
                db.add(existing_permission)
                await db.flush()
            permissions_by_code[permission_code] = existing_permission

        existing_mappings = {
            (mapping.role_id, mapping.permission_id)
            for mapping in (
                await db.execute(
                    select(RolePermission).where(
                        RolePermission.institution_id == institution.id,
                        RolePermission.deleted_at.is_(None),
                    )
                )
            )
            .scalars()
            .all()
        }

        for role_code, definition in ROLE_DEFINITIONS_BY_CODE.items():
            role = roles_by_code[role_code]
            for permission_code in definition.permissions:
                permission = permissions_by_code[permission_code]
                key = (role.id, permission.id)
                if key in existing_mappings:
                    continue
                db.add(
                    RolePermission(
                        institution_id=institution.id,
                        role_id=role.id,
                        permission_id=permission.id,
                    )
                )
                existing_mappings.add(key)

        admin_user = (
            await db.execute(
                select(User).where(
                    User.institution_id == institution.id,
                    User.email == "admin@udsm.ac.tz",
                    User.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        super_admin_role = roles_by_code.get("super_admin")
        if admin_user is not None and super_admin_role is not None:
            existing_binding = (
                await db.execute(
                    select(RoleBinding).where(
                        RoleBinding.institution_id == institution.id,
                        RoleBinding.user_id == admin_user.id,
                        RoleBinding.role_id == super_admin_role.id,
                        RoleBinding.scope_type == "institution",
                        RoleBinding.deleted_at.is_(None),
                    )
                )
            ).scalar_one_or_none()
            if existing_binding is None:
                db.add(
                    RoleBinding(
                        institution_id=institution.id,
                        created_by=admin_user.id,
                        user_id=admin_user.id,
                        role_id=super_admin_role.id,
                        scope_type="institution",
                        scope_id=None,
                        active=True,
                    )
                )

        await db.commit()


def _bootstrap_badges() -> list[tuple[str, str, float]]:
    return [
        ("ON_TIME_SCHOLAR", "On-Time Scholar", 80),
        ("CONSISTENCY_CHAMPION", "Consistency Champion", 90),
        ("SKILL_MASTER", "Skill Master", 100),
    ]


def _bootstrap_quotes() -> list[tuple[str, str]]:
    return [
        ("Education is the passport to the future.", "Malcolm X"),
        ("A person is a person through other persons.", "Ubuntu Proverb"),
        ("The best way to predict your future is to create it.", "Abraham Lincoln"),
    ]


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    app.state.redis = redis

    async with AsyncSessionFactory() as db:
        institution_stmt = select(Institution).where(Institution.code == "UDSM")
        institution = (await db.execute(institution_stmt)).scalar_one_or_none()
        if institution is None:
            institution = Institution(
                id=uuid4(),
                institution_id=None,
                name="University of Dar es Salaam",
                code="UDSM",
                domain="hub.udsm.ac.tz",
                settings={"pilot": True},
            )
            db.add(institution)
            await db.flush()
            institution.institution_id = institution.id

        for code, name, threshold in _bootstrap_badges():
            exists = (
                await db.execute(select(Badge).where(Badge.institution_id == institution.id, Badge.code == code))
            ).scalar_one_or_none()
            if exists is None:
                db.add(Badge(institution_id=institution.id, code=code, name=name, threshold=threshold))

        existing_quotes = (await db.execute(select(Quote).where(Quote.institution_id == institution.id))).scalars().all()
        if not existing_quotes:
            for text_value, author in _bootstrap_quotes():
                db.add(Quote(institution_id=institution.id, text=text_value, author=author, language="en", active=True))

        await db.commit()

    await _bootstrap_rbac(institution)

    yield

    await redis.close()
    await engine.dispose()


app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0", lifespan=lifespan)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, include_in_schema=False)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check() -> dict:
    db_status = "healthy"
    redis_status = "healthy"
    storage_status = "healthy"

    try:
        async with AsyncSessionFactory() as db:
            await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    try:
        await app.state.redis.ping()
    except Exception:
        redis_status = "unhealthy"

    return {
        "status": "healthy" if all(v == "healthy" for v in (db_status, redis_status, storage_status)) else "degraded",
        "database": db_status,
        "redis": redis_status,
        "storage": storage_status,
    }
