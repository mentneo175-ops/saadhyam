"""
Saadhyam AI Backend - ULTRA MINIMAL for FREE TIER
Memory optimized version for Render free tier (512MB limit)
"""

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Minimal logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

# Create minimal FastAPI app
app = FastAPI(
    title="Saadhyam AI - Free Tier",
    description="Minimal version for free deployment",
    version="1.0.0"
)

# Minimal CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Simplified for free tier
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Essential routes only
@app.get("/")
async def root():
    return {"message": "Saadhyam AI Backend - Free Tier", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "tier": "free"}

# Minimal auth endpoint
@app.post("/auth/login")
async def login():
    return {"message": "Auth endpoint - upgrade for full functionality"}

# Minimal API endpoint
@app.get("/api/status")
async def api_status():
    return {"api": "active", "features": "limited", "upgrade": "for full access"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)