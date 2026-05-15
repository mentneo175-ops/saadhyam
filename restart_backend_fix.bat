@echo off
echo ========================================
echo RESTARTING BACKEND TO APPLY FIX
echo ========================================
echo.

echo Step 1: Stopping all Python processes...
taskkill /F /IM python.exe /T 2>nul
timeout /t 2 /nobreak >nul
echo ✅ Python processes stopped
echo.

echo Step 2: Clearing Python cache...
cd Backend
for /d /r %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
echo ✅ Python cache cleared
echo.

echo Step 3: Starting backend server...
start "Backend Server" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo ✅ Backend server starting...
echo.

echo ========================================
echo BACKEND RESTARTED SUCCESSFULLY
echo ========================================
echo.
echo Next steps:
echo 1. Schedule a new Instagram post
echo 2. Wait for it to publish (scheduler runs every 1 minute)
echo 3. Run: cd Backend ^&^& python verify_instagram_media_id.py
echo 4. Verify instagram_media_id is saved
echo.
pause
