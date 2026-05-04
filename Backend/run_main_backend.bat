@echo off
REM Start Main Backend Server on Port 8000
REM IMPORTANT: Start run_business_model.bat FIRST in another terminal

echo.
echo ================================================================================
echo Starting Main Backend Server (Port 8000)
echo ================================================================================
echo.
echo IMPORTANT: Ensure business_model.py is running on port 9001 first!
echo.
echo If you see "Cannot connect to business model server" error:
echo 1. Open another terminal
echo 2. Run: run_business_model.bat
echo 3. Wait for "MODEL LOADED SUCCESSFULLY" message
echo 4. Then run this script
echo.
echo ================================================================================
echo.

py main.py

pause
