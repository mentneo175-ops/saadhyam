# Render Deployment Script for Saadhyam AI Backend
# Run this script to prepare and deploy your backend to Render

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Saadhyam AI - Render Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "main.py")) {
    Write-Host "❌ Error: Please run this script from the Backend directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found main.py - we're in the correct directory" -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "🔄 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Check if requirements.txt exists
if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ Error: requirements.txt not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found requirements.txt" -ForegroundColor Green

# Check if Dockerfile exists
if (-not (Test-Path "Dockerfile")) {
    Write-Host "❌ Error: Dockerfile not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Dockerfile" -ForegroundColor Green

# Check if render.yaml exists
if (-not (Test-Path "render.yaml")) {
    Write-Host "❌ Error: render.yaml not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found render.yaml" -ForegroundColor Green

# Check if entrypoint.sh exists and is executable
if (-not (Test-Path "entrypoint.sh")) {
    Write-Host "❌ Error: entrypoint.sh not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found entrypoint.sh" -ForegroundColor Green

# Add all files to git
Write-Host "🔄 Adding files to Git..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "🔄 Committing changes..." -ForegroundColor Yellow
    git commit -m "Prepare backend for Render deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Blue
}

# Check if remote origin exists
$remotes = git remote -v
if ($remotes -match "origin") {
    Write-Host "✅ Git remote 'origin' found" -ForegroundColor Green
    
    # Push to GitHub
    Write-Host "🔄 Pushing to GitHub..." -ForegroundColor Yellow
    try {
        git push origin main
        Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Push failed. You may need to set up the remote or resolve conflicts." -ForegroundColor Yellow
        Write-Host "Run: git remote add origin <your-github-repo-url>" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No Git remote 'origin' found" -ForegroundColor Yellow
    Write-Host "Please add your GitHub repository as remote:" -ForegroundColor Cyan
    Write-Host "git remote add origin <your-github-repo-url>" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Go to https://render.com" -ForegroundColor White
Write-Host "2. Click 'New' → 'Blueprint'" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Select this repository" -ForegroundColor White
Write-Host "5. Render will auto-detect render.yaml" -ForegroundColor White
Write-Host "6. Click 'Apply' to deploy" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed instructions, see: deploy-render.md" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your backend will be available at:" -ForegroundColor Cyan
Write-Host "https://saadhyam-backend.onrender.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Health check endpoint:" -ForegroundColor Cyan
Write-Host "https://saadhyam-backend.onrender.com/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Ready for Render deployment!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan