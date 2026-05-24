#!/bin/bash

# Railway Deployment Script for Saadhyam AI Backend
# This script helps automate the Railway deployment process

set -e

echo "=========================================================="
echo "🚀 Saadhyam AI - Railway Deployment Script"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    print_status "Checking Railway CLI installation..."
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed!"
        echo "Please install it with: npm install -g @railway/cli"
        echo "Or visit: https://docs.railway.app/develop/cli"
        exit 1
    fi
    print_success "Railway CLI is installed"
}

# Check if user is logged in to Railway
check_railway_auth() {
    print_status "Checking Railway authentication..."
    if ! railway whoami &> /dev/null; then
        print_error "You are not logged in to Railway!"
        echo "Please run: railway login"
        exit 1
    fi
    print_success "Railway authentication verified"
}

# Validate environment
validate_environment() {
    print_status "Validating deployment environment..."
    
    # Check if we're in the right directory
    if [ ! -f "main.py" ] || [ ! -f "requirements.txt" ]; then
        print_error "Please run this script from the Backend directory"
        exit 1
    fi
    
    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile not found!"
        exit 1
    fi
    
    # Check if entrypoint.sh exists and is executable
    if [ ! -f "entrypoint.sh" ]; then
        print_error "entrypoint.sh not found!"
        exit 1
    fi
    
    if [ ! -x "entrypoint.sh" ]; then
        print_warning "Making entrypoint.sh executable..."
        chmod +x entrypoint.sh
    fi
    
    print_success "Environment validation passed"
}

# Test local build
test_local_build() {
    print_status "Testing local Docker build..."
    
    if docker build -t saadhyam-test . > /dev/null 2>&1; then
        print_success "Local Docker build successful"
        docker rmi saadhyam-test > /dev/null 2>&1 || true
    else
        print_error "Local Docker build failed!"
        echo "Please fix Docker build issues before deploying to Railway"
        exit 1
    fi
}

# Deploy to Railway
deploy_to_railway() {
    print_status "Starting Railway deployment..."
    
    # Check if project exists
    if railway status &> /dev/null; then
        print_status "Deploying to existing Railway project..."
        railway up
    else
        print_status "Creating new Railway project..."
        railway init
        railway up
    fi
    
    print_success "Railway deployment initiated"
}

# Setup database services
setup_services() {
    print_status "Setting up Railway services..."
    
    # Add PostgreSQL if not exists
    print_status "Adding PostgreSQL service..."
    railway add postgresql || print_warning "PostgreSQL service may already exist"
    
    # Add Redis if not exists
    print_status "Adding Redis service..."
    railway add redis || print_warning "Redis service may already exist"
    
    print_success "Services setup completed"
}

# Display post-deployment instructions
post_deployment_instructions() {
    echo ""
    echo "=========================================================="
    echo "🎉 Deployment Complete!"
    echo "=========================================================="
    echo ""
    echo "Next steps:"
    echo "1. Configure environment variables in Railway Dashboard:"
    echo "   - SECRET_KEY (generate a secure random string)"
    echo "   - ALLOWED_ORIGINS (your frontend domain)"
    echo "   - API keys for AI services (optional)"
    echo ""
    echo "2. Check deployment status:"
    echo "   railway status"
    echo ""
    echo "3. View logs:"
    echo "   railway logs"
    echo ""
    echo "4. Open your application:"
    echo "   railway open"
    echo ""
    echo "5. Get your application URL:"
    echo "   railway domain"
    echo ""
    echo "📖 For detailed configuration, see RAILWAY_DEPLOYMENT.md"
    echo ""
}

# Main deployment flow
main() {
    echo "Starting deployment process..."
    echo ""
    
    # Pre-deployment checks
    check_railway_cli
    check_railway_auth
    validate_environment
    
    # Ask for confirmation
    echo ""
    read -p "Do you want to proceed with Railway deployment? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled by user"
        exit 0
    fi
    
    # Optional: Test local build
    read -p "Do you want to test local Docker build first? (Y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        test_local_build
    fi
    
    # Deploy
    deploy_to_railway
    setup_services
    
    # Show next steps
    post_deployment_instructions
}

# Handle script interruption
trap 'print_error "Deployment interrupted by user"; exit 1' INT

# Run main function
main "$@"