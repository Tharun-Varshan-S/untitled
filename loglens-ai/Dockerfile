# Production Dockerfile for LogLens FastAPI AI Service
FROM python:3.12-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /app

# Install curl + build tools for scikit-learn C extensions
RUN apt-get update && apt-get install -y --no-install-recommends curl gcc g++ && rm -rf /var/lib/apt/lists/*

# Copy dependency requirements
COPY requirements.txt .

# Install dependencies (includes scikit-learn, numpy, joblib)
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user and ML model persistence directory
RUN adduser --disabled-password --gecos '' appuser \
    && mkdir -p /models \
    && chown -R appuser:appuser /models
USER appuser

# ML model persistence
ENV ML_MODEL_DIR=/models

# Copy application source code
COPY --chown=appuser:appuser app/ ./app/

# Expose FastAPI application port
EXPOSE 8000

# Docker Healthcheck probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Launch FastAPI server using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
