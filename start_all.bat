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

REM Check if virtual environment exists
if not exist "Backend\venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at Backend\venv!
    echo Please create virtual environment: cd Backend && python -m venv venv
    pause
    exit /b 1
)

REM Check if Redis is running
echo [INFO] Checking Redis connection...
Backend\venv\Scripts\python.exe -c "import redis; r = redis.Redis(host='localhost', port=6379); r.ping()" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Redis is not running on port 6379
    echo Celery tasks will not work without Redis
    echo Please start Redis server first
    pause
)

REM Start Backend Server
echo ============================================
echo   Starting Backend Server (Port 8000)
echo ============================================
start "Saadhyam Backend" cmd /k "cd Backend && call venv\Scripts\activate.bat && python main.py"
echo [SUCCESS] Backend server starting in virtual environment...
echo.

REM Start AI Model Server (Review Reply AI)
echo ============================================
echo   Starting AI Model Server (Port 9000)
echo   (TinyLlama for Review Replies - DEPRECATED)
echo ============================================
REM Skipping deprecated TinyLlama model server
echo [INFO] AI Model server skipped (using Gemini API instead)...
echo.

REM Start Main Celery Worker (Instagram + WhatsApp)
echo ============================================
echo   Starting Main Celery Worker
echo   (Instagram Posts + WhatsApp Automation)
echo ============================================
start "Saadhyam Celery - Worker" cmd /k "cd Backend && call venv\Scripts\activate.bat && python -m celery -A celery_worker worker --loglevel=info --pool=solo"
echo [SUCCESS] Main Celery worker starting...
echo.

REM Start Website AI Celery Worker
echo ============================================
echo   Starting Website AI Celery Worker
echo   (Website Generation Tasks)
echo ============================================
start "Saadhyam Celery - Website Worker" cmd /k "cd Backend && call venv\Scripts\activate.bat && python -m celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo"
echo [SUCCESS] Website AI Celery worker starting...
echo.

REM Start Celery Beat (Task Scheduler)
echo ============================================
echo   Starting Celery Beat Scheduler
echo   (Periodic Tasks)
echo ============================================
start "Saadhyam Celery - Beat" cmd /k "cd Backend && call venv\Scripts\activate.bat && python -m celery -A celery_worker beat --loglevel=info"
echo [SUCCESS] Celery Beat scheduler starting...
echo.

REM Start Content Creator AI (Image Generation)
echo ============================================
echo   Starting Content Creator AI
echo   (Image Generation - Port 8001)
echo ============================================
start "Saadhyam Content Creator AI" cmd /k "cd Backend && call venv\Scripts\activate.bat && cd ai_models\content_creator && python -m uvicorn app.main:app --reload --port 8001"
echo [SUCCESS] Content Creator AI starting...
echo.

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo ============================================
echo   Starting Frontend Server (Port 8080)
echo ============================================
start "Saadhyam Frontend" cmd /k "cd Frontend && npm run dev"
echo [SUCCESS] Frontend server starting...
echo.

echo ============================================
echo   All Services Started Successfully!
echo ============================================
echo.
echo Backend API:      http://localhost:8000
echo Content Creator:  http://localhost:8001
echo Celery Worker:    Running (Background Tasks)
echo Celery Beat:      Running (Task Scheduler)
echo Frontend:         http://localhost:8080
echo Redis:            Running (Port 6379)
echo.
echo [INFO] 5 terminal windows opened:
echo   1. Backend Server (FastAPI - Port 8000)
echo   2. Celery Worker (Background Tasks)
echo   3. Website AI Celery Worker (Website Generation)
echo   4. Celery Beat (Task Scheduler)
echo   5. Content Creator AI (Image Generation - Port 8001)
echo   6. Frontend Server (Vite - Port 8080)
echo.
echo Press any key to open the application in browser...
pause >nul

REM Open browser
start http://localhost:8080

echo.
echo [INFO] Application opened in browser
echo [INFO] To stop all servers, close the 5 terminal windows or run stop_all.bat
echo.
pause
