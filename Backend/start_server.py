#!/usr/bin/env python3
"""
Saadhyam AI Backend Startup Script
Handles dependencies and starts the server
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'sqlalchemy', 
        'psycopg2-binary',
        'asyncpg',
        'pydantic',
        'python-multipart',
        'python-socketio',
        'python-dotenv',
        'httpx',
        'aiosqlite'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            module_name = package.replace('-', '_')
            if package == 'python-socketio':
                module_name = 'socketio'
            elif package == 'python-dotenv':
                module_name = 'dotenv'
            __import__(module_name)
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def install_dependencies(packages):
    """Install missing dependencies"""
    if not packages:
        return True
    
    logger.info(f"Installing missing packages: {', '.join(packages)}")
    
    try:
        # Try pip3 first
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '--user'
        ] + packages)
        return True
    except subprocess.CalledProcessError:
        try:
            # Try with --break-system-packages
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', '--break-system-packages'
            ] + packages)
            return True
        except subprocess.CalledProcessError:
            logger.error("Failed to install dependencies")
            return False

def start_server():
    """Start the FastAPI server"""
    try:
        logger.info("Starting Saadhyam AI Backend Server...")
        
        # Add current directory to Python path
        current_dir = Path(__file__).parent
        sys.path.insert(0, str(current_dir))
        
        # Import and run the main app
        import uvicorn
        
        # Run the server
        uvicorn.run(
            "main:app",
            host="0.0.0.0", 
            port=8001,
            reload=False,  # Disable reload for production
            log_level="info"
        )
        
    except ImportError as e:
        logger.error(f"Import error: {e}")
        logger.error("Make sure all dependencies are installed")
        return False
    except Exception as e:
        logger.error(f"Server startup error: {e}")
        return False

def main():
    """Main startup function"""
    print("🚀 SAADHYAM AI BACKEND STARTUP")
    print("=" * 50)
    
    # Check dependencies
    print("1️⃣ Checking dependencies...")
    missing_deps = check_dependencies()
    
    if missing_deps:
        print(f"❌ Missing dependencies: {', '.join(missing_deps)}")
        print("📦 Attempting to install...")
        
        if not install_dependencies(missing_deps):
            print("❌ Failed to install dependencies")
            print("🔧 Please install manually:")
            print(f"   pip install {' '.join(missing_deps)}")
            return False
        
        print("✅ Dependencies installed")
    else:
        print("✅ All dependencies available")
    
    # Set environment variables
    os.environ.setdefault('ENVIRONMENT', 'development')
    
    # Start server
    print("\n2️⃣ Starting server...")
    print("🔌 Plugin system will initialize automatically")
    print("🌐 Server will be available at: http://localhost:8001")
    print("📚 API docs at: http://localhost:8001/docs")
    print("🔌 Plugin endpoints at: http://localhost:8001/api/plugins/test")
    print()
    
    return start_server()

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Startup failed: {e}")
        sys.exit(1)