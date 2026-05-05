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

# Global model and tokenizer instances
_model = None
_tokenizer = None
_model_loaded = False
_load_error = None
_load_config = {
    "quantization": "unknown",
    "cpu_offload": "unknown",
    "device_map": "unknown"
}


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


# ============ Model Loading ============

def load_model():
    """
    Load Mistral-7B model with LoRA adapter
    Supports CPU offloading for GTX 1650 (4GB VRAM)
    Falls back to CPU-only if GPU not available
    """
    global _model, _tokenizer, _model_loaded, _load_error, _load_config
    
    if _model_loaded:
        logger.info("✅ Model already loaded")
        return _model, _tokenizer
    
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
        from peft import PeftModel
        
        logger.info("=" * 80)
        logger.info("🚀 INITIALIZING BUSINESS ANALYSIS MODEL SERVER")
        logger.info("=" * 80)
        
        base_model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        
        # ============ Check GPU Availability ============
        logger.info("🔍 Checking GPU availability...")
        gpu_available = torch.cuda.is_available()
        logger.info(f"   GPU Available: {gpu_available}")
        if gpu_available:
            logger.info(f"   GPU Device: {torch.cuda.get_device_name(0)}")
            logger.info(f"   GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        else:
            logger.warning("   ⚠️  No GPU detected - will use CPU (slower)")
        
        # ============ Load Tokenizer ============
        logger.info("🔤 Loading tokenizer...")
        _tokenizer = AutoTokenizer.from_pretrained(
            base_model_name,
            use_fast=False,
            trust_remote_code=True
        )
        _tokenizer.pad_token = _tokenizer.eos_token
        logger.info("✅ Tokenizer loaded")
        
        # ============ Load Base Model ============
        logger.info("🧠 Loading base model...")
        logger.info("   This may take 2-3 minutes...")
        
        # Create offload directory if it doesn't exist
        os.makedirs("offload", exist_ok=True)
        
        if gpu_available:
            # ============ GPU Mode: 4-bit Quantization with CPU Offload ============
            logger.info("⚙️  Configuring 4-bit quantization with CPU offload...")
            logger.info("   GPU: GTX 1650 (4GB VRAM)")
            logger.info("   Strategy: GPU + CPU offload + Disk offload")
            
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                llm_int8_enable_fp32_cpu_offload=True  # CRITICAL: Enable CPU offload
            )
            logger.info("✅ Quantization config ready")
            
            _model = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                quantization_config=bnb_config,
                device_map="auto",  # Auto-distribute across GPU/CPU
                torch_dtype=torch.float16,
                offload_folder="offload",  # Disk offload for temporary storage
                max_memory={0: "3.0GB", "cpu": "20GB"},  # Conservative GPU allocation
                low_cpu_mem_usage=True  # Minimize CPU memory during loading
            )
            _load_config = {
                "quantization": "4-bit NF4",
                "cpu_offload": "Enabled",
                "device_map": "Auto (GPU + CPU)"
            }
        else:
            # ============ CPU Mode: Prefer 4-bit to reduce RAM ============
            logger.info("⚙️  Loading model on CPU (no GPU available)...")
            logger.info("   This will be SLOW - analysis may take 2-5 minutes per request")
            logger.info("   Trying CPU 4-bit quantization first to reduce RAM usage")

            strict_4bit_cpu = os.getenv("BUSINESS_MODEL_STRICT_CPU_4BIT", "0") == "1"

            try:
                bnb_cpu_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float32,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4"
                )

                _model = AutoModelForCausalLM.from_pretrained(
                    base_model_name,
                    quantization_config=bnb_cpu_config,
                    device_map={"": "cpu"},
                    low_cpu_mem_usage=True
                )
                _load_config = {
                    "quantization": "4-bit NF4 (CPU)",
                    "cpu_offload": "N/A (CPU only)",
                    "device_map": "CPU"
                }
                logger.info("✅ CPU 4-bit quantization enabled")

            except Exception as cpu_4bit_error:
                logger.warning(f"⚠️  CPU 4-bit quantization not available: {cpu_4bit_error}")
                if strict_4bit_cpu:
                    raise RuntimeError(
                        "BUSINESS_MODEL_STRICT_CPU_4BIT=1 but CPU 4-bit quantization failed. "
                        "Install a CPU-compatible bitsandbytes build or disable strict mode."
                    ) from cpu_4bit_error

                logger.info("🔁 Falling back to CPU dynamic int8 quantization to reduce RAM")
                base_cpu_model = AutoModelForCausalLM.from_pretrained(
                    base_model_name,
                    device_map={"": "cpu"},
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=True
                )
                _model = torch.quantization.quantize_dynamic(
                    base_cpu_model,
                    {torch.nn.Linear},
                    dtype=torch.qint8
                )
                _load_config = {
                    "quantization": "Dynamic INT8 (CPU)",
                    "cpu_offload": "N/A (CPU only)",
                    "device_map": "CPU"
                }
                logger.warning("   ⚠️  4-bit CPU unavailable, using dynamic INT8 fallback")
        
        logger.info("✅ Base model loaded")
        
        # ============ Load LoRA Adapter (Optional) ============
        adapter_path = os.path.abspath("./ai_models/business_analysis/adapter")
        
        if os.path.exists(adapter_path):
            logger.info("🔧 Loading Business Analysis LoRA adapter...")
            logger.info(f"   Adapter path: {adapter_path}")
            try:
                _model = PeftModel.from_pretrained(_model, adapter_path)
                logger.info("✅ LoRA adapter loaded")
            except Exception as adapter_error:
                logger.warning(f"⚠️  Could not load LoRA adapter: {adapter_error}")
                logger.info("   Continuing with base model only")
        else:
            logger.info("ℹ️  No LoRA adapter found, using base model only")
        
        # ============ Model Setup ============
        _model.eval()
        logger.info("✅ Model set to evaluation mode")
        
        _model_loaded = True
        
        logger.info("=" * 80)
        logger.info("🎉 MODEL LOADED SUCCESSFULLY")
        logger.info("=" * 80)
        logger.info(f"   Model: TinyLlama-1.1B-Chat-v1.0")
        logger.info(f"   Quantization: {_load_config['quantization']}")
        logger.info(f"   CPU Offload: {_load_config['cpu_offload']}")
        logger.info(f"   Device Map: {_load_config['device_map']}")
        logger.info("=" * 80)
        
        return _model, _tokenizer
        
    except Exception as e:
        _load_error = str(e)
        logger.error("=" * 80)
        logger.error(f"❌ FAILED TO LOAD MODEL: {e}")
        logger.error("=" * 80)
        import traceback
        logger.error(traceback.format_exc())
        raise


