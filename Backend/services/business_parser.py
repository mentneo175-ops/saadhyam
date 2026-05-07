"""
Business Parser Service
Extract business-relevant information from raw text
"""

import re
from typing import Dict, List, Optional
from services.text_cleaner import clean_text


def extract_business_keywords(text: str) -> List[str]:
    """Extract business-related keywords"""
    business_keywords = [
        'service', 'product', 'customer', 'client', 'business', 'company',
        'offer', 'provide', 'specialize', 'expert', 'professional',
        'quality', 'experience', 'team', 'mission', 'vision', 'value',
        'industry', 'market', 'solution', 'deliver', 'commitment'
    ]
    
    found_keywords = []
    text_lower = text.lower()
    
    for keyword in business_keywords:
        if keyword in text_lower:
            found_keywords.append(keyword)
    
    return found_keywords


def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    """Extract contact information"""
    contact_info = {
        'email': None,
        'phone': None,
        'address': None
    }
    
    # Extract email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    if emails:
        contact_info['email'] = emails[0]
    
    # Extract phone
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    phones = re.findall(phone_pattern, text)
    if phones:
        contact_info['phone'] = ''.join(phones[0]) if isinstance(phones[0], tuple) else phones[0]
    
    return contact_info


def extract_sections(text: str) -> Dict[str, str]:
    """Extract common business sections"""
    sections = {
        'about': '',
        'services': '',
        'products': '',
        'contact': ''
    }
    
    # Split text into lines
    lines = text.split('\n')
    current_section = None
    section_content = []
    
    for line in lines:
        line_lower = line.lower().strip()
        
        # Detect section headers
        if any(keyword in line_lower for keyword in ['about us', 'about', 'who we are']):
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content)
            current_section = 'about'
            section_content = []
        elif any(keyword in line_lower for keyword in ['services', 'what we do', 'our services']):
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content)
            current_section = 'services'
            section_content = []
        elif any(keyword in line_lower for keyword in ['products', 'our products']):
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content)
            current_section = 'products'
            section_content = []
        elif any(keyword in line_lower for keyword in ['contact', 'reach us', 'get in touch']):
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content)
            current_section = 'contact'
            section_content = []
        elif current_section and line.strip():
            section_content.append(line.strip())
    
    # Save last section
    if current_section and section_content:
        sections[current_section] = '\n'.join(section_content)
    
    return sections


def parse_business_content(raw_text: str) -> str:
    """
    Parse raw content and extract business-focused text
    
    Args:
        raw_text: Raw extracted text from PDF/voice/website
    
    Returns:
        Clean business-focused description with proper formatting
    """
    if not raw_text:
        return ""
    
    # Just clean the text, don't try to extract sections
    # This preserves all the important business information
    cleaned = clean_text(raw_text)
    
    # Remove navigation and footer junk only
    lines = cleaned.split('\n')
    filtered_lines = []
    
    skip_patterns = [
        r'^(home|about|services|products|contact|menu|navigation)$',
        r'^(facebook|twitter|instagram|linkedin)$',
        r'^(©|copyright)',
        r'^(privacy|terms|cookie)',
    ]
    
    # Labels that should have colons after them
    label_patterns = [
        'Business Name', 'Owner Name', 'Business Type', 'Location', 
        'Website', 'Contact', 'Email', 'Phone', 'Address',
        'Services Offered', 'Target Customers', 'Business Goals',
        'Current Challenges', 'Competitors', 'Social Media',
        'Business Description'
    ]
    
    prev_line = None
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        line_lower = line_stripped.lower()
        should_skip = False
        
        for pattern in skip_patterns:
            if re.match(pattern, line_lower):
                should_skip = True
                break
        
        if not should_skip:
            # Check if previous line was a label and current line is the value
            if prev_line and prev_line in label_patterns:
                # Combine label and value: "Business Name: Sweet Crumbs Bakery"
                if filtered_lines:
                    filtered_lines[-1] = f"{prev_line}: {line_stripped}"
                    prev_line = None
                    continue
            
            # Check if current line is a label
            if line_stripped in label_patterns:
                prev_line = line_stripped
                filtered_lines.append(line_stripped)
            else:
                filtered_lines.append(line_stripped)
                prev_line = None
    
    return '\n'.join(filtered_lines)


def merge_business_descriptions(
    manual_text: Optional[str] = None,
    pdf_text: Optional[str] = None,
    voice_text: Optional[str] = None,
    website_text: Optional[str] = None
) -> str:
    """
    Intelligently merge business descriptions from multiple sources
    
    Args:
        manual_text: Manually entered text
        pdf_text: Text extracted from PDF
        voice_text: Text from voice transcription
        website_text: Text from website scraping
    
    Returns:
        Merged business description
    """
    parts = []
    
    # Priority: manual > voice > pdf > website
    if manual_text and manual_text.strip():
        parts.append(manual_text.strip())
    
    if voice_text and voice_text.strip():
        # Only add if not too similar to manual text
        if not manual_text or voice_text.lower() not in manual_text.lower():
            parts.append(f"Additional details: {voice_text.strip()}")
    
    if pdf_text and pdf_text.strip():
        if not any(pdf_text.lower() in part.lower() for part in parts):
            parts.append(f"From documents: {pdf_text.strip()}")
    
    if website_text and website_text.strip():
        if not any(website_text.lower() in part.lower() for part in parts):
            parts.append(f"From website: {website_text.strip()}")
    
    return '\n\n'.join(parts)
