@echo off
echo ============================================
echo   Starting Saadhyam AI - All Services
echo   (Using Global Python Environment)
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [INFO] Python and Node.js detected
echo.

REM Start Backend Server (using global Python)
echo ============================================
echo   Starting Backend Server (Port 8000)
echo ============================================
cd Backend
start "Saadhyam Backend" cmd /k "python main.py"
echo [SUCCESS] Backend server starting in new window...
echo.
cd ..

REM Wait for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo ============================================
echo   Starting Frontend Server (Port 5173)
echo ============================================
cd Frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

start "Saadhyam Frontend" cmd /k "npm run dev"
echo [SUCCESS] Frontend server starting in new window...
echo.
cd ..

echo ============================================
echo   All Services Started Successfully!
echo ============================================
echo.
echo Backend:       http://localhost:8000
echo Frontend:      http://localhost:5173
echo.
echo [INFO] All services are running in separate windows
echo [INFO] Close the individual windows to stop each service
echo.
echo [INFO] Wait 30-60 seconds for backend to load AI models
echo [INFO] Then visit: http://localhost:5173
echo.
pause
