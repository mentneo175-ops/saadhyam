"""
Model Loader for Review Reply AI
Loads TinyLlama model for fast CPU inference

NOTE: This version uses TinyLlama for fast CPU inference.
Mistral + LoRA code is commented and can be re-enabled later.
"""

import logging
from typing import Optional, Any
import os

logger = logging.getLogger(__name__)

# Global model and tokenizer instances
_model = None
_tokenizer = None
_model_loaded = False


def load_model():
    """
    Load TinyLlama model for fast CPU inference
    
    NOTE: Mistral-7B + LoRA code is commented below for future use
    """
    global _model, _tokenizer, _model_loaded

    if _model_loaded:
        logger.info("✅ Model already loaded")
        return _model, _tokenizer

    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM

        logger.info("🚀 Loading Review Reply AI Model (TinyLlama)...")

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

        logger.info("🎉 TinyLlama model loaded successfully!")
        logger.info("   Expected inference: 2-5 seconds")

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

        # REQUIRE LoRA (NO SKIP)
        adapter_path = "./ai_models/review_reply_ai/adapter"

        if not os.path.exists(adapter_path):
            raise RuntimeError("❌ LoRA adapter not found. Cannot continue.")

        logger.info("🔧 Loading Review Reply LoRA adapter...")
        from peft import PeftModel
        _model = PeftModel.from_pretrained(base_model, adapter_path, adapter_name="review")

        logger.info("✅ Review Reply adapter loaded successfully")

        # Load Business Analysis adapter (second adapter)
        business_adapter_path = "./ai_models/business_analysis/adapter"
        if os.path.exists(business_adapter_path):
            try:
                logger.info("🔧 Loading Business Analysis LoRA adapter...")
                _model.load_adapter(business_adapter_path, adapter_name="business")
                logger.info("✅ Business Analysis adapter loaded successfully")
            except Exception as e:
                logger.warning(f"⚠️  Business Analysis adapter not available: {e}")
        else:
            logger.warning(f"⚠️  Business Analysis adapter path not found: {business_adapter_path}")

        # Adapter logic disabled for TinyLlama version
        # _model.set_active_adapters(["review"])
        
        _model.eval()
        _model_loaded = True

        logger.info("🎉 Model loaded successfully with all adapters!")

        return _model, _tokenizer
        """

    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}", exc_info=True)
        raise
def get_model() -> Optional[Any]:
    """
    Get the loaded model
    Returns None if model not loaded
    """
    global _model
    if _model is None:
        logger.warning("⚠️  Model not loaded. Call load_model() first")
        return None
    return _model


def get_tokenizer() -> Optional[Any]:
    """
    Get the loaded tokenizer
    Returns None if tokenizer not loaded
    """
    global _tokenizer
    if _tokenizer is None:
        logger.warning("⚠️  Tokenizer not loaded. Call load_model() first")
        return None
    return _tokenizer


def is_model_loaded() -> bool:
    """Check if model is loaded"""
    return _model_loaded


def unload_model():
    """
    Unload model and tokenizer
    Call on application shutdown
    """
    global _model, _tokenizer, _model_loaded
    
    if _model is not None:
        del _model
        _model = None
    
    if _tokenizer is not None:
        del _tokenizer
        _tokenizer = None
    
    _model_loaded = False
    logger.info("✅ Model unloaded")
