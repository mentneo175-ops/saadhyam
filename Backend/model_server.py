"""
Saadhyam AI Model Server
Standalone FastAPI server for ML model inference
Runs on port 9000 in a separate process
"""

import logging
import sys
import os
from typing import Optional
from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
import uvicorn

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global model state
model_instance = None
tokenizer_instance = None
model_loaded = False
load_error = None


def load_model_sync():
    """Load model synchronously at startup"""
    global model_instance, tokenizer_instance, model_loaded, load_error
    
    try:
        logger.info("=" * 80)
        logger.info("🚀 INITIALIZING MODEL SERVER - LOADING ML MODEL...")
        logger.info("=" * 80)
        
        from ai_models.review_reply_ai.model_loader import load_model
        
        logger.info("📦 Importing model loader...")
        model_instance, tokenizer_instance = load_model()
        
        logger.info(f"✅ Model device: {model_instance.device if hasattr(model_instance, 'device') else 'Unknown'}")
        logger.info(f"✅ Model dtype: {model_instance.dtype if hasattr(model_instance, 'dtype') else 'Unknown'}")
        logger.info(f"✅ Model parameters: {model_instance.num_parameters() if hasattr(model_instance, 'num_parameters') else 'Unknown'}")
        
        model_loaded = True
        logger.info("=" * 80)
        logger.info("🎉 MODEL LOADED SUCCESSFULLY - SERVER READY FOR INFERENCE")
        logger.info("=" * 80)
        
    except Exception as e:
        model_loaded = False
        load_error = str(e)
        logger.error("=" * 80)
        logger.error(f"❌ FAILED TO LOAD MODEL: {e}")
        logger.error("=" * 80)
        import traceback
        logger.error(traceback.format_exc())


def generate_text(prompt: str, max_new_tokens: int = 128) -> dict:
    """
    Generate text using the loaded model
    
    Args:
        prompt: Input prompt for generation
        max_new_tokens: Maximum new tokens to generate
        
    Returns:
        Dictionary with generated text and metadata
    """
    if not model_loaded:
        raise RuntimeError("Model not loaded")
    
    if not model_instance or not tokenizer_instance:
        raise RuntimeError("Model or tokenizer not initialized")
    
    try:
        import torch
        
        logger.info(f"📝 Generating text for prompt: {prompt[:100]}...")
        
        # Tokenize input
        inputs = tokenizer_instance(
            prompt,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        )
        
        # Move to same device as model
        device = next(model_instance.parameters()).device
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        logger.info(f"🔧 Input tokens: {inputs['input_ids'].shape}")
        
        # Generate
        with torch.no_grad():
            outputs = model_instance.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer_instance.eos_token_id,
                eos_token_id=tokenizer_instance.eos_token_id,
            )
        
        # Decode
        generated_text = tokenizer_instance.decode(
            outputs[0],
            skip_special_tokens=True
        )
        
        logger.info(f"✅ Generated {len(outputs[0])} tokens")
        
        return {
            "success": True,
            "prompt": prompt,
            "generated_text": generated_text,
            "tokens_generated": len(outputs[0]) - inputs['input_ids'].shape[1],
            "max_new_tokens": max_new_tokens
        }
        
    except Exception as e:
        logger.error(f"❌ Generation error: {e}", exc_info=True)
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage app lifecycle
    Load model at startup, cleanup at shutdown
    """
    # Startup
    logger.info("🔄 Application startup...")
    load_model_sync()
    
    yield
    
    # Shutdown
    logger.info("🔄 Application shutdown...")
    logger.info("💾 Clearing model from memory...")


# Create FastAPI app
app = FastAPI(
    title="Saadhyam AI Model Server",
    description="Standalone ML model inference server for review reply generation",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/", tags=["Health"])
async def health_check():
    """
    Health check endpoint
    Returns model status and server readiness
    """
    if not model_loaded:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "ready": False,
                "error": load_error or "Model not loaded"
            }
        )
    
    return {
        "status": "healthy",
        "ready": True,
        "service": "Saadhyam AI Model Server",
        "model_loaded": model_loaded,
        "model_device": str(model_instance.device) if hasattr(model_instance, 'device') else "unknown",
    }


@app.post("/generate", tags=["Generation"])
async def generate(
    prompt: str,
    max_new_tokens: int = 128
):
    """
    Generate text using the AI model
    
    Args:
        prompt: Input prompt for text generation
        max_new_tokens: Maximum number of new tokens to generate (default: 128)
        
    Returns:
        Generated text with metadata
    """
    if not model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Check server logs."
        )
    
    if not prompt or not prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt cannot be empty"
        )
    
    if max_new_tokens < 1 or max_new_tokens > 512:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_new_tokens must be between 1 and 512"
        )
    
    try:
        result = generate_text(prompt, max_new_tokens)
        return result
        
    except RuntimeError as e:
        logger.error(f"Runtime error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Generation failed. Check server logs."
        )


@app.get("/info", tags=["Info"])
async def model_info():
    """Get information about loaded model"""
    if not model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )
    
    try:
        return {
            "model_loaded": True,
            "model_type": type(model_instance).__name__,
            "model_device": str(model_instance.device) if hasattr(model_instance, 'device') else "unknown",
            "model_dtype": str(model_instance.dtype) if hasattr(model_instance, 'dtype') else "unknown",
            "model_parameters": model_instance.num_parameters() if hasattr(model_instance, 'num_parameters') else None,
            "tokenizer_type": type(tokenizer_instance).__name__,
        }
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get model info"
        )


if __name__ == "__main__":
    logger.info("=" * 80)
    logger.info("🚀 STARTING SAADHYAM AI MODEL SERVER")
    logger.info("=" * 80)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=9000,
        log_level="info",
        access_log=True,
    )
