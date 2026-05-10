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

REM Start Backend Server
echo ============================================
echo   Starting Backend Server (Port 8000)
echo ============================================
cd Backend

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please run: cd Backend ^&^& python -m venv venv ^&^& venv\Scripts\activate ^&^& pip install -r requirements.txt
    cd ..
    pause
    exit /b 1
)

start "Saadhyam Backend" cmd /k "venv\Scripts\activate && python main.py"
cd ..
echo [SUCCESS] Backend server starting in virtual environment...
echo.

REM Start AI Model Server (Review Reply AI)
echo ============================================
echo   Starting AI Model Server (Port 9000)
echo   (TinyLlama for Review Replies)
echo ============================================
cd Backend
start "Saadhyam AI Model Server" cmd /k "venv\Scripts\activate && python model_server.py"
cd ..
echo [SUCCESS] AI Model server starting...
echo.

REM Start Main Celery Worker (Instagram + WhatsApp)
echo ============================================
echo   Starting Main Celery Worker
echo   (Instagram Posts + WhatsApp Automation)
echo ============================================
cd Backend
start "Saadhyam Celery - Main" cmd /k "venv\Scripts\activate && celery -A celery_worker worker --loglevel=info --pool=solo"
cd ..
echo [SUCCESS] Main Celery worker starting...
echo.

REM Start Website AI Celery Worker
echo ============================================
echo   Starting Website AI Celery Worker
echo   (Website Generation Tasks)
echo ============================================
cd Backend
start "Saadhyam Celery - Website AI" cmd /k "venv\Scripts\activate && celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo"
cd ..
echo [SUCCESS] Website AI Celery worker starting...
echo.

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo ============================================
echo   Starting Frontend Server (Port 5173)
echo ============================================
cd Frontend
start "Saadhyam Frontend" cmd /k "npm run dev"
cd ..
echo [SUCCESS] Frontend server starting...
echo.

echo ============================================
echo   All Services Started Successfully!
echo ============================================
echo.
echo Backend:          http://localhost:8000
echo AI Model Server:  http://localhost:9000
echo Celery Main:      Running (Instagram + WhatsApp)
echo Celery Web AI:    Running (Website Generation)
echo Frontend:         http://localhost:5173
echo.
echo [INFO] 5 terminal windows opened:
echo   1. Backend Server (FastAPI - Port 8000)
echo   2. AI Model Server (TinyLlama - Port 9000)
echo   3. Main Celery Worker (Instagram + WhatsApp)
echo   4. Website AI Celery Worker (Website Generation)
echo   5. Frontend Server (Vite - Port 5173)
echo.
echo Press any key to open the application in browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo [INFO] Application opened in browser
echo [INFO] To stop all servers, close the 5 terminal windows:
echo   - Backend Server (Port 8000)
echo   - AI Model Server (Port 9000)
echo   - Main Celery Worker (Instagram + WhatsApp)
echo   - Website AI Celery Worker (Website Generation)
echo   - Frontend Server (Port 5173)
echo.
pause
