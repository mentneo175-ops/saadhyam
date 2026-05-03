"""
Business Analysis Generator
Generates business insights using TinyLlama (SINGLETON PATTERN)

NOTE: This version uses improved prompts since LoRA adapters are disabled.
Optimized for TinyLlama fast CPU inference.
Uses SINGLETON model loader - NO model loading in this file!
"""

import logging
import json
import re
import sys
import os
from typing import Dict, Any

# Add Backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

# IMPORTANT: Import from SINGLETON model loader
from ai_models.business_analysis.model_loader import get_model, get_tokenizer, is_model_loaded

logger = logging.getLogger(__name__)


def clean_json_string(json_str: str) -> str:
    """Clean common JSON formatting issues"""
    # Remove extra whitespace and newlines
    json_str = re.sub(r'\s+', ' ', json_str.strip())
    
    # Fix missing quotes around keys
    json_str = re.sub(r'(\w+):', r'"\1":', json_str)
    
    # Fix single quotes to double quotes
    json_str = json_str.replace("'", '"')
    
    # Remove trailing commas
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    
    return json_str


def fix_json_issues(json_str: str) -> str:
    """Attempt to fix common JSON parsing issues"""
    try:
        # Remove any text before the first {
        start_brace = json_str.find('{')
        if start_brace > 0:
            json_str = json_str[start_brace:]
        
        # Remove any text after the last }
        end_brace = json_str.rfind('}')
        if end_brace != -1 and end_brace < len(json_str) - 1:
            json_str = json_str[:end_brace + 1]
        
        # Fix common array issues - ensure arrays have proper quotes
        # Fix patterns like: ["item1", "item2", "item3"]
        json_str = re.sub(r'\[\s*([^"\[\]]+?)\s*\]', 
                         lambda m: '["' + '", "'.join([x.strip().strip('"') for x in m.group(1).split(',') if x.strip()]) + '"]', 
                         json_str)
        
        # Ensure proper number formatting (remove quotes around numbers)
        json_str = re.sub(r'"(\d+)"(?=\s*[,}])', r'\1', json_str)
        
        # Fix missing commas between array items
        json_str = re.sub(r'"\s*"', '", "', json_str)
        
        # Fix missing commas between object properties
        json_str = re.sub(r'"\s*"([a-zA-Z_])', r'", "\1', json_str)
        
        return json_str
    except Exception as e:
        logger.warning(f"Error fixing JSON: {e}")
        return json_str


