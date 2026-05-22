import os
import sys
import asyncio
import logging

# Add Backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_blog_fallback():
    from services.auto_blogger_service import generate_blog_post
    
    logger.info("🧪 Starting blog generator fallback test...")
    
    # We will pass dummy data
    user_id = 999
    business_name = "Bella Vita Salon"
    business_type = "Beauty Salon & Spa"
    location = "San Francisco"
    topic = "Summer Skincare & Glow Guide"
    keywords = ["summer skin", "facial", "salon sf"]
    
    try:
        # Run blog generation. Even if Gemini keys are empty or fail, this should succeed and return mock data
        result = await generate_blog_post(
            user_id=user_id,
            business_name=business_name,
            business_type=business_type,
            location=location,
            topic=topic,
            keywords=keywords
        )
        
        logger.info("📊 Blog generation result:")
        logger.info(f"   Status: {result.get('status')}")
        logger.info(f"   Source used: {result.get('source')}")
        
        if result.get("status") == "success":
            blog_post = result.get("blog_post", {})
            logger.info("✅ SUCCESS: Blog generation gracefully completed!")
            logger.info(f"   Title: {blog_post.get('title')}")
            logger.info(f"   Reading Time: {blog_post.get('reading_time')} mins")
            logger.info(f"   Word Count: {blog_post.get('word_count')} words")
            logger.info(f"   Meta Description: {blog_post.get('meta_description')}")
            logger.info(f"   Intro length: {len(blog_post.get('introduction', ''))} chars")
            
            # Ensure no raw Gemini rate limit message was returned as content
            intro_text = blog_post.get('introduction', '').lower()
            if "quota" in intro_text or "rate limit" in intro_text or "429" in intro_text:
                logger.error("❌ FAIL: User-facing content contains raw quota/rate limit error text!")
                return False
            else:
                logger.info("✅ SUCCESS: User-facing content is clean of raw API errors.")
                return True
        else:
            logger.error(f"❌ FAIL: Blog generation returned error: {result.get('message')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ FAIL: Blog generation crashed with exception: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    asyncio.run(test_blog_fallback())
