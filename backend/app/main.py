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
from app.database import Base
from app.database.session import AsyncSessionFactory, engine
from app.models.iam import Institution, Permission, Role
from app.models.student_success import Badge, Quote
from app.utils.logging import configure_logging

settings = get_settings()


def _bootstrap_roles() -> list[tuple[str, str]]:
    return [
        ("student", "Student role"),
        ("lecturer", "Lecturer role"),
        ("admin", "Institution admin role"),
    ]


def _bootstrap_permissions() -> list[tuple[str, str]]:
    return [
        ("admin.conflicts", "Resolve sync conflicts"),
        ("admin.receipts", "Inspect receipt chains"),
        ("assessments.create", "Create assessments"),
        ("submissions.grade", "Grade submissions"),
    ]


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

        for role_code, description in _bootstrap_roles():
            exists = (
                await db.execute(
                    select(Role).where(Role.institution_id == institution.id, Role.code == role_code)
                )
            ).scalar_one_or_none()
            if exists is None:
                db.add(Role(institution_id=institution.id, code=role_code, description=description))

        for permission_code, description in _bootstrap_permissions():
            exists = (
                await db.execute(
                    select(Permission).where(Permission.institution_id == institution.id, Permission.code == permission_code)
                )
            ).scalar_one_or_none()
            if exists is None:
                db.add(Permission(institution_id=institution.id, code=permission_code, description=description))

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
