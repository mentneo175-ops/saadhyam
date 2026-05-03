"""
Model Loader for Business Analysis AI
Singleton pattern - loads TinyLlama model ONCE and shares across entire application

NOTE: This version uses TinyLlama for fast CPU inference.
Mistral + LoRA code is commented and can be re-enabled later.
"""

import logging
from typing import Optional, Any
import os
import sys

# Add Backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

logger = logging.getLogger(__name__)

# ============ SINGLETON GLOBAL VARIABLES ============
# These are shared across the ENTIRE application
_model = None
_tokenizer = None
_model_loaded = False
_load_error = None


def load_model():
    """
    Load TinyLlama model ONCE using singleton pattern
    
    Returns:
        tuple: (model, tokenizer) or (None, None) if failed
    
    NOTE: Mistral-7B + LoRA code is commented below for future use
    """
    global _model, _tokenizer, _model_loaded, _load_error

    if _model_loaded:
        logger.info("✅ Model already loaded (singleton)")
        return _model, _tokenizer

    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM

        logger.info("🚀 Loading Business Analysis AI Model (TinyLlama) - SINGLETON")
        logger.info("=" * 80)

        # ============ TinyLlama for Fast CPU Inference ============
        model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

        logger.info("🔤 Loading TinyLlama tokenizer...")
        _tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            use_fast=False,
            trust_remote_code=True
        )
        _tokenizer.pad_token = _tokenizer.eos_token
        logger.info("✅ Tokenizer loaded")

        logger.info("🧠 Loading TinyLlama model (fast CPU inference)...")
        logger.info("   Model: TinyLlama-1.1B-Chat-v1.0")
        logger.info("   Device: CPU")
        logger.info("   Expected load time: < 30 seconds")

        _model = AutoModelForCausalLM.from_pretrained(
            model_name,
            device_map="cpu",
            torch_dtype="auto",
            low_cpu_mem_usage=True
        )

        _model.eval()
        _model_loaded = True
        _load_error = None

        logger.info("🎉 TinyLlama model loaded successfully! (SINGLETON)")
        logger.info("   Expected inference: 2-5 seconds")
        logger.info("   Global instance created - shared across application")
        logger.info("=" * 80)

        return _model, _tokenizer

        # ============ TEMP DISABLED: Mistral 7B + LoRA (slow on CPU, will re-enable later) ============
        """
        # ORIGINAL MISTRAL-7B + LORA CODE (COMMENTED FOR FUTURE USE)
        
        base_model_name = "mistralai/Mistral-7B-Instruct-v0.2"

        # Load tokenizer
        logger.info("🔤 Loading tokenizer...")
        _tokenizer = AutoTokenizer.from_pretrained(
            base_model_name,
            use_fast=False,
            trust_remote_code=True
        )
        _tokenizer.pad_token = _tokenizer.eos_token

        # Configure 4-bit quantization for memory efficiency
        logger.info("⚙️  Configuring 4-bit quantization...")
        from transformers import BitsAndBytesConfig
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )

        # Load base model with quantization
        logger.info("🧠 Loading base model with 4-bit quantization...")
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            quantization_config=bnb_config,
            device_map="auto",
            offload_folder="offload",
            llm_int8_enable_fp32_cpu_offload=True,
            max_memory={0: "6GB", "cpu": "16GB"}
        )

        logger.info("✅ Base model loaded")

        # Load LoRA Adapter
        adapter_path = "./adapter"

        if not os.path.exists(adapter_path):
            raise RuntimeError("❌ LoRA adapter not found. Cannot continue.")

        logger.info("🔧 Loading Business Analysis LoRA adapter...")
        from peft import PeftModel
        _model = PeftModel.from_pretrained(base_model, adapter_path)

        logger.info("✅ Business Analysis adapter loaded successfully")

        # Adapter logic disabled for TinyLlama version
        
        _model.eval()
        _model_loaded = True

        logger.info("🎉 Model loaded successfully with LoRA adapter!")

        return _model, _tokenizer
        """

    except Exception as e:
        _load_error = str(e)
        logger.error(f"❌ Failed to load model: {e}", exc_info=True)
        logger.error("=" * 80)
        raise


def get_model() -> Optional[Any]:
    """
    Get the loaded model (singleton pattern)
    
    Returns:
        model: The loaded TinyLlama model or None if not loaded
    """
    global _model, _model_loaded
    
    if not _model_loaded or _model is None:
        logger.info("🔄 Model not loaded yet, loading now...")
        try:
            load_model()
        except Exception as e:
            logger.error(f"❌ Failed to load model in get_model(): {e}")
            return None
    
    if _model is not None:
        logger.debug("✅ Returning loaded model (singleton)")
    else:
        logger.warning("⚠️  Model is None after loading attempt")
    
    return _model


def get_tokenizer() -> Optional[Any]:
    """
    Get the loaded tokenizer (singleton pattern)
    
    Returns:
        tokenizer: The loaded tokenizer or None if not loaded
    """
    global _tokenizer, _model_loaded
    
    if not _model_loaded or _tokenizer is None:
        logger.info("🔄 Tokenizer not loaded yet, loading now...")
        try:
            load_model()
        except Exception as e:
            logger.error(f"❌ Failed to load tokenizer in get_tokenizer(): {e}")
            return None
    
    if _tokenizer is not None:
        logger.debug("✅ Returning loaded tokenizer (singleton)")
    else:
        logger.warning("⚠️  Tokenizer is None after loading attempt")
    
    return _tokenizer


def is_model_loaded() -> bool:
    """Check if model is loaded (singleton pattern)"""
    global _model_loaded, _model, _tokenizer
    loaded = _model_loaded and _model is not None and _tokenizer is not None
    logger.debug(f"📊 Model loaded status: {loaded}")
    return loaded


def get_load_error() -> Optional[str]:
    """Get the last load error if any"""
    global _load_error
    return _load_error


def unload_model():
    """
    Unload model and tokenizer (singleton pattern)
    Call on application shutdown
    """
    global _model, _tokenizer, _model_loaded, _load_error
    
    logger.info("🔄 Unloading model (singleton)...")
    
    if _model is not None:
        del _model
        _model = None
    
    if _tokenizer is not None:
        del _tokenizer
        _tokenizer = None
    
    _model_loaded = False
    _load_error = None
    
    logger.info("✅ Model unloaded (singleton)")


def get_model_info() -> dict:
    """Get information about the loaded model"""
    global _model_loaded, _model, _tokenizer, _load_error
    
    return {
        "model_loaded": _model_loaded,
        "model_available": _model is not None,
        "tokenizer_available": _tokenizer is not None,
        "load_error": _load_error,
        "model_name": "TinyLlama-1.1B-Chat-v1.0" if _model_loaded else None
    }