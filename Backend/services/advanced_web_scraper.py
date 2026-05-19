"""
Advanced Production-Grade Web Scraper
Bypasses modern anti-bot protections (Cloudflare, Akamai, DataDome, PerimeterX)
"""

import logging
import asyncio
import random
import json
import base64
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse
from datetime import datetime
from pathlib import Path

from bs4 import BeautifulSoup
import requests

logger = logging.getLogger(__name__)

# ============================================
# Configuration
# ============================================

# Realistic User Agents (rotating pool)
USER_AGENTS = [
    # Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    # Chrome on Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    # Firefox on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    # Safari on Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    # Edge on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
]

# Browser fingerprint variations
VIEWPORTS = [
    {'width': 1920, 'height': 1080},
    {'width': 1366, 'height': 768},
    {'width': 1536, 'height': 864},
    {'width': 1440, 'height': 900},
    {'width': 2560, 'height': 1440},
]

TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
]

LOCALES = [
    'en-US',
    'en-GB',
    'en-CA',
    'en-AU',
]

# Mobile devices for emulation
MOBILE_DEVICES = [
    {
        'name': 'iPhone 13 Pro',
        'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'viewport': {'width': 390, 'height': 844},
        'device_scale_factor': 3,
        'is_mobile': True,
        'has_touch': True,
    },
    {
        'name': 'Samsung Galaxy S21',
        'user_agent': 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'viewport': {'width': 360, 'height': 800},
        'device_scale_factor': 3,
        'is_mobile': True,
        'has_touch': True,
    },
    {
        'name': 'iPad Pro',
        'user_agent': 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'viewport': {'width': 1024, 'height': 1366},
        'device_scale_factor': 2,
        'is_mobile': True,
        'has_touch': True,
    },
]

# Timeouts
TIMEOUT_MS = 60000  # 60 seconds
NAVIGATION_TIMEOUT = 45000  # 45 seconds

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_MIN = 2
RETRY_DELAY_MAX = 5

# Anti-bot detection patterns
ANTI_BOT_PATTERNS = [
    'access denied',
    'forbidden',
    'captcha',
    'cloudflare',
    'akamai',
    'datadome',
    'perimeterx',
    'bot detection',
    'security check',
    'please verify',
    'are you a robot',
    'unusual traffic',
    'blocked',
]

# Screenshot directory
SCREENSHOT_DIR = Path('Backend/logs/screenshots')
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

HTML_DUMP_DIR = Path('Backend/logs/html_dumps')
HTML_DUMP_DIR.mkdir(parents=True, exist_ok=True)


# ============================================
# Utility Functions
# ============================================

def get_random_user_agent() -> str:
    """Get random user agent from pool"""
    return random.choice(USER_AGENTS)


def get_random_viewport() -> Dict[str, int]:
    """Get random viewport size"""
    return random.choice(VIEWPORTS)


def get_random_timezone() -> str:
    """Get random timezone"""
    return random.choice(TIMEZONES)


def get_random_locale() -> str:
    """Get random locale"""
    return random.choice(LOCALES)


def get_random_mobile_device() -> Dict[str, Any]:
    """Get random mobile device configuration"""
    return random.choice(MOBILE_DEVICES)


def random_delay(min_sec: float = 0.5, max_sec: float = 2.0) -> float:
    """Generate random delay"""
    return random.uniform(min_sec, max_sec)


def detect_anti_bot_page(html: str, title: str = '') -> Tuple[bool, Optional[str]]:
    """
    Detect if page is an anti-bot challenge page
    
    Returns:
        (is_blocked, reason)
    """
    html_lower = html.lower()
    title_lower = title.lower()
    
    for pattern in ANTI_BOT_PATTERNS:
        if pattern in html_lower or pattern in title_lower:
            return True, pattern
    
    # Check for specific anti-bot services
    if 'cf-browser-verification' in html_lower or 'cf_chl_opt' in html_lower:
        return True, 'Cloudflare challenge'
    
    if 'akamai' in html_lower and 'reference' in html_lower:
        return True, 'Akamai block'
    
    if 'datadome' in html_lower:
        return True, 'DataDome challenge'
    
    if 'perimeterx' in html_lower or '_px' in html_lower:
        return True, 'PerimeterX challenge'
    
    # Check for very short content (likely challenge page)
    if len(html) < 500 and ('verify' in html_lower or 'check' in html_lower):
        return True, 'Verification page'
    
    return False, None


