@echo off
echo ========================================
echo   Starting Saadhyam AI - All Services
echo ========================================
echo.

REM Set environment variable for Windows compatibility
set FORKED_BY_MULTIPROCESSING=1

REM Get the current directory
set ROOT_DIR=%cd%

echo [1/5] Starting Business Analysis Model Server (Port 9001)...
start "Business Model Server" cmd /k "cd /d %ROOT_DIR%\Backend && call venv\Scripts\activate && cd ai_models\business_analysis && python model_server.py"
timeout /t 5 /nobreak >nul

echo [2/5] Starting Backend Server (Port 8000)...
start "Backend Server" cmd /k "cd /d %ROOT_DIR%\Backend && call venv\Scripts\activate && python main.py"
timeout /t 3 /nobreak >nul

echo [3/5] Starting Instagram Celery Worker...
start "Instagram Celery Worker" cmd /k "cd /d %ROOT_DIR%\Backend && call venv\Scripts\activate && celery -A celery_worker worker --loglevel=info --pool=solo"
timeout /t 3 /nobreak >nul

echo [4/5] Starting Website AI Celery Worker...
start "Website AI Celery Worker" cmd /k "cd /d %ROOT_DIR%\Backend && call venv\Scripts\activate && python -m celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo"
timeout /t 3 /nobreak >nul

echo [5/5] Starting Frontend (Port 5173)...
start "Frontend Server" cmd /k "cd /d %ROOT_DIR%\Frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   All Services Started Successfully!
echo ========================================
echo.
echo Running Services:
echo   - Business Model Server:    http://localhost:9001
echo   - Backend API:              http://localhost:8000
echo   - Frontend:                 http://localhost:5173
echo   - Instagram Celery Worker:  Running in background
echo   - Website AI Celery Worker: Running in background
echo.
echo API Documentation: http://localhost:8000/docs
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping all services...
taskkill /FI "WindowTitle eq Business Model Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Instagram Celery Worker*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Website AI Celery Worker*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1

echo All services stopped.
echo.
pause
