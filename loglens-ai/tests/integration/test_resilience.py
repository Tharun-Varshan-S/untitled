"""
Provider Resilience and Fault Tolerance Integration Tests.

Responsibility:
- Verifies that external provider failures (Timeout, Rate Limit, Service Unavailable)
  are caught by domain exception handlers and returned as standardized JSON responses.
"""

import pytest
from httpx import AsyncClient
from app.api.chat import get_chat_service
from app.services.chat_service import ChatService
from app.core.exceptions import (
    ProviderTimeoutException,
    ProviderRateLimitException,
    ProviderUnavailableException
)
from tests.fixtures.responses import FakeProvider
from tests.fixtures.requests import VALID_CHAT_PAYLOAD


@pytest.mark.asyncio
async def test_resilience_provider_timeout(async_client: AsyncClient, valid_headers: dict):
    """Verify ProviderTimeoutException is returned as HTTP 504 with MODEL_TIMEOUT code."""
    fake = FakeProvider(should_fail=True, exception_to_raise=ProviderTimeoutException())
    async_client.app.dependency_overrides[get_chat_service] = lambda: ChatService(provider=fake)

    response = await async_client.post("/chat", json=VALID_CHAT_PAYLOAD, headers=valid_headers)
    assert response.status_code == 504

    data = response.json()
    assert data["success"] is False
    assert data["code"] == "MODEL_TIMEOUT"
    async_client.app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_resilience_provider_rate_limit(async_client: AsyncClient, valid_headers: dict):
    """Verify ProviderRateLimitException is returned as HTTP 429 with MODEL_RATE_LIMITED code."""
    fake = FakeProvider(should_fail=True, exception_to_raise=ProviderRateLimitException())
    async_client.app.dependency_overrides[get_chat_service] = lambda: ChatService(provider=fake)

    response = await async_client.post("/chat", json=VALID_CHAT_PAYLOAD, headers=valid_headers)
    assert response.status_code == 429

    data = response.json()
    assert data["success"] is False
    assert data["code"] == "MODEL_RATE_LIMITED"
    async_client.app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_resilience_provider_unavailable(async_client: AsyncClient, valid_headers: dict):
    """Verify ProviderUnavailableException is returned as HTTP 503 with MODEL_UNAVAILABLE code."""
    fake = FakeProvider(should_fail=True, exception_to_raise=ProviderUnavailableException())
    async_client.app.dependency_overrides[get_chat_service] = lambda: ChatService(provider=fake)

    response = await async_client.post("/chat", json=VALID_CHAT_PAYLOAD, headers=valid_headers)
    assert response.status_code == 503

    data = response.json()
    assert data["success"] is False
    assert data["code"] == "MODEL_UNAVAILABLE"
    async_client.app.dependency_overrides.clear()
