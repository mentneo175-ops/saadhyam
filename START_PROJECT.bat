@echo off
echo ============================================
echo   Saadhyam AI - Smart Startup
echo ============================================
echo.

REM Kill any existing processes on ports 8000
echo [INFO] Checking for port conflicts...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [INFO] Killing process %%a on port 8000...
    taskkill /F /PID %%a >nul 2>&1
)

echo [INFO] Ports cleared
echo.

REM Start Backend
echo ============================================
echo   Starting Backend (Port 8000)
echo ============================================
cd Backend
start "Saadhyam Backend" cmd /k "python main.py"
echo [SUCCESS] Backend starting...
cd ..

REM Wait for backend to initialize
echo [INFO] Waiting for backend to load AI models (30 seconds)...
timeout /t 30 /nobreak >nul

REM Start Frontend
echo ============================================
echo   Starting Frontend
echo ============================================
cd Frontend
start "Saadhyam Frontend" cmd /k "npm run dev"
echo [SUCCESS] Frontend starting...
cd ..

echo.
echo ============================================
echo   Services Started!
echo ============================================
echo.
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ✅ Backend:  http://localhost:8000
echo ✅ Frontend: http://localhost:8081 (or check the Frontend window for actual port)
echo ✅ API Docs: http://localhost:8000/docs
echo.
echo [INFO] Services are running in separate windows
echo [INFO] Close each window to stop the service
echo.
echo 🎉 Open your browser to http://localhost:8081
echo.
pause
