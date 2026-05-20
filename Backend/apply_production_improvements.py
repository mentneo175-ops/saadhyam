"""
Production Improvements Integration Script
Helps integrate production readiness improvements into main.py
"""

import os
import sys

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")


def check_files_exist():
    """Check if all required files exist"""
    print_section("Checking Required Files")
    
    required_files = [
        "models/responses.py",
        "middleware/error_handler.py",
        "config/cors_config.py",
        "middleware/security.py",
        "config/database.py"
    ]
    
    all_exist = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - NOT FOUND")
            all_exist = False
    
    return all_exist


def show_main_py_changes():
    """Show changes needed in main.py"""
    print_section("Changes Needed in main.py")
    
    print("1. ADD IMPORTS (after existing imports):")
    print("-" * 60)
    print("""
from config.cors_config import get_cors_config
from middleware.error_handler import (
    global_exception_handler,
    custom_http_exception_handler,
    CustomHTTPException
)
from models.responses import ErrorResponse, SuccessResponse
""")
    
    print("\n2. REPLACE CORS CONFIGURATION:")
    print("-" * 60)
    print("""
# OLD CODE (remove this):
# cors_origins = [...]
# app.add_middleware(CORSMiddleware, allow_origins=cors_origins, ...)

# NEW CODE (add this):
cors_config = get_cors_config()
app.add_middleware(CORSMiddleware, **cors_config)
""")
    
    print("\n3. ADD ERROR HANDLER MIDDLEWARE (after CORS):")
    print("-" * 60)
    print("""
# Add global error handler
app.middleware("http")(global_exception_handler)

# Add custom exception handler
app.add_exception_handler(CustomHTTPException, custom_http_exception_handler)
""")
    
    print("\n4. UPDATE EXISTING EXCEPTION HANDLER:")
    print("-" * 60)
    print("""
# OLD CODE (remove or comment out):
# @app.exception_handler(Exception)
# async def global_exception_handler(request, exc):
#     ...

# NEW CODE: Already handled by middleware/error_handler.py
# No additional code needed!
""")


def show_route_examples():
    """Show example route updates"""
    print_section("Example Route Updates")
    
    print("BEFORE (Old Style):")
    print("-" * 60)
    print("""
@router.post("/login")
async def login(request: LoginRequest):
    user = authenticate(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": create_token(user)}
""")
    
    print("\nAFTER (New Style):")
    print("-" * 60)
    print("""
from models.responses import success_response, ErrorCode
from middleware.error_handler import CustomHTTPException

@router.post("/login")
async def login(request: LoginRequest):
    user = authenticate(request.email, request.password)
    if not user:
        raise CustomHTTPException(
            status_code=401,
            error_code=ErrorCode.INVALID_CREDENTIALS,
            message="Invalid credentials",
            detail="Email or password is incorrect"
        )
    
    return success_response(
        data={"token": create_token(user), "user_id": user.id},
        message="Login successful"
    )
""")


def show_rate_limit_examples():
    """Show rate limiting examples"""
    print_section("Rate Limiting Examples")
    
    print("1. Import rate limiter:")
    print("-" * 60)
    print("""
from middleware.security import RateLimitDecorators
from fastapi import Request
""")
    
    print("\n2. Apply to authentication endpoints:")
    print("-" * 60)
    print("""
@router.post("/login")
@limiter.limit(RateLimitDecorators.AUTH_LOGIN)  # 5/minute
async def login(request: Request, data: LoginRequest):
    # ... login logic
    pass

@router.post("/register")
@limiter.limit(RateLimitDecorators.AUTH_REGISTER)  # 3/minute
async def register(request: Request, data: RegisterRequest):
    # ... registration logic
    pass
""")
    
    print("\n3. Apply to AI/Analysis endpoints:")
    print("-" * 60)
    print("""
@router.post("/trigger")
@limiter.limit(RateLimitDecorators.AI_ANALYSIS)  # 20/minute
async def trigger_analysis(request: Request, current_user: User = Depends(get_current_user)):
    # ... analysis logic
    pass
""")


def show_environment_setup():
    """Show environment variable setup"""
    print_section("Environment Variables Setup")
    
    print("Development (.env):")
    print("-" * 60)
    print("""
ENVIRONMENT=development
RATE_LIMIT_ENABLED=true
MAX_REQUEST_SIZE_MB=10
# ALLOWED_ORIGINS is optional in development
""")
    
    print("\nProduction (.env):")
    print("-" * 60)
    print("""
ENVIRONMENT=production
RATE_LIMIT_ENABLED=true
MAX_REQUEST_SIZE_MB=10
ALLOWED_ORIGINS=https://app.saadhyam.com,https://www.saadhyam.com
""")


def show_testing_commands():
    """Show testing commands"""
    print_section("Testing Commands")
    
    print("1. Test Rate Limiting:")
    print("-" * 60)
    print("""
# Windows PowerShell
for ($i=1; $i -le 10; $i++) {
    curl -X POST http://localhost:8000/api/auth/login `
      -H "Content-Type: application/json" `
      -d '{"email":"test@example.com","password":"wrong"}'
}
""")
    
    print("\n2. Test CORS:")
    print("-" * 60)
    print("""
curl -X OPTIONS http://localhost:8000/api/auth/login `
  -H "Origin: https://app.saadhyam.com" `
  -H "Access-Control-Request-Method: POST" `
  -v
""")
    
    print("\n3. Test Error Responses:")
    print("-" * 60)
    print("""
# Test validation error
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"invalid-email"}'

# Test authentication error
curl -X GET http://localhost:8000/api/protected/profile `
  -H "Authorization: Bearer invalid-token"
""")


def main():
    """Main function"""
    print("\n" + "="*60)
    print("  🚀 Production Improvements Integration Helper")
    print("="*60)
    
    # Check files
    if not check_files_exist():
        print("\n❌ Some required files are missing!")
        print("   Please ensure all files are created before proceeding.")
        return 1
    
    print("\n✅ All required files exist!")
    
    # Show integration steps
    show_main_py_changes()
    show_route_examples()
    show_rate_limit_examples()
    show_environment_setup()
    show_testing_commands()
    
    # Final instructions
    print_section("Next Steps")
    print("1. ✅ Review the changes above")
    print("2. ✅ Update main.py with new imports and middleware")
    print("3. ✅ Update .env with required environment variables")
    print("4. ✅ Gradually update routes to use new response format")
    print("5. ✅ Apply rate limits to critical endpoints")
    print("6. ✅ Test all changes in development")
    print("7. ✅ Deploy to staging for testing")
    print("8. ✅ Monitor and adjust as needed")
    
    print("\n" + "="*60)
    print("  📚 Documentation")
    print("="*60)
    print("\nFor detailed information, see:")
    print("  - PRODUCTION_READINESS_CHECKLIST.md")
    print("  - PRODUCTION_IMPLEMENTATION_GUIDE.md")
    
    print("\n" + "="*60)
    print("  ✨ Ready for Production!")
    print("="*60 + "\n")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
