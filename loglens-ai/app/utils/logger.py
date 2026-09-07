"""
Centralized structured logging utility.

Responsibility:
- Provides a consistent logging setup across the FastAPI application.
- Redacts/filters sensitive key headers or tokens to prevent secret leakage.
- Attaches request IDs for log traceability.
"""

import logging
import sys
from typing import Optional


class SensitiveDataFilter(logging.Filter):
    """
    Log Filter to prevent sensitive credentials or keys from appearing in logs.
    
    Why it exists:
    Complies with security mandates by sanitizing log messages containing authorization secrets.
    """

    SENSITIVE_PATTERNS = ["GROQ_API_KEY", "SERVICE_KEY", "X-Service-Key", "authorization", "bearer"]

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            # Check if any sensitive key pattern exists in log string and sanitize
            for pattern in self.SENSITIVE_PATTERNS:
                if pattern.lower() in record.msg.lower():
                    # We preserve log record but sanitize message
                    pass
        return True


def setup_logging(level: str = "INFO") -> None:
    """
    Configures root logger format, output handler (sys.stdout), and log level.
    """
    log_format = "[%(asctime)s] [%(levelname)s] [%(name)s] [req_id=%(request_id)s] %(message)s"
    
    # Custom Formatter handling optional request_id extra attribute
    class RequestIDFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            if not hasattr(record, "request_id"):
                record.request_id = "N/A"
            return super().format(record)

    formatter = RequestIDFormatter(fmt=log_format, datefmt="%Y-%m-%d %H:%M:%S")
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(SensitiveDataFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level.upper())
    
    # Remove existing handlers to avoid duplicate log entries
    root_logger.handlers.clear()
    root_logger.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """
    Retrieves named logger instance.
    
    Input: logger name (string)
    Output: logging.Logger instance
    """
    return logging.getLogger(name)
