"""
Reusable provider response fixtures and FakeProvider implementation for test mocking.
"""

from typing import Optional
from app.providers.base_provider import BaseProvider, ProviderResponse


class FakeProvider(BaseProvider):
    """
    Fake AI Provider implementation for fast, deterministic unit & integration tests.
    
    Why it exists:
    Allows testing application flow, services, and routes without invoking external Groq API.
    """

    def __init__(
        self,
        response_text: str = "The PostgreSQL database pool is exhausted causing connection timeouts.",
        should_fail: bool = False,
        exception_to_raise: Optional[Exception] = None
    ):
        self.response_text = response_text
        self.should_fail = should_fail
        self.exception_to_raise = exception_to_raise
        self.calls_count = 0

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> ProviderResponse:
        self.calls_count += 1

        if self.should_fail and self.exception_to_raise:
            raise self.exception_to_raise

        return ProviderResponse(
            content=self.response_text,
            provider="fake_groq",
            model="fake-llama-3.3-70b",
            latency_ms=12.5,
            token_usage={"promptTokens": 100, "completionTokens": 50, "totalTokens": 150}
        )