def get_model():
    """Get loaded model"""
    global _model
    return _model


def get_tokenizer():
    """Get loaded tokenizer"""
    global _tokenizer
    return _tokenizer


# ============ Analysis Function ============

def analyze_business(description: str) -> Dict[str, Any]:
    """
    Analyze business description and return structured insights
    """
    try:
        import torch
        
        logger.info(f"📊 Analyzing business description ({len(description)} chars)...")
        
        model = get_model()
        tokenizer = get_tokenizer()
        
        if model is None or tokenizer is None:
            logger.error("❌ Model not loaded")
            return {
                "success": False,
                "error": "Model not loaded",
                "business_score": 5,
                "ai_visibility_score": 50,
                "conversion_score": 50,
                "strengths": ["Basic presence"],
                "weaknesses": ["Low engagement"],
                "opportunities": ["Marketing growth"],
                "threats": ["Competition"],
                "recommendations": ["Run ads"]
            }
        
        # ============ Build Prompt ============
        prompt = f"""<|system|>
You are a business analyst. Analyze the business description and return ONLY valid JSON with no additional text.</s>
<|user|>
Analyze this business and return exactly this JSON structure:
{{
    "business_score": <number 1-10>,
    "ai_visibility_score": <number 0-100>,
    "conversion_score": <number 0-100>,
    "strengths": [<list of 3-4 key strengths>],
    "weaknesses": [<list of 3-4 key weaknesses>],
    "opportunities": [<list of 3-4 growth opportunities>],
    "threats": [<list of 3-4 potential threats>],
    "recommendations": [<list of 5-6 actionable recommendations>]
}}

Business Description:
{description}

Return ONLY the JSON object, no other text.</s>
<|assistant|>"""
        
        logger.info("🔤 Tokenizing input...")
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=512
        ).to(model.device)
        
        logger.info("🧠 Generating analysis (this may take 20-30 seconds on GPU, 2-5 minutes on CPU)...")
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=250,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                num_beams=1
            )
        
        logger.info("📖 Decoding output...")
        full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.info(f"📝 Model output: {full_response[:150]}...")
        
        # ============ Extract JSON ============
        logger.info("📊 Extracting JSON from response...")
        start_idx = full_response.find('{')
        end_idx = full_response.rfind('}')
        
        if start_idx == -1 or end_idx == -1 or start_idx >= end_idx:
            logger.warning("⚠️  No JSON found in response, using fallback")
            return {
                "success": False,
                "error": "Could not parse model output",
                "business_score": 5,
                "ai_visibility_score": 50,
                "conversion_score": 50,
                "strengths": ["Basic presence"],
                "weaknesses": ["Low engagement"],
                "opportunities": ["Marketing growth"],
                "threats": ["Competition"],
                "recommendations": ["Run ads"]
            }
        
        json_str = full_response[start_idx:end_idx + 1]
        analysis_json = json.loads(json_str)
        
        logger.info("✅ Analysis completed successfully")
        logger.info(f"   Business Score: {analysis_json.get('business_score')}/10")
        logger.info(f"   AI Visibility: {analysis_json.get('ai_visibility_score')}%")
        logger.info(f"   Conversion Score: {analysis_json.get('conversion_score')}%")
        
        return {
            "success": True,
            "error": None,
            **analysis_json
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON parsing error: {e}")
        return {
            "success": False,
            "error": f"JSON parsing error: {e}",
            "business_score": 5,
            "ai_visibility_score": 50,
            "conversion_score": 50,
            "strengths": ["Basic presence"],
            "weaknesses": ["Low engagement"],
            "opportunities": ["Marketing growth"],
            "threats": ["Competition"],
            "recommendations": ["Run ads"]
        }
    except Exception as e:
        logger.error(f"❌ Error analyzing business: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "business_score": 5,
            "ai_visibility_score": 50,
            "conversion_score": 50,
            "strengths": ["Basic presence"],
            "weaknesses": ["Low engagement"],
            "opportunities": ["Marketing growth"],
            "threats": ["Competition"],
            "recommendations": ["Run ads"]
        }


# ============ FastAPI App ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app lifecycle"""
    # Startup
    logger.info("🔄 Application startup...")
    try:
        load_model()
    except Exception as e:
        logger.error(f"❌ Failed to load model at startup: {e}")
    
    yield
    
    # Shutdown
    logger.info("🔄 Application shutdown...")
    logger.info("💾 Clearing model from memory...")


app = FastAPI(
    title="Saadhyam AI - Business Analysis Model Server",
    description="Separate server for business analysis using Mistral-7B with LoRA adapter",
    version="1.0.0",
    lifespan=lifespan
)


# ============ Health Check ============

@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    if not _model_loaded:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "ready": False,
                "error": _load_error or "Model not loaded"
            }
        )
    
    return {
        "status": "healthy",
        "ready": True,
        "service": "Business Analysis Model Server",
        "model_loaded": _model_loaded,
        "port": 9001
    }


