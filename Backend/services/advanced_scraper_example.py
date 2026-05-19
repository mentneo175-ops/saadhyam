"""
Advanced Web Scraper - Usage Examples
"""

import asyncio
import logging
from advanced_web_scraper import (
    scrape_website_advanced,
    scrape_with_proxy,
    scrape_multiple_urls,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


# ============================================
# Example 1: Basic Scraping
# ============================================

async def example_basic_scraping():
    """Basic scraping example"""
    print("\n" + "="*60)
    print("Example 1: Basic Scraping")
    print("="*60)
    
    url = "https://example.com"
    
    success, data, error = await scrape_website_advanced(url)
    
    if success:
        print(f"✅ Success!")
        print(f"Title: {data.get('title')}")
        print(f"Word Count: {data.get('word_count')}")
        print(f"Headings: {len(data.get('headings', []))}")
        print(f"Links: {len(data.get('links', []))}")
    else:
        print(f"❌ Failed: {error}")
        if data.get('blocked'):
            print(f"🚫 Blocked by: {data.get('block_reason')}")
            print(f"Screenshot: {data.get('screenshot')}")
            print(f"HTML Dump: {data.get('html_dump')}")


# ============================================
# Example 2: Scraping with Proxy
# ============================================

async def example_proxy_scraping():
    """Scraping with residential proxy"""
    print("\n" + "="*60)
    print("Example 2: Scraping with Proxy")
    print("="*60)
    
    url = "https://example.com"
    
    # Residential proxy configuration
    proxy_url = "http://proxy.example.com:8080"
    proxy_username = "your_username"
    proxy_password = "your_password"
    
    success, data, error = await scrape_with_proxy(
        url,
        proxy_url,
        proxy_username,
        proxy_password
    )
    
    if success:
        print(f"✅ Success with proxy!")
        print(f"Title: {data.get('title')}")
    else:
        print(f"❌ Failed: {error}")


# ============================================
# Example 3: Scraping Protected Sites
# ============================================

async def example_protected_site():
    """Scraping Cloudflare/Akamai protected sites"""
    print("\n" + "="*60)
    print("Example 3: Scraping Protected Sites")
    print("="*60)
    
    # Sites protected by Cloudflare, Akamai, etc.
    protected_urls = [
        "https://www.cloudflare-protected-site.com",
        "https://www.akamai-protected-site.com",
    ]
    
    for url in protected_urls:
        print(f"\n🎯 Scraping: {url}")
        
        success, data, error = await scrape_website_advanced(
            url,
            max_retries=5,  # More retries for protected sites
            use_retry_queue=True  # Use different strategies
        )
        
        if success:
            print(f"✅ Bypassed protection!")
            print(f"Title: {data.get('title')}")
            print(f"Content length: {len(data.get('content', ''))}")
        else:
            print(f"❌ Failed: {error}")
            if data.get('blocked'):
                print(f"🚫 Still blocked by: {data.get('block_reason')}")


# ============================================
# Example 4: Concurrent Scraping
# ============================================

async def example_concurrent_scraping():
    """Scrape multiple URLs concurrently"""
    print("\n" + "="*60)
    print("Example 4: Concurrent Scraping")
    print("="*60)
    
    urls = [
        "https://example.com",
        "https://example.org",
        "https://example.net",
    ]
    
    print(f"📋 Scraping {len(urls)} URLs concurrently...")
    
    results = await scrape_multiple_urls(urls, max_concurrent=3)
    
    print(f"\n📊 Results:")
    for url, success, data, error in results:
        if success:
            print(f"✅ {url}: {data.get('word_count')} words")
        else:
            print(f"❌ {url}: {error}")


# ============================================
# Example 5: Extract Structured Data
# ============================================

async def example_structured_data():
    """Extract structured data (JSON-LD, OpenGraph)"""
    print("\n" + "="*60)
    print("Example 5: Extract Structured Data")
    print("="*60)
    
    url = "https://example.com"
    
    success, data, error = await scrape_website_advanced(url)
    
    if success:
        print(f"✅ Success!")
        
        # OpenGraph data
        print(f"\n📱 OpenGraph Data:")
        print(f"  Title: {data.get('og_title')}")
        print(f"  Description: {data.get('og_description')}")
        print(f"  Image: {data.get('og_image')}")
        
        # JSON-LD structured data
        print(f"\n📋 JSON-LD Data:")
        json_ld = data.get('json_ld', [])
        print(f"  Found {len(json_ld)} structured data blocks")
        for i, block in enumerate(json_ld[:3]):  # Show first 3
            print(f"  Block {i+1}: {block.get('@type', 'Unknown')}")
        
        # Meta description
        print(f"\n📝 Meta Description:")
        print(f"  {data.get('meta_description')}")
    else:
        print(f"❌ Failed: {error}")


# ============================================
# Example 6: Handle Anti-Bot Detection
# ============================================

async def example_anti_bot_handling():
    """Handle anti-bot detection and save debug info"""
    print("\n" + "="*60)
    print("Example 6: Anti-Bot Detection Handling")
    print("="*60)
    
    url = "https://protected-site.com"
    
    success, data, error = await scrape_website_advanced(url)
    
    if not success and data.get('blocked'):
        print(f"🚫 Detected anti-bot protection!")
        print(f"   Reason: {data.get('block_reason')}")
        print(f"   Title: {data.get('title')}")
        print(f"   URL: {data.get('url')}")
        print(f"\n📸 Debug Information:")
        print(f"   Screenshot: {data.get('screenshot')}")
        print(f"   HTML Dump: {data.get('html_dump')}")
        print(f"\n💡 Suggestions:")
        print(f"   1. Try with residential proxy")
        print(f"   2. Increase retry attempts")
        print(f"   3. Use mobile emulation")
        print(f"   4. Try different browser (Firefox/WebKit)")
    elif success:
        print(f"✅ Successfully bypassed protection!")
        print(f"   Title: {data.get('title')}")
        print(f"   Content: {len(data.get('content', ''))} characters")
    else:
        print(f"❌ Failed: {error}")


# ============================================
# Example 7: Custom Proxy Rotation
# ============================================

async def example_proxy_rotation():
    """Rotate through multiple proxies"""
    print("\n" + "="*60)
    print("Example 7: Proxy Rotation")
    print("="*60)
    
    url = "https://example.com"
    
    # List of residential proxies
    proxies = [
        {
            'server': 'http://proxy1.example.com:8080',
            'username': 'user1',
            'password': 'pass1'
        },
        {
            'server': 'http://proxy2.example.com:8080',
            'username': 'user2',
            'password': 'pass2'
        },
        {
            'server': 'http://proxy3.example.com:8080',
            'username': 'user3',
            'password': 'pass3'
        },
    ]
    
    for i, proxy in enumerate(proxies):
        print(f"\n🔄 Trying proxy {i+1}/{len(proxies)}: {proxy['server']}")
        
        success, data, error = await scrape_website_advanced(
            url,
            proxy=proxy,
            max_retries=2
        )
        
        if success:
            print(f"✅ Success with proxy {i+1}!")
            print(f"   Title: {data.get('title')}")
            break
        else:
            print(f"❌ Failed with proxy {i+1}: {error}")
    else:
        print(f"\n❌ All proxies failed")


# ============================================
# Run All Examples
# ============================================

async def main():
    """Run all examples"""
    print("\n" + "="*60)
    print("Advanced Web Scraper - Usage Examples")
    print("="*60)
    
    # Run examples
    await example_basic_scraping()
    # await example_proxy_scraping()  # Uncomment if you have proxy
    await example_protected_site()
    await example_concurrent_scraping()
    await example_structured_data()
    await example_anti_bot_handling()
    # await example_proxy_rotation()  # Uncomment if you have proxies
    
    print("\n" + "="*60)
    print("Examples completed!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
