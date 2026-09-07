"""
Health Check API Route.

Responsibility:
- Provides lightweight GET /health endpoint for Docker health checks, load balancers, and container monitoring probes.
- Unauthenticated public route.
"""

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Application health status.")


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check probe"
)
async def health_check():
    """
    Returns service health status.
    """
    return HealthResponse(status="healthy")
