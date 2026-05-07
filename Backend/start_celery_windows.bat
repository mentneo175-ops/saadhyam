@echo off
echo Starting Celery Worker for Website AI...
echo.

REM Set environment variable for Windows compatibility
set FORKED_BY_MULTIPROCESSING=1

REM Start Celery worker with Windows-compatible settings
python -m celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo --concurrency=1

pause