async def save_screenshot(page, url: str, reason: str = 'blocked'):
    """Save screenshot for debugging"""
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        domain = urlparse(url).netloc.replace('.', '_')
        filename = f"{domain}_{reason}_{timestamp}.png"
        filepath = SCREENSHOT_DIR / filename
        
        await page.screenshot(path=str(filepath), full_page=True)
        logger.info(f"📸 Screenshot saved: {filepath}")
        return str(filepath)
    except Exception as e:
        logger.error(f"❌ Failed to save screenshot: {e}")
        return None


async def save_html_dump(html: str, url: str, reason: str = 'blocked'):
    """Save HTML dump for debugging"""
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        domain = urlparse(url).netloc.replace('.', '_')
        filename = f"{domain}_{reason}_{timestamp}.html"
        filepath = HTML_DUMP_DIR / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        
        logger.info(f"💾 HTML dump saved: {filepath}")
        return str(filepath)
    except Exception as e:
        logger.error(f"❌ Failed to save HTML dump: {e}")
        return None



# ============================================
# Human Behavior Simulation
# ============================================

async def simulate_human_mouse_movement(page):
    """Simulate realistic mouse movements"""
    try:
        viewport = page.viewport_size
        if not viewport:
            return
        
        # Random mouse movements
        for _ in range(random.randint(2, 5)):
            x = random.randint(0, viewport['width'])
            y = random.randint(0, viewport['height'])
            await page.mouse.move(x, y)
            await asyncio.sleep(random_delay(0.1, 0.3))
    except Exception as e:
        logger.debug(f"Mouse movement simulation failed: {e}")


async def simulate_human_scrolling(page):
    """Simulate realistic scrolling behavior"""
    try:
        # Scroll down in chunks
        scroll_steps = random.randint(3, 7)
        for i in range(scroll_steps):
            scroll_amount = random.randint(200, 600)
            await page.evaluate(f'window.scrollBy(0, {scroll_amount})')
            await asyncio.sleep(random_delay(0.3, 0.8))
        
        # Scroll back up a bit
        await page.evaluate(f'window.scrollBy(0, -{random.randint(100, 300)})')
        await asyncio.sleep(random_delay(0.2, 0.5))
    except Exception as e:
        logger.debug(f"Scrolling simulation failed: {e}")


async def simulate_human_typing(page, selector: str, text: str):
    """Simulate realistic typing with delays"""
    try:
        await page.click(selector)
        for char in text:
            await page.keyboard.type(char)
            await asyncio.sleep(random_delay(0.05, 0.15))
    except Exception as e:
        logger.debug(f"Typing simulation failed: {e}")


async def simulate_human_behavior(page):
    """Simulate complete human behavior"""
    try:
        # Wait a bit after page load
        await asyncio.sleep(random_delay(1.0, 2.0))
        
        # Mouse movements
        await simulate_human_mouse_movement(page)
        
        # Scrolling
        await simulate_human_scrolling(page)
        
        # Random pause
        await asyncio.sleep(random_delay(0.5, 1.5))
    except Exception as e:
        logger.debug(f"Human behavior simulation failed: {e}")


# ============================================
# Stealth Configuration
# ============================================

async def apply_stealth_mode(page):
    """Apply stealth techniques to bypass bot detection"""
    try:
        # Override navigator properties
        await page.add_init_script("""
            // Override webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            
            // Override plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            
            // Override languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
            
            // Override chrome property
            window.chrome = {
                runtime: {}
            };
            
            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
            
            // Override connection
            Object.defineProperty(navigator, 'connection', {
                get: () => ({
                    effectiveType: '4g',
                    rtt: 50,
                    downlink: 10,
                    saveData: false
                })
            });
            
            // Override hardwareConcurrency
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => 8
            });
            
            // Override deviceMemory
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => 8
            });
            
            // Override platform
            Object.defineProperty(navigator, 'platform', {
                get: () => 'Win32'
            });
            
            // Override vendor
            Object.defineProperty(navigator, 'vendor', {
                get: () => 'Google Inc.'
            });
            
            // Override maxTouchPoints
            Object.defineProperty(navigator, 'maxTouchPoints', {
                get: () => 0
            });
        """)
        
        logger.debug("✅ Stealth mode applied")
    except Exception as e:
        logger.error(f"❌ Failed to apply stealth mode: {e}")


