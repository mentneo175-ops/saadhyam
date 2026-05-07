@echo off
echo ========================================
echo   Starting Saadhyam AI - Core Services
echo ========================================
echo.
echo NOTE: Celery workers require Redis.
echo      Instagram and Website AI features will be limited.
echo      Core features (Auth, Voice Assistant, Gemini AI) will work.
echo.

REM Set environment variable for Windows compatibility
set FORKED_BY_MULTIPROCESSING=1

REM Get the current directory
set ROOT_DIR=%cd%

echo [1/3] Starting Business Analysis Model Server (Port 9001)...
start "Business Model Server" cmd /k "cd /d %ROOT_DIR%\Backend && call venv\Scripts\activate && cd ai_models\business_analysis && python model_server.py"
timeout /t 5 /nobreak >nul

echo [2/3] Starting Backend Server (Port 8000)...
start "Backend Server" cmd /k "cd /d %ROOT_DIR%\Backend && call venv\Scripts\activate && python main.py"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend (Port 5173)...
start "Frontend Server" cmd /k "cd /d %ROOT_DIR%\Frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Core Services Started Successfully!
echo ========================================
echo.
echo Running Services:
echo   - Business Model Server:    http://localhost:9001
echo   - Backend API:              http://localhost:8000
echo   - Frontend:                 http://localhost:5173
echo.
echo API Documentation: http://localhost:8000/docs
echo.
echo To enable Instagram and Website AI features:
echo   1. Install Redis (via WSL or Memurai)
echo   2. Run start_all.bat instead
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping all services...
taskkill /FI "WindowTitle eq Business Model Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1

echo All services stopped.
echo.
pause
