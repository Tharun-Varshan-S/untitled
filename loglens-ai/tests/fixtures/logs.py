"""
Reusable log data fixtures for tests.
"""

SAMPLE_AUTH_LOGS = [
    "2026-08-11T12:00:01Z ERROR [auth-service] DB connection timeout to PostgreSQL:5432 after 5000ms",
    "2026-08-11T12:00:02Z WARN [api-gateway] Request POST /api/v1/auth/login failed with HTTP 500",
    "2026-08-11T12:00:03Z ERROR [auth-service] Fatal: PoolExhaustedError - Max pool size of 20 connections reached"
]

SAMPLE_CRITICAL_LOGS = [
    "2026-08-11T12:05:00Z CRITICAL [payment-service] Stripe webhook signature verification failed",
    "2026-08-11T12:05:01Z ERROR [checkout] Transaction tx_998822 aborted due to invalid signature"
]

EMPTY_LOGS = []

VERY_LARGE_LOGS = [f"2026-08-11T12:00:{idx:02d}Z INFO [worker-{idx}] Processing batch task" for idx in range(200)]
