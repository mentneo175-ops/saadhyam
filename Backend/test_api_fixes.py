#!/usr/bin/env python3
"""
Test script to verify API fixes
"""

import os
import sys
import asyncio
import logging

# Add the backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(script_dir, '.env'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_gemini_fix():
    """Test the Gemini API fix"""
    try:
        from services.gemini_business_analysis_service import generate_realtime_business_analysis
        
        import random
        import time
        # Test business profile
        test_profile = {
            "business_name": f"Test Cafe {random.randint(1000, 9999)}",
            "business_type": "Restaurant",
            "location": f"Mumbai {int(time.time())}",
            "services": ["Coffee", "Snacks"],
            "target_audience": "Young professionals",
            "goals": "Increase foot traffic"
        }
        
        logger.info("🧪 Testing Gemini business analysis...")
        result = await generate_realtime_business_analysis(test_profile)
        
        if result["status"] == "success":
            logger.info("✅ Gemini API fix successful!")
            return True
        else:
            logger.warning(f"⚠️ Gemini API still has issues: {result.get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Gemini test failed: {e}")
        return False

def test_mistral_fix():
    """Test the Mistral adapter fix"""
    try:
        from ai_models.content_creator.app.services.mistral_content_service import generate_content
        
        logger.info("🧪 Testing Mistral content generation...")
        result = generate_content(
            business_type="E-commerce",
            platform="instagram", 
            goal="promotion",
            tone="friendly",
            language="english",
            user_input="Test product launch"
        )
        
        if result and "headline" in result:
            logger.info("✅ Mistral adapter fix successful!")
            logger.info(f"   Generated headline: {result['headline']}")
            return True
        else:
            logger.warning("⚠️ Mistral adapter still has issues")
            return False
            
    except Exception as e:
        logger.error(f"❌ Mistral test failed: {e}")
        return False

def test_groq_api():
    """Test Groq API functionality"""
    try:
        from services.content_creator_service import generate_content
        
        logger.info("🧪 Testing Groq API...")
        
        # Prepare data in the expected format
        data = {
            "business_type": "E-commerce",
            "platform": "instagram",
            "goal": "promotion", 
            "tone": "friendly",
            "language": "english",
            "user_input": "Test content generation"
        }
        
        result = generate_content(data)
        
        if result["status"] == "success":
            logger.info("✅ Groq API working correctly!")
            logger.info(f"   Generated headline: {result['content']['headline']}")
            return True
        else:
            logger.warning(f"⚠️ Groq API issues: {result.get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Groq test failed: {e}")
        return False

async def main():
    """Run all tests"""
    logger.info("🚀 Starting API fixes verification...")
    
    results = {
        "gemini": await test_gemini_fix(),
        "mistral": test_mistral_fix(), 
        "groq": test_groq_api()
    }
    
    logger.info("\n📊 Test Results:")
    for api, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"   {api.upper()}: {status}")
    
    all_passed = all(results.values())
    if all_passed:
        logger.info("\n🎉 All API fixes successful!")
    else:
        logger.warning("\n⚠️ Some APIs still need attention")
    
    return all_passed

if __name__ == "__main__":
    asyncio.run(main())