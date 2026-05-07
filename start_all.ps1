# Saadhyam AI - Start All Services
# PowerShell script to start all required services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Saadhyam AI - All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variable for Windows compatibility
$env:FORKED_BY_MULTIPROCESSING = "1"

# Get the current directory
$ROOT_DIR = Get-Location

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDir
    )
    
    Write-Host "[Starting] $Name..." -ForegroundColor Yellow
    
    # Start process in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDir'; Write-Host '$Name' -ForegroundColor Green; $Command" -WindowStyle Normal
    
    Start-Sleep -Seconds 2
    Write-Host "[Started] $Name" -ForegroundColor Green
    Write-Host ""
}

# Start Business Analysis Model Server
Start-Service -Name "Business Model Server (Port 9001)" `
              -Command ".\venv\Scripts\Activate.ps1; cd ai_models\business_analysis; python model_server.py" `
              -WorkingDir "$ROOT_DIR\Backend"

Start-Sleep -Seconds 3

# Start Backend Server
Start-Service -Name "Backend Server (Port 8000)" `
              -Command ".\venv\Scripts\Activate.ps1; python main.py" `
              -WorkingDir "$ROOT_DIR\Backend"

# Start Instagram Celery Worker
Start-Service -Name "Instagram Celery Worker" `
              -Command ".\venv\Scripts\Activate.ps1; celery -A celery_worker worker --loglevel=info --pool=solo" `
              -WorkingDir "$ROOT_DIR\Backend"

# Start Website AI Celery Worker
Start-Service -Name "Website AI Celery Worker" `
              -Command ".\venv\Scripts\Activate.ps1; python -m celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo" `
              -WorkingDir "$ROOT_DIR\Backend"

# Start Frontend
Start-Service -Name "Frontend Server (Port 5173)" `
              -Command "npm run dev" `
              -WorkingDir "$ROOT_DIR\Frontend"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  All Services Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Running Services:" -ForegroundColor Cyan
Write-Host "  - Business Model Server:    http://localhost:9001" -ForegroundColor White
Write-Host "  - Backend API:              http://localhost:8000" -ForegroundColor White
Write-Host "  - Frontend:                 http://localhost:5173" -ForegroundColor White
Write-Host "  - Instagram Celery Worker:  Running in background" -ForegroundColor White
Write-Host "  - Website AI Celery Worker: Running in background" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop all services, close all the opened terminal windows." -ForegroundColor Red
Write-Host ""
Write-Host "Press any key to exit this window (services will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
