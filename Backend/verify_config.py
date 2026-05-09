"""
Configuration Verification Script
Checks if all environment variables are properly loaded
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("🔍 CONFIGURATION VERIFICATION")
print("=" * 60)

# Check critical environment variables
checks = {
    "Database": {
        "DATABASE_URL": os.getenv("DATABASE_URL"),
    },
    "Gemini API": {
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY"),
        "GEMINI_API_KEY_2": os.getenv("GEMINI_API_KEY_2"),
        "GEMINI_API_KEY_3": os.getenv("GEMINI_API_KEY_3"),
    },
    "Web Search APIs": {
        "TAVILY_API_KEY": os.getenv("TAVILY_API_KEY"),
        "SERPER_API_KEY": os.getenv("SERPER_API_KEY"),
        "BRAVE_SEARCH_API_KEY": os.getenv("BRAVE_SEARCH_API_KEY"),
    },
    "Other APIs": {
        "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
        "HUGGINGFACE_TOKEN": os.getenv("HUGGINGFACE_TOKEN"),
    }
}

all_good = True

for category, vars in checks.items():
    print(f"\n📦 {category}")
    print("-" * 60)
    
    for var_name, var_value in vars.items():
        if var_value and var_value.strip():
            # Mask the value for security
            if len(var_value) > 10:
                masked = var_value[:8] + "..." + var_value[-4:]
            else:
                masked = "***"
            print(f"  ✅ {var_name}: {masked}")
        else:
            print(f"  ⚠️  {var_name}: Not configured")
            if var_name in ["GEMINI_API_KEY", "TAVILY_API_KEY", "SERPER_API_KEY", "DATABASE_URL"]:
                all_good = False

print("\n" + "=" * 60)

if all_good:
    print("✅ ALL CRITICAL CONFIGURATIONS ARE SET")
    print("\nYou can now start the backend server:")
    print("  cd Backend")
    print("  ..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000")
else:
    print("⚠️  SOME CRITICAL CONFIGURATIONS ARE MISSING")
    print("\nPlease check your .env file and add missing API keys.")

print("=" * 60)

# Try to import Pydantic settings
print("\n🔧 Testing Pydantic Settings Import...")
try:
    from config.settings import settings
    print("✅ Pydantic settings loaded successfully!")
    print(f"   - Database: {settings.DATABASE_URL[:30]}...")
    print(f"   - Gemini API: {'Configured' if settings.GEMINI_API_KEY else 'Not configured'}")
    print(f"   - Tavily API: {'Configured' if settings.TAVILY_API_KEY else 'Not configured'}")
    print(f"   - Serper API: {'Configured' if settings.SERPER_API_KEY else 'Not configured'}")
except Exception as e:
    print(f"❌ Failed to load Pydantic settings: {e}")
    all_good = False

print("\n" + "=" * 60)

if all_good:
    print("🚀 READY TO START BACKEND SERVER!")
else:
    print("⚠️  PLEASE FIX CONFIGURATION ISSUES FIRST")

print("=" * 60)
