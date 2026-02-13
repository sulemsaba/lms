from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.iam import Institution, User
from app.utils.security import hash_password


@pytest.mark.asyncio
async def test_login(client: AsyncClient, db_session: AsyncSession):
    institution = Institution(id=uuid4(), name="Test Institution", code="TEST")
    db_session.add(institution)
    await db_session.commit()

    user = User(
        id=uuid4(),
        institution_id=institution.id,
        email="test@test.com",
        full_name="Test User",
        hashed_password=hash_password("password"),
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@test.com", "password": "password"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
