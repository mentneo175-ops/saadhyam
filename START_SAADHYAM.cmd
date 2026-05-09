@echo off
echo ========================================
echo   Saadhyam AI - Startup Script
echo ========================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/4] Checking Python environment...
if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv .venv
    echo Then run: .venv\Scripts\pip.exe install -r Backend\requirements.txt
    pause
    exit /b 1
)
echo OK - Virtual environment found
echo.

echo [2/4] Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js found
echo.

echo [3/4] Checking Backend configuration...
if not exist "Backend\.env" (
    echo WARNING: Backend .env file not found!
    echo Please copy Backend\.env.example to Backend\.env
    echo and configure your API keys.
    pause
    exit /b 1
)
echo OK - Backend .env found
echo.

echo [4/4] Checking Frontend configuration...
if not exist "Frontend\.env" (
    echo WARNING: Frontend .env file not found!
    echo Please copy Frontend\.env.example to Frontend\.env
    echo and configure your Firebase keys.
    pause
    exit /b 1
)
echo OK - Frontend .env found
echo.

echo ========================================
echo   Starting Saadhyam AI
echo ========================================
echo.
echo This will open TWO terminal windows:
echo   1. Backend Server (Port 8000)
echo   2. Frontend Server (Port 8080)
echo.
echo Press any key to continue...
pause >nul

REM Start Backend in new window
echo Starting Backend Server...
start "Saadhyam AI - Backend" cmd /k "cd /d "%SCRIPT_DIR%Backend" && ..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start Frontend in new window
echo Starting Frontend Server...
start "Saadhyam AI - Frontend" cmd /k "cd /d "%SCRIPT_DIR%Frontend" && npm run dev"

echo.
echo ========================================
echo   Saadhyam AI Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:8080
echo API Docs: http://localhost:8000/docs
echo.
echo Wait 10-15 seconds for servers to start,
echo then open http://localhost:8080 in your browser.
echo.
echo To stop servers: Close the terminal windows
echo or press Ctrl+C in each window.
echo.
echo ========================================
pause
