"""
Unit tests for AnalysisService with valid JSON, markdown backticks, and unparseable JSON fallbacks.
"""

import pytest
import json
from app.services.analysis_service import AnalysisService
from app.schemas.analysis import AnalysisRequest
from tests.fixtures.responses import FakeProvider
from tests.fixtures.logs import SAMPLE_AUTH_LOGS


@pytest.mark.asyncio
async def test_analysis_service_valid_json():
    """Test AnalysisService correctly parses raw JSON LLM response."""
    valid_json = json.dumps({
        "summary": "PostgreSQL connection pool exhaustion.",
        "rootCause": "Max pool limit of 20 reached under heavy load.",
        "severity": "high",
        "recommendation": "Increase pool size to 50 and tune connection idle timeouts."
    })
    fake = FakeProvider(response_text=valid_json)
    service = AnalysisService(provider=fake)

    req = AnalysisRequest(
        workspaceId="ws-1",
        projectId="proj-1",
        logs=SAMPLE_AUTH_LOGS
    )

    res = await service.analyze_logs(req)

    assert res.success is True
    assert res.summary == "PostgreSQL connection pool exhaustion."
    assert res.rootCause == "Max pool limit of 20 reached under heavy load."
    assert res.severity == "high"


@pytest.mark.asyncio
async def test_analysis_service_markdown_json_backticks():
    """Test AnalysisService cleans markdown backtick wrappers before parsing."""
    markdown_json = "```json\n" + json.dumps({
        "summary": "Stripe webhook failure.",
        "rootCause": "Invalid signature.",
        "severity": "critical",
        "recommendation": "Rotate webhook secret."
    }) + "\n```"

    fake = FakeProvider(response_text=markdown_json)
    service = AnalysisService(provider=fake)

    req = AnalysisRequest(
        workspaceId="ws-1",
        projectId="proj-1",
        logs=SAMPLE_AUTH_LOGS
    )

    res = await service.analyze_logs(req)

    assert res.severity == "critical"
    assert res.summary == "Stripe webhook failure."


@pytest.mark.asyncio
async def test_analysis_service_fallback_unparseable():
    """Test AnalysisService returns fallback analysis when LLM output is not valid JSON."""
    unparseable_text = "I analyzed the logs and found that DB connections timed out."
    fake = FakeProvider(response_text=unparseable_text)
    service = AnalysisService(provider=fake)

    req = AnalysisRequest(
        workspaceId="ws-1",
        projectId="proj-1",
        logs=SAMPLE_AUTH_LOGS
    )

    res = await service.analyze_logs(req)

    assert res.success is True
    assert res.rootCause == unparseable_text
    assert res.severity == "medium"
