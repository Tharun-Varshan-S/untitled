"""
Reusable API request fixtures for tests.
"""

from tests.fixtures.logs import SAMPLE_AUTH_LOGS

VALID_CHAT_PAYLOAD = {
    "workspaceId": "ws-test-123",
    "projectId": "proj-test-456",
    "question": "Why are login requests failing?",
    "logs": SAMPLE_AUTH_LOGS
}

VALID_ANALYSIS_PAYLOAD = {
    "workspaceId": "ws-test-123",
    "projectId": "proj-test-456",
    "logs": SAMPLE_AUTH_LOGS
}
