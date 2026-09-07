"""
Groq LLM Provider Implementation.

Responsibility:
- Communicates asynchronously with Groq Cloud API using groq Python SDK or HTTP client.
- Translates Groq-specific status errors (429, 504, 500) to domain exceptions.
- Measures network latency and collects token usage stats.
"""

import time
from typing import Optional
from groq import AsyncGroq, APIConnectionError, APITimeoutError, APIStatusError

from app.config.settings import settings
from app.providers.base_provider import BaseProvider, ProviderResponse
from app.core.exceptions import (
    ProviderTimeoutException,
    ProviderRateLimitException,
    ProviderUnavailableException,
    InvalidProviderResponseException
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class GroqProvider(BaseProvider):
    """
    Groq Provider implementation inheriting from BaseProvider interface.
    
    Why it exists:
    Encapsulates Groq SDK calls, authentication, error mapping, and timing metrics.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None
    ):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.MODEL
        self.timeout = timeout or settings.TIMEOUT
        self._client: Optional[AsyncGroq] = None

    def _get_client(self) -> AsyncGroq:
        """Lazily initializes and reuses AsyncGroq client instance."""
        if not self._client:
            self._client = AsyncGroq(
                api_key=self.api_key,
                timeout=self.timeout
            )
        return self._client

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> ProviderResponse:
        """
        Executes async chat completion with Groq API.
        """
        client = self._get_client()
        temp = temperature if temperature is not None else settings.TEMPERATURE
        tokens = max_tokens if max_tokens is not None else settings.MAX_TOKENS

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        start_time = time.perf_counter()
        
        try:
            logger.info(f"Calling Groq API model={self.model}, temp={temp}, max_tokens={tokens}")
            completion = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temp,
                max_tokens=tokens
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            if not completion.choices or not completion.choices[0].message:
                raise InvalidProviderResponseException("Groq returned completion with empty choices.")

            content = completion.choices[0].message.content or ""
            
            # Extract token usage metadata if available
            usage = {}
            if hasattr(completion, "usage") and completion.usage:
                usage = {
                    "promptTokens": getattr(completion.usage, "prompt_tokens", 0),
                    "completionTokens": getattr(completion.usage, "completion_tokens", 0),
                    "totalTokens": getattr(completion.usage, "total_tokens", 0)
                }

            logger.info(f"Groq API call successful in {elapsed_ms}ms. Tokens used: {usage}")

            return ProviderResponse(
                content=content,
                provider="groq",
                model=self.model,
                latency_ms=elapsed_ms,
                token_usage=usage
            )

        except APITimeoutError as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"Groq API request timed out after {elapsed_ms}ms: {exc}")
            raise ProviderTimeoutException("Groq API request timed out.")

        except APIConnectionError as exc:
            logger.error(f"Failed to connect to Groq API: {exc}")
            raise ProviderUnavailableException("Unable to establish connection to Groq API.")

        except APIStatusError as exc:
            logger.error(f"Groq API status error status_code={exc.status_code}: {exc.message}")
            if exc.status_code == 429:
                raise ProviderRateLimitException("Groq API rate limit exceeded.")
            elif exc.status_code in (500, 502, 503, 504):
                raise ProviderUnavailableException("Groq API is temporarily unavailable.")
            else:
                raise InvalidProviderResponseException(f"Groq API status error: {exc.message}")

        except Exception as exc:
            if isinstance(exc, (ProviderTimeoutException, ProviderRateLimitException, ProviderUnavailableException, InvalidProviderResponseException)):
                raise exc
            logger.exception(f"Unexpected error calling Groq API: {exc}")
            raise ProviderUnavailableException(f"Unexpected provider error: {str(exc)}")
