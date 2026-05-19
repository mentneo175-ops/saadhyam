@echo off
echo ============================================
echo   Checking Saadhyam AI Services Status
echo ============================================
echo.

echo [INFO] Checking Backend (Port 8000)...
curl -s http://localhost:8000/test >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Backend is NOT running on port 8000
) else (
    echo [SUCCESS] Backend is running on http://localhost:8000
    curl -s http://localhost:8000/test
)
echo.

echo [INFO] Checking Frontend (Port 5173)...
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Frontend is NOT running on port 5173
) else (
    echo [SUCCESS] Frontend is running on http://localhost:5173
)
echo.

echo [INFO] Checking Redis...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Redis is NOT running
) else (
    echo [SUCCESS] Redis is running
)
echo.

echo ============================================
echo   Service Status Check Complete
echo ============================================
pause
