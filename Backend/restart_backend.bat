@echo off
echo ========================================
echo Restarting Saadhyam Backend
echo ========================================
echo.

echo [1/2] Activating virtual environment...
call venv\Scripts\activate

echo.
echo [2/2] Starting backend server...
echo Backend will run on http://localhost:8000
echo.
echo Press CTRL+C to stop the server
echo ========================================
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
