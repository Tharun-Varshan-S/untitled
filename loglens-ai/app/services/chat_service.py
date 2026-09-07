"""
Chat Application Service Layer.

Responsibility:
- Encapsulates business logic for /chat API endpoint.
- Uses PromptBuilder to construct grounded prompts.
- Calls BaseProvider abstraction for LLM completion.
- Transforms ProviderResponse into Pydantic ChatResponse model.
"""

from typing import Optional
from app.providers.base_provider import BaseProvider
from app.providers.groq_provider import GroqProvider
from app.core.prompt_builder import PromptBuilder, SYSTEM_CHAT_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ChatService:
    """
    Chat Service class.
    
    Why it exists:
    Decouples route handlers from AI provider generation and prompt formatting logic.
    Follows Dependency Injection by accepting any BaseProvider implementation.
    """

    def __init__(self, provider: Optional[BaseProvider] = None):
        self.provider = provider or GroqProvider()

    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        """
        Processes AI chat request.
        
        Input: ChatRequest DTO
        Output: ChatResponse DTO
        
        Flow:
        1. Construct prompt using PromptBuilder
        2. Invoke provider.generate()
        3. Format and return ChatResponse
        """
        logger.info(f"Processing chat question for workspace={request.workspaceId}, project={request.projectId}")
        
        prompt = PromptBuilder.build_chat_prompt(
            question=request.question,
            logs=request.logs
        )

        response = await self.provider.generate(
            prompt=prompt,
            system_prompt=SYSTEM_CHAT_PROMPT
        )

        return ChatResponse(
            success=True,
            answer=response.content,
            provider=response.provider,
            model=response.model,
            latency=response.latency_ms,
            tokenUsage=response.token_usage
        )
