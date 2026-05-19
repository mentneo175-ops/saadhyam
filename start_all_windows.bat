@echo off
echo ============================================
echo   Starting Saadhyam AI - All Services
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Python and Node.js detected
echo.

REM Check if Redis is running
echo [INFO] Checking Redis connection...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Redis is not running or not accessible
    echo [INFO] Celery workers will not function without Redis
    echo [INFO] To install Redis on Windows:
    echo   1. Download from: https://github.com/microsoftarchive/redis/releases
    echo   2. Or use WSL: wsl --install, then: sudo apt install redis-server
    echo.
    set REDIS_AVAILABLE=0
) else (
    echo [SUCCESS] Redis is running
    set REDIS_AVAILABLE=1
)
echo.

REM Start Backend Server
echo ============================================
echo   Starting Backend Server (Port 8000)
echo ============================================
cd Backend

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created
    echo [INFO] Installing dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
) else (
    echo [INFO] Virtual environment found
)

REM Start backend in a new window
start "Saadhyam Backend" cmd /k "cd /d "%CD%" && call venv\Scripts\activate.bat && python main.py"
echo [SUCCESS] Backend server starting in new window...
echo.

REM Wait for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Celery Workers if Redis is available
if %REDIS_AVAILABLE%==1 (
    echo ============================================
    echo   Starting Main Celery Worker
    echo   (Instagram Posts + WhatsApp Automation)
    echo ============================================
    start "Celery Main Worker" cmd /k "cd /d "%CD%" && call venv\Scripts\activate.bat && celery -A celery_worker worker --loglevel=info --pool=solo"
    echo [SUCCESS] Main Celery worker starting in new window...
    echo.

    echo ============================================
    echo   Starting Website AI Celery Worker
    echo   (Website Generation Tasks)
    echo ============================================
    start "Celery Website AI" cmd /k "cd /d "%CD%" && call venv\Scripts\activate.bat && celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo"
    echo [SUCCESS] Website AI Celery worker starting in new window...
    echo.
) else (
    echo [WARNING] Skipping Celery workers (Redis not available)
    echo.
)

cd ..

REM Start Frontend Server
echo ============================================
echo   Starting Frontend Server (Port 5173)
echo ============================================
cd Frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Frontend dependencies installed
)

start "Saadhyam Frontend" cmd /k "cd /d "%CD%" && npm run dev"
echo [SUCCESS] Frontend server starting in new window...
echo.

cd ..

echo ============================================
echo   All Services Started Successfully!
echo ============================================
echo.
echo Backend:       http://localhost:8000
echo Frontend:      http://localhost:5173
echo.
echo [INFO] All services are running in separate windows
echo [INFO] Close the individual windows to stop each service
echo.
echo Press any key to exit this launcher...
pause >nul
