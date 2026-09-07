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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Configure Custom Request Logging Middleware
    app.add_middleware(RequestLoggingMiddleware)

    # Register Global Exception Handlers
    setup_exception_handlers(app)

    # Register Routers
    app.include_router(health_router)
    app.include_router(chat_router)
    app.include_router(analysis_router)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
