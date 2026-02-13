from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import UUID

import pytest

from app.api import deps
from app.main import app
from app.services.rbac import RbacService


class _ScalarResult:
    def __init__(self, data):
        self._data = data

    def all(self):
        return self._data


class _ExecuteResult:
    def __init__(self, data):
        self._data = data

    def scalars(self):
        return _ScalarResult(self._data)


class _FakeSession:
    async def execute(self, stmt):
        course = SimpleNamespace(
            id=UUID("33333333-3333-3333-3333-333333333333"),
            institution_id=UUID("22222222-2222-2222-2222-222222222222"),
            code="CS101",
            title="Intro to CS",
            description="Foundations",
            status="active",
            created_at=datetime.now(timezone.utc),
        )
        return _ExecuteResult([course])


@pytest.mark.asyncio
async def test_list_courses_success(client):
    async def override_db():
        return _FakeSession()

    async def override_user():
        return SimpleNamespace(
            id=UUID("11111111-1111-1111-1111-111111111111"),
            institution_id=UUID("22222222-2222-2222-2222-222222222222"),
        )

    app.dependency_overrides[deps.get_db_with_tenant] = override_db
    app.dependency_overrides[deps.get_current_user] = override_user

    original_has_permission = RbacService.user_has_permission

    async def mock_user_has_permission(self, *, user, permission_code, scope_type=None, scope_id=None):
        return True

    RbacService.user_has_permission = mock_user_has_permission
    try:
        response = await client.get("/api/v1/courses/")
    finally:
        RbacService.user_has_permission = original_has_permission

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["code"] == "CS101"
