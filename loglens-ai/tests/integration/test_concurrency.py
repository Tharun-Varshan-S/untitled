"""
Concurrency and Request Isolation Integration Tests.

Responsibility:
- Verifies that concurrent async requests do not share mutable state incorrectly.
- Verifies request correlation IDs remain distinct across concurrent client calls.
"""

import pytest
import asyncio
from httpx import AsyncClient
from app.api.chat import get_chat_service
from app.services.chat_service import ChatService
from tests.fixtures.responses import FakeProvider


@pytest.mark.asyncio
async def test_concurrent_chat_requests_isolation(async_client: AsyncClient, valid_headers: dict):
    """
    Executes 20 simultaneous chat requests with distinct questions and correlation IDs.
    Verifies every response matches its corresponding request ID and returns cleanly.
    """
    fake = FakeProvider(response_text="Answer for concurrent query")
    async_client.app.dependency_overrides[get_chat_service] = lambda: ChatService(provider=fake)

    async def send_request(idx: int):
        req_id = f"concurrent-req-id-{idx}"
        payload = {
            "workspaceId": f"ws-{idx}",
            "projectId": f"proj-{idx}",
            "question": f"Question number {idx}?",
            "logs": [f"Log entry {idx}"]
        }
        headers = {**valid_headers, "X-Request-ID": req_id}
        res = await async_client.post("/chat", json=payload, headers=headers)
        return res, req_id

    # Dispatch 20 concurrent requests
    tasks = [send_request(i) for i in range(20)]
    results = await asyncio.gather(*tasks)

    for res, expected_req_id in results:
        assert res.status_code == 200
        assert res.headers["X-Request-ID"] == expected_req_id
        data = res.json()
        assert data["success"] is True

    async_client.app.dependency_overrides.clear()
