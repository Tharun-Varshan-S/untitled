"""
Unit tests for ChatService using FakeProvider.
"""

import pytest
from app.services.chat_service import ChatService
from app.schemas.chat import ChatRequest
from tests.fixtures.responses import FakeProvider
from tests.fixtures.logs import SAMPLE_AUTH_LOGS


@pytest.mark.asyncio
async def test_chat_service_process_chat():
    """Test ChatService correctly processes chat request via FakeProvider."""
    fake = FakeProvider(response_text="The login requests are failing due to DB connection timeout.")
    service = ChatService(provider=fake)

    req = ChatRequest(
        workspaceId="ws-1",
        projectId="proj-1",
        question="Why are login requests failing?",
        logs=SAMPLE_AUTH_LOGS
    )

    res = await service.process_chat(req)

    assert res.success is True
    assert res.answer == "The login requests are failing due to DB connection timeout."
    assert res.provider == "fake_groq"
    assert res.model == "fake-llama-3.3-70b"
    assert fake.calls_count == 1
