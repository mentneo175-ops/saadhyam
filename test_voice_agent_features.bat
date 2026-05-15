@echo off
echo ============================================
echo   Voice Agent Features - Quick Test
echo ============================================
echo.

echo [INFO] This script will help you test the new Voice Agent features
echo.

REM Check if services are running
echo [STEP 1] Checking if services are running...
echo.

REM Check Backend
curl -s http://localhost:8000/docs >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend is NOT running on port 8000
    echo Please run: start_all.bat
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Backend is running on port 8000
)

REM Check Frontend
curl -s http://localhost:8080 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Frontend is NOT running on port 8080
    echo Please run: start_all.bat
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Frontend is running on port 8080
)

REM Check Redis
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Redis might not be running
    echo Voice calling features require Redis
    echo Start Redis: docker run -d -p 6379:6379 redis:latest
) else (
    echo [OK] Redis is running
)

echo.
echo ============================================
echo   All Services Running!
echo ============================================
echo.

echo [STEP 2] Opening Voice Agent pages for testing...
echo.

REM Wait a moment
timeout /t 2 /nobreak >nul

echo Opening pages in browser...
echo.

REM Open main dashboard
start http://localhost:8080/dashboard/voice-agent
echo [1/3] Voice Agent Dashboard opened

timeout /t 1 /nobreak >nul

REM Open conversation history (NEW)
start http://localhost:8080/dashboard/voice-agent/conversations
echo [2/3] Conversation History opened (NEW FEATURE)

timeout /t 1 /nobreak >nul

REM Open analytics (NEW)
start http://localhost:8080/dashboard/voice-agent/analytics
echo [3/3] Analytics Dashboard opened (NEW FEATURE)

echo.
echo ============================================
echo   Testing Instructions
echo ============================================
echo.
echo NEW FEATURES TO TEST:
echo.
echo 1. CONVERSATION HISTORY PAGE
echo    URL: /dashboard/voice-agent/conversations
echo    - Check if page loads
echo    - See 5 stat cards
echo    - Try search and filters
echo    - Expand a conversation (if data exists)
echo    - Download transcript
echo.
echo 2. ANALYTICS DASHBOARD PAGE
echo    URL: /dashboard/voice-agent/analytics
echo    - Check if page loads
echo    - See 4 metric cards
echo    - See 7 charts (may be empty if no data)
echo    - Try date range filter
echo    - Try campaign filter
echo.
echo TO GENERATE TEST DATA:
echo    1. Create a test campaign
echo    2. Upload 3-5 test leads
echo    3. Start calling
echo    4. Wait for completion
echo    5. Refresh conversation history and analytics
echo.
echo ============================================
echo   Quick Test Checklist
echo ============================================
echo.
echo [ ] Dashboard loads
echo [ ] Conversation History page loads
echo [ ] Analytics page loads
echo [ ] Can create campaign
echo [ ] Can upload leads
echo [ ] Simulator works
echo [ ] Can start calling
echo [ ] Conversations appear after calling
echo [ ] Analytics populate with data
echo [ ] No console errors (F12)
echo.
echo ============================================
echo   API Endpoints to Test
echo ============================================
echo.
echo Backend API Docs: http://localhost:8000/docs
echo.
echo Key endpoints:
echo - GET  /api/v2/voice-agent/campaigns
echo - POST /api/v2/voice-agent/campaigns
echo - GET  /api/v2/voice-agent/dashboard/stats
echo - POST /api/v2/voice-agent/conversation/simulate
echo - POST /api/voice-agent/campaigns/{id}/start-calling
echo - GET  /api/voice-agent/campaigns/{id}/call-progress
echo.
echo ============================================
echo   Documentation
echo ============================================
echo.
echo Read these files for detailed information:
echo - START_VOICE_AGENT_TESTING.md (This guide)
echo - VOICE_AGENT_QUICK_START.md (Quick start)
echo - VOICE_AGENT_IMPLEMENTATION_SUMMARY.md (Complete summary)
echo - VOICE_AGENT_README.md (Technical docs)
echo.
echo ============================================
echo   Need Help?
echo ============================================
echo.
echo If you see errors:
echo 1. Check browser console (F12)
echo 2. Check backend terminal for errors
echo 3. Check celery worker terminal
echo 4. Restart services: stop_all.bat then start_all.bat
echo.
echo ============================================
echo   Testing Complete!
echo ============================================
echo.
echo Press any key to exit...
pause >nul
