@echo off
echo ========================================
echo   Stopping Saadhyam AI - All Services
echo ========================================
echo.

echo Stopping Business Model Server...
taskkill /FI "WindowTitle eq Business Model Server*" /T /F >nul 2>&1

echo Stopping Backend Server...
taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1

echo Stopping Instagram Celery Worker...
taskkill /FI "WindowTitle eq Instagram Celery Worker*" /T /F >nul 2>&1

echo Stopping Website AI Celery Worker...
taskkill /FI "WindowTitle eq Website AI Celery Worker*" /T /F >nul 2>&1

echo Stopping Frontend Server...
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1

echo.
echo Stopping any remaining Python processes...
taskkill /IM python.exe /F >nul 2>&1

echo Stopping any remaining Node processes...
taskkill /IM node.exe /F >nul 2>&1

echo.
echo ========================================
echo   All Services Stopped
echo ========================================
echo.
pause
