#!/usr/bin/env python3
"""
Simple startup script for business analysis server
Run this from the Backend directory
"""

import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

# Import and run the server
if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting Business Analysis Server")
    print("=" * 60)
    print("Port: 9001")
    print("Model: TinyLlama-1.1B-Chat-v1.0")
    print("=" * 60)
    
    try:
        from ai_models.business_analysis.model_server import app
        import uvicorn
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=9001,
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        import traceback
        traceback.print_exc()