from __future__ import annotations

from types import SimpleNamespace
from uuid import UUID

import pytest

from app.api import deps
from app.main import app
from app.services.auth import AuthService


@pytest.mark.asyncio
async def test_auth_sso_callback_success(client, institution_id):
    async def override_db():
        return object()

    async def override_institution():
        return UUID(institution_id)

    async def mock_authenticate(self, email, password, institution_id):
        return SimpleNamespace(
            id=UUID("11111111-1111-1111-1111-111111111111"),
            institution_id=UUID(str(institution_id)),
            verification_level="L2",
            updated_at=SimpleNamespace(timestamp=lambda: 1),
        )

    async def mock_issue_tokens(self, user, device_id=None):
        return "access-token", "refresh-token"

    app.dependency_overrides[deps.get_db_with_tenant] = override_db
    app.dependency_overrides[deps.get_request_institution_id] = override_institution

    original_authenticate = AuthService.authenticate_user
    original_issue = AuthService.issue_token_pair
    AuthService.authenticate_user = mock_authenticate
    AuthService.issue_token_pair = mock_issue_tokens

    try:
        response = await client.post(
            "/api/v1/auth/sso/callback",
            json={"email": "student@udsm.ac.tz", "password": "password", "institution_code": "UDSM"},
        )
    finally:
        AuthService.authenticate_user = original_authenticate
        AuthService.issue_token_pair = original_issue

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"] == "access-token"
    assert payload["refresh_token"] == "refresh-token"
    assert payload["token_type"] == "bearer"
