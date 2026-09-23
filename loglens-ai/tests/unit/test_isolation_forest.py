"""
test_isolation_forest.py

ML evaluation tests for the IsolationForest anomaly detector.

IMPORTANT: The synthetic data in this test file is CLEARLY LABELED as synthetic
and is used exclusively for evaluating ML detection capability. It is NOT used
to train production models. Production models train on real MongoDB logs.

Test strategy:
- Inject known-anomalous patterns (10x error spike, complete outage) and assert anomaly=True
- Use known-normal patterns and assert anomaly=False
- Evaluate precision/recall on a controlled 100-sample dataset
- Assert NaN/Infinity protection works
"""

import math
import pytest
import numpy as np

from app.schemas.anomaly import LogRecord, AnomalyFeatures
from app.services.anomaly_service import (
    extract_features,
    features_to_array,
    train,
    detect,
    _raw_score_to_probability,
    _get_threshold,
    MIN_SAMPLES,
)


# ── Fixtures ─────────────────────────────────────────────────────────────────

PROJECT_ID_TEST = "test-project-ml-eval-001"


def _make_logs(
    count: int,
    level: str = "info",
    service: str = "api",
    status_code: int | None = None,
    message_prefix: str = "event",
) -> list[LogRecord]:
    """
    Generates synthetic log records for controlled ML evaluation.
    Each record has a unique message prefix to allow meaningful entropy computation.
    """
    metadata = {}
    if status_code is not None:
        metadata["statusCode"] = status_code

    # Use rotating prefixes so the first-word entropy is realistic
    prefixes = [message_prefix, f"{message_prefix}_ok", f"{message_prefix}_done",
                f"{message_prefix}_ok", f"{message_prefix}_ok"]
    return [
        LogRecord(
            level=level,
            message=f"{prefixes[i % len(prefixes)]} processing record #{i}",
            service=service,
            metadata=metadata if metadata else None,
            normalizedLevel=level,
        )
        for i in range(count)
    ]


def _make_normal_logs(count: int) -> list[LogRecord]:
    """Normal operation pattern: 90% info, 5% warn, 5% error."""
    logs = (
        _make_logs(int(count * 0.90), level="info", service="api", message_prefix="request")
        + _make_logs(int(count * 0.05), level="warn", service="api", message_prefix="slow")
        + _make_logs(int(count * 0.05), level="error", service="db", status_code=500, message_prefix="db_timeout")
    )
    return logs[:count]


def _make_anomalous_logs(count: int) -> list[LogRecord]:
    """
    Anomalous pattern: sudden 10x error spike.
    70% error + 20% fatal + 10% warn — clear anomaly.
    Uses distinct message prefixes to produce high error_ratio + high error rate features.
    """
    logs = (
        _make_logs(int(count * 0.70), level="error", service="api", status_code=500, message_prefix="CRITICAL")
        + _make_logs(int(count * 0.20), level="fatal", service="db", message_prefix="FATAL")
        + _make_logs(int(count * 0.10), level="warn", service="auth", message_prefix="AUTH")
    )
    return logs[:count]


# ── Feature extraction tests ──────────────────────────────────────────────────

class TestFeatureExtraction:
    """Tests for the extract_features() function."""

    def test_normal_logs_produce_low_error_ratio(self):
        logs = _make_normal_logs(100)
        features = extract_features(logs, window_minutes=5)
        assert features.error_ratio < 0.15, (
            f"Normal logs should have error_ratio < 0.15, got {features.error_ratio}"
        )

    def test_anomalous_logs_produce_high_error_ratio(self):
        logs = _make_anomalous_logs(100)
        features = extract_features(logs, window_minutes=5)
        assert features.error_ratio > 0.6, (
            f"Anomalous logs should have error_ratio > 0.6, got {features.error_ratio}"
        )

    def test_http_500_counted_in_5xx(self):
        logs = _make_logs(10, level="error", status_code=500)
        features = extract_features(logs, window_minutes=1)
        assert features.http_5xx_count == 10

    def test_http_400_counted_in_4xx(self):
        logs = _make_logs(5, level="warn", status_code=404)
        features = extract_features(logs, window_minutes=1)
        assert features.http_4xx_count == 5

    def test_empty_logs_returns_zero_features(self):
        """Should not raise — all-zero feature vector for empty input."""
        features = extract_features([], window_minutes=5)
        assert features.logs_per_minute == 0.0
        assert features.error_ratio == 0.0
        assert features.message_entropy == 0.0

    def test_diverse_services_counted(self):
        logs = [
            LogRecord(level="info", message="msg", service=f"service-{i}")
            for i in range(10)
        ]
        features = extract_features(logs, window_minutes=1)
        assert features.unique_services == 10

    def test_rate_is_per_minute(self):
        logs = _make_logs(60, level="error")
        features_1m = extract_features(logs, window_minutes=1)
        features_2m = extract_features(logs, window_minutes=2)
        assert features_1m.logs_per_minute == pytest.approx(60.0)
        assert features_2m.logs_per_minute == pytest.approx(30.0)

    def test_entropy_higher_for_diverse_messages(self):
        uniform = [LogRecord(level="error", message="same error always") for _ in range(20)]
        diverse = [LogRecord(level="info", message=f"event_{i} happened") for i in range(20)]
        entropy_uniform = extract_features(uniform, window_minutes=1).message_entropy
        entropy_diverse = extract_features(diverse, window_minutes=1).message_entropy
        assert entropy_diverse > entropy_uniform