# ============================================
# Content Extraction
# ============================================

def extract_with_beautifulsoup(html: str) -> Dict[str, Any]:
    """Extract content using BeautifulSoup"""
    try:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove unwanted elements
        for tag in ['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'noscript']:
            for element in soup.find_all(tag):
                element.decompose()
        
        data = {
            'title': '',
            'meta_description': '',
            'og_title': '',
            'og_description': '',
            'og_image': '',
            'content': '',
            'headings': [],
            'links': [],
            'images': [],
            'json_ld': [],
        }
        
        # Title
        if soup.title:
            data['title'] = soup.title.get_text().strip()
        
        # Meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            data['meta_description'] = meta_desc['content'].strip()
        
        # OpenGraph data
        og_title = soup.find('meta', attrs={'property': 'og:title'})
        if og_title and og_title.get('content'):
            data['og_title'] = og_title['content'].strip()
        
        og_desc = soup.find('meta', attrs={'property': 'og:description'})
        if og_desc and og_desc.get('content'):
            data['og_description'] = og_desc['content'].strip()
        
        og_image = soup.find('meta', attrs={'property': 'og:image'})
        if og_image and og_image.get('content'):
            data['og_image'] = og_image['content'].strip()
        
        # JSON-LD structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                json_data = json.loads(script.string)
                data['json_ld'].append(json_data)
            except:
                pass
        
        # Headings
        for tag in ['h1', 'h2', 'h3']:
            for heading in soup.find_all(tag):
                text = heading.get_text().strip()
                if text and len(text) > 3:
                    data['headings'].append(text)
        
        # Main content
        paragraphs = []
        for p in soup.find_all('p'):
            text = p.get_text().strip()
            if text and len(text) > 30:
                paragraphs.append(text)
        
        data['content'] = '\n\n'.join(paragraphs[:50])  # Limit to 50 paragraphs
        
        # Links
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href and not href.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
                data['links'].append(href)
        
        # Images
        for img in soup.find_all('img', src=True):
            data['images'].append(img['src'])
        
        return data
        
    except Exception as e:
        logger.error(f"❌ BeautifulSoup extraction failed: {e}")
        return {}


def extract_readable_content(html: str) -> str:
    """Extract readable content using readability-like algorithm"""
    try:
        from readability import Document
        doc = Document(html)
        return doc.summary()
    except ImportError:
        logger.warning("readability-lxml not installed, using BeautifulSoup fallback")
        data = extract_with_beautifulsoup(html)
        return data.get('content', '')
    except Exception as e:
        logger.error(f"❌ Readability extraction failed: {e}")
        return ''



# ============================================
# Advanced Playwright Scraper
# ============================================

async def scrape_with_advanced_playwright(
    url: str,
    proxy: Optional[Dict[str, str]] = None,
    headless: bool = True,
    use_mobile: bool = False,
    browser_type: str = 'chromium',
    retry_count: int = 0
) -> Tuple[bool, Dict[str, Any], Optional[str]]:
    """
    Advanced Playwright scraper with anti-bot bypass
    
    Args:
        url: Target URL
        proxy: Proxy configuration {'server': 'http://proxy:port', 'username': '', 'password': ''}
        headless: Run in headless mode
        use_mobile: Use mobile emulation
        browser_type: 'chromium', 'firefox', or 'webkit'
        retry_count: Current retry attempt
    
    Returns:
        (success, data, error_message)
    """
    try:
        from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
        
        logger.info(f"🎭 [Attempt {retry_count + 1}] Scraping with Playwright: {url}")
        logger.info(f"   Headless: {headless}, Mobile: {use_mobile}, Browser: {browser_type}")
        
        async with async_playwright() as p:
            # Select browser
            if browser_type == 'firefox':
                browser_engine = p.firefox
            elif browser_type == 'webkit':
                browser_engine = p.webkit
            else:
                browser_engine = p.chromium
            
            # Browser launch args
            launch_args = {
                'headless': headless,
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                ]
            }
            
            # Add proxy if provided
            if proxy:
                launch_args['proxy'] = proxy
            
            browser = await browser_engine.launch(**launch_args)
            
            try:
                # Context configuration
                context_config = {
                    'user_agent': get_random_user_agent(),
                    'viewport': get_random_viewport(),
                    'locale': get_random_locale(),
                    'timezone_id': get_random_timezone(),
                    'permissions': ['geolocation'],
                    'geolocation': {'latitude': 40.7128, 'longitude': -74.0060},  # New York
                    'color_scheme': random.choice(['light', 'dark']),
                    'extra_http_headers': {
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                    }
                }
                
                # Mobile emulation
                if use_mobile:
                    device = get_random_mobile_device()
                    context_config.update({
                        'user_agent': device['user_agent'],
                        'viewport': device['viewport'],
                        'device_scale_factor': device['device_scale_factor'],
                        'is_mobile': device['is_mobile'],
                        'has_touch': device['has_touch'],
                    })
                    logger.info(f"📱 Using mobile device: {device['name']}")
                
                context = await browser.new_context(**context_config)
                
                # Create page
                page = await context.new_page()
                
                # Apply stealth mode
                await apply_stealth_mode(page)
                
                # Set default timeout
                page.set_default_timeout(TIMEOUT_MS)
                
                # Navigate to URL
                try:
                    logger.info(f"🌐 Navigating to {url}...")
                    response = await page.goto(
                        url,
                        timeout=NAVIGATION_TIMEOUT,
                        wait_until='domcontentloaded'
                    )
                    
                    # Check response status
                    if response:
                        status = response.status
                        logger.info(f"📊 Response status: {status}")
                        
                        if status >= 400:
                            logger.warning(f"⚠️ HTTP error: {status}")
                    
                except PlaywrightTimeout:
                    logger.warning(f"⏱️ Navigation timeout, continuing anyway...")
                
                # Wait for page to stabilize
                await asyncio.sleep(random_delay(1.0, 2.0))
                
                # Wait for network to be idle
                try:
                    await page.wait_for_load_state('networkidle', timeout=10000)
                except:
                    logger.debug("Network idle timeout, continuing...")
                
                # Simulate human behavior
                await simulate_human_behavior(page)
                
                # Wait for lazy-loaded content
                await page.evaluate("""
                    async () => {
                        // Scroll to bottom to trigger lazy loading
                        window.scrollTo(0, document.body.scrollHeight);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Scroll back to top
                        window.scrollTo(0, 0);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                """)
                
                # Wait a bit more for content to load
                await asyncio.sleep(random_delay(1.0, 2.0))
                
                # Get page content
                html_content = await page.content()
                title = await page.title()
                url_final = page.url  # May have redirected
                
                # Detect anti-bot page
                is_blocked, block_reason = detect_anti_bot_page(html_content, title)
                
                if is_blocked:
                    logger.warning(f"🚫 Anti-bot page detected: {block_reason}")
                    
                    # Save screenshot and HTML
                    screenshot_path = await save_screenshot(page, url, block_reason)
                    html_path = await save_html_dump(html_content, url, block_reason)
                    
                    await context.close()
                    await browser.close()
                    
                    # Return blocked info
                    return False, {
                        'blocked': True,
                        'block_reason': block_reason,
                        'screenshot': screenshot_path,
                        'html_dump': html_path,
                        'title': title,
                        'url': url_final,
                    }, f"Blocked by anti-bot: {block_reason}"
                
                # Extract content
                logger.info(f"📝 Extracting content...")
                data = extract_with_beautifulsoup(html_content)
                
                # Add metadata
                data['url'] = url_final
                data['scraped_at'] = datetime.now().isoformat()
                data['word_count'] = len(data.get('content', '').split())
                data['blocked'] = False
                
                # Close browser
                await context.close()
                await browser.close()
                
                logger.info(f"✅ Scraping successful: {data['word_count']} words extracted")
                return True, data, None
                
            except Exception as e:
                await browser.close()
                raise e
                
    except ImportError:
        logger.error("❌ Playwright not installed")
        return False, {}, "Playwright not available"
    
    except Exception as e:
        logger.error(f"❌ Scraping error: {e}")
        return False, {}, f"Scraping failed: {str(e)}"


