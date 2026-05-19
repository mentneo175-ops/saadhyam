@echo off
echo ============================================
echo   Starting Frontend Server Only
echo ============================================
echo.

cd Frontend

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo [INFO] Starting frontend server on http://localhost:5173
echo [INFO] Press Ctrl+C to stop the server
echo.
npm run dev

pause