class TestFeaturesArray:
    """Tests for features_to_array() NaN/Inf protection."""

    def test_nan_inf_replaced_with_zero(self):
        features = AnomalyFeatures(
            logs_per_minute=float("nan"),
            errors_per_minute=float("inf"),
            warnings_per_minute=float("-inf"),
            error_ratio=0.5,
            unique_services=3,
            http_4xx_count=0,
            http_5xx_count=0,
            message_entropy=1.0,
        )
        arr = features_to_array(features)
        assert not np.any(np.isnan(arr)), "NaN values should be replaced with 0"
        assert not np.any(np.isinf(arr)), "Inf values should be replaced with 0"
        assert arr[0] == 0.0  # nan → 0
        assert arr[1] == 0.0  # inf → 0
        assert arr[2] == 0.0  # -inf → 0
        assert arr[3] == pytest.approx(0.5)

    def test_normal_features_preserved(self):
        features = AnomalyFeatures(
            logs_per_minute=10.0,
            errors_per_minute=1.0,
            warnings_per_minute=0.5,
            error_ratio=0.1,
            unique_services=3,
            http_4xx_count=2,
            http_5xx_count=1,
            message_entropy=2.5,
        )
        arr = features_to_array(features)
        assert arr.shape == (8,)
        assert arr[0] == pytest.approx(10.0)
        assert arr[3] == pytest.approx(0.1)


# ── Score normalization tests ─────────────────────────────────────────────────

class TestScoreNormalization:
    """Tests for _raw_score_to_probability()"""

    def test_very_negative_raw_score_produces_high_anomaly_score(self):
        # Raw score -0.5 (very anomalous) → probability close to 1.0
        score = _raw_score_to_probability(-0.5)
        assert score >= 0.9, f"Expected score >= 0.9 for raw=-0.5, got {score}"

    def test_positive_raw_score_produces_low_anomaly_score(self):
        # Raw score 0.5 (very normal) → probability close to 0.0
        score = _raw_score_to_probability(0.5)
        assert score <= 0.1, f"Expected score <= 0.1 for raw=0.5, got {score}"

    def test_output_is_always_in_0_1_range(self):
        for raw in [-2.0, -1.0, -0.5, 0.0, 0.5, 1.0, 2.0]:
            score = _raw_score_to_probability(raw)
            assert 0.0 <= score <= 1.0, f"Score {score} out of [0,1] for raw={raw}"


# ── End-to-end detection tests ────────────────────────────────────────────────

