"""
Request Logging & Correlation ID Middleware.

Responsibility:
- Intercepts all incoming HTTP requests.
- Generates or propagates X-Request-ID header for correlation across distributed microservices.
- Measures request processing duration.
- Attaches X-Request-ID and X-Process-Time headers to HTTP responses.
"""

import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.utils.logger import get_logger

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware handling correlation IDs, request timing, and structured request logs.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()

        # Extract existing X-Request-ID or generate new UUID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # Attach request_id to request state for access in endpoints
        request.state.request_id = request_id

        logger.info(
            f"Incoming request: {request.method} {request.url.path}",
            extra={"request_id": request_id}
        )

        try:
            response = await call_next(request)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{elapsed_ms}ms"

            logger.info(
                f"Completed {request.method} {request.url.path} status={response.status_code} in {elapsed_ms}ms",
                extra={"request_id": request_id}
            )
            return response

        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled exception during {request.method} {request.url.path} after {elapsed_ms}ms: {exc}",
                extra={"request_id": request_id}
            )
            raise exc
