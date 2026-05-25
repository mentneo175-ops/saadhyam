#!/bin/bash
set -e

echo "=========================================="
echo "🆓 ULTRA-LIGHTWEIGHT FREE TIER"
echo "=========================================="

# Minimal logging
echo "Port: ${PORT:-8000}"

# 1. SKIP REDIS - Use in-memory only for free tier
export REDIS_URL=""
export CELERY_BROKER_URL=""
export CELERY_RESULT_BACKEND=""

# 2. SKIP DATABASE MIGRATIONS - Minimal setup
echo "⏭️ Skipping migrations for free tier"

# 3. SKIP CELERY - Too memory intensive
echo "⏭️ Skipping Celery for free tier"

# 4. START MINIMAL FASTAPI SERVER ONLY
PORT=${PORT:-8000}
echo "� Starting minimal FastAPI server..."

# Ultra-minimal startup - FastAPI only, no Socket.IO wrapper
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1 --log-level error
