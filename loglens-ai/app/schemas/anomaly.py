"""
anomaly.py — Pydantic schemas for anomaly detection API.

All schemas use strict types and validators to prevent malformed
payloads from reaching the ML service.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class LogRecord(BaseModel):
    """Minimal representation of a log entry used as ML feature input."""
    level: str = Field(..., description="Log severity level (error, warn, info, debug, fatal)")
    message: str = Field(..., min_length=1, max_length=10_000)
    service: Optional[str] = None
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    normalizedLevel: Optional[str] = None
    errorCategory: Optional[str] = None
    fingerprint: Optional[str] = None

    @field_validator("level")
    @classmethod
    def normalize_level(cls, v: str) -> str:
        return v.strip().lower()


class AnomalyRequest(BaseModel):
    """Request body for POST /api/v1/anomaly/detect"""
    projectId: str = Field(..., min_length=1, max_length=64)
    logs: List[LogRecord] = Field(..., min_length=1, max_length=5000,
                                   description="Log records in the detection window")
    windowMinutes: int = Field(default=5, ge=1, le=60,
                                description="Time window size in minutes for rate calculations")


class AnomalyFeatures(BaseModel):
    """Feature vector that was computed for the anomaly decision."""
    logs_per_minute: float
    errors_per_minute: float
    warnings_per_minute: float
    error_ratio: float
    unique_services: int
    http_4xx_count: int
    http_5xx_count: int
    message_entropy: float


class AnomalyResult(BaseModel):
    """Response from POST /api/v1/anomaly/detect"""
    anomaly: bool
    score: float = Field(..., ge=0.0, le=1.0,
                          description="Anomaly score 0.0-1.0; higher = more anomalous")
    threshold: float
    timestamp: str
    projectId: str
    windowMinutes: int
    sampleCount: int
    features: AnomalyFeatures
    model: str = "isolation_forest"
    modelVersion: str
    reason: Optional[str] = Field(
        default=None,
        description="Set when result is inconclusive: 'insufficient_data' | 'model_unavailable'"
    )


class TrainRequest(BaseModel):
    """Request body for POST /api/v1/anomaly/train"""
    projectId: str = Field(..., min_length=1, max_length=64)
    logs: List[LogRecord] = Field(..., min_length=50, max_length=100_000,
                                   description="Historical log records for training baseline")
    windowMinutes: int = Field(default=5, ge=1, le=60)


class TrainResult(BaseModel):
    """Response from POST /api/v1/anomaly/train"""
    success: bool
    projectId: str
    sampleCount: int
    modelVersion: str
    trainedAt: str
    message: str


class AnomalyStatusResult(BaseModel):
    """Response from GET /api/v1/anomaly/status"""
    available: bool
    modelVersion: Optional[str] = None
    trainedAt: Optional[str] = None
    sampleCount: Optional[int] = None
    threshold: float
    message: str