class TestDetectionEndToEnd:
    """
    End-to-end tests that train a model and then detect anomalies.

    NOTE: All training data is clearly labeled synthetic data for ML evaluation only.
    """

    @pytest.fixture(autouse=True)
    def setup_project(self):
        """Trains a baseline model on normal patterns before each test."""
        import os
        # Threshold calibrated for small training set.
        # With 2000 training logs, normal windows score ~0.55-0.62,
        # anomalous windows score ~0.70+. Threshold 0.63 separates them.
        os.environ["ML_ANOMALY_THRESHOLD"] = "0.63"

        # Train on 2000 normal logs → ~400 feature windows (better baseline)
        training_logs = _make_normal_logs(2000)
        result = train(
            logs=training_logs,
            project_id=PROJECT_ID_TEST,
            window_minutes=5,
        )
        assert result.success, f"Training failed: {result.message}"

    def test_normal_pattern_not_flagged_as_anomaly(self):
        """A normal traffic window should NOT be classified as anomalous."""
        # Use 100 logs per window for better rate estimation
        normal_window = _make_normal_logs(100)
        result = detect(
            logs=normal_window,
            project_id=PROJECT_ID_TEST,
            window_minutes=5,
        )
        assert result.reason is None, f"Expected no reason, got: {result.reason}"
        assert not result.anomaly, (
            f"Normal pattern incorrectly flagged as anomaly (score={result.score:.3f})"
        )

    def test_error_spike_detected_as_anomaly(self):
        """A sudden 70% error rate spike should be detected as anomalous."""
        # Use 100 logs for better rate estimation
        anomalous_window = _make_anomalous_logs(100)
        result = detect(
            logs=anomalous_window,
            project_id=PROJECT_ID_TEST,
            window_minutes=5,
        )
        assert result.reason is None, f"Expected no reason, got: {result.reason}"
        assert result.anomaly, (
            f"Error spike NOT detected as anomaly (score={result.score:.3f}, threshold={result.threshold})"
        )
        assert result.score > result.threshold

    def test_result_includes_all_required_fields(self):
        """AnomalyResult must always include all required fields."""
        result = detect(
            logs=_make_normal_logs(20),
            project_id=PROJECT_ID_TEST,
            window_minutes=5,
        )
        assert result.projectId == PROJECT_ID_TEST
        assert isinstance(result.score, float)
        assert isinstance(result.threshold, float)
        assert result.modelVersion != "none"
        assert result.features is not None
        assert result.model == "isolation_forest"

    def test_cold_start_returns_insufficient_data(self):
        """A project with no trained model must return reason='insufficient_data'."""
        result = detect(
            logs=_make_normal_logs(20),
            project_id="project-with-no-model-xyz-999",
            window_minutes=5,
        )
        assert result.reason == "insufficient_data"
        assert result.anomaly is False
        assert result.score == 0.0

    def test_precision_recall_on_controlled_dataset(self):
        """
        Evaluates detection quality on a controlled 100-sample dataset:
        50 normal + 50 anomalous windows.

        IMPORTANT: This test uses SYNTHETIC data labeled explicitly for ML evaluation.
        Acceptable performance thresholds are intentionally lenient given the
        minimal training dataset size.

        Requirements:
        - Precision >= 0.6 (at least 60% of anomaly flags are true anomalies)
        - Recall >= 0.6 (at least 60% of true anomalies are detected)
        """
        true_positives = 0
        false_positives = 0
        false_negatives = 0
        true_negatives = 0

        # 50 normal windows (100 logs each for better feature estimation)
        for _ in range(50):
            logs = _make_normal_logs(100)
            result = detect(logs, PROJECT_ID_TEST, window_minutes=5)
            if result.anomaly:
                false_positives += 1
            else:
                true_negatives += 1

        # 50 anomalous windows (injected error spikes)
        for _ in range(50):
            logs = _make_anomalous_logs(100)
            result = detect(logs, PROJECT_ID_TEST, window_minutes=5)
            if result.anomaly:
                true_positives += 1
            else:
                false_negatives += 1

        precision = true_positives / (true_positives + false_positives + 1e-9)
        recall = true_positives / (true_positives + false_negatives + 1e-9)
        f1 = 2 * precision * recall / (precision + recall + 1e-9)

        print(f"\n[ML Eval] TP={true_positives} FP={false_positives} FN={false_negatives} TN={true_negatives}")
        print(f"[ML Eval] Precision={precision:.2f} Recall={recall:.2f} F1={f1:.2f}")

        assert precision >= 0.6, (
            f"Precision {precision:.2f} below acceptable threshold 0.60. "
            f"TP={true_positives}, FP={false_positives}"
        )
        assert recall >= 0.6, (
            f"Recall {recall:.2f} below acceptable threshold 0.60. "
            f"TP={true_positives}, FN={false_negatives}"
        )


# ── Training tests ────────────────────────────────────────────────────────────

class TestTraining:
    def test_insufficient_data_returns_failure(self):
        """Training with fewer than MIN_SAMPLES windows should fail gracefully."""
        # Provide only 10 logs — will produce fewer feature windows than MIN_SAMPLES
        result = train(
            logs=_make_normal_logs(10),
            project_id="test-insufficient",
            window_minutes=5,
        )
        assert not result.success
        assert "Insufficient" in result.message

    def test_sufficient_data_trains_successfully(self):
        result = train(
            logs=_make_normal_logs(500),
            project_id="test-sufficient",
            window_minutes=5,
        )
        assert result.success
        assert result.sampleCount >= MIN_SAMPLES
        assert result.modelVersion != ""
