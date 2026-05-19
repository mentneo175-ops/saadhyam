"""
Token Refresh Background Task
Runs daily to check and refresh expiring Instagram tokens
"""

import logging
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from services.instagram_token_refresh_service import instagram_token_refresh_service

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None


async def refresh_instagram_tokens_task():
    """
    Background task to refresh Instagram tokens
    Runs daily at 2 AM
    """
    try:
        logger.info("🔄 Starting daily Instagram token refresh task")
        stats = await instagram_token_refresh_service.check_and_refresh_expiring_tokens()
        logger.info(f"✅ Token refresh task complete: {stats}")
    except Exception as e:
        logger.error(f"❌ Error in token refresh task: {e}")


def start_token_refresh_scheduler():
    """
    Start the token refresh scheduler
    Runs daily at 2 AM
    """
    global scheduler
    
    if scheduler is not None:
        logger.warning("⚠️ Token refresh scheduler already running")
        return
    
    try:
        scheduler = AsyncIOScheduler()
        
        # Run daily at 2 AM
        scheduler.add_job(
            refresh_instagram_tokens_task,
            trigger=CronTrigger(hour=2, minute=0),
            id="instagram_token_refresh",
            name="Instagram Token Refresh",
            replace_existing=True
        )
        
        # Also run immediately on startup (for testing)
        # Comment this out in production if you don't want immediate run
        scheduler.add_job(
            refresh_instagram_tokens_task,
            id="instagram_token_refresh_startup",
            name="Instagram Token Refresh (Startup)",
        )
        
        scheduler.start()
        logger.info("✅ Token refresh scheduler started (runs daily at 2 AM)")
        
    except Exception as e:
        logger.error(f"❌ Failed to start token refresh scheduler: {e}")


def stop_token_refresh_scheduler():
    """Stop the token refresh scheduler"""
    global scheduler
    
    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("✅ Token refresh scheduler stopped")