# ============================================
# Retry Queue System
# ============================================

class ScrapeRetryQueue:
    """Manages retry attempts with different strategies"""
    
    def __init__(self):
        self.strategies = [
            {'headless': True, 'use_mobile': False, 'browser_type': 'chromium'},
            {'headless': False, 'use_mobile': False, 'browser_type': 'chromium'},
            {'headless': True, 'use_mobile': True, 'browser_type': 'chromium'},
            {'headless': False, 'use_mobile': True, 'browser_type': 'chromium'},
            {'headless': True, 'use_mobile': False, 'browser_type': 'firefox'},
            {'headless': False, 'use_mobile': False, 'browser_type': 'firefox'},
        ]
    
    async def scrape_with_retries(
        self,
        url: str,
        proxy: Optional[Dict[str, str]] = None,
        max_retries: int = MAX_RETRIES
    ) -> Tuple[bool, Dict[str, Any], Optional[str]]:
        """
        Scrape with automatic retry using different strategies
        
        Args:
            url: Target URL
            proxy: Proxy configuration
            max_retries: Maximum retry attempts
        
        Returns:
            (success, data, error_message)
        """
        logger.info(f"🔄 Starting scrape with retry queue: {url}")
        
        for attempt in range(max_retries):
            # Select strategy
            strategy = self.strategies[attempt % len(self.strategies)]
            
            logger.info(f"📋 Attempt {attempt + 1}/{max_retries} - Strategy: {strategy}")
            
            # Try scraping
            success, data, error = await scrape_with_advanced_playwright(
                url=url,
                proxy=proxy,
                retry_count=attempt,
                **strategy
            )
            
            if success:
                logger.info(f"✅ Scraping successful on attempt {attempt + 1}")
                return success, data, error
            
            # Check if blocked
            if data.get('blocked'):
                logger.warning(f"🚫 Blocked: {data.get('block_reason')}")
                
                # If blocked, wait longer before retry
                if attempt < max_retries - 1:
                    delay = random.uniform(RETRY_DELAY_MIN * 2, RETRY_DELAY_MAX * 2)
                    logger.info(f"⏳ Waiting {delay:.1f}s before retry...")
                    await asyncio.sleep(delay)
            else:
                # Regular error, shorter delay
                if attempt < max_retries - 1:
                    delay = random.uniform(RETRY_DELAY_MIN, RETRY_DELAY_MAX)
                    logger.info(f"⏳ Waiting {delay:.1f}s before retry...")
                    await asyncio.sleep(delay)
        
        logger.error(f"❌ All retry attempts failed for {url}")
        return False, data, f"Failed after {max_retries} attempts"


