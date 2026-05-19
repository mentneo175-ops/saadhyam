@echo off
echo ============================================
echo   Starting Backend Server Only
echo ============================================
echo.

cd Backend

if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo [INFO] Run start_all_windows.bat first to set up the environment
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Starting backend server on http://localhost:8000
echo [INFO] Press Ctrl+C to stop the server
echo.
python main.py

pause
