"""
Main FastAPI Application Entry Point.

Responsibility:
- Initializes FastAPI application instance.
- Configures CORS, Request Logging Middleware, and exception handlers.
- Includes API route modules.
- Handles startup and shutdown lifespan events.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.utils.logger import setup_logging, get_logger
from app.middleware.logging import RequestLoggingMiddleware
from app.core.exceptions import setup_exception_handlers
from app.api.health import router as health_router
from app.api.chat import router as chat_router
from app.api.analysis import router as analysis_router
from app.api.anomaly import router as anomaly_router
from app.api.investigation import router as investigation_router

# Initialize structured logging
setup_logging(settings.LOG_LEVEL)
logger = get_logger("loglens_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Event Handler.
    Runs startup and shutdown actions.
    """
    logger.info(f"Starting LogLens AI Service in environment={settings.ENVIRONMENT}, model={settings.MODEL}")
    yield
    logger.info("Shutting down LogLens AI Service")


def create_app() -> FastAPI:
    """
    FastAPI Application Factory.
    
    Why it exists:
    Factory pattern enables creating fresh application instances for unit & integration tests.
    """
    app = FastAPI(
        title="LogLens AI Service",
        description="Production AI microservice for LogLens log monitoring & observability platform using Groq LLM.",
        version="1.0.0",
        lifespan=lifespan
    )

    # Configure CORS Middleware
    # Origins must be configured explicitly in production via ALLOWED_ORIGINS env var.
    # Never use ['*'] in production — it allows any origin to make authenticated requests.
    import os
    raw_origins = os.getenv("ALLOWED_ORIGINS", "")
    if raw_origins.strip():
        allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    else:
        # Development fallback — restrict to localhost
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:4000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:4000",
        ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Service-Key", "X-Request-ID"],
    )

    # Configure Custom Request Logging Middleware
    app.add_middleware(RequestLoggingMiddleware)

    # Register Global Exception Handlers
    setup_exception_handlers(app)

    # Register Routers
    app.include_router(health_router)
    app.include_router(chat_router)
    app.include_router(analysis_router)
    app.include_router(anomaly_router)
    app.include_router(investigation_router)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
