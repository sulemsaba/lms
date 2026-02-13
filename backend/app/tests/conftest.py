from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Ensure tests do not require external infra by default.
os.environ.setdefault("ASYNC_DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SYNC_DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")

from app.api.deps import get_db
from app.database.base import Base
from app.main import app


@pytest.fixture()
def test_user_id() -> str:
    return "11111111-1111-1111-1111-111111111111"


@pytest.fixture()
def institution_id() -> str:
    return "22222222-2222-2222-2222-222222222222"


@pytest_asyncio.fixture()
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client


@pytest.fixture(autouse=True)
def clear_dependency_overrides() -> None:
    app.dependency_overrides = {}
    yield
    app.dependency_overrides = {}


@pytest.fixture(scope="session")
def event_loop():
    import asyncio
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    """yields a SQLAlchemy engine which is suppressed after the test session"""
    engine = create_async_engine("sqlite+aiosqlite:///./test.db", echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    # commented out to inspect the database after tests
    # os.remove("./test.db")


@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine):
    """yields a SQLAlchemy session which is rollbacked after the test"""
    connection = await db_engine.connect()
    # begin the nested transaction
    await connection.begin()
    # use the connection with the already started transaction
    session = AsyncSession(bind=connection)

    yield session

    await session.close()
    # roll back the broader transaction
    await connection.rollback()
    # put back the connection to the connection pool
    await connection.close()


@pytest.fixture(scope="function", autouse=True)
def override_get_db(db_session: AsyncSession):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
