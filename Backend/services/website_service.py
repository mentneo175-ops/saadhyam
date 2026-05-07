"""
Website Service
Scrape and extract business information from websites
Uses modern Playwright-based scraper with fallback
"""

import logging
from typing import Dict, Optional, Tuple

from services.web_scraper import scrape_website as scrape_website_async, format_for_business_input

logger = logging.getLogger(__name__)


async def scrape_website_async_wrapper(url: str, use_playwright: bool = True) -> Tuple[bool, Dict[str, str], Optional[str]]:
    """
    Async wrapper for website scraping
    
    Args:
        url: Website URL to scrape
        use_playwright: Use Playwright (default: True)
    
    Returns:
        Tuple of (success, extracted_data, error_message)
    """
    try:
        # Call async scraper
        success, data, error = await scrape_website_async(url, use_playwright)
        
        if not success:
            return False, {}, error
        
        # Convert to old format for compatibility
        extracted_data = {
            'title': data.get('title', ''),
            'meta_description': data.get('meta_description', ''),
            'headings': '\n'.join(data.get('headings', [])),
            'paragraphs': data.get('content', ''),
            'about_section': data.get('business_sections', {}).get('about', ''),
            'services_section': data.get('business_sections', {}).get('services', ''),
            'contact_info': data.get('business_sections', {}).get('contact', '')
        }
        
        return True, extracted_data, None
        
    except Exception as e:
        logger.error(f"❌ Website scraping error: {e}")
        return False, {}, f"Website scraping failed: {str(e)}"


def scrape_website(url: str, use_playwright: bool = True) -> Tuple[bool, Dict[str, str], Optional[str]]:
    """
    Scrape website (synchronous wrapper - DEPRECATED, use async version)
    This is kept for backward compatibility but should not be used
    
    Args:
        url: Website URL to scrape
        use_playwright: Use Playwright (default: True)
    
    Returns:
        Tuple of (success, extracted_data, error_message)
    """
    import asyncio
    
    try:
        # Try to get the running event loop
        try:
            loop = asyncio.get_running_loop()
            # If we're already in an async context, we can't use run_until_complete
            logger.error("Cannot use synchronous wrapper in async context")
            return False, {}, "Internal error: Use async scraping in FastAPI routes"
        except RuntimeError:
            # No event loop running, create a new one
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success, data, error = loop.run_until_complete(scrape_website_async(url, use_playwright))
                
                if not success:
                    return False, {}, error
                
                # Convert to old format
                extracted_data = {
                    'title': data.get('title', ''),
                    'meta_description': data.get('meta_description', ''),
                    'headings': '\n'.join(data.get('headings', [])),
                    'paragraphs': data.get('content', ''),
                    'about_section': data.get('business_sections', {}).get('about', ''),
                    'services_section': data.get('business_sections', {}).get('services', ''),
                    'contact_info': data.get('business_sections', {}).get('contact', '')
                }
                
                return True, extracted_data, None
            finally:
                loop.close()
        
    except Exception as e:
        logger.error(f"❌ Website scraping error: {e}")
        return False, {}, f"Website scraping failed: {str(e)}"


def format_website_content(extracted_data: Dict[str, str]) -> str:
    """
    Format extracted website data into clean business description
    (Kept for backward compatibility)
    
    Args:
        extracted_data: Dictionary of extracted website data
    
    Returns:
        Formatted business description
    """
    parts = []
    
    # Title
    if extracted_data.get('title'):
        parts.append(f"Business: {extracted_data['title']}")
    
    # Meta description
    if extracted_data.get('meta_description'):
        parts.append(extracted_data['meta_description'])
    
    # Headings (important for understanding page structure)
    if extracted_data.get('headings'):
        headings_text = extracted_data['headings'].strip()
        if headings_text:
            parts.append(f"Key Topics:\n{headings_text}")
    
    # About section
    if extracted_data.get('about_section'):
        parts.append(f"About:\n{extracted_data['about_section']}")
    
    # Services section
    if extracted_data.get('services_section'):
        parts.append(f"Services:\n{extracted_data['services_section']}")
    
    # Paragraphs (main content)
    if extracted_data.get('paragraphs'):
        paragraphs_text = extracted_data['paragraphs'].strip()
        if paragraphs_text:
            # Only add if we don't already have about/services sections
            # or if paragraphs contain different content
            if not extracted_data.get('about_section') and not extracted_data.get('services_section'):
                parts.append(f"Content:\n{paragraphs_text}")
            elif len(paragraphs_text) > 200:  # Add substantial additional content
                parts.append(f"Additional Information:\n{paragraphs_text}")
    
    # Contact info
    if extracted_data.get('contact_info'):
        contact_text = extracted_data['contact_info'].strip()
        if contact_text and len(contact_text) > 20:
            parts.append(f"Contact:\n{contact_text}")
    
    return '\n\n'.join(parts)



def format_website_content(extracted_data: Dict[str, str]) -> str:
    """
    Format extracted website data into clean business description
    
    Args:
        extracted_data: Dictionary of extracted website data
    
    Returns:
        Formatted business description
    """
    parts = []
    
    # Title
    if extracted_data.get('title'):
        parts.append(f"Business: {extracted_data['title']}")
    
    # Meta description
    if extracted_data.get('meta_description'):
        parts.append(extracted_data['meta_description'])
    
    # Headings (important for understanding page structure)
    if extracted_data.get('headings'):
        headings_text = extracted_data['headings'].strip()
        if headings_text:
            parts.append(f"Key Topics:\n{headings_text}")
    
    # About section
    if extracted_data.get('about_section'):
        parts.append(f"About:\n{extracted_data['about_section']}")
    
    # Services section
    if extracted_data.get('services_section'):
        parts.append(f"Services:\n{extracted_data['services_section']}")
    
    # Paragraphs (main content)
    if extracted_data.get('paragraphs'):
        paragraphs_text = extracted_data['paragraphs'].strip()
        if paragraphs_text:
            # Only add if we don't already have about/services sections
            # or if paragraphs contain different content
            if not extracted_data.get('about_section') and not extracted_data.get('services_section'):
                parts.append(f"Content:\n{paragraphs_text}")
            elif len(paragraphs_text) > 200:  # Add substantial additional content
                parts.append(f"Additional Information:\n{paragraphs_text}")
    
    # Contact info
    if extracted_data.get('contact_info'):
        contact_text = extracted_data['contact_info'].strip()
        if contact_text and len(contact_text) > 20:
            parts.append(f"Contact:\n{contact_text}")
    
    return '\n\n'.join(parts)
