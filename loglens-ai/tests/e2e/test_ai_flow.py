"""
End-to-End Node.js Express ↔ FastAPI AI Service Contract Test.

Responsibility:
- Simulates complete request flow from Node.js Express backend down to FastAPI AI service and mock Groq provider.
- Validates the exact JSON contract exchanged across service boundaries.
"""

import pytest
import json
from httpx import AsyncClient
from app.api.chat import get_chat_service
from app.api.analysis import get_analysis_service
from app.services.chat_service import ChatService
from app.services.analysis_service import AnalysisService
from tests.fixtures.responses import FakeProvider
from tests.fixtures.logs import SAMPLE_AUTH_LOGS


@pytest.mark.asyncio
async def test_e2e_node_to_fastapi_chat_flow(async_client: AsyncClient, valid_headers: dict):
    """
    E2E Chat Flow Simulation:
    Express Node Backend -> POST /chat -> FastAPI ChatService -> Fake Provider -> Express Response
    """
    fake = FakeProvider(response_text="The login failures are caused by PostgreSQL connection timeouts.")
    async_client.app.dependency_overrides[get_chat_service] = lambda: ChatService(provider=fake)

    node_request_body = {
        "workspaceId": "ws-production-001",
        "projectId": "proj-auth-microservice",
        "question": "Why are auth logins failing?",
        "logs": SAMPLE_AUTH_LOGS
    }

    response = await async_client.post("/chat", json=node_request_body, headers=valid_headers)
    assert response.status_code == 200

    res_data = response.json()
    assert res_data["success"] is True
    assert "PostgreSQL connection timeouts" in res_data["answer"]
    assert res_data["provider"] == "fake_groq"
    assert "tokenUsage" in res_data
    async_client.app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_e2e_node_to_fastapi_analysis_flow(async_client: AsyncClient, valid_headers: dict):
    """
    E2E Log Analysis Flow Simulation:
    Express Node Backend -> POST /analyze -> FastAPI AnalysisService -> Fake Provider -> Express Response
    """
    structured_ai_json = json.dumps({
        "summary": "PostgreSQL database connection pool exhaustion.",
        "rootCause": "Pool limit of 20 connections reached under spike traffic.",
        "severity": "high",
        "recommendation": "Scale DB pool size to 50 connections and add connection retry backoff."
    })
    fake = FakeProvider(response_text=structured_ai_json)
    async_client.app.dependency_overrides[get_analysis_service] = lambda: AnalysisService(provider=fake)

    node_request_body = {
        "workspaceId": "ws-production-001",
        "projectId": "proj-auth-microservice",
        "logs": SAMPLE_AUTH_LOGS
    }

    response = await async_client.post("/analyze", json=node_request_body, headers=valid_headers)
    assert response.status_code == 200

    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["summary"] == "PostgreSQL database connection pool exhaustion."
    assert res_data["rootCause"] == "Pool limit of 20 connections reached under spike traffic."
    assert res_data["severity"] == "high"
    assert res_data["recommendation"] == "Scale DB pool size to 50 connections and add connection retry backoff."
    async_client.app.dependency_overrides.clear()
