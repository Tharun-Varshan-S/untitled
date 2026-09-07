"""
Unit tests for Chat Request & Response Pydantic v2 schemas.
"""

import pytest
from pydantic import ValidationError
from app.schemas.chat import ChatRequest, ChatResponse


def test_valid_chat_request():
    """Test ChatRequest validates correctly with valid payload."""
    req = ChatRequest(
        workspaceId="ws-123",
        projectId="proj-456",
        question="Why did the server crash?",
        logs=["2026-08-11 ERROR OOM killed process 1024"]
    )
    assert req.workspaceId == "ws-123"
    assert req.projectId == "proj-456"
    assert req.question == "Why did the server crash?"
    assert len(req.logs) == 1


def test_chat_request_missing_required_fields():
    """Test ChatRequest raises ValidationError when question is missing."""
    with pytest.raises(ValidationError) as exc_info:
        ChatRequest(
            workspaceId="ws-123",
            projectId="proj-456"
            # question missing
        )
    assert "question" in str(exc_info.value)


def test_chat_request_question_too_short():
    """Test ChatRequest rejects question shorter than min_length=3."""
    with pytest.raises(ValidationError):
        ChatRequest(
            workspaceId="ws-123",
            projectId="proj-456",
            question="hi"  # < 3 chars
        )


def test_chat_request_question_wrong_datatype():
    """Test ChatRequest rejects non-string question input."""
    with pytest.raises(ValidationError):
        ChatRequest(
            workspaceId="ws-123",
            projectId="proj-456",
            question=12345  # Not a string
        )


def test_valid_chat_response():
    """Test ChatResponse creation."""
    res = ChatResponse(
        success=True,
        answer="Database timeout occurred.",
        provider="groq",
        model="llama-3.3-70b-versatile",
        latency=45.2,
        tokenUsage={"totalTokens": 150}
    )
    assert res.success is True
    assert res.provider == "groq"
    assert res.latency == 45.2
