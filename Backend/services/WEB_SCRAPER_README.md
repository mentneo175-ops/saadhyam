# Modern Web Scraper Service

## Overview

This is a production-ready web scraping service that uses **Playwright** for JavaScript-heavy websites with automatic fallback to **requests + BeautifulSoup** for simple sites.

## Features

✅ **Playwright-based scraping** - Handles JavaScript-rendered content  
✅ **Automatic fallback** - Falls back to requests if Playwright fails  
✅ **Retry logic** - Automatically retries failed requests  
✅ **Content cleaning** - Removes scripts, styles, nav, footer, ads  
✅ **Business-focused extraction** - Extracts about, services, contact sections  
✅ **Async architecture** - Uses async/await for better performance  
✅ **Memory leak prevention** - Proper browser cleanup  
✅ **Production-ready** - Comprehensive error handling and logging  

## Architecture

```
┌─────────────────────────────────────────┐
│         scrape_website(url)             │
│                                         │
│  1. Validate URL                        │
│  2. Try Playwright (primary)            │
│  3. Fallback to requests (if needed)    │
│  4. Clean HTML                          │
│  5. Extract business content            │
│  6. Return structured data              │
└─────────────────────────────────────────┘
```

## Installation

### 1. Install Python packages

```bash
cd Backend
venv\Scripts\python.exe -m pip install playwright==1.48.0 readability-lxml==0.8.1
```

### 2. Install Playwright browsers

```bash
venv\Scripts\playwright.exe install chromium
```

**Or use the provided script:**

```bash
cd Backend
install_playwright.bat
```

## Usage

### Basic Usage

```python
from services.web_scraper import scrape_website
import asyncio

async def main():
    url = "https://example.com"
    success, data, error = await scrape_website(url)
    
    if success:
        print(f"Title: {data['title']}")
        print(f"Word count: {data['word_count']}")
        print(f"Content: {data['content'][:200]}...")
    else:
        print(f"Error: {error}")

asyncio.run(main())
```

### Synchronous Wrapper

```python
from services.website_service import scrape_website

# This is a synchronous wrapper
success, data, error = scrape_website("https://example.com")
```

## Extracted Data Structure

```python
{
    'title': str,              # Page title
    'meta_description': str,   # Meta description
    'content': str,            # Main text content
    'headings': List[str],     # H1, H2, H3 headings
    'links': List[str],        # Relevant links
    'business_sections': {     # Business-specific sections
        'about': str,
        'services': str,
        'contact': str
    },
    'word_count': int          # Total word count
}
```

## Configuration

Edit `services/web_scraper.py` to customize:

```python
USER_AGENT = '...'          # Browser user agent
TIMEOUT_MS = 30000          # Playwright timeout (ms)
TIMEOUT_SEC = 10            # Requests timeout (sec)
MAX_RETRIES = 2             # Retry attempts
UNWANTED_TAGS = [...]       # Tags to remove
```

## How It Works

### 1. Playwright Scraper (Primary)

- Launches headless Chromium browser
- Waits for network idle (JavaScript execution complete)
- Extracts fully rendered HTML
- Handles dynamic content, SPAs, lazy loading
- Automatically retries on failure

### 2. Requests Scraper (Fallback)

- Fast HTTP request with BeautifulSoup
- Works for static HTML sites
- Lower resource usage
- Fallback when Playwright fails or unavailable

### 3. Content Extraction

- **Title**: From `<title>` tag
- **Meta**: From `<meta name="description">`
- **Headings**: From `<h1>`, `<h2>`, `<h3>`
- **Content**: From `<p>` tags and text nodes
- **Business Sections**: From semantic HTML (id/class matching)
- **Links**: From `<a>` tags (same domain only)

### 4. Content Cleaning

Removes:
- Scripts (`<script>`)
- Styles (`<style>`)
- Navigation (`<nav>`)
- Footers (`<footer>`)
- Headers (`<header>`)
- Ads and sidebars (`<aside>`)
- Iframes (`<iframe>`)

## Error Handling

The scraper handles:
- ✅ Network timeouts
- ✅ Invalid URLs
- ✅ HTTP errors (404, 500, etc.)
- ✅ JavaScript errors
- ✅ Empty content
- ✅ Anti-scraping protection (with fallback)

## Performance

- **Playwright**: ~3-5 seconds per page
- **Requests**: ~1-2 seconds per page
- **Memory**: ~100-200MB per browser instance
- **Concurrent**: Supports async concurrent scraping

## Limitations

❌ **Cannot bypass:**
- CAPTCHA challenges
- Login walls
- Cloudflare protection (advanced)
- Rate limiting (aggressive)

❌ **Not suitable for:**
- Large-scale scraping (use Scrapy instead)
- Real-time data extraction
- Sites requiring authentication

## Troubleshooting

### Playwright not installed

```bash
venv\Scripts\playwright.exe install chromium
```

### Browser launch fails

```python
# Add these args in web_scraper.py
browser = await p.chromium.launch(
    headless=True,
    args=[
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
    ]
)
```

### Timeout errors

Increase timeout in `web_scraper.py`:

```python
TIMEOUT_MS = 60000  # 60 seconds
```

## Testing

Test the scraper:

```bash
cd Backend
venv\Scripts\python.exe -c "
from services.web_scraper import scrape_website
import asyncio

async def test():
    url = 'https://example.com'
    success, data, error = await scrape_website(url)
    print(f'Success: {success}')
    print(f'Word count: {data.get(\"word_count\", 0)}')

asyncio.run(test())
"
```

## Production Deployment

### Docker

```dockerfile
FROM python:3.11-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy application
COPY . /app
WORKDIR /app

CMD ["python", "main.py"]
```

### Environment Variables

```bash
# Optional: Configure Playwright
PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

## Monitoring

Add logging:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

Monitor:
- Scraping success rate
- Average response time
- Error types and frequency
- Memory usage

## License

Part of Saadhyam AI Backend
