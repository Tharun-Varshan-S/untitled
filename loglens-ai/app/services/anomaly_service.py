"""
anomaly_service.py — IsolationForest-based anomaly detection.

Architecture:
- One model per project, stored on disk (joblib pickle).
- Feature extraction from a time window of log records.
- Threshold configurable via environment variable.
- Cold-start handling: returns reason='insufficient_data' if < MIN_SAMPLES.
- All numeric operations are guarded against NaN/Infinity.

Design constraints (mandated by architecture):
- scikit-learn IsolationForest only — no LLM-based anomaly detection.
- The LLM (Groq) is for investigation/correlation, NOT for anomaly detection.
"""

from __future__ import annotations

import math
import os
import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
from joblib import dump, load
from sklearn.ensemble import IsolationForest

from app.schemas.anomaly import (
    AnomalyFeatures,
    AnomalyResult,
    LogRecord,
    TrainResult,
    AnomalyStatusResult,
)

logger = logging.getLogger("loglens_ai.anomaly_service")

# ── Constants ─────────────────────────────────────────────────────────────────

# Minimum number of feature vectors required before we attempt training.
# Below this threshold we return reason='insufficient_data'.
MIN_SAMPLES = 50

# IsolationForest configuration — fixed for reproducibility
IF_CONFIG = {
    "n_estimators": 100,
    "contamination": 0.05,  # Expected ~5% anomaly rate in production logs
    "random_state": 42,
    "max_samples": "auto",
    "n_jobs": -1,           # Use all available CPUs for training
}

# Default anomaly score threshold (0.0-1.0)
# Logs with score >= threshold are classified as anomalous.
def _get_threshold() -> float:
    """Reads the anomaly threshold from environment at call time (testable)."""
    return float(os.getenv("ML_ANOMALY_THRESHOLD", "0.7"))

# Persistance directory for trained models
MODEL_DIR = Path(os.getenv("ML_MODEL_DIR", "/tmp/loglens_models"))
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ── Feature extraction ────────────────────────────────────────────────────────

def extract_features(logs: List[LogRecord], window_minutes: int) -> AnomalyFeatures:
    """
    Extracts a fixed-length numerical feature vector from a window of log records.
    All features are normalized per-minute rates or ratios to be window-size agnostic.

    Guarded against:
    - Division by zero (window_minutes=0, total_logs=0)
    - NaN/Infinity from empty inputs
    - Missing metadata fields
    """
    total = len(logs)
    window_m = max(window_minutes, 1)  # Guard division by zero

    # Level counts
    level_counts = {"error": 0, "fatal": 0, "warn": 0, "warning": 0, "info": 0, "debug": 0}
    for log in logs:
        level = (log.normalizedLevel or log.level or "info").strip().lower()
        if level in level_counts:
            level_counts[level] += 1

    error_count = level_counts["error"] + level_counts["fatal"]
    warn_count = level_counts["warn"] + level_counts["warning"]

    # Service diversity
    unique_services = len({log.service for log in logs if log.service})

    # HTTP status codes from metadata
    http_4xx = 0
    http_5xx = 0
    for log in logs:
        if log.metadata and isinstance(log.metadata, dict):
            status = (
                log.metadata.get("statusCode")
                or log.metadata.get("status_code")
                or log.metadata.get("httpStatus")
                or log.metadata.get("status")
            )
            if status is not None:
                code = _safe_int(status)
                if code is not None:
                    if 400 <= code < 500:
                        http_4xx += 1
                    elif 500 <= code < 600:
                        http_5xx += 1

    # Message entropy — measures vocabulary diversity (low entropy = repeated errors)
    entropy = _compute_message_entropy(logs)

    return AnomalyFeatures(
        logs_per_minute=_safe_rate(total, window_m),
        errors_per_minute=_safe_rate(error_count, window_m),
        warnings_per_minute=_safe_rate(warn_count, window_m),
        error_ratio=_safe_ratio(error_count, total),
        unique_services=unique_services,
        http_4xx_count=http_4xx,
        http_5xx_count=http_5xx,
        message_entropy=entropy,
    )


