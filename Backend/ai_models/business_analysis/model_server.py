"""
Business Analysis Model Server
Separate FastAPI server for business analysis using TinyLlama for fast CPU inference
Runs on port 9001 to avoid GPU memory conflicts with main backend

NOTE: This version uses TinyLlama for fast CPU inference (2-5 seconds).
Mistral-7B + LoRA code is commented and can be re-enabled later.
"""

import logging
import json
import sys
import os
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

# Add the Backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ NO GLOBAL VARIABLES ============
# All model state is managed by singleton in model_loader.py


# ============ Pydantic Models ============

class AnalyzeRequest(BaseModel):
    """Request model for business analysis"""
    description: str = Field(
        ...,
        min_length=20,
        max_length=2000,
        description="Business description to analyze"
    )
    
    class Config:
        example = {
            "description": "We are a restaurant in downtown area serving Italian cuisine. We have 50 seats, open 6 days a week."
        }


class AnalyzeResponse(BaseModel):
    """Response model for business analysis"""
    success: bool
    business_score: int = Field(..., ge=1, le=10)
    ai_visibility_score: int = Field(..., ge=0, le=100)
    conversion_score: int = Field(..., ge=0, le=100)
    strengths: list = Field(...)
    weaknesses: list = Field(...)
    opportunities: list = Field(...)
    threats: list = Field(...)
    recommendations: list = Field(...)
    error: Optional[str] = None


# ============ Model Loading (SINGLETON PATTERN) ============
# Model loading is handled by model_loader.py singleton
# NO model loading code here - everything goes through singleton


# ============ FastAPI App ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app lifecycle - LOAD MODEL ONCE AT STARTUP"""
    # Startup
    logger.info("🔄 Application startup...")
    try:
        # Load model using SINGLETON pattern - this loads it ONCE for entire app
        logger.info("🚀 Loading TinyLlama model using singleton pattern...")
        from ai_models.business_analysis.model_loader import load_model, is_model_loaded, get_model_info
        
        # Load model ONCE
        model, tokenizer = load_model()
        
        # Verify model loaded
        if is_model_loaded():
            logger.info("✅ Model loaded successfully at startup (SINGLETON)")
            info = get_model_info()
            logger.info(f"   Model info: {info}")
        else:
            logger.error("❌ Model failed to load at startup")
            
    except Exception as e:
        logger.error(f"❌ Failed to load model at startup: {e}")
        import traceback
        traceback.print_exc()
    
    yield
    
    # Shutdown
    logger.info("🔄 Application shutdown...")
    logger.info("💾 Clearing model from memory...")
    try:
        from ai_models.business_analysis.model_loader import unload_model
        unload_model()
    except Exception as e:
        logger.error(f"Error during model cleanup: {e}")


app = FastAPI(
    title="Saadhyam AI - Business Analysis Model Server (TinyLlama)",
    description="Fast CPU inference server using TinyLlama for business analysis",
    version="1.0.0",
    lifespan=lifespan
)


# ============ Health Check ============

@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    from ai_models.business_analysis.model_loader import is_model_loaded, get_load_error
    
    if not is_model_loaded():
        error = get_load_error() or "Model not loaded"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "ready": False,
                "error": error
            }
        )
    
    return {
        "status": "healthy",
        "ready": True,
        "service": "Business Analysis Model Server (TinyLlama)",
        "model_loaded": True,
        "port": 9001
    }


# ============ Analysis Endpoint ============

@app.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze(request: AnalyzeRequest):
    """
    Analyze a business description using TinyLlama (SINGLETON)
    
    Returns:
    - business_score: 1-10
    - ai_visibility_score: 0-100
    - conversion_score: 0-100
    - strengths, weaknesses, opportunities, threats, recommendations
    """
    
    from ai_models.business_analysis.model_loader import is_model_loaded
    
    if not is_model_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Check server logs."
        )
    
    if not request.description or not request.description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description cannot be empty"
        )
    
    try:
        # Use generator with SINGLETON model
        from ai_models.business_analysis.generator import analyze_business as analyze_business_local
        result = analyze_business_local(request.description)
        
        if not result.get("success"):
            logger.warning(f"Analysis returned error: {result.get('error')}")
        
        return AnalyzeResponse(**result)
        
    except Exception as e:
        logger.error(f"❌ Error in analyze endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed"
        )


# ============ Info Endpoint ============

@app.get("/info", tags=["Info"])
async def model_info():
    """Get model information"""
    from ai_models.business_analysis.model_loader import is_model_loaded, get_model_info
    
    if not is_model_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )
    
    info = get_model_info()
    return {
        "model_loaded": True,
        "model_name": "TinyLlama-1.1B-Chat-v1.0",
        "quantization": "None (TinyLlama is already small)",
        "cpu_offload": False,
        "device_map": "cpu",
        "gpu_available": False,
        "gpu_device": "None (CPU mode)",
        "inference_time": "2-5 seconds",
        "port": 9001,
        "singleton_info": info
    }


if __name__ == "__main__":
    import torch
    
    logger.info("=" * 80)
    logger.info("🚀 STARTING BUSINESS ANALYSIS MODEL SERVER (TINYLLAMA)")
    logger.info("=" * 80)
    logger.info(f"Port: 9001")
    logger.info("Model: TinyLlama-1.1B-Chat-v1.0")
    logger.info("Device: CPU")
    logger.info("Expected inference: 2-5 seconds")
    logger.info("=" * 80)
    
    uvicorn.run(
        "ai_models.business_analysis.model_server:app",
        host="0.0.0.0",
        port=9001,
        log_level="info",
        access_log=True
    )