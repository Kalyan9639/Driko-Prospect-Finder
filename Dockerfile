# syntax=docker/dockerfile:1
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    HOST=0.0.0.0

# Set container working directory
WORKDIR /app

# Install system dependencies (curl for container healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user and persistent cache directory structure
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser \
    && mkdir -p /app/.cache/workspaces /app/.cache/icp_reports \
    && chown -R appuser:appuser /app

# Copy dependency specifications first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies without saving pip wheel cache
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code and static assets with non-root ownership
COPY --chown=appuser:appuser app /app/app
COPY --chown=appuser:appuser static /app/static

# Switch to non-root user for security best practices
USER appuser

# Cloud Run forwards traffic to $PORT (default 8080)
EXPOSE 8080

# Container healthcheck using FastAPI /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start Uvicorn with 2 workers (configured for 2 vCPUs), responding to Cloud Run $PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 2
