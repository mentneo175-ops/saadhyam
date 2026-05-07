"""
Modern Web Scraper Service
Uses Playwright for JavaScript-heavy sites with BeautifulSoup fallback
"""

import logging
import re
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
import asyncio

from bs4 import BeautifulSoup
import requests

logger = logging.getLogger(__name__)

# ============================================
# Configuration
# ============================================

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

TIMEOUT_MS = 30000  # 30 seconds for Playwright
TIMEOUT_SEC = 10    # 10 seconds for requests

MAX_RETRIES = 2

# Elements to remove from scraped content
UNWANTED_TAGS = ['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'noscript']

# Business-related keywords for content filtering
BUSINESS_KEYWORDS = [
    'about', 'services', 'products', 'contact', 'team', 'mission', 'vision',
    'company', 'business', 'solutions', 'offerings', 'expertise'
]


# ============================================
# URL Validation
# ============================================

def validate_url(url: str) -> Tuple[bool, Optional[str]]:
    """
    Validate URL format
    
    Args:
        url: URL to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        result = urlparse(url)
        if not all([result.scheme, result.netloc]):
            return False, "Invalid URL format. Please include http:// or https://"
        
        if result.scheme not in ['http', 'https']:
            return False, "URL must start with http:// or https://"
        
        return True, None
        
    except Exception as e:
        return False, f"Invalid URL: {str(e)}"


# ============================================
# Content Cleaning Utilities
# ============================================

def clean_html(soup: BeautifulSoup) -> BeautifulSoup:
    """
    Remove unwanted elements from BeautifulSoup object
    
    Args:
        soup: BeautifulSoup object
    
    Returns:
        Cleaned BeautifulSoup object
    """
    # Remove unwanted tags
    for tag in UNWANTED_TAGS:
        for element in soup.find_all(tag):
            element.decompose()
    
    # Remove comments
    for comment in soup.find_all(string=lambda text: isinstance(text, str) and text.strip().startswith('<!--')):
        comment.extract()
    
    return soup


def extract_text_content(soup: BeautifulSoup, max_paragraphs: int = 20) -> str:
    """
    Extract clean text content from HTML
    
    Args:
        soup: BeautifulSoup object
        max_paragraphs: Maximum number of paragraphs to extract
    
    Returns:
        Clean text content
    """
    paragraphs = []
    
    # Extract paragraphs
    for p in soup.find_all('p'):
        text = p.get_text().strip()
        if text and len(text) > 30:  # Only substantial paragraphs
            paragraphs.append(text)
            if len(paragraphs) >= max_paragraphs:
                break
    
    # If no paragraphs, try divs with substantial text
    if not paragraphs:
        for div in soup.find_all('div'):
            text = div.get_text().strip()
            if text and len(text) > 50 and len(text) < 1000:
                paragraphs.append(text)
                if len(paragraphs) >= max_paragraphs:
                    break
    
    return '\n\n'.join(paragraphs)


def extract_headings(soup: BeautifulSoup, max_headings: int = 15) -> List[str]:
    """
    Extract headings from HTML
    
    Args:
        soup: BeautifulSoup object
        max_headings: Maximum number of headings to extract
    
    Returns:
        List of heading texts
    """
    headings = []
    
    for tag in ['h1', 'h2', 'h3']:
        for heading in soup.find_all(tag):
            text = heading.get_text().strip()
            if text and len(text) > 3 and len(text) < 200:
                headings.append(text)
                if len(headings) >= max_headings:
                    return headings
    
    return headings


def extract_links(soup: BeautifulSoup, base_url: str, max_links: int = 10) -> List[str]:
    """
    Extract relevant links from HTML
    
    Args:
        soup: BeautifulSoup object
        base_url: Base URL for resolving relative links
        max_links: Maximum number of links to extract
    
    Returns:
        List of URLs
    """
    links = []
    parsed_base = urlparse(base_url)
    
    for a in soup.find_all('a', href=True):
        href = a['href']
        
        # Skip anchors, javascript, mailto, tel
        if href.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
            continue
        
        # Convert relative to absolute
        if href.startswith('/'):
            href = f"{parsed_base.scheme}://{parsed_base.netloc}{href}"
        elif not href.startswith('http'):
            continue
        
        # Only include links from same domain
        if parsed_base.netloc in href:
            links.append(href)
            if len(links) >= max_links:
                break
    
    return links


def extract_business_sections(soup: BeautifulSoup) -> Dict[str, str]:
    """
    Extract business-related sections from HTML
    
    Args:
        soup: BeautifulSoup object
    
    Returns:
        Dictionary of section names to content
    """
    sections = {}
    
    # Look for about section
    for keyword in ['about', 'about-us', 'about_us', 'who-we-are']:
        section = soup.find(['section', 'div', 'article'], id=re.compile(keyword, re.I))
        if not section:
            section = soup.find(['section', 'div', 'article'], class_=re.compile(keyword, re.I))
        
        if section:
            text = section.get_text().strip()
            if text and len(text) > 50:
                sections['about'] = text[:1000]  # Limit length
                break
    
    # Look for services section
    for keyword in ['services', 'what-we-do', 'offerings', 'solutions']:
        section = soup.find(['section', 'div', 'article'], id=re.compile(keyword, re.I))
        if not section:
            section = soup.find(['section', 'div', 'article'], class_=re.compile(keyword, re.I))
        
        if section:
            text = section.get_text().strip()
            if text and len(text) > 50:
                sections['services'] = text[:1000]
                break
    
    # Look for contact section
    for keyword in ['contact', 'reach-us', 'get-in-touch']:
        section = soup.find(['section', 'div', 'article'], id=re.compile(keyword, re.I))
        if not section:
            section = soup.find(['section', 'div', 'article'], class_=re.compile(keyword, re.I))
        
        if section:
            text = section.get_text().strip()
            if text and len(text) > 20:
                sections['contact'] = text[:500]
                break
    
    return sections


# ============================================
# Playwright-based Scraper (Primary)
# ============================================

async def scrape_with_playwright(url: str, retries: int = MAX_RETRIES) -> Tuple[bool, Dict, Optional[str]]:
    """
    Scrape website using Playwright (handles JavaScript)
    
    Args:
        url: Website URL to scrape
        retries: Number of retry attempts
    
    Returns:
        Tuple of (success, data_dict, error_message)
    """
    try:
        from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
        
        logger.info(f"🎭 Scraping with Playwright: {url}")
        
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            
            try:
                # Create context with user agent
                context = await browser.new_context(
                    user_agent=USER_AGENT,
                    viewport={'width': 1920, 'height': 1080}
                )
                
                # Create page
                page = await context.new_page()
                
                # Navigate to URL
                try:
                    await page.goto(url, timeout=TIMEOUT_MS, wait_until='networkidle')
                except PlaywrightTimeout:
                    logger.warning(f"⏱️ Timeout waiting for networkidle, continuing anyway")
                    await page.wait_for_timeout(2000)  # Wait 2 more seconds
                
                # Wait for content to load
                await page.wait_for_timeout(1000)
                
                # Get page content
                html_content = await page.content()
                
                # Get page title
                title = await page.title()
                
                # Close browser
                await context.close()
                await browser.close()
                
                # Parse with BeautifulSoup
                soup = BeautifulSoup(html_content, 'html.parser')
                soup = clean_html(soup)
                
                # Extract data
                data = {
                    'title': title or '',
                    'meta_description': '',
                    'content': extract_text_content(soup),
                    'headings': extract_headings(soup),
                    'links': extract_links(soup, url),
                    'business_sections': extract_business_sections(soup),
                    'word_count': 0
                }
                
                # Extract meta description
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                if not meta_desc:
                    meta_desc = soup.find('meta', attrs={'property': 'og:description'})
                if meta_desc and meta_desc.get('content'):
                    data['meta_description'] = meta_desc['content'].strip()
                
                # Calculate word count
                all_text = f"{data['content']} {' '.join(data['headings'])}"
                data['word_count'] = len(all_text.split())
                
                logger.info(f"✅ Playwright scraping successful: {data['word_count']} words")
                return True, data, None
                
            except Exception as e:
                await browser.close()
                raise e
                
    except ImportError:
        logger.warning("❌ Playwright not installed")
        return False, {}, "Playwright not available"
    except Exception as e:
        logger.error(f"❌ Playwright scraping error: {e}")
        
        # Retry logic
        if retries > 0:
            logger.info(f"🔄 Retrying... ({MAX_RETRIES - retries + 1}/{MAX_RETRIES})")
            await asyncio.sleep(2)
            return await scrape_with_playwright(url, retries - 1)
        
        return False, {}, f"Playwright scraping failed: {str(e)}"


# ============================================
# Requests-based Scraper (Fallback)
# ============================================

def scrape_with_requests(url: str, retries: int = MAX_RETRIES) -> Tuple[bool, Dict, Optional[str]]:
    """
    Scrape website using requests + BeautifulSoup (fallback)
    
    Args:
        url: Website URL to scrape
        retries: Number of retry attempts
    
    Returns:
        Tuple of (success, data_dict, error_message)
    """
    try:
        logger.info(f"🌐 Scraping with requests: {url}")
        
        headers = {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # Make request
        response = requests.get(url, headers=headers, timeout=TIMEOUT_SEC, allow_redirects=True)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        soup = clean_html(soup)
        
        # Extract data
        data = {
            'title': '',
            'meta_description': '',
            'content': extract_text_content(soup),
            'headings': extract_headings(soup),
            'links': extract_links(soup, url),
            'business_sections': extract_business_sections(soup),
            'word_count': 0
        }
        
        # Extract title
        if soup.title and soup.title.string:
            data['title'] = soup.title.string.strip()
        elif soup.title:
            data['title'] = soup.title.get_text().strip()
        
        # Extract meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if not meta_desc:
            meta_desc = soup.find('meta', attrs={'property': 'og:description'})
        if meta_desc and meta_desc.get('content'):
            data['meta_description'] = meta_desc['content'].strip()
        
        # Calculate word count
        all_text = f"{data['content']} {' '.join(data['headings'])}"
        data['word_count'] = len(all_text.split())
        
        logger.info(f"✅ Requests scraping successful: {data['word_count']} words")
        return True, data, None
        
    except requests.Timeout:
        logger.error(f"⏱️ Request timeout")
        if retries > 0:
            logger.info(f"🔄 Retrying... ({MAX_RETRIES - retries + 1}/{MAX_RETRIES})")
            return scrape_with_requests(url, retries - 1)
        return False, {}, "Request timed out"
    except requests.RequestException as e:
        logger.error(f"❌ Request error: {e}")
        if retries > 0:
            logger.info(f"🔄 Retrying... ({MAX_RETRIES - retries + 1}/{MAX_RETRIES})")
            return scrape_with_requests(url, retries - 1)
        return False, {}, f"Failed to access website: {str(e)}"
    except Exception as e:
        logger.error(f"❌ Scraping error: {e}")
        return False, {}, f"Scraping failed: {str(e)}"


# ============================================
# Main Scraper Function (with fallback)
# ============================================

async def scrape_website(url: str, use_playwright: bool = True) -> Tuple[bool, Dict, Optional[str]]:
    """
    Scrape website with automatic fallback
    Primary: Playwright (handles JavaScript)
    Fallback: Requests + BeautifulSoup
    
    Args:
        url: Website URL to scrape
        use_playwright: Try Playwright first (default: True)
    
    Returns:
        Tuple of (success, data_dict, error_message)
    """
    # Validate URL
    is_valid, error = validate_url(url)
    if not is_valid:
        return False, {}, error
    
    # Try Playwright first (if enabled)
    if use_playwright:
        success, data, error = await scrape_with_playwright(url)
        if success and data.get('word_count', 0) > 0:
            return success, data, error
        
        logger.warning(f"⚠️ Playwright failed or returned no content, trying fallback")
    
    # Fallback to requests
    success, data, error = scrape_with_requests(url)
    return success, data, error


# ============================================
# Format for Business Input
# ============================================

def format_for_business_input(data: Dict) -> str:
    """
    Format scraped data for business input
    
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
    
    # Headings
    if data.get('headings'):
        headings_text = '\n'.join(data['headings'][:10])
        if headings_text:
            parts.append(f"Key Topics:\n{headings_text}")
    
    # Business sections
    business_sections = data.get('business_sections', {})
    if business_sections.get('about'):
        parts.append(f"About:\n{business_sections['about']}")
    
    if business_sections.get('services'):
        parts.append(f"Services:\n{business_sections['services']}")
    
    # Main content
    if data.get('content'):
        content = data['content']
        # Only add if not already covered by business sections
        if not business_sections.get('about') and not business_sections.get('services'):
            parts.append(f"Content:\n{content[:2000]}")  # Limit to 2000 chars
        elif len(content) > 500:
            parts.append(f"Additional Information:\n{content[:1500]}")
    
    # Contact info
    if business_sections.get('contact'):
        parts.append(f"Contact:\n{business_sections['contact']}")
    
    return '\n\n'.join(parts)
