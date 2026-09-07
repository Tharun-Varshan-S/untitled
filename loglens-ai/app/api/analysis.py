"""
Automated Log Analysis API Route Handler.

Responsibility:
- Receives POST /analyze payload from authenticated Node.js backend.
- Enforces internal authentication using verify_service_key dependency.
- Validates request payload schema using Pydantic AnalysisRequest model.
- Delegates business logic to AnalysisService.
"""

from fastapi import APIRouter, Depends, status
from app.dependencies.auth import verify_service_key
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis_service import AnalysisService
from app.providers.groq_provider import GroqProvider

router = APIRouter(tags=["Log Analysis"])


def get_analysis_service() -> AnalysisService:
    """Dependency provider factory for AnalysisService."""
    return AnalysisService(provider=GroqProvider())


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Automated bulk log root-cause analysis"
)
async def analyze_endpoint(
    request: AnalysisRequest,
    service_key: str = Depends(verify_service_key),
    service: AnalysisService = Depends(get_analysis_service)
):
    """
    POST /analyze endpoint.
    
    Accepts workspaceId, projectId, and logs array.
    Returns structured summary, root cause, severity, and actionable recommendations.
    """
    return await service.analyze_logs(request)

