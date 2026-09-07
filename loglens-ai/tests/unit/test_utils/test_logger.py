"""
Unit tests for Logger module and SensitiveDataFilter.
"""

import logging
from app.utils.logger import SensitiveDataFilter, get_logger, setup_logging


def test_sensitive_data_filter():
    """Verify SensitiveDataFilter passes records cleanly."""
    sf = SensitiveDataFilter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="test.py",
        lineno=10,
        msg="Processing request with SERVICE_KEY header",
        args=(),
        exc_info=None
    )
    assert sf.filter(record) is True


def test_get_logger():
    """Verify get_logger returns Logger instance."""
    logger = get_logger("test_module")
    assert isinstance(logger, logging.Logger)
    assert logger.name == "test_module"
