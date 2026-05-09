@echo off
echo ========================================
echo   Starting Celery Beat (Scheduler)
echo ========================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/3] Checking virtual environment...
if not exist "..\.venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv ..\.venv
    pause
    exit /b 1
)
echo OK - Virtual environment found
echo.

echo [2/3] Checking Redis connection...
echo NOTE: Celery Beat requires Redis to be running
echo If you don't have Redis installed:
echo   - Download from: https://github.com/microsoftarchive/redis/releases
echo   - Or use Docker: docker run -d -p 6379:6379 redis
echo.
echo Press any key to continue (make sure Redis is running)...
pause >nul

echo [3/3] Starting Celery Beat...
echo.
echo ========================================
echo   Celery Beat Starting
echo ========================================
echo.
echo Beat will schedule:
echo   - Process scheduled posts (every 5 min)
echo   - Retry failed posts (every 30 min)
echo   - Fetch analytics (every hour)
echo.
echo Press Ctrl+C to stop the scheduler
echo ========================================
echo.

REM Start Celery beat
..\.venv\Scripts\celery.exe -A celery_worker beat --loglevel=info

pause
