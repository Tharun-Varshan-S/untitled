"""
API routers package initializer
"""
from app.api.health import router as health_router
from app.api.chat import router as chat_router
from app.api.analysis import router as analysis_router

__all__ = ["health_router", "chat_router", "analysis_router"]
