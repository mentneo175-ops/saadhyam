# Railway Deployment Script for Saadhyam AI Backend (PowerShell)
# This script helps automate the Railway deployment process

param(
    [switch]$SkipBuildTest,
    [switch]$Force
)

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline
    Write-Host "[$Type] " -ForegroundColor $Colors[$Type] -NoNewline
    Write-Host $Message
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Main deployment function
function Start-RailwayDeployment {
    Write-Host "==========================================================" -ForegroundColor Blue
    Write-Host "🚀 Saadhyam AI - Railway Deployment Script (PowerShell)" -ForegroundColor Blue
    Write-Host "==========================================================" -ForegroundColor Blue
    Write-Host ""

    # Check Railway CLI
    Write-Status "Checking Railway CLI installation..." "Info"
    if (-not (Test-Command "railway")) {
        Write-Status "Railway CLI is not installed!" "Error"
        Write-Host "Please install it with: npm install -g @railway/cli"
        Write-Host "Or visit: https://docs.railway.app/develop/cli"
        return $false
    }
    Write-Status "Railway CLI is installed" "Success"

    # Check Railway authentication
    Write-Status "Checking Railway authentication..." "Info"
    try {
        $null = railway whoami 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Not authenticated"
        }
        Write-Status "Railway authentication verified" "Success"
    }
    catch {
        Write-Status "You are not logged in to Railway!" "Error"
        Write-Host "Please run: railway login"
        return $false
    }

    # Validate environment
    Write-Status "Validating deployment environment..." "Info"
    
    $requiredFiles = @("main.py", "requirements.txt", "Dockerfile", "entrypoint.sh")
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Status "$file not found!" "Error"
            Write-Host "Please run this script from the Backend directory"
            return $false
        }
    }
    Write-Status "Environment validation passed" "Success"

    # Test Docker build (optional)
    if (-not $SkipBuildTest) {
        $testBuild = Read-Host "Do you want to test local Docker build first? (Y/n)"
        if ($testBuild -ne "n" -and $testBuild -ne "N") {
            Write-Status "Testing local Docker build..." "Info"
            try {
                docker build -t saadhyam-test . | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Status "Local Docker build successful" "Success"
                    docker rmi saadhyam-test | Out-Null
                }
                else {
                    throw "Build failed"
                }
            }
            catch {
                Write-Status "Local Docker build failed!" "Error"
                Write-Host "Please fix Docker build issues before deploying to Railway"
                return $false
            }
        }
    }

    # Confirm deployment
    if (-not $Force) {
        $confirm = Read-Host "Do you want to proceed with Railway deployment? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Status "Deployment cancelled by user" "Info"
            return $true
        }
    }

    # Deploy to Railway
    Write-Status "Starting Railway deployment..." "Info"
    
    try {
        # Check if project exists
        $null = railway status 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Deploying to existing Railway project..." "Info"
        }
        else {
            Write-Status "Creating new Railway project..." "Info"
            railway init
        }
        
        railway up
        if ($LASTEXITCODE -ne 0) {
            throw "Deployment failed"
        }
        Write-Status "Railway deployment initiated" "Success"
    }
    catch {
        Write-Status "Railway deployment failed!" "Error"
        return $false
    }

    # Setup services
    Write-Status "Setting up Railway services..." "Info"
    
    Write-Status "Adding PostgreSQL service..." "Info"
    railway add postgresql 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "PostgreSQL service may already exist" "Warning"
    }
    
    Write-Status "Adding Redis service..." "Info"
    railway add redis 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Redis service may already exist" "Warning"
    }
    
    Write-Status "Services setup completed" "Success"

    # Post-deployment instructions
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Configure environment variables in Railway Dashboard:"
    Write-Host "   - SECRET_KEY (generate a secure random string)"
    Write-Host "   - ALLOWED_ORIGINS (your frontend domain)"
    Write-Host "   - API keys for AI services (optional)"
    Write-Host ""
    Write-Host "2. Check deployment status:" -ForegroundColor Yellow
    Write-Host "   railway status"
    Write-Host ""
    Write-Host "3. View logs:" -ForegroundColor Yellow
    Write-Host "   railway logs"
    Write-Host ""
    Write-Host "4. Open your application:" -ForegroundColor Yellow
    Write-Host "   railway open"
    Write-Host ""
    Write-Host "5. Get your application URL:" -ForegroundColor Yellow
    Write-Host "   railway domain"
    Write-Host ""
    Write-Host "📖 For detailed configuration, see RAILWAY_DEPLOYMENT.md" -ForegroundColor Cyan
    Write-Host ""

    return $true
}

# Run the deployment
try {
    $success = Start-RailwayDeployment
    if (-not $success) {
        exit 1
    }
}
catch {
    Write-Status "Deployment interrupted: $($_.Exception.Message)" "Error"
    exit 1
}