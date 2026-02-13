from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Ensure tests do not require external infra by default.
os.environ.setdefault("ASYNC_DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SYNC_DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")

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
