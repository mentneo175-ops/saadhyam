"""
Integration wrapper for Advanced Web Scraper
Drop-in replacement for existing web_scraper.py
"""

import asyncio
import logging
from typing import Dict, Optional, Tuple
from advanced_web_scraper import scrape_website_advanced

logger = logging.getLogger(__name__)


# ============================================
# Backward Compatible Functions
# ============================================

async def scrape_website(url: str, use_playwright: bool = True) -> Tuple[bool, Dict, Optional[str]]:
    """
    Drop-in replacement for old scrape_website function
    Now uses advanced scraper with anti-bot bypass
    
    Args:
        url: Website URL to scrape
        use_playwright: Always True (kept for compatibility)
    
    Returns:
        Tuple of (success, data_dict, error_message)
    """
    logger.info(f"🔄 Using advanced scraper for: {url}")
    
    # Use advanced scraper
    success, data, error = await scrape_website_advanced(
        url,
        max_retries=3,
        use_retry_queue=True
    )
    
    if success:
        # Transform data to match old format
        old_format_data = {
            'title': data.get('title', ''),
            'meta_description': data.get('meta_description', ''),
            'content': data.get('content', ''),
            'headings': data.get('headings', []),
            'links': data.get('links', []),
            'business_sections': {},  # Not extracted by advanced scraper
            'word_count': data.get('word_count', 0),
        }
        
        return True, old_format_data, None
    else:
        # Check if blocked
        if data.get('blocked'):
            logger.warning(f"🚫 Site blocked: {data.get('block_reason')}")
            return False, {}, f"Blocked: {data.get('block_reason')}"
        
        return False, {}, error


def scrape_website_sync(url: str, use_playwright: bool = True) -> Tuple[bool, Dict, Optional[str]]:
    """
    Synchronous wrapper for backward compatibility
    
    Args:
        url: Website URL to scrape
        use_playwright: Always True (kept for compatibility)
    
    Returns:
        Tuple of (success, data_dict, error_message)
    """
    try:
        # Get or create event loop
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Run async function
        return loop.run_until_complete(scrape_website(url, use_playwright))
        
    except Exception as e:
        logger.error(f"❌ Sync scraping error: {e}")
        return False, {}, str(e)


# ============================================
# Enhanced Functions with Proxy Support
# ============================================

async def scrape_website_with_proxy(
    url: str,
    proxy_url: str,
    proxy_username: str = '',
    proxy_password: str = ''
) -> Tuple[bool, Dict, Optional[str]]:
    """
    Scrape website with proxy support
    
    Args:
        url: Website URL
        proxy_url: Proxy server URL (e.g., 'http://proxy.com:8080')
        proxy_username: Proxy username (optional)
        proxy_password: Proxy password (optional)
    
    Returns:
        Tuple of (success, data_dict, error_message)
    """
    proxy_config = {'server': proxy_url}
    
    if proxy_username:
        proxy_config['username'] = proxy_username
        proxy_config['password'] = proxy_password
    
    logger.info(f"🔐 Scraping with proxy: {proxy_url}")
    
    success, data, error = await scrape_website_advanced(
        url,
        proxy=proxy_config,
        max_retries=5
    )
    
    return success, data, error


async def scrape_protected_website(url: str) -> Tuple[bool, Dict, Optional[str]]:
    """
    Scrape website with maximum anti-bot bypass attempts
    Use for Cloudflare, Akamai, DataDome protected sites
    
    Args:
        url: Website URL
    
    Returns:
        Tuple of (success, data_dict, error_message)
    """
    logger.info(f"🛡️ Scraping protected site: {url}")
    
    success, data, error = await scrape_website_advanced(
        url,
        max_retries=10,  # More retries
        use_retry_queue=True  # Try all strategies
    )
    
    if not success and data.get('blocked'):
        logger.error(f"🚫 Failed to bypass: {data.get('block_reason')}")
        logger.info(f"💡 Suggestion: Try with residential proxy")
    
    return success, data, error


# ============================================
# Batch Scraping
# ============================================

async def scrape_multiple_websites(
    urls: list,
    max_concurrent: int = 3
) -> list:
    """
    Scrape multiple websites concurrently
    
    Args:
        urls: List of URLs to scrape
        max_concurrent: Maximum concurrent scraping tasks
    
    Returns:
        List of (url, success, data, error) tuples
    """
    from advanced_web_scraper import scrape_multiple_urls
    
    logger.info(f"📋 Scraping {len(urls)} URLs concurrently...")
    
    results = await scrape_multiple_urls(urls, max_concurrent)
    
    # Log summary
    success_count = sum(1 for _, success, _, _ in results if success)
    logger.info(f"✅ Success: {success_count}/{len(urls)}")
    
    return results


# ============================================
# Utility Functions
# ============================================

def format_for_business_input(data: Dict) -> str:
    """
    Format scraped data for business input
    Compatible with old format
    
    Args:
        data: Scraped data dictionary
    
    Returns:
        Formatted business description
    """
    parts = []
    
    # Title
    if data.get('title'):
        parts.append(f"Business: {data['title']}")
    
    # Meta description
    if data.get('meta_description'):
        parts.append(data['meta_description'])
    
    # OpenGraph description (fallback)
    if not data.get('meta_description') and data.get('og_description'):
        parts.append(data['og_description'])
    
    # Headings
    if data.get('headings'):
        headings_text = '\n'.join(data['headings'][:10])
        if headings_text:
            parts.append(f"Key Topics:\n{headings_text}")
    
    # Main content
    if data.get('content'):
        content = data['content']
        parts.append(f"Content:\n{content[:2000]}")  # Limit to 2000 chars
    
    return '\n\n'.join(parts)


# ============================================
# Migration Helper
# ============================================

def migrate_from_old_scraper():
    """
    Helper function to migrate from old scraper
    
    Usage:
        # Old code:
        from services.web_scraper import scrape_website
        
        # New code:
        from services.scraper_integration import scrape_website
        
        # Everything else stays the same!
    """
    print("""
    ✅ Migration Guide:
    
    1. Replace imports:
       OLD: from services.web_scraper import scrape_website
       NEW: from services.scraper_integration import scrape_website
    
    2. No code changes needed! The function signature is identical.
    
    3. Benefits:
       - Anti-bot bypass (Cloudflare, Akamai, etc.)
       - Better success rates
       - Automatic retries
       - Human behavior simulation
       - Proxy support
    
    4. Optional enhancements:
       - Use scrape_website_with_proxy() for proxy support
       - Use scrape_protected_website() for heavily protected sites
       - Use scrape_multiple_websites() for batch scraping
    """)


if __name__ == "__main__":
    # Show migration guide
    migrate_from_old_scraper()
