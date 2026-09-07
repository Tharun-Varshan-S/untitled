"""
Middleware package initializer
"""
from app.middleware.logging import RequestLoggingMiddleware

__all__ = ["RequestLoggingMiddleware"]
