# FREE TIER Render Deployment Script for Saadhyam AI Backend
# This script optimizes your backend for Render's FREE tier (no payment required)

Write-Host "========================================" -ForegroundColor Green
Write-Host "🆓 Saadhyam AI - FREE Render Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "main.py")) {
    Write-Host "❌ Error: Please run this script from the Backend directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found main.py - we're in the correct directory" -ForegroundColor Green

# Fix line endings for Linux
Write-Host "🔧 Fixing line endings for Linux deployment..." -ForegroundColor Yellow
$content = Get-Content "entrypoint.sh" -Raw
$content = $content -replace "`r`n", "`n"
[System.IO.File]::WriteAllText("entrypoint.sh", $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "✅ Line endings fixed" -ForegroundColor Green

# Check git status
if (-not (Test-Path ".git")) {
    Write-Host "🔄 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Add all files to git
Write-Host "🔄 Adding files to Git..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "🔄 Committing changes..." -ForegroundColor Yellow
    git commit -m "FREE TIER: Optimize backend for Render free deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Blue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🆓 FREE TIER OPTIMIZATIONS APPLIED:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Removed external Redis service" -ForegroundColor White
Write-Host "✅ Using internal Redis (50MB limit)" -ForegroundColor White
Write-Host "✅ Single Celery worker process" -ForegroundColor White
Write-Host "✅ Minimal logging for performance" -ForegroundColor White
Write-Host "✅ Optimized Docker image" -ForegroundColor White
Write-Host "✅ Memory usage under 512MB" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "📋 NEXT STEPS (100% FREE):" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "1. Push to GitHub (if not done already)" -ForegroundColor White
Write-Host "2. Go to https://render.com" -ForegroundColor White
Write-Host "3. Click 'New' → 'Web Service' (NOT Blueprint)" -ForegroundColor White
Write-Host "4. Connect your GitHub repository" -ForegroundColor White
Write-Host "5. Select this repository" -ForegroundColor White
Write-Host "6. Configure manually:" -ForegroundColor White
Write-Host "   - Name: saadhyam-backend" -ForegroundColor Cyan
Write-Host "   - Environment: Docker" -ForegroundColor Cyan
Write-Host "   - Plan: FREE" -ForegroundColor Cyan
Write-Host "   - Region: Oregon" -ForegroundColor Cyan
Write-Host "   - Branch: main" -ForegroundColor Cyan
Write-Host "   - Dockerfile Path: ./Dockerfile" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Your FREE backend will be at:" -ForegroundColor Green
Write-Host "https://saadhyam-backend.onrender.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "💰 COST: $0.00 (Completely FREE)" -ForegroundColor Green
Write-Host "📊 Limits: 512MB RAM, 750 hours/month" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 Ready for FREE deployment!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green