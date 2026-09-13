"""
Global Pytest Configuration and Shared Fixtures.

Responsibility:
- Configures async test event loop.
- Provides httpx AsyncClient for route testing.
- Provides valid/invalid authentication headers.
- Overrides FastAPI dependencies to inject FakeProvider.
"""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
import os
import secrets

# Use a randomly generated key per test session — never a hardcoded known value.
# This ensures tests don't inadvertently rely on a production secret default.
os.environ.setdefault("SERVICE_KEY", secrets.token_hex(32))
os.environ.setdefault("GROQ_API_KEY", "test_key_not_real")

from httpx import AsyncClient, ASGITransport

from app.main import create_app
from app.config.settings import settings
from tests.fixtures.responses import FakeProvider


@pytest.fixture
def valid_headers() -> dict:
    """Returns valid X-Service-Key headers."""
    return {"X-Service-Key": settings.SERVICE_KEY}


@pytest.fixture
def invalid_headers() -> dict:
    """Returns invalid authentication headers."""
    return {"X-Service-Key": "invalid-service-key-12345"}


@pytest.fixture
def fake_provider() -> FakeProvider:
    """Returns default FakeProvider instance."""
    return FakeProvider()


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Creates httpx AsyncClient tied to FastAPI app via ASGITransport.
    Attaches app instance as client.app for dependency overrides.
    """
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.app = app
        yield client

