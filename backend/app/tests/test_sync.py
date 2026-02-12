from __future__ import annotations

from types import SimpleNamespace
from uuid import UUID

import pytest

from app.api import deps
from app.main import app
from app.services.auth import AuthService
from app.services.sync import SyncService


@pytest.mark.asyncio
async def test_sync_batch_success(client):
    async def override_db():
        return object()

    async def override_user():
        return SimpleNamespace(
            id=UUID("11111111-1111-1111-1111-111111111111"),
            institution_id=UUID("22222222-2222-2222-2222-222222222222"),
        )

    async def mock_verify_device_trust(self, device_id, token):
        return True

    async def mock_process_batch(self, institution_id, user_id, actions):
        return [
            {
                "id": actions[0].id,
                "success": True,
                "receipt_code": "UDSM-DEMO-0001",
                "server_entity_id": UUID("44444444-4444-4444-4444-444444444444"),
                "conflict": None,
                "error": None,
            }
        ]

    app.dependency_overrides[deps.get_db_with_tenant] = override_db
    app.dependency_overrides[deps.get_current_user] = override_user

    original_verify = AuthService.verify_device_trust
    original_process = SyncService.process_batch
    AuthService.verify_device_trust = mock_verify_device_trust
    SyncService.process_batch = mock_process_batch

    try:
        response = await client.post(
            "/api/v1/sync/batch",
            json={
                "device_id": "55555555-5555-5555-5555-555555555555",
                "device_trust_token": "trusted-token",
                "actions": [
                    {
                        "id": "66666666-6666-6666-6666-666666666666",
                        "entity_type": "assessment_attempt",
                        "action": "submit",
                        "payload": {"attempt_id": "77777777-7777-7777-7777-777777777777"},
                        "idempotency_key": "88888888-8888-8888-8888-888888888888",
                        "client_created_at": "2026-02-13T10:00:00Z",
                    }
                ],
            },
        )
    finally:
        AuthService.verify_device_trust = original_verify
        SyncService.process_batch = original_process

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["success"] is True
    assert payload[0]["receipt_code"] == "UDSM-DEMO-0001"
