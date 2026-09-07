"""
Integration tests for X-Service-Key internal authentication.
"""

import pytest
from httpx import AsyncClient
from app.api.chat import get_chat_service
from app.services.chat_service import ChatService
from tests.fixtures.responses import FakeProvider
from tests.fixtures.requests import VALID_CHAT_PAYLOAD


@pytest.mark.asyncio
async def test_auth_valid_service_key(async_client: AsyncClient, valid_headers: dict):
    """Verify request succeeds when valid X-Service-Key header is provided."""
    fake = FakeProvider(response_text="Success answer")
    async_client.app.dependency_overrides[get_chat_service] = lambda: ChatService(provider=fake)

    response = await async_client.post("/chat", json=VALID_CHAT_PAYLOAD, headers=valid_headers)
    assert response.status_code == 200
    async_client.app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_auth_missing_service_key(async_client: AsyncClient):
    """Verify request rejected with HTTP 401 when X-Service-Key is missing."""
    response = await async_client.post("/chat", json=VALID_CHAT_PAYLOAD)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["code"] == "UNAUTHORIZED"
    assert "Missing required X-Service-Key header" in data["message"]


@pytest.mark.asyncio
async def test_auth_invalid_service_key(async_client: AsyncClient, invalid_headers: dict):
    """Verify request rejected with HTTP 401 when X-Service-Key is incorrect."""
    response = await async_client.post("/chat", json=VALID_CHAT_PAYLOAD, headers=invalid_headers)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["code"] == "UNAUTHORIZED"
