@echo off
echo.
echo ========================================
echo   SAADHYAM AI - COMPLETE RESTART
echo ========================================
echo.

echo [Step 1/5] Stopping all existing processes...
echo.

REM Kill Backend (port 8000)
echo Stopping Backend (port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo   Killing PID %%a
    taskkill /F /PID %%a 2>nul
)

REM Kill Frontend (port 8080)
echo Stopping Frontend (port 8080)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo   Killing PID %%a
    taskkill /F /PID %%a 2>nul
)

echo   Done!
timeout /t 3 >nul

echo.
echo [Step 2/5] Checking environment files...
echo.

REM Check Backend .env
if exist "Backend\.env" (
    echo   ✅ Backend .env exists
) else (
    echo   ⚠️  Backend .env not found
    if exist "Backend\.env.example" (
        echo   Creating Backend .env from .env.example...
        copy "Backend\.env.example" "Backend\.env" >nul
        echo   ✅ Created Backend .env - Please edit it with your API keys
        echo   Press any key to open .env file...
        pause >nul
        notepad "Backend\.env"
    ) else (
        echo   ❌ Backend .env.example not found
        echo   Please create Backend\.env manually
    )
)

REM Check Frontend .env
if exist "Frontend\.env" (
    echo   ✅ Frontend .env exists
) else (
    echo   ⚠️  Frontend .env not found
    echo   Creating Frontend .env...
    echo VITE_API_URL=http://localhost:8000 > "Frontend\.env"
    echo   ✅ Created Frontend .env
)

echo.
echo [Step 3/5] Starting Backend...
echo.

cd /d "%~dp0Backend"
start "Saadhyam Backend" cmd /k "echo Starting Backend... & echo. & python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo   Backend starting on http://localhost:8000
echo   Waiting for Backend to initialize...

REM Wait for Backend to be ready
set /a count=0
:wait_backend
timeout /t 2 >nul
set /a count+=1

REM Check if Backend is responding
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Backend is ready!
    goto backend_ready
)

if %count% lss 15 (
    echo   Waiting... (%count%/15^)
    goto wait_backend
)

echo   ⚠️  Backend may not be ready yet, but continuing...

:backend_ready

echo.
echo [Step 4/5] Starting Frontend...
echo.

cd /d "%~dp0Frontend"
start "Saadhyam Frontend" cmd /k "echo Starting Frontend... & echo. & npm run dev"

echo   Frontend starting on http://localhost:8080
echo   Waiting for Frontend to initialize...
timeout /t 8 >nul

echo.
echo [Step 5/5] Opening application...
echo.

REM Wait a bit more for Frontend to be fully ready
timeout /t 3 >nul

echo   Opening browser...
start http://localhost:8080

echo.
echo ========================================
echo   ✅ SAADHYAM AI IS NOW RUNNING!
echo ========================================
echo.
echo   Frontend:  http://localhost:8080
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo   Two terminal windows are now open:
echo   1. Saadhyam Backend (port 8000)
echo   2. Saadhyam Frontend (port 8080)
echo.
echo   To stop the application:
echo   - Close both terminal windows
echo   - Or press Ctrl+C in each terminal
echo.
echo   Troubleshooting:
echo   - If you see errors, run TROUBLESHOOT.bat
echo   - Check FIX_COMPLETE.md for solutions
echo   - Check QUICK_START.md for detailed guide
echo.
echo ========================================
echo.

pause
