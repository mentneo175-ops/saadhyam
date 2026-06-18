#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Saadhyam AI Backend Entrypoint"
echo "=========================================="

# 1. Handle Redis configuration
if [ -z "$REDIS_URL" ]; then
    echo "ℹ️ REDIS_URL not set. Running in lightweight memory-fallback mode."
    export REDIS_URL=""
    export CELERY_BROKER_URL=""
    export CELERY_RESULT_BACKEND=""
else
    echo "✅ REDIS_URL is configured: ${REDIS_URL:0:15}..."
    export CELERY_BROKER_URL="${REDIS_URL}/0"
    export CELERY_RESULT_BACKEND="${REDIS_URL}/1"
fi

# 2. Database Migrations
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 Running database migrations..."
    alembic upgrade head || echo "⚠️ Migrations failed or skipped"
else
    echo "⏭️ Skipping database migrations (RUN_MIGRATIONS != true)"
fi

# 3. Start Celery Worker & Beat in background if requested
if [ "$START_CELERY" = "true" ] && [ -n "$REDIS_URL" ]; then
    echo "⚙️ Starting Celery worker in background..."
    celery -A celery_worker.celery worker --loglevel=error --concurrency=1 &
    
    echo "⚙️ Starting Celery beat in background..."
    celery -A celery_worker.celery beat --loglevel=error &
else
    echo "⏭️ Skipping Celery (START_CELERY != true or REDIS_URL not set)"
fi

# 4. START FASTAPI SERVER
PORT=${PORT:-8000}
echo "🌐 Starting FastAPI server on port $PORT..."

# Run Uvicorn in foreground
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1
