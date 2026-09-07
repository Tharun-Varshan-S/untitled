"""
AI Chat API Route Handler.

Responsibility:
- Receives POST /chat payload from authenticated Node.js backend.
- Enforces service authentication using verify_service_key dependency.
- Validates request payload schema using Pydantic ChatRequest model.
- Delegates business logic to ChatService.
"""

from fastapi import APIRouter, Depends, status
from app.dependencies.auth import verify_service_key
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.providers.groq_provider import GroqProvider

router = APIRouter(tags=["AI Chat"])


def get_chat_service() -> ChatService:
    """Dependency provider factory for ChatService."""
    return ChatService(provider=GroqProvider())


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Interactive AI log monitoring chat"
)
async def chat_endpoint(
    request: ChatRequest,
    service_key: str = Depends(verify_service_key),
    service: ChatService = Depends(get_chat_service)
):
    """
    POST /chat endpoint.
    
    Accepts workspaceId, projectId, question, and logs.
    Returns AI generated answer with provider, model, latency, and token usage metadata.
    """
    return await service.process_chat(request)

