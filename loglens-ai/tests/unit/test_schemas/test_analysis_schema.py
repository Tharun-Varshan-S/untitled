"""
Unit tests for Analysis Request & Response Pydantic v2 schemas.
"""

import pytest
from pydantic import ValidationError
from app.schemas.analysis import AnalysisRequest, AnalysisResponse


def test_valid_analysis_request():
    """Test AnalysisRequest validates with valid logs payload."""
    req = AnalysisRequest(
        workspaceId="ws-123",
        projectId="proj-456",
        logs=["Log line 1", "Log line 2"]
    )
    assert req.workspaceId == "ws-123"
    assert len(req.logs) == 2


def test_analysis_request_empty_logs():
    """Test AnalysisRequest rejects empty logs array."""
    with pytest.raises(ValidationError):
        AnalysisRequest(
            workspaceId="ws-123",
            projectId="proj-456",
            logs=[]
        )


def test_valid_analysis_response():
    """Test AnalysisResponse schema serialization."""
    res = AnalysisResponse(
        success=True,
        summary="Pool exhaustion",
        rootCause="PostgreSQL pool max 20 reached",
        severity="high",
        recommendation="Increase pool size to 50",
        provider="groq",
        model="llama-3.3-70b-versatile",
        latency=120.0,
        tokenUsage={"totalTokens": 300}
    )
    assert res.severity == "high"
    assert res.provider == "groq"