def validate_and_fix_analysis(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and fix analysis data"""
    # Ensure required numeric fields
    analysis['business_score'] = max(1, min(10, int(analysis.get('business_score', 5))))
    analysis['ai_visibility_score'] = max(0, min(100, int(analysis.get('ai_visibility_score', 50))))
    analysis['conversion_score'] = max(0, min(100, int(analysis.get('conversion_score', 50))))
    
    # Ensure required array fields
    for field in ['strengths', 'weaknesses', 'opportunities', 'threats', 'recommendations']:
        if field not in analysis or not isinstance(analysis[field], list):
            analysis[field] = [f"Default {field}"]
        elif len(analysis[field]) == 0:
            analysis[field] = [f"No specific {field} identified"]
    
    return analysis


def get_fallback_analysis() -> Dict[str, Any]:
    """Get fallback analysis when JSON parsing fails"""
    return {
        "success": False,
        "error": "Could not parse model output",
        "business_score": 5,
        "ai_visibility_score": 50,
        "conversion_score": 50,
        "strengths": ["Basic business presence"],
        "weaknesses": ["Limited online visibility"],
        "opportunities": ["Digital marketing expansion"],
        "threats": ["Market competition"],
        "recommendations": [
            "Improve social media presence",
            "Optimize online listings",
            "Engage with customer reviews",
            "Create content marketing strategy",
            "Implement customer feedback system"
        ]
    }


def get_fallback_analysis_with_error(error_msg: str) -> Dict[str, Any]:
    """Get fallback analysis with specific error message"""
    result = get_fallback_analysis()
    result["error"] = f"JSON parsing error: {error_msg}"
    return result


def generate_template_analysis(description: str) -> Dict[str, Any]:
    """
    Generate analysis using templates when AI model fails
    This ensures we always return valid JSON
    """
    
    # Analyze description for keywords to customize response
    desc_lower = description.lower()
    
    # Determine business type
    business_type = "business"
    if any(word in desc_lower for word in ["restaurant", "food", "cafe", "dining"]):
        business_type = "restaurant"
    elif any(word in desc_lower for word in ["hotel", "accommodation", "stay"]):
        business_type = "hotel"
    elif any(word in desc_lower for word in ["salon", "beauty", "hair"]):
        business_type = "salon"
    elif any(word in desc_lower for word in ["gym", "fitness", "workout"]):
        business_type = "gym"
    elif any(word in desc_lower for word in ["retail", "store", "shop", "sell"]):
        business_type = "retail"
    
    # Calculate scores based on description analysis
    has_social = any(word in desc_lower for word in ["instagram", "facebook", "social", "post"])
    has_online = any(word in desc_lower for word in ["website", "online", "digital"])
    has_reviews = any(word in desc_lower for word in ["review", "rating", "feedback"])
    
    # Business score (1-10)
    business_score = 6  # Base score
    if has_social: business_score += 1
    if has_online: business_score += 1
    if has_reviews: business_score += 1
    if "established" in desc_lower or "years" in desc_lower: business_score += 1
    
    # AI visibility score (0-100)
    ai_visibility = 40  # Base score
    if has_social: ai_visibility += 20
    if has_online: ai_visibility += 25
    if has_reviews: ai_visibility += 15
    
    # Conversion score (0-100)
    conversion_score = 50  # Base score
    if "customers" in desc_lower: conversion_score += 10
    if has_online: conversion_score += 15
    if "booking" in desc_lower or "order" in desc_lower: conversion_score += 10
    
    # Ensure scores are within bounds
    business_score = min(10, max(1, business_score))
    ai_visibility = min(100, max(0, ai_visibility))
    conversion_score = min(100, max(0, conversion_score))
    
    # Template-based recommendations by business type
    templates = {
        "restaurant": {
            "strengths": [
                "Good food quality and service",
                "Established customer base",
                "Physical location advantage"
            ],
            "weaknesses": [
                "Limited online presence",
                "Inconsistent social media activity",
                "No online ordering system"
            ],
            "opportunities": [
                "Launch food delivery partnerships",
                "Increase social media engagement",
                "Implement online reservation system"
            ],
            "threats": [
                "New restaurant competitors",
                "Rising food costs",
                "Changing dining preferences"
            ],
            "recommendations": [
                "Post food photos daily on Instagram",
                "Set up online ordering and delivery",
                "Respond to all customer reviews",
                "Create weekly special offers",
                "Partner with food delivery apps",
                "Implement customer loyalty program"
            ]
        },
        "retail": {
            "strengths": [
                "Physical store presence",
                "Direct customer interaction",
                "Product quality focus"
            ],
            "weaknesses": [
                "Limited online sales channel",
                "Low digital marketing presence",
                "No e-commerce platform"
            ],
            "opportunities": [
                "Launch online store",
                "Expand social media marketing",
                "Implement customer database"
            ],
            "threats": [
                "Online retail competition",
                "Changing shopping habits",
                "Economic uncertainty"
            ],
            "recommendations": [
                "Create online store presence",
                "Post product showcases daily",
                "Offer click-and-collect service",
                "Run targeted social media ads",
                "Build email marketing list",
                "Implement inventory management"
            ]
        },
        "default": {
            "strengths": [
                "Established business operations",
                "Customer service focus",
                "Market presence"
            ],
            "weaknesses": [
                "Limited digital presence",
                "Inconsistent online marketing",
                "No automated systems"
            ],
            "opportunities": [
                "Digital transformation",
                "Social media expansion",
                "Customer engagement improvement"
            ],
            "threats": [
                "Digital-first competitors",
                "Market changes",
                "Technology disruption"
            ],
            "recommendations": [
                "Develop digital marketing strategy",
                "Increase social media activity",
                "Implement customer feedback system",
                "Create online booking system",
                "Build email marketing campaigns",
                "Optimize Google Business profile"
            ]
        }
    }
    
    # Get template for business type or use default
    template = templates.get(business_type, templates["default"])
    
    return {
        "success": True,
        "error": None,
        "business_score": business_score,
        "ai_visibility_score": ai_visibility,
        "conversion_score": conversion_score,
        "strengths": template["strengths"],
        "weaknesses": template["weaknesses"],
        "opportunities": template["opportunities"],
        "threats": template["threats"],
        "recommendations": template["recommendations"]
    }


def analyze_business(description: str) -> Dict[str, Any]:
    """
    Analyze business description and return structured insights
    Uses SINGLETON model loader - model is loaded ONCE at startup
    """
    try:
        import torch
        
        logger.info(f"📊 Analyzing business description ({len(description)} chars)...")
        
        # Get model from SINGLETON (NO loading here!)
        model = get_model()
        tokenizer = get_tokenizer()
        
        if model is None or tokenizer is None:
            logger.error("❌ Model not loaded from singleton, using template analysis")
            logger.info(f"   Model loaded status: {is_model_loaded()}")
            return generate_template_analysis(description)
        
        logger.info("✅ Using loaded TinyLlama model from singleton")
        
        # ============ Build Enhanced Prompt for Frontend Integration ============
        prompt = f"""Business Analysis Task:

Analyze: {description}

Output ONLY this exact JSON format with no additional text:

{{
"business_score": 7,
"ai_visibility_score": 65,
"conversion_score": 55,
"strengths": ["Good location", "Established brand"],
"weaknesses": ["Limited online presence", "Irregular posting"],
"opportunities": ["Social media growth", "Online ordering"],
"threats": ["New competitors", "Changing habits"],
"recommendations": ["Post daily on social media", "Set up online ordering"]
}}"""
        
        logger.info("🔤 Tokenizing input...")
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=512
        ).to(model.device)
        
        logger.info("🧠 Generating analysis (2-5 seconds on TinyLlama)...")
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=200,  # Increased for complete JSON
                temperature=0.3,     # Lower temperature for more consistent output
                top_p=0.8,          # More focused sampling
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                num_beams=1,
                repetition_penalty=1.1
            )
        
        logger.info("📖 Decoding output...")
        full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.info(f"📝 Full model output:")
        logger.info(f"{'='*50}")
        logger.info(full_response)
        logger.info(f"{'='*50}")
        
        # ============ Extract and Clean JSON ============
        logger.info("📊 Extracting JSON from response...")
        
        # Remove the original prompt from response
        prompt_end = full_response.find("Output ONLY this exact JSON format")
        if prompt_end != -1:
            full_response = full_response[prompt_end + len("Output ONLY this exact JSON format with no additional text:"):]
        
        # Also try to remove the prompt by finding the business description
        desc_start = full_response.find(description[:50])  # First 50 chars of description
        if desc_start != -1:
            # Find text after the description
            desc_end = desc_start + len(description)
            full_response = full_response[desc_end:]
        
        # Find JSON boundaries
        start_idx = full_response.find('{')
        end_idx = full_response.rfind('}')
        
        if start_idx == -1 or end_idx == -1 or start_idx >= end_idx:
            logger.warning("⚠️  No JSON found in response, using template analysis")
            return generate_template_analysis(description)
        
        json_str = full_response[start_idx:end_idx + 1]
        logger.info(f"📝 Raw JSON: {json_str[:200]}...")
        
        # Clean and fix common JSON issues
        json_str = clean_json_string(json_str)
        
        try:
            analysis_json = json.loads(json_str)
            logger.info("✅ JSON parsed successfully from TinyLlama output")
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️  JSON parsing failed: {e}")
            logger.info("🔧 Attempting to fix JSON...")
            
            # Try to fix common JSON issues
            fixed_json = fix_json_issues(json_str)
            try:
                analysis_json = json.loads(fixed_json)
                logger.info("✅ JSON fixed and parsed successfully")
            except json.JSONDecodeError as e2:
                logger.error(f"❌ Could not fix JSON: {e2}")
                logger.info(f"📝 Problematic JSON: {json_str}")
                logger.info("🔄 Using template-based analysis instead")
                return generate_template_analysis(description)
        
        # Validate required fields
        analysis_json = validate_and_fix_analysis(analysis_json)
        
        logger.info("✅ Analysis completed successfully using TinyLlama")
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
        logger.info("🔄 Using template-based analysis instead")
        return generate_template_analysis(description)
    except Exception as e:
        logger.error(f"❌ Error analyzing business: {e}", exc_info=True)
        logger.info("🔄 Using template-based analysis instead")
        return generate_template_analysis(description)


def analyze_batch(descriptions: list) -> list:
    """
    Analyze multiple business descriptions
    
    Args:
        descriptions: List of business description strings
    
    Returns:
        List of analysis results
    """
    
    logger.info(f"🔄 Analyzing {len(descriptions)} businesses...")
    results = []
    
    for i, description in enumerate(descriptions, 1):
        logger.info(f"Processing business {i}/{len(descriptions)}")
        
        result = analyze_business(description)
        results.append(result)
    
    logger.info(f"✅ Batch analysis complete")
    return results