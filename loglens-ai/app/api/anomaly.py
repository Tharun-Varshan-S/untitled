"""
anomaly.py — FastAPI router for Isolation Forest anomaly detection.

Endpoints:
- POST /api/v1/anomaly/detect — Score a window of log records
- POST /api/v1/anomaly/train  — Train/retrain model from historical logs
- GET  /api/v1/anomaly/status — Model version, training date, sample count

All endpoints require X-Service-Key authentication (same as other internal routes).
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import verify_service_key
from app.schemas.anomaly import (
    AnomalyRequest,
    AnomalyResult,
    AnomalyStatusResult,
    TrainRequest,
    TrainResult,
)
from app.services import anomaly_service
from app.utils.logger import get_logger

logger = get_logger("loglens_ai.api.anomaly")

router = APIRouter(
    prefix="/api/v1/anomaly",
    tags=["anomaly"],
    dependencies=[Depends(verify_service_key)],
)


@router.post(
    "/detect",
    response_model=AnomalyResult,
    summary="Detect anomalies in a window of log records",
    description=(
        "Accepts a batch of log records representing a time window, "
        "extracts numerical features, and runs the trained IsolationForest model "
        "to produce an anomaly score and binary classification. "
        "Returns reason='insufficient_data' if the model has not been trained yet."
    ),
)
async def detect_anomaly(request: AnomalyRequest) -> AnomalyResult:
    logger.info(
        f"Anomaly detection request: project={request.projectId}, "
        f"logs={len(request.logs)}, window={request.windowMinutes}m"
    )
    result = anomaly_service.detect(
        logs=request.logs,
        project_id=request.projectId,
        window_minutes=request.windowMinutes,
    )
    logger.info(
        f"Anomaly result: project={request.projectId}, anomaly={result.anomaly}, "
        f"score={result.score:.3f}, reason={result.reason}"
    )
    return result


@router.post(
    "/train",
    response_model=TrainResult,
    summary="Train Isolation Forest model from historical logs",
    description=(
        "Trains (or retrains) the IsolationForest anomaly detection model for a project "
        "using historical log records. Requires at least 50 log records. "
        "Model is persisted to disk and used by subsequent /detect calls."
    ),
)
async def train_model(request: TrainRequest) -> TrainResult:
    logger.info(
        f"Training request: project={request.projectId}, logs={len(request.logs)}"
    )
    result = anomaly_service.train(
        logs=request.logs,
        project_id=request.projectId,
        window_minutes=request.windowMinutes,
    )
    if result.success:
        logger.info(
            f"Training complete: project={request.projectId}, "
            f"samples={result.sampleCount}, version={result.modelVersion}"
        )
    else:
        logger.warning(f"Training failed: project={request.projectId}, reason={result.message}")
    return result


@router.get(
    "/status",
    response_model=AnomalyStatusResult,
    summary="Get anomaly model status for a project",
    description="Returns model version, training date, and sample count for the project's model.",
)
async def get_anomaly_status(projectId: str) -> AnomalyStatusResult:
    return anomaly_service.get_status(project_id=projectId)