# ============ Analysis Endpoint ============

@app.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze(request: AnalyzeRequest):
    """
    Analyze a business description
    
    Returns:
    - business_score: 1-10
    - ai_visibility_score: 0-100
    - conversion_score: 0-100
    - strengths, weaknesses, opportunities, threats, recommendations
    """
    
    if not _model_loaded:
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
        result = analyze_business(request.description)
        
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
    if not _model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )
    
    import torch
    gpu_available = torch.cuda.is_available()
    
    return {
        "model_loaded": True,
        "model_name": "TinyLlama-1.1B-Chat-v1.0",
        "quantization": "4-bit NF4" if gpu_available else "None (CPU mode)",
        "cpu_offload": gpu_available,
        "device_map": "auto (GPU + CPU)" if gpu_available else "cpu",
        "gpu_available": gpu_available,
        "gpu_device": torch.cuda.get_device_name(0) if gpu_available else "None",
        "port": 9001
    }


if __name__ == "__main__":
    import torch
    gpu_available = torch.cuda.is_available()
    
    logger.info("=" * 80)
    logger.info("🚀 STARTING BUSINESS ANALYSIS MODEL SERVER")
    logger.info("=" * 80)
    logger.info(f"Port: 9001")
    if gpu_available:
        logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
        logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        logger.info("CPU Offload: Enabled")
    else:
        logger.warning("GPU: NOT AVAILABLE - Using CPU (slower)")
        logger.warning("Analysis will take 2-5 minutes per request")
    logger.info("=" * 80)
    
    uvicorn.run(
        "business_model:app",
        host="0.0.0.0",
        port=9001,
        log_level="info",
        access_log=True
    )
