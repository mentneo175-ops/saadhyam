@echo off
echo ========================================
echo Saadhyam AI - Troubleshooting Script
echo ========================================
echo.

echo [1/5] Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    goto :end
)
echo OK: Python is installed
echo.

echo [2/5] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    goto :end
)
echo OK: Node.js is installed
echo.

echo [3/5] Checking if ports 8000 and 8080 are available...
netstat -ano | findstr :8000
if %errorlevel% equ 0 (
    echo WARNING: Port 8000 is already in use
    echo Run this to kill the process: for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a
) else (
    echo OK: Port 8000 is available
)

netstat -ano | findstr :8080
if %errorlevel% equ 0 (
    echo WARNING: Port 8080 is already in use
    echo Run this to kill the process: for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /F /PID %%a
) else (
    echo OK: Port 8080 is available
)
echo.

echo [4/5] Checking Backend dependencies...
cd /d "%~dp0Backend"
if not exist ".venv" (
    echo WARNING: Virtual environment not found
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip list | findstr fastapi
if %errorlevel% neq 0 (
    echo WARNING: FastAPI not installed
    echo Installing dependencies...
    pip install -r requirements.txt
) else (
    echo OK: Backend dependencies installed
)
echo.

echo [5/5] Checking Frontend dependencies...
cd /d "%~dp0Frontend"
if not exist "node_modules" (
    echo WARNING: Node modules not found
    echo Installing dependencies...
    npm install
) else (
    echo OK: Frontend dependencies installed
)
echo.

echo ========================================
echo Troubleshooting Complete!
echo ========================================
echo.
echo If all checks passed, run START_PROJECT.bat to start the application.
echo.

:end
pause
