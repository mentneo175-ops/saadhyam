@echo off
echo.
echo ========================================
echo   SAADHYAM AI - STATUS CHECK
echo ========================================
echo.

echo [1/4] Checking Backend (port 8000)...
echo.

netstat -ano | findstr :8000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Backend is running on port 8000
    
    REM Try to hit health endpoint
    curl -s http://localhost:8000/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✅ Backend is responding to requests
        curl -s http://localhost:8000/health
    ) else (
        echo   ⚠️  Backend port is open but not responding
        echo   It may still be starting up...
    )
) else (
    echo   ❌ Backend is NOT running
    echo   Run RESTART_ALL.bat to start it
)

echo.
echo [2/4] Checking Frontend (port 8080)...
echo.

netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Frontend is running on port 8080
) else (
    echo   ❌ Frontend is NOT running
    echo   Run RESTART_ALL.bat to start it
)

echo.
echo [3/4] Checking Environment Files...
echo.

if exist "Backend\.env" (
    echo   ✅ Backend .env exists
) else (
    echo   ❌ Backend .env is missing
    echo   Run RESTART_ALL.bat to create it
)

if exist "Frontend\.env" (
    echo   ✅ Frontend .env exists
) else (
    echo   ❌ Frontend .env is missing
    echo   Run RESTART_ALL.bat to create it
)

echo.
echo [4/4] Checking Dependencies...
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Python is installed
    python --version
) else (
    echo   ❌ Python is NOT installed
    echo   Install Python 3.9+ from python.org
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Node.js is installed
    node --version
) else (
    echo   ❌ Node.js is NOT installed
    echo   Install Node.js 16+ from nodejs.org
)

echo.
echo ========================================
echo   STATUS CHECK COMPLETE
echo ========================================
echo.

REM Check if both services are running
netstat -ano | findstr :8000 | findstr LISTENING >nul 2>&1
set backend_running=%errorlevel%

netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
set frontend_running=%errorlevel%

if %backend_running% equ 0 (
    if %frontend_running% equ 0 (
        echo   ✅ Both Backend and Frontend are running!
        echo.
        echo   Access Points:
        echo   - Frontend:  http://localhost:8080
        echo   - Backend:   http://localhost:8000
        echo   - API Docs:  http://localhost:8000/docs
        echo.
        echo   Press any key to open the application...
        pause >nul
        start http://localhost:8080
        goto :end
    )
)

echo   ⚠️  One or more services are not running
echo.
echo   To start the application, run:
echo   RESTART_ALL.bat
echo.

:end
pause
