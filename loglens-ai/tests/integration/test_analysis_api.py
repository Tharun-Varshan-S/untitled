"""
Integration tests for POST /analyze API endpoint.
"""

import pytest
import json
from httpx import AsyncClient
from app.api.analysis import get_analysis_service
from app.services.analysis_service import AnalysisService
from tests.fixtures.responses import FakeProvider
from tests.fixtures.requests import VALID_ANALYSIS_PAYLOAD


@pytest.mark.asyncio
async def test_post_analyze_success(async_client: AsyncClient, valid_headers: dict):
    """Verify POST /analyze returns 200 with structured summary, root cause, severity."""
    ai_json = json.dumps({
        "summary": "PostgreSQL connection pool exhausted.",
        "rootCause": "Max pool size of 20 connections exceeded.",
        "severity": "high",
        "recommendation": "Increase pool size to 50."
    })
    fake = FakeProvider(response_text=ai_json)
    async_client.app.dependency_overrides[get_analysis_service] = lambda: AnalysisService(provider=fake)

    response = await async_client.post("/analyze", json=VALID_ANALYSIS_PAYLOAD, headers=valid_headers)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["summary"] == "PostgreSQL connection pool exhausted."
    assert data["rootCause"] == "Max pool size of 20 connections exceeded."
    assert data["severity"] == "high"
    assert data["recommendation"] == "Increase pool size to 50."
    assert data["provider"] == "fake_groq"

    async_client.app.dependency_overrides.clear()