# ============================================
# Main Scraper Function
# ============================================

async def scrape_website_advanced(
    url: str,
    proxy: Optional[Dict[str, str]] = None,
    max_retries: int = MAX_RETRIES,
    use_retry_queue: bool = True
) -> Tuple[bool, Dict[str, Any], Optional[str]]:
    """
    Main advanced scraping function with all features
    
    Args:
        url: Target URL
        proxy: Proxy configuration (optional)
        max_retries: Maximum retry attempts
        use_retry_queue: Use retry queue with different strategies
    
    Returns:
        (success, data, error_message)
    """
    # Validate URL
    try:
        parsed = urlparse(url)
        if not all([parsed.scheme, parsed.netloc]):
            return False, {}, "Invalid URL format"
        
        if parsed.scheme not in ['http', 'https']:
            return False, {}, "URL must start with http:// or https://"
    except Exception as e:
        return False, {}, f"Invalid URL: {str(e)}"
    
    # Use retry queue
    if use_retry_queue:
        queue = ScrapeRetryQueue()
        return await queue.scrape_with_retries(url, proxy, max_retries)
    else:
        # Single attempt
        return await scrape_with_advanced_playwright(url, proxy)


# ============================================
# Convenience Functions
# ============================================

async def scrape_with_proxy(url: str, proxy_url: str, proxy_username: str = '', proxy_password: str = ''):
    """Scrape with proxy support"""
    proxy_config = {
        'server': proxy_url,
    }
    
    if proxy_username:
        proxy_config['username'] = proxy_username
        proxy_config['password'] = proxy_password
    
    return await scrape_website_advanced(url, proxy=proxy_config)


async def scrape_multiple_urls(urls: List[str], max_concurrent: int = 3) -> List[Tuple[str, bool, Dict, Optional[str]]]:
    """
    Scrape multiple URLs concurrently
    
    Args:
        urls: List of URLs to scrape
        max_concurrent: Maximum concurrent scraping tasks
    
    Returns:
        List of (url, success, data, error) tuples
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def scrape_with_semaphore(url):
        async with semaphore:
            success, data, error = await scrape_website_advanced(url)
            return (url, success, data, error)
    
    tasks = [scrape_with_semaphore(url) for url in urls]
    results = await asyncio.gather(*tasks)
    
    return results
