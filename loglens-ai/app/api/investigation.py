"""
investigation.py — FastAPI router for bounded AI investigation.

Endpoint:
- POST /api/v1/investigate — Run investigation on an anomaly event's evidence

Protected by X-Service-Key. Called by the Node.js backend after evidence retrieval.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.dependencies.auth import verify_service_key
from app.services import investigation_service
from app.utils.logger import get_logger

logger = get_logger("loglens_ai.api.investigation")

router = APIRouter(
    prefix="/api/v1/investigate",
    tags=["investigation"],
    dependencies=[Depends(verify_service_key)],
)


# ── Request / Response schemas ────────────────────────────────────────────────

class EvidenceLogPayload(BaseModel):
    id: str
    level: str
    message: str
    service: str
    timestamp: str
    traceId: Optional[str] = None
    requestId: Optional[str] = None
    environment: Optional[str] = None
    errorCategory: Optional[str] = None
    fingerprint: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class EvidenceRationalePayload(BaseModel):
    logId: str
    reason: str


class InvestigateRequest(BaseModel):
    projectId: str = Field(..., min_length=1, max_length=64)
    anomalyScore: float = Field(..., ge=0.0, le=1.0)
    windowMinutes: int = Field(default=5, ge=1, le=60)
    evidenceLogs: List[EvidenceLogPayload] = Field(..., max_length=50)
    rationale: List[EvidenceRationalePayload] = Field(default_factory=list, max_length=50)


class SuspectedCauseResponse(BaseModel):
    cause: str
    type: str
    evidence_ids: List[str]


class SupportingEvidenceResponse(BaseModel):
    log_id: str
    relevance: str


class TimelineEventResponse(BaseModel):
    timestamp: str
    event: str


class InvestigationResponse(BaseModel):
    projectId: str
    summary: str
    suspected_causes: List[SuspectedCauseResponse]
    supporting_evidence: List[SupportingEvidenceResponse]
    timeline: List[TimelineEventResponse]
    confidence: float
    unknowns: List[str]
    evidenceCount: int
    contextTruncated: bool
    model: str


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=InvestigationResponse,
    summary="Run bounded AI investigation on anomaly evidence",
    description=(
        "Accepts structured evidence logs gathered around an anomaly event and "
        "runs the bounded LLM investigator. All log content is sandboxed to prevent "
        "prompt injection. Returns a structured investigation with confidence score."
    ),
)
async def investigate(request: InvestigateRequest) -> InvestigationResponse:
    logger.info(
        f"Investigation request: project={request.projectId}, "
        f"evidence={len(request.evidenceLogs)}, score={request.anomalyScore:.3f}"
    )

    # Convert Pydantic models to plain dicts for the service layer
    evidence_dicts = [log.model_dump() for log in request.evidenceLogs]
    rationale_dicts = [r.model_dump() for r in request.rationale]

    result = investigation_service.investigate(
        anomaly_score=request.anomalyScore,
        window_minutes=request.windowMinutes,
        project_id=request.projectId,
        evidence_logs=evidence_dicts,
        rationale=rationale_dicts,
    )

    # Detect if context was truncated by counting evidence
    context_truncated = len(request.evidenceLogs) > 0 and result.get("confidence", 0) == 0.0 and "truncated" in result.get("summary", "").lower()

    logger.info(
        f"Investigation complete: project={request.projectId}, "
        f"confidence={result['confidence']:.2f}"
    )

    return InvestigationResponse(
        projectId=request.projectId,
        summary=result["summary"],
        suspected_causes=result.get("suspected_causes", []),
        supporting_evidence=result.get("supporting_evidence", []),
        timeline=result.get("timeline", []),
        confidence=result["confidence"],
        unknowns=result.get("unknowns", []),
        evidenceCount=len(request.evidenceLogs),
        contextTruncated=context_truncated,
        model="groq/" + "llama-3.3-70b-versatile",
    )
