@echo off
setlocal enabledelayedexpansion

REM Railway Deployment Script for Saadhyam AI Backend (Windows)
REM This script helps automate the Railway deployment process

echo ==========================================================
echo 🚀 Saadhyam AI - Railway Deployment Script (Windows)
echo ==========================================================
echo.

REM Check if Railway CLI is installed
echo [INFO] Checking Railway CLI installation...
railway --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Railway CLI is not installed!
    echo Please install it with: npm install -g @railway/cli
    echo Or visit: https://docs.railway.app/develop/cli
    pause
    exit /b 1
)
echo [SUCCESS] Railway CLI is installed

REM Check if user is logged in to Railway
echo [INFO] Checking Railway authentication...
railway whoami >nul 2>&1
if errorlevel 1 (
    echo [ERROR] You are not logged in to Railway!
    echo Please run: railway login
    pause
    exit /b 1
)
echo [SUCCESS] Railway authentication verified

REM Validate environment
echo [INFO] Validating deployment environment...

if not exist "main.py" (
    echo [ERROR] main.py not found! Please run this script from the Backend directory
    pause
    exit /b 1
)

if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found!
    pause
    exit /b 1
)

if not exist "Dockerfile" (
    echo [ERROR] Dockerfile not found!
    pause
    exit /b 1
)

if not exist "entrypoint.sh" (
    echo [ERROR] entrypoint.sh not found!
    pause
    exit /b 1
)

echo [SUCCESS] Environment validation passed

REM Ask for confirmation
echo.
set /p "confirm=Do you want to proceed with Railway deployment? (y/N): "
if /i not "!confirm!"=="y" (
    echo [INFO] Deployment cancelled by user
    pause
    exit /b 0
)

REM Deploy to Railway
echo [INFO] Starting Railway deployment...

REM Check if project exists
railway status >nul 2>&1
if errorlevel 1 (
    echo [INFO] Creating new Railway project...
    railway init
) else (
    echo [INFO] Deploying to existing Railway project...
)

echo [INFO] Uploading and deploying...
railway up

if errorlevel 1 (
    echo [ERROR] Railway deployment failed!
    pause
    exit /b 1
)

echo [SUCCESS] Railway deployment initiated

REM Setup database services
echo [INFO] Setting up Railway services...

echo [INFO] Adding PostgreSQL service...
railway add postgresql 2>nul || echo [WARNING] PostgreSQL service may already exist

echo [INFO] Adding Redis service...
railway add redis 2>nul || echo [WARNING] Redis service may already exist

echo [SUCCESS] Services setup completed

REM Display post-deployment instructions
echo.
echo ==========================================================
echo 🎉 Deployment Complete!
echo ==========================================================
echo.
echo Next steps:
echo 1. Configure environment variables in Railway Dashboard:
echo    - SECRET_KEY (generate a secure random string)
echo    - ALLOWED_ORIGINS (your frontend domain)
echo    - API keys for AI services (optional)
echo.
echo 2. Check deployment status:
echo    railway status
echo.
echo 3. View logs:
echo    railway logs
echo.
echo 4. Open your application:
echo    railway open
echo.
echo 5. Get your application URL:
echo    railway domain
echo.
echo 📖 For detailed configuration, see RAILWAY_DEPLOYMENT.md
echo.

pause