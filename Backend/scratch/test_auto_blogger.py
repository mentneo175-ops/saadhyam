#!/usr/bin/env python3
import os
import sys
import asyncio
import logging

# Add the backend directory to Python path
scratch_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(scratch_dir)
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_auto_blogger():
    try:
        from services.auto_blogger_service import generate_blog_post
        
        logger.info("🧪 Testing Auto Blogger Service...")
        result = await generate_blog_post(
            user_id=1,
            business_name="Green Oasis Cafe",
            business_type="Cafe & Restaurant",
            location="Kakinada",
            topic="Top organic brewing techniques for premium coffee",
            keywords=["organic coffee", "kakinada cafe", "brewing methods"]
        )
        
        logger.info(f"📊 Result Status: {result.get('status')}")
        logger.info(f"📊 Result Source: {result.get('source')}")
        
        if result.get("status") == "success" and "blog_post" in result:
            blog = result["blog_post"]
            logger.info("✅ Auto Blogger test successful!")
            logger.info(f"   Title: {blog.get('title')}")
            logger.info(f"   Category: {blog.get('category')}")
            logger.info(f"   Word Count: {blog.get('word_count')}")
            return True
        else:
            logger.error(f"❌ Auto Blogger failed: {result.get('message', 'Unknown error')}")
            return False
    except Exception as e:
        logger.error(f"❌ Exception in Auto Blogger test: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    asyncio.run(test_auto_blogger())
