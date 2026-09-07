"""
Abstract LLM Provider interface definition.

Responsibility:
- Defines abstract contract for AI models.
- Standardizes LLM response structure (content, model, tokens, latency).
- Decouples application logic from vendor-specific SDKs (Groq, OpenAI, Anthropic).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, Optional


@dataclass
class ProviderResponse:
    """
    Standardized AI Provider Response Data Transfer Object (DTO).
    """
    content: str
    provider: str
    model: str
    latency_ms: float
    token_usage: Dict[str, int] = field(default_factory=dict)


class BaseProvider(ABC):
    """
    Abstract Base Class for all AI Provider implementations.
    
    Why it exists:
    Adheres to Dependency Inversion Principle (D of SOLID). Services depend on
    BaseProvider abstraction rather than concrete Groq or OpenAI SDK classes.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> ProviderResponse:
        """
        Generates text completion asynchronously.
        
        Input: prompt (str), system_prompt (Optional[str]), options
        Output: ProviderResponse object containing content and metadata
        """
        pass