def features_to_array(features: AnomalyFeatures) -> np.ndarray:
    """Converts AnomalyFeatures to a numpy array for sklearn."""
    arr = np.array([
        features.logs_per_minute,
        features.errors_per_minute,
        features.warnings_per_minute,
        features.error_ratio,
        float(features.unique_services),
        float(features.http_4xx_count),
        float(features.http_5xx_count),
        features.message_entropy,
    ], dtype=np.float64)
    # Replace any NaN/Inf with 0.0 — defense against edge case inputs
    arr = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)
    return arr


# ── Model persistence ─────────────────────────────────────────────────────────

def _model_path(project_id: str) -> Path:
    safe_id = hashlib.sha256(project_id.encode()).hexdigest()[:16]
    return MODEL_DIR / f"if_model_{safe_id}.joblib"


def _meta_path(project_id: str) -> Path:
    safe_id = hashlib.sha256(project_id.encode()).hexdigest()[:16]
    return MODEL_DIR / f"if_meta_{safe_id}.joblib"


def _load_model(project_id: str) -> Optional[Tuple[IsolationForest, dict]]:
    mpath = _model_path(project_id)
    metapath = _meta_path(project_id)
    if not mpath.exists() or not metapath.exists():
        return None
    try:
        model = load(mpath)
        meta = load(metapath)
        return model, meta
    except Exception as exc:
        logger.warning(f"Failed to load model for project {project_id}: {exc}")
        return None


def _save_model(project_id: str, model: IsolationForest, meta: dict) -> None:
    dump(model, _model_path(project_id))
    dump(meta, _meta_path(project_id))


# ── Core detection ────────────────────────────────────────────────────────────

def _raw_score_to_probability(raw_score: float) -> float:
    """
    Converts scikit-learn IsolationForest decision_function output
    to a [0.0, 1.0] anomaly probability.

    IsolationForest.decision_function() returns:
    - Positive values → normal (closer to 0 = more normal)
    - Negative values → anomalous (more negative = more anomalous)

    Mapping: score = (raw_score * -1 + max_expected) / scale, clipped to [0, 1]
    """
    # Typical decision_function range is roughly [-0.5, 0.5]
    # We map -0.5 → 1.0 (very anomalous), 0.5 → 0.0 (very normal)
    normalized = (-raw_score + 0.5) / 1.0
    return float(np.clip(normalized, 0.0, 1.0))


