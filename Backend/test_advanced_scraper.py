"""
Quick Test Script for Advanced Web Scraper
Run this to verify installation and functionality
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add services to path
sys.path.insert(0, str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def test_basic_scraping():
    """Test 1: Basic scraping"""
    print("\n" + "="*60)
    print("TEST 1: Basic Scraping")
    print("="*60)
    
    try:
        from services.advanced_web_scraper import scrape_website_advanced
        
        url = "https://example.com"
        logger.info(f"Testing basic scraping: {url}")
        
        success, data, error = await scrape_website_advanced(url, max_retries=2)
        
        if success:
            print(f"✅ SUCCESS!")
            print(f"   Title: {data.get('title')}")
            print(f"   Word Count: {data.get('word_count')}")
            print(f"   Headings: {len(data.get('headings', []))}")
            print(f"   Links: {len(data.get('links', []))}")
            return True
        else:
            print(f"❌ FAILED: {error}")
            if data.get('blocked'):
                print(f"   Blocked by: {data.get('block_reason')}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_integration_wrapper():
    """Test 2: Integration wrapper (backward compatibility)"""
    print("\n" + "="*60)
    print("TEST 2: Integration Wrapper")
    print("="*60)
    
    try:
        from services.scraper_integration import scrape_website
        
        url = "https://example.org"
        logger.info(f"Testing integration wrapper: {url}")
        
        success, data, error = await scrape_website(url)
        
        if success:
            print(f"✅ SUCCESS!")
            print(f"   Title: {data.get('title')}")
            print(f"   Content length: {len(data.get('content', ''))}")
            return True
        else:
            print(f"❌ FAILED: {error}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_anti_bot_detection():
    """Test 3: Anti-bot detection"""
    print("\n" + "="*60)
    print("TEST 3: Anti-Bot Detection")
    print("="*60)
    
    try:
        from services.advanced_web_scraper import detect_anti_bot_page
        
        # Test Cloudflare detection
        cloudflare_html = "<html><body>Checking your browser... cf-browser-verification</body></html>"
        is_blocked, reason = detect_anti_bot_page(cloudflare_html, "Just a moment...")
        
        if is_blocked and "cloudflare" in reason.lower():
            print(f"✅ Cloudflare detection works: {reason}")
        else:
            print(f"❌ Cloudflare detection failed")
            return False
        
        # Test normal page
        normal_html = "<html><body><h1>Welcome</h1><p>This is a normal page</p></body></html>"
        is_blocked, reason = detect_anti_bot_page(normal_html, "Welcome")
        
        if not is_blocked:
            print(f"✅ Normal page detection works")
        else:
            print(f"❌ False positive: {reason}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_content_extraction():
    """Test 4: Content extraction"""
    print("\n" + "="*60)
    print("TEST 4: Content Extraction")
    print("="*60)
    
    try:
        from services.advanced_web_scraper import extract_with_beautifulsoup
        
        html = """
        <html>
        <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
            <meta property="og:title" content="OG Title">
            <script type="application/ld+json">
                {"@type": "Organization", "name": "Test Org"}
            </script>
        </head>
        <body>
            <h1>Main Heading</h1>
            <h2>Sub Heading</h2>
            <p>This is a test paragraph with more than thirty characters.</p>
            <a href="https://example.com">Link</a>
            <img src="https://example.com/image.jpg">
        </body>
        </html>
        """
        
        data = extract_with_beautifulsoup(html)
        
        checks = [
            (data.get('title') == 'Test Page', "Title extraction"),
            (data.get('meta_description') == 'Test description', "Meta description"),
            (data.get('og_title') == 'OG Title', "OpenGraph title"),
            (len(data.get('headings', [])) >= 2, "Headings extraction"),
            (len(data.get('content', '')) > 0, "Content extraction"),
            (len(data.get('links', [])) > 0, "Links extraction"),
            (len(data.get('images', [])) > 0, "Images extraction"),
            (len(data.get('json_ld', [])) > 0, "JSON-LD extraction"),
        ]
        
        all_passed = True
        for passed, name in checks:
            if passed:
                print(f"   ✅ {name}")
            else:
                print(f"   ❌ {name}")
                all_passed = False
        
        if all_passed:
            print(f"✅ All extraction tests passed!")
            return True
        else:
            print(f"❌ Some extraction tests failed")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_retry_queue():
    """Test 5: Retry queue system"""
    print("\n" + "="*60)
    print("TEST 5: Retry Queue System")
    print("="*60)
    
    try:
        from services.advanced_web_scraper import ScrapeRetryQueue
        
        queue = ScrapeRetryQueue()
        
        if len(queue.strategies) >= 6:
            print(f"✅ Retry queue has {len(queue.strategies)} strategies")
            
            # Show strategies
            for i, strategy in enumerate(queue.strategies[:3]):
                print(f"   Strategy {i+1}: {strategy}")
            
            return True
        else:
            print(f"❌ Retry queue has only {len(queue.strategies)} strategies")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """Run all tests"""
    print("\n" + "="*70)
    print("  ADVANCED WEB SCRAPER - TEST SUITE")
    print("="*70)
    
    tests = [
        ("Basic Scraping", test_basic_scraping),
        ("Integration Wrapper", test_integration_wrapper),
        ("Anti-Bot Detection", test_anti_bot_detection),
        ("Content Extraction", test_content_extraction),
        ("Retry Queue System", test_retry_queue),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            result = await test_func()
            results.append((name, result))
        except Exception as e:
            logger.error(f"Test '{name}' crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*70)
    print("  TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print("\n" + "-"*70)
    print(f"Results: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print("="*70)
    
    if passed == total:
        print("\n🎉 All tests passed! Advanced scraper is ready to use!")
        return True
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. Please check the errors above.")
        return False


if __name__ == "__main__":
    try:
        success = asyncio.run(run_all_tests())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
