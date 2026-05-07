@echo off
echo Starting Celery Worker...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start Celery worker with proper configuration
echo Starting Celery worker for background tasks...
celery -A celery_worker.celery worker --loglevel=info --pool=solo

pause