def detect(
    logs: List[LogRecord],
    project_id: str,
    window_minutes: int,
    threshold: Optional[float] = None,
) -> AnomalyResult:
    """
    Primary entry point: extracts features from a window of logs and
    runs the trained Isolation Forest model to produce an anomaly decision.

    Returns a complete AnomalyResult. Never raises — all errors are captured
    in the result's reason field.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    features = extract_features(logs, window_minutes)
    effective_threshold = threshold if threshold is not None else _get_threshold()

    # Load model
    model_data = _load_model(project_id)
    if model_data is None:
        logger.warning(f"No trained model for project {project_id}. Returning insufficient_data.")
        return AnomalyResult(
            anomaly=False,
            score=0.0,
            threshold=effective_threshold,
            timestamp=now_iso,
            projectId=project_id,
            windowMinutes=window_minutes,
            sampleCount=len(logs),
            features=features,
            modelVersion="none",
            reason="insufficient_data",
        )

    model, meta = model_data
    sample_count = meta.get("sample_count", 0)

    if sample_count < MIN_SAMPLES:
        return AnomalyResult(
            anomaly=False,
            score=0.0,
            threshold=effective_threshold,
            timestamp=now_iso,
            projectId=project_id,
            windowMinutes=window_minutes,
            sampleCount=len(logs),
            features=features,
            modelVersion=meta.get("version", "unknown"),
            reason="insufficient_data",
        )

    X = features_to_array(features).reshape(1, -1)
    try:
        raw_score = float(model.decision_function(X)[0])
        score = _raw_score_to_probability(raw_score)
        is_anomaly = score >= effective_threshold

        return AnomalyResult(
            anomaly=is_anomaly,
            score=score,
            threshold=effective_threshold,
            timestamp=now_iso,
            projectId=project_id,
            windowMinutes=window_minutes,
            sampleCount=len(logs),
            features=features,
            modelVersion=meta.get("version", "unknown"),
            reason=None,
        )
    except Exception as exc:
        logger.error(f"Isolation Forest inference failed for project {project_id}: {exc}")
        return AnomalyResult(
            anomaly=False,
            score=0.0,
            threshold=effective_threshold,
            timestamp=now_iso,
            projectId=project_id,
            windowMinutes=window_minutes,
            sampleCount=len(logs),
            features=features,
            modelVersion=meta.get("version", "unknown"),
            reason="model_unavailable",
        )


def train(
    logs: List[LogRecord],
    project_id: str,
    window_minutes: int,
) -> TrainResult:
    """
    Trains (or retrains) the Isolation Forest model for a project.
    Processes logs in sliding windows to build the feature matrix.

    Requires at least MIN_SAMPLES windows. Returns an error result if not.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    version = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    # Build feature matrix from sliding windows
    step = max(len(logs) // 200, 1)  # Up to 200 windows
    window_size = max(len(logs) // 100, 10)

    feature_vectors = []
    for start in range(0, len(logs), step):
        window_logs = logs[start : start + window_size]
        if not window_logs:
            continue
        feat = extract_features(window_logs, window_minutes)
        arr = features_to_array(feat)
        feature_vectors.append(arr)

    if len(feature_vectors) < MIN_SAMPLES:
        return TrainResult(
            success=False,
            projectId=project_id,
            sampleCount=len(feature_vectors),
            modelVersion=version,
            trainedAt=now_iso,
            message=f"Insufficient data: {len(feature_vectors)} feature vectors < {MIN_SAMPLES} required.",
        )

    X = np.vstack(feature_vectors)
    model = IsolationForest(**IF_CONFIG)
    model.fit(X)

    meta = {
        "version": version,
        "trained_at": now_iso,
        "sample_count": len(feature_vectors),
        "log_count": len(logs),
        "threshold": _get_threshold(),
    }
    _save_model(project_id, model, meta)

    logger.info(f"Trained IsolationForest for project {project_id}: {len(feature_vectors)} feature vectors.")

    return TrainResult(
        success=True,
        projectId=project_id,
        sampleCount=len(feature_vectors),
        modelVersion=version,
        trainedAt=now_iso,
        message=f"Model trained on {len(feature_vectors)} feature vectors from {len(logs)} log records.",
    )


def get_status(project_id: str) -> AnomalyStatusResult:
    """Returns current model status for a project."""
    model_data = _load_model(project_id)
    if model_data is None:
        return AnomalyStatusResult(
            available=False,
            threshold=_get_threshold(),
            message="No trained model available for this project.",
        )
    _, meta = model_data
    return AnomalyStatusResult(
        available=True,
        modelVersion=meta.get("version"),
        trainedAt=meta.get("trained_at"),
        sampleCount=meta.get("sample_count"),
        threshold=_get_threshold(),
        message="Model is available.",
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_rate(count: int, per_minutes: int) -> float:
    if per_minutes <= 0:
        return 0.0
    return float(count) / float(per_minutes)


def _safe_ratio(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return float(numerator) / float(denominator)


def _safe_int(value: object) -> Optional[int]:
    try:
        return int(str(value))
    except (ValueError, TypeError):
        return None


def _compute_message_entropy(logs: List[LogRecord]) -> float:
    """
    Computes Shannon entropy of the first word of each log message.
    Low entropy = many identical messages (repeated error pattern).
    High entropy = diverse messages (normal operation).
    """
    if not logs:
        return 0.0

    # Use the first word of the message as a token
    tokens: list[str] = []
    for log in logs:
        msg = log.message.strip()
        if msg:
            first_word = msg.split()[0].lower()
            tokens.append(first_word)

    if not tokens:
        return 0.0

    total = len(tokens)
    freq: dict[str, int] = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + 1

    entropy = 0.0
    for count in freq.values():
        p = count / total
        entropy -= p * math.log2(p)

    return entropy
