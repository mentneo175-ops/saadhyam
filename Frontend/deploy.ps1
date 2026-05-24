# Frontend Deployment Script for Saadhyam AI
# Supports multiple deployment platforms

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("vercel", "netlify", "railway", "cloudflare")]
    [string]$Platform,
    
    [string]$BackendUrl,
    [switch]$Production,
    [switch]$SkipBuild
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

function Update-EnvironmentFile {
    param([string]$BackendUrl)
    
    if (-not $BackendUrl) {
        Write-Status "Backend URL not provided. Please update .env.production manually." "Warning"
        return
    }
    
    Write-Status "Updating .env.production with backend URL..." "Info"
    
    $envContent = @"
# Production Environment Configuration
# Updated automatically by deployment script

VITE_API_BASE_URL=$BackendUrl
VITE_SOCKET_URL=$BackendUrl
VITE_APP_URL=https://your-frontend-domain.com
VITE_ENVIRONMENT=production
"@
    
    Set-Content -Path ".env.production" -Value $envContent
    Write-Status "Environment file updated successfully" "Success"
}

function Deploy-ToVercel {
    Write-Status "Deploying to Vercel..." "Info"
    
    if (-not (Test-Command "vercel")) {
        Write-Status "Vercel CLI not found. Installing..." "Warning"
        npm install -g vercel
    }
    
    # Check if logged in
    try {
        vercel whoami | Out-Null
    }
    catch {
        Write-Status "Please login to Vercel first: vercel login" "Error"
        return $false
    }
    
    # Deploy
    if ($Production) {
        vercel --prod
    }
    else {
        vercel
    }
    
    Write-Status "Vercel deployment completed" "Success"
    return $true
}

function Deploy-ToNetlify {
    Write-Status "Deploying to Netlify..." "Info"
    
    if (-not (Test-Command "netlify")) {
        Write-Status "Netlify CLI not found. Installing..." "Warning"
        npm install -g netlify-cli
    }
    
    # Check if logged in
    try {
        netlify status | Out-Null
    }
    catch {
        Write-Status "Please login to Netlify first: netlify login" "Error"
        return $false
    }
    
    # Build if not skipped
    if (-not $SkipBuild) {
        Write-Status "Building project..." "Info"
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Build failed!" "Error"
            return $false
        }
    }
    
    # Deploy
    if ($Production) {
        netlify deploy --prod --dir=dist
    }
    else {
        netlify deploy --dir=dist
    }
    
    Write-Status "Netlify deployment completed" "Success"
    return $true
}

function Deploy-ToRailway {
    Write-Status "Deploying to Railway..." "Info"
    
    if (-not (Test-Command "railway")) {
        Write-Status "Railway CLI not found. Installing..." "Warning"
        npm install -g @railway/cli
    }
    
    # Check if logged in
    try {
        railway whoami | Out-Null
    }
    catch {
        Write-Status "Please login to Railway first: railway login" "Error"
        return $false
    }
    
    # Deploy
    railway up
    
    Write-Status "Railway deployment completed" "Success"
    return $true
}

function Deploy-ToCloudflare {
    Write-Status "Deploying to Cloudflare Pages..." "Info"
    
    if (-not (Test-Command "wrangler")) {
        Write-Status "Wrangler CLI not found. Installing..." "Warning"
        npm install -g wrangler
    }
    
    # Check if logged in
    try {
        wrangler whoami | Out-Null
    }
    catch {
        Write-Status "Please login to Cloudflare first: wrangler login" "Error"
        return $false
    }
    
    # Build if not skipped
    if (-not $SkipBuild) {
        Write-Status "Building project..." "Info"
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Build failed!" "Error"
            return $false
        }
    }
    
    # Deploy
    wrangler pages deploy dist
    
    Write-Status "Cloudflare Pages deployment completed" "Success"
    return $true
}

# Main deployment function
function Start-Deployment {
    Write-Host "==========================================================" -ForegroundColor Blue
    Write-Host "🚀 Saadhyam AI Frontend - Deployment Script" -ForegroundColor Blue
    Write-Host "==========================================================" -ForegroundColor Blue
    Write-Host ""
    
    Write-Status "Platform: $Platform" "Info"
    Write-Status "Production: $Production" "Info"
    Write-Status "Skip Build: $SkipBuild" "Info"
    
    # Validate environment
    if (-not (Test-Path "package.json")) {
        Write-Status "package.json not found! Please run from Frontend directory." "Error"
        return $false
    }
    
    # Update environment file if backend URL provided
    if ($BackendUrl) {
        Update-EnvironmentFile -BackendUrl $BackendUrl
    }
    
    # Install dependencies
    Write-Status "Installing dependencies..." "Info"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Status "npm install failed!" "Error"
        return $false
    }
    
    # Build project (for platforms that need it)
    if (-not $SkipBuild -and ($Platform -eq "netlify" -or $Platform -eq "cloudflare")) {
        Write-Status "Building project..." "Info"
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Build failed!" "Error"
            return $false
        }
        Write-Status "Build completed successfully" "Success"
    }
    
    # Deploy based on platform
    $success = switch ($Platform) {
        "vercel" { Deploy-ToVercel }
        "netlify" { Deploy-ToNetlify }
        "railway" { Deploy-ToRailway }
        "cloudflare" { Deploy-ToCloudflare }
        default { 
            Write-Status "Unknown platform: $Platform" "Error"
            $false
        }
    }
    
    if ($success) {
        Write-Host ""
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host "🎉 Frontend Deployment Complete!" -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Update backend CORS with your frontend URL"
        Write-Host "2. Test all features on the deployed frontend"
        Write-Host "3. Configure custom domain (optional)"
        Write-Host "4. Set up monitoring and analytics"
        Write-Host ""
    }
    else {
        Write-Status "Deployment failed!" "Error"
        return $false
    }
    
    return $true
}

# Run deployment
try {
    $success = Start-Deployment
    if (-not $success) {
        exit 1
    }
}
catch {
    Write-Status "Deployment error: $($_.Exception.Message)" "Error"
    exit 1
}