"""
Integration tests for POST /chat API endpoint.
"""

import pytest
from httpx import AsyncClient
from app.main import create_app
from app.api.chat import get_chat_service
from app.services.chat_service import ChatService
from tests.fixtures.responses import FakeProvider
from tests.fixtures.requests import VALID_CHAT_PAYLOAD


@pytest.mark.asyncio
async def test_post_chat_success(async_client: AsyncClient, valid_headers: dict):
    """Verify POST /chat returns 200 with complete AI answer and token usage."""
    fake = FakeProvider(response_text="Database pool limit reached.")
    async_client.app.dependency_overrides[get_chat_service] = lambda: ChatService(provider=fake)

    response = await async_client.post("/chat", json=VALID_CHAT_PAYLOAD, headers=valid_headers)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["answer"] == "Database pool limit reached."
    assert data["provider"] == "fake_groq"
    assert "tokenUsage" in data
    assert data["latency"] >= 0.0
    
    async_client.app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_post_chat_validation_error(async_client: AsyncClient, valid_headers: dict):
    """Verify POST /chat returns 422 Unprocessable Entity when question is missing."""
    invalid_payload = {
        "workspaceId": "ws-123",
        "projectId": "proj-456"
        # missing question
    }
    response = await async_client.post("/chat", json=invalid_payload, headers=valid_headers)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["code"] == "INVALID_REQUEST"
