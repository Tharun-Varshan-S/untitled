"""
Pydantic v2 Request & Response schemas for /analyze API endpoint.

Responsibility:
- Defines request payload model for bulk log root-cause analysis.
- Defines structured response model containing summary, root cause, severity, and recommendations.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class AnalysisRequest(BaseModel):
    """
    Request payload model for /analyze endpoint.
    """
    workspaceId: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Target LogLens Workspace ID."
    )
    projectId: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Target LogLens Project ID."
    )
    logs: List[str] = Field(
        ...,
        min_length=1,
        description="Array of log entries to analyze."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "workspaceId": "ws-12345",
                "projectId": "proj-67890",
                "logs": [
                    "2026-08-11T12:00:00Z [ERROR] Database connection lost (connection reset by peer)",
                    "2026-08-11T12:00:01Z [CRITICAL] Connection pool exhausted. Waiting threads: 15"
                ]
            }
        }
    )


class AnalysisResponse(BaseModel):
    """
    Structured Response model for /analyze endpoint.
    """
    success: bool = Field(default=True, description="Operation success status.")
    summary: str = Field(..., description="High-level summary of log findings.")
    rootCause: str = Field(..., description="Technical root cause analysis.")
    severity: str = Field(..., description="Assessed severity level: low, medium, high, or critical.")
    recommendation: str = Field(..., description="Actionable remediation steps.")
    provider: str = Field(..., description="AI Provider identifier (groq).")
    model: str = Field(..., description="LLM model name used.")
    latency: float = Field(..., description="Processing latency in milliseconds.")
    tokenUsage: Dict[str, int] = Field(
        default_factory=dict,
        description="Token usage stats."
    )
