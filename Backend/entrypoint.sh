#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 Starting Saadhyam AI Production Environment..."
echo "=========================================================="

# Log environment variable status (masking values)
echo "Port: ${PORT:-8000}"
echo "Environment: ${ENVIRONMENT:-production}"
echo "Database URL configured: ${DATABASE_URL:+"YES (length: ${#DATABASE_URL})"}"
echo "Redis URL configured: ${REDIS_URL:+"YES (length: ${#REDIS_URL})"}"

# 1. ORCHESTRATE REDIS
# Check if REDIS_URL points to localhost/127.0.0.1 or is empty. If so, spin up local Redis.
if [ -z "$REDIS_URL" ] || [[ "$REDIS_URL" == *"localhost"* ]] || [[ "$REDIS_URL" == *"127.0.0.1"* ]]; then
    echo "⚠️  No external REDIS_URL provided (or points to localhost). Starting local redis-server..."
    # Spin up redis-server in daemon mode, saving db inside /app
    redis-server --port 6379 --dir /app --dbfilename dump.rdb --daemonize yes
    
    # Configure variables to point to this local Redis
    export REDIS_URL="redis://127.0.0.1:6379"
    export CELERY_BROKER_URL="redis://127.0.0.1:6379/0"
    export CELERY_RESULT_BACKEND="redis://127.0.0.1:6379/1"
    echo "✅ Local Redis server started successfully on port 6379."
else
    echo "✅ External REDIS_URL detected. Connecting to: $REDIS_URL"
    # Ensure Celery uses the external Redis
    export CELERY_BROKER_URL="${REDIS_URL}/0"
    export CELERY_RESULT_BACKEND="${REDIS_URL}/1"
fi

# 2. RUN DATABASE MIGRATIONS (if Database URL is set)
if [ -n "$DATABASE_URL" ]; then
    echo "🔄 Database URL detected. Running database migrations..."
    # We execute Python scripts to run database setup and migrations
    python -c "
import logging
logging.basicConfig(level=logging.INFO)
from config.database import init_db
import asyncio
try:
    asyncio.run(init_db())
    print('✅ Database schema initialized successfully.')
except Exception as e:
    print(f'❌ Database initialization failed: {e}')
" || echo "⚠️ Database init skipped or failed."

    # Run specific migrations sequentially
    python -c "import logging; logging.basicConfig(level=logging.INFO); from migrations.add_meta_ads_tables import migrate_add_meta_ads_tables; migrate_add_meta_ads_tables()" || echo "⚠️ Migration 1 skipped."
    python -c "import logging; logging.basicConfig(level=logging.INFO); from migrations.fix_campaign_status_enum import migrate_fix_campaign_status_enum; migrate_fix_campaign_status_enum()" || echo "⚠️ Migration 2 skipped."
    python -c "import logging; logging.basicConfig(level=logging.INFO); from migrations.update_campaign_status_enum import migrate_update_campaign_status_enum; migrate_update_campaign_status_enum()" || echo "⚠️ Migration 3 skipped."
    python -c "import logging; logging.basicConfig(level=logging.INFO); from migrations.add_session_tracking import migrate_add_session_tracking; migrate_add_session_tracking()" || echo "⚠️ Migration 4 skipped."
    python -c "import logging; logging.basicConfig(level=logging.INFO); from migrations.add_chat_tables import migrate_add_chat_tables; migrate_add_chat_tables()" || echo "⚠️ Migration 5 skipped."
    echo "✅ All database migrations processing complete."
fi

# 3. START MAIN CELERY WORKER & BEAT (Self-contained in one process to save memory)
echo "🚀 Starting Main Celery Worker + Beat (concurrency=1)..."
celery -A celery_worker worker -B --loglevel=info --concurrency=1 &
CELERY_PID=$!
echo "✅ Main Celery worker + beat started with PID: $CELERY_PID"

# 4. START WEBSITE AI CELERY WORKER
echo "🚀 Starting Website AI Celery worker (concurrency=1)..."
celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --concurrency=1 &
WEBSITE_CELERY_PID=$!
echo "✅ Website AI Celery worker started with PID: $WEBSITE_CELERY_PID"

# 5. START FASTAPI WEB SERVER (with Socket.IO support)
PORT=${PORT:-8000}
echo "🚀 Starting FastAPI (Socket.IO wrapped) server on port $PORT..."
# Using exec so uvicorn becomes PID 1 to handle SIGTERM / SIGINT correctly
exec uvicorn main:sio_asgi_app --host 0.0.0.0 --port "$PORT"
