"""
Pydantic v2 Request & Response schemas for /chat API endpoint.

Responsibility:
- Defines request payload model with strict field validation.
- Defines structured response format matching Node.js backend expectation.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class ChatRequest(BaseModel):
    """
    Request model for AI Chat Endpoint.
    
    Validation:
    - workspaceId: non-empty string
    - projectId: non-empty string
    - question: 3-1000 characters
    - logs: list of log strings
    """
    workspaceId: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Target LogLens Workspace identifier."
    )
    projectId: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Target LogLens Project identifier."
    )
    question: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="User prompt or troubleshooting question for AI."
    )
    logs: List[str] = Field(
        default_factory=list,
        description="List of raw log strings for context."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "workspaceId": "ws-12345",
                "projectId": "proj-67890",
                "question": "Why are login requests failing with status 500?",
                "logs": [
                    "[2026-08-11T12:00:01Z] ERROR [auth-service] DB connection timeout to PostgreSQL: 5432",
                    "[2026-08-11T12:00:02Z] WARN [api-gateway] Request POST /api/auth/login failed with HTTP 500"
                ]
            }
        }
    )


class ChatResponse(BaseModel):
    """
    Response model for AI Chat Endpoint.
    """
    success: bool = Field(default=True, description="Success status flag.")
    answer: str = Field(..., description="AI generated answer string.")
    provider: str = Field(..., description="LLM provider name (e.g. groq).")
    model: str = Field(..., description="LLM model name.")
    latency: float = Field(..., description="Response latency in milliseconds.")
    tokenUsage: Dict[str, int] = Field(
        default_factory=dict,
        description="Metadata detailing prompt, completion, and total tokens."
    )
