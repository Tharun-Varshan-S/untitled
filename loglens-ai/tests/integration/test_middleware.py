"""
Integration tests for Request ID Middleware and Process Timing headers.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_middleware_generates_request_id(async_client: AsyncClient):
    """Verify middleware automatically generates X-Request-ID header when missing."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time" in response.headers
    assert len(response.headers["X-Request-ID"]) > 10


@pytest.mark.asyncio
async def test_middleware_propagates_existing_request_id(async_client: AsyncClient):
    """Verify middleware propagates client-provided X-Request-ID header."""
    custom_req_id = "custom-req-id-998877"
    response = await async_client.get("/health", headers={"X-Request-ID": custom_req_id})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == custom_req_id
