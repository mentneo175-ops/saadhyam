"""
Text Cleaner Service
Clean and normalize extracted text from various sources
"""

import re
from typing import Optional


def remove_html_tags(text: str) -> str:
    """Remove HTML tags from text"""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)


def normalize_whitespace(text: str) -> str:
    """Normalize whitespace - remove extra spaces, but preserve line breaks"""
    # Replace multiple spaces with single space (but not newlines)
    lines = text.split('\n')
    normalized_lines = []
    
    for line in lines:
        # Remove extra spaces within each line
        line = re.sub(r' +', ' ', line)
        # Strip leading/trailing whitespace from each line
        line = line.strip()
        normalized_lines.append(line)
    
    # Join lines back together
    text = '\n'.join(normalized_lines)
    
    # Replace multiple consecutive newlines with double newline (paragraph break)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    return text.strip()


def remove_duplicates(text: str) -> str:
    """Remove duplicate consecutive lines"""
    lines = text.split('\n')
    unique_lines = []
    prev_line = None
    
    for line in lines:
        line = line.strip()
        if line and line != prev_line:
            unique_lines.append(line)
            prev_line = line
        elif not line:
            unique_lines.append('')
            prev_line = None
    
    return '\n'.join(unique_lines)


def limit_length(text: str, max_length: int = 5000) -> str:
    """Limit text length"""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."


def remove_common_junk(text: str) -> str:
    """Remove common junk text patterns"""
    junk_patterns = [
        r'cookie\s+policy',
        r'privacy\s+policy',
        r'terms\s+(of\s+service|and\s+conditions)',
        r'all\s+rights\s+reserved',
        r'copyright\s+©',
        r'skip\s+to\s+(content|main)',
        r'accept\s+cookies',
        r'we\s+use\s+cookies',
        r'subscribe\s+to\s+(our\s+)?newsletter',
        r'follow\s+us\s+on',
        r'share\s+on\s+social',
    ]
    
    for pattern in junk_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text


def clean_text(
    text: str,
    remove_html: bool = True,
    normalize_ws: bool = True,
    remove_dup: bool = True,
    remove_junk: bool = True,
    max_length: Optional[int] = 5000
) -> str:
    """
    Clean text with multiple cleaning operations
    
    Args:
        text: Input text to clean
        remove_html: Remove HTML tags
        normalize_ws: Normalize whitespace
        remove_dup: Remove duplicate lines
        remove_junk: Remove common junk patterns
        max_length: Maximum text length (None for no limit)
    
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Apply cleaning operations
    if remove_html:
        text = remove_html_tags(text)
    
    if remove_junk:
        text = remove_common_junk(text)
    
    if normalize_ws:
        text = normalize_whitespace(text)
    
    if remove_dup:
        text = remove_duplicates(text)
    
    if max_length:
        text = limit_length(text, max_length)
    
    return text.strip()
