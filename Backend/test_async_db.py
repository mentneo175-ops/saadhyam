#!/usr/bin/env python3
"""
Test script to verify async database connection and basic operations.
"""

import asyncio
import logging
from sqlalchemy import text
from config.database import async_engine, get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_async_database():
    """Test async database connection and basic operations."""
    try:
        logger.info("🔄 Testing async database connection...")
        
        # Test 1: Basic connection
        async with async_engine.begin() as conn:
            result = await conn.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            logger.info(f"✅ Basic connection test: {test_value}")
        
        # Test 2: Session-based query
        async for db in get_db():
            result = await db.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            logger.info(f"✅ Session-based query test: {user_count} users in database")
            break
        
        logger.info("🎉 All async database tests passed!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Async database test failed: {e}")
        return False

async def main():
    """Main test function."""
    logger.info("=" * 60)
    logger.info("🚀 ASYNC DATABASE CONNECTION TEST")
    logger.info("=" * 60)
    
    success = await test_async_database()
    
    if success:
        logger.info("✅ Backend is ready for async operations!")
    else:
        logger.error("❌ Backend async conversion needs attention!")
    
    # Close the engine
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())