@echo off
echo ========================================
echo Restarting Saadhyam AI Services
echo ========================================

echo.
echo [1/3] Stopping all services...
call stop_all.bat

echo.
echo [2/3] Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo.
echo [3/3] Starting all services...
call start_all.bat

echo.
echo ========================================
echo All services restarted!
echo ========================================
pause
