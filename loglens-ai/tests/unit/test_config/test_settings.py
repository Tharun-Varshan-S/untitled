"""
Unit tests for Application Settings and Configuration module.
"""

from app.config.settings import Settings


def test_settings_default_values():
    """Verify default setting values meet project specifications."""
    s = Settings(GROQ_API_KEY="test_key")
    assert s.MODEL == "llama-3.3-70b-versatile"
    assert s.TEMPERATURE == 0.2
    assert s.MAX_TOKENS == 2048
    assert s.TIMEOUT == 30.0
    assert s.SERVICE_KEY == "loglens-internal-secret-key"


def test_settings_environment_override(monkeypatch):
    """Verify environment variables override default setting values."""
    monkeypatch.setenv("MODEL", "llama-3.1-8b-instant")
    monkeypatch.setenv("SERVICE_KEY", "custom-secret-key")
    monkeypatch.setenv("TEMPERATURE", "0.5")

    s = Settings()
    assert s.MODEL == "llama-3.1-8b-instant"
    assert s.SERVICE_KEY == "custom-secret-key"
    assert s.TEMPERATURE == 0.5
