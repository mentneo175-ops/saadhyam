@echo off
echo ========================================
echo RESTARTING BACKEND SERVER
echo ========================================
echo.

echo Step 1: Stopping all Python processes...
taskkill /F /IM python.exe /T 2>nul
if %errorlevel% equ 0 (
    echo ✓ Python processes stopped
) else (
    echo ! No Python processes found or already stopped
)

echo.
echo Step 2: Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Clearing Python cache...
cd /d "%~dp0Backend"
if exist __pycache__ (
    rmdir /s /q __pycache__ 2>nul
    echo ✓ Cache cleared
)
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul

echo.
echo Step 4: Starting backend server...
cd /d "%~dp0Backend"

if exist .venv\Scripts\activate.bat (
    echo ✓ Found virtual environment
    call .venv\Scripts\activate.bat
    echo.
    echo Starting server with: python main.py
    echo.
    echo ========================================
    echo BACKEND SERVER STARTING...
    echo Press Ctrl+C to stop
    echo ========================================
    echo.
    python main.py
) else (
    echo ✗ Virtual environment not found at .venv\Scripts\activate.bat
    echo.
    echo Trying direct start...
    python main.py
)

pause
