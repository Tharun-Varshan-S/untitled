"""
Authentication & Security FastAPI dependency module.

Responsibility:
- Enforces internal service-to-service authentication between Node.js backend and FastAPI AI service.
- Validates the presence and correctness of X-Service-Key header.
- Protects internal AI routes from unauthenticated external access.
"""

from fastapi import Header, Security
from app.config.settings import settings
from app.core.exceptions import UnauthorizedException
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def verify_service_key(
    x_service_key: str = Header(None, alias="X-Service-Key")
) -> str:
    """
    FastAPI Security Dependency verifying X-Service-Key header.
    
    Input: x_service_key string from HTTP Request Header
    Output: Verified service key string
    Raises: UnauthorizedException (HTTP 401) if key is missing or invalid.
    """
    if not x_service_key:
        logger.warning("Rejecting request: Missing X-Service-Key header")
        raise UnauthorizedException("Missing required X-Service-Key header.")

    if x_service_key != settings.SERVICE_KEY:
        logger.warning("Rejecting request: Invalid X-Service-Key header provided")
        raise UnauthorizedException("Invalid X-Service-Key provided.")

    return x_service_key
