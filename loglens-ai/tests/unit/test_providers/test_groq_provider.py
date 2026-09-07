"""
Unit tests for GroqProvider with mocked Groq SDK client.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from groq import APITimeoutError, APIConnectionError, APIStatusError

from app.providers.groq_provider import GroqProvider
from app.core.exceptions import (
    ProviderTimeoutException,
    ProviderRateLimitException,
    ProviderUnavailableException,
    InvalidProviderResponseException
)


@pytest.mark.asyncio
async def test_groq_provider_success():
    """Test successful generation from GroqProvider."""
    provider = GroqProvider(api_key="gsk_mock_test_key")

    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Analysis result: DB connection lost."
    mock_completion.choices = [mock_choice]
    mock_completion.usage.prompt_tokens = 50
    mock_completion.usage.completion_tokens = 20
    mock_completion.usage.total_tokens = 70

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)
    provider._client = mock_client

    result = await provider.generate(prompt="Test prompt", system_prompt="Test system")

    assert result.content == "Analysis result: DB connection lost."
    assert result.provider == "groq"
    assert result.token_usage["totalTokens"] == 70
    assert result.latency_ms >= 0.0


@pytest.mark.asyncio
async def test_groq_provider_timeout():
    """Test GroqProvider handles APITimeoutError by raising ProviderTimeoutException."""
    provider = GroqProvider(api_key="gsk_mock_test_key")

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        side_effect=APITimeoutError(request=MagicMock())
    )
    provider._client = mock_client

    with pytest.raises(ProviderTimeoutException) as exc_info:
        await provider.generate(prompt="Test prompt")
    assert "timed out" in exc_info.value.message


@pytest.mark.asyncio
async def test_groq_provider_rate_limit_429():
    """Test GroqProvider raises ProviderRateLimitException on HTTP 429."""
    provider = GroqProvider(api_key="gsk_mock_test_key")

    mock_response = MagicMock()
    mock_response.status_code = 429

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        side_effect=APIStatusError(message="Rate limit exceeded", response=mock_response, body=None)
    )
    provider._client = mock_client

    with pytest.raises(ProviderRateLimitException):
        await provider.generate(prompt="Test prompt")


@pytest.mark.asyncio
async def test_groq_provider_server_error_503():
    """Test GroqProvider raises ProviderUnavailableException on HTTP 503."""
    provider = GroqProvider(api_key="gsk_mock_test_key")

    mock_response = MagicMock()
    mock_response.status_code = 503

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        side_effect=APIStatusError(message="Service Unavailable", response=mock_response, body=None)
    )
    provider._client = mock_client

    with pytest.raises(ProviderUnavailableException):
        await provider.generate(prompt="Test prompt")


@pytest.mark.asyncio
async def test_groq_provider_empty_choices():
    """Test GroqProvider handles empty completion choices."""
    provider = GroqProvider(api_key="gsk_mock_test_key")

    mock_completion = MagicMock()
    mock_completion.choices = []

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)
    provider._client = mock_client

    with pytest.raises(InvalidProviderResponseException):
        await provider.generate(prompt="Test prompt")
