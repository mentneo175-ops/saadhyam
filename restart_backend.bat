@echo off
echo ============================================
echo   Restarting Backend with Voice Agent
echo ============================================
echo.

cd Backend

echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo [INFO] Starting backend server...
echo [INFO] Watch for these messages:
echo   - Voice Agent router imported successfully
echo   - Voice Agent V2 router imported successfully
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
