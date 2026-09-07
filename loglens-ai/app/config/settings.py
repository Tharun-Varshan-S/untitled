"""
Configuration settings management using Pydantic Settings.

Responsibility:
- Centralizes all environment configuration and secrets.
- Loads configuration from environment variables or .env file.
- Provides type safety, default values, and runtime validation.
- Prevents magic constants across services and providers.
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """
    Application Settings class.
    
    Why it exists:
    Decouples configuration from application code, following 12-factor app principles.
    Allows easy environment override for local dev, testing, and production deployment.
    """
    
    # AI Provider Configurations
    GROQ_API_KEY: str = Field(
        default="",
        description="API key for Groq Cloud API authentication."
    )
    MODEL: str = Field(
        default="llama-3.3-70b-versatile",
        description="Groq LLM model name."
    )
    TEMPERATURE: float = Field(
        default=0.2,
        ge=0.0,
        le=2.0,
        description="Sampling temperature for AI model response variability."
    )
    MAX_TOKENS: int = Field(
        default=2048,
        gt=0,
        description="Maximum number of output tokens for AI generation."
    )
    TIMEOUT: float = Field(
        default=30.0,
        gt=0.0,
        description="Request timeout in seconds for outbound Groq API requests."
    )

    # Service Security
    SERVICE_KEY: str = Field(
        default="loglens-internal-secret-key",
        description="Internal secret key required in X-Service-Key header."
    )

    # Application Runtime Environment
    ENVIRONMENT: str = Field(
        default="development",
        description="Deployment environment (development, testing, production)."
    )
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Logging verbosity level (DEBUG, INFO, WARNING, ERROR, CRITICAL)."
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Global singleton settings instance
settings = Settings()
