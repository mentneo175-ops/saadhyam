@echo off
echo ============================================
echo   Stopping Saadhyam AI - All Services
echo ============================================
echo.

echo [INFO] Force stopping all Saadhyam AI services...
echo.

REM Kill all Node.js processes (Frontend)
echo [1/5] Stopping Node.js (Frontend)...
taskkill /F /IM node.exe >nul 2>&1
echo [SUCCESS] Node.js stopped
echo.

REM Kill all Python processes from project
echo [2/5] Stopping Python processes...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM pythonw.exe >nul 2>&1
echo [SUCCESS] Python processes stopped
echo.

REM Kill Celery processes
echo [3/5] Stopping Celery...
taskkill /F /IM celery.exe >nul 2>&1
echo [SUCCESS] Celery stopped
echo.

REM Kill all CMD windows with "Saadhyam" in title
echo [4/5] Closing terminal windows...
powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -like '*Saadhyam*'} | Stop-Process -Force" >nul 2>&1
echo [SUCCESS] Terminal windows closed
echo.

REM Kill processes by port as backup
echo [5/5] Cleaning up ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /F /PID %%a >nul 2>&1
echo [SUCCESS] Ports cleaned
echo.

echo ============================================
echo   All Services Stopped!
echo ============================================
echo.
echo All processes have been terminated:
echo   - Node.js (Frontend)
echo   - Python (Backend + AI Model)
echo   - Celery Workers
echo   - All terminal windows
echo.
echo NOTE: If you see any remaining windows, they are
echo       empty and can be manually closed.
echo.
timeout /t 3 /nobreak >nul
exit
