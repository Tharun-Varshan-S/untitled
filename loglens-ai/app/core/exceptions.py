"""
Custom application exception hierarchy and FastAPI global exception handlers.

Responsibility:
- Defines strongly typed exception classes for domain failures.
- Standardizes error response format across all endpoints.
- Prevents leakage of internal stack traces, API keys, or database credentials.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AIServiceException(Exception):
    """Base exception for all domain errors within LogLens AI Service."""

    def __init__(self, code: str, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ProviderTimeoutException(AIServiceException):
    """Raised when external AI provider call exceeds configured HTTP timeout."""

    def __init__(self, message: str = "AI service request timed out."):
        super().__init__(
            code="MODEL_TIMEOUT",
            message=message,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT
        )


class ProviderRateLimitException(AIServiceException):
    """Raised when AI provider returns HTTP 429 Too Many Requests."""

    def __init__(self, message: str = "AI provider rate limit exceeded. Please try again later."):
        super().__init__(
            code="MODEL_RATE_LIMITED",
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


class ProviderUnavailableException(AIServiceException):
    """Raised when AI provider returns HTTP 5xx or connection refuses."""

    def __init__(self, message: str = "AI service temporarily unavailable."):
        super().__init__(
            code="MODEL_UNAVAILABLE",
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


class InvalidProviderResponseException(AIServiceException):
    """Raised when AI provider output fails parsing or structure validation."""

    def __init__(self, message: str = "Received invalid or unparseable response from AI provider."):
        super().__init__(
            code="MODEL_INVALID_RESPONSE",
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY
        )


class UnauthorizedException(AIServiceException):
    """Raised when X-Service-Key authentication header is missing or invalid."""

    def __init__(self, message: str = "Unauthorized: Invalid or missing service key."):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


def setup_exception_handlers(app: FastAPI) -> None:
    """
    Registers global exception handlers on FastAPI application instance.
    
    Flow:
    Unhandled/Domain Exceptions -> Caught by handler -> JSONResponse with standard schema
    """

    @app.exception_handler(AIServiceException)
    async def ai_service_exception_handler(request: Request, exc: AIServiceException):
        logger.error(f"Domain exception: code={exc.code}, message={exc.message}, status={exc.status_code}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "code": exc.code,
                "message": exc.message
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Format Pydantic validation errors into readable message string
        errors = exc.errors()
        error_msg = "; ".join([f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in errors])
        logger.warning(f"Validation error on {request.method} {request.url.path}: {error_msg}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "code": "INVALID_REQUEST",
                "message": f"Validation error: {error_msg}"
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "code": "INTERNAL_ERROR",
                "message": "An internal server error occurred."
            }
        )
