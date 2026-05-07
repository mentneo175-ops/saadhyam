"""
PDF Service
Extract text from PDF files with OCR fallback
"""

import logging
from pathlib import Path
from typing import Optional, Tuple
import io

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> Tuple[bool, str, Optional[str]]:
    """
    Extract text from PDF file
    
    Args:
        file_path: Path to PDF file
    
    Returns:
        Tuple of (success, extracted_text, error_message)
    """
    try:
        # Try PyPDF2 first (fastest)
        try:
            import PyPDF2
            
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_parts = []
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    if text.strip():
                        text_parts.append(text)
                
                extracted_text = '\n\n'.join(text_parts)
                
                # If we got substantial text, return it
                if len(extracted_text.strip()) > 50:
                    logger.info(f"✅ Extracted {len(extracted_text)} characters using PyPDF2")
                    return True, extracted_text, None
                
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {e}")
        
        # Try pdfplumber (better for complex PDFs)
        try:
            import pdfplumber
            
            text_parts = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text and text.strip():
                        text_parts.append(text)
            
            extracted_text = '\n\n'.join(text_parts)
            
            if len(extracted_text.strip()) > 50:
                logger.info(f"✅ Extracted {len(extracted_text)} characters using pdfplumber")
                return True, extracted_text, None
                
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {e}")
        
        # Try OCR as last resort (for scanned PDFs)
        try:
            from pdf2image import convert_from_path
            import pytesseract
            from PIL import Image
            
            logger.info("🔄 Attempting OCR extraction...")
            
            # Convert PDF to images
            images = convert_from_path(file_path, dpi=300)
            
            text_parts = []
            for i, image in enumerate(images):
                # Perform OCR
                text = pytesseract.image_to_string(image, lang='eng')
                if text.strip():
                    text_parts.append(text)
                logger.info(f"✅ OCR page {i+1}/{len(images)}")
            
            extracted_text = '\n\n'.join(text_parts)
            
            if len(extracted_text.strip()) > 50:
                logger.info(f"✅ Extracted {len(extracted_text)} characters using OCR")
                return True, extracted_text, None
            
        except Exception as e:
            logger.warning(f"OCR extraction failed: {e}")
        
        # If all methods failed
        return False, "", "Unable to extract text from PDF. The file may be empty, corrupted, or image-based without OCR support."
        
    except Exception as e:
        logger.error(f"❌ PDF extraction error: {e}")
        return False, "", f"PDF extraction failed: {str(e)}"


def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str) -> Tuple[bool, str, Optional[str]]:
    """
    Extract text from PDF file bytes
    
    Args:
        file_bytes: PDF file content as bytes
        filename: Original filename
    
    Returns:
        Tuple of (success, extracted_text, error_message)
    """
    try:
        # Try PyPDF2 first
        try:
            import PyPDF2
            
            pdf_file = io.BytesIO(file_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text_parts = []
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text.strip():
                    text_parts.append(text)
            
            extracted_text = '\n\n'.join(text_parts)
            
            if len(extracted_text.strip()) > 50:
                logger.info(f"✅ Extracted {len(extracted_text)} characters from {filename}")
                return True, extracted_text, None
                
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {e}")
        
        # Try pdfplumber
        try:
            import pdfplumber
            
            pdf_file = io.BytesIO(file_bytes)
            text_parts = []
            
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text and text.strip():
                        text_parts.append(text)
            
            extracted_text = '\n\n'.join(text_parts)
            
            if len(extracted_text.strip()) > 50:
                logger.info(f"✅ Extracted {len(extracted_text)} characters from {filename}")
                return True, extracted_text, None
                
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {e}")
        
        return False, "", "Unable to extract text from PDF. Try using a text-based PDF instead of a scanned image."
        
    except Exception as e:
        logger.error(f"❌ PDF extraction error: {e}")
        return False, "", f"PDF extraction failed: {str(e)}"


def validate_pdf_file(file_bytes: bytes, max_size_mb: int = 10) -> Tuple[bool, Optional[str]]:
    """
    Validate PDF file
    
    Args:
        file_bytes: PDF file content
        max_size_mb: Maximum file size in MB
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file size
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > max_size_mb:
        return False, f"PDF file too large. Maximum size is {max_size_mb}MB"
    
    # Check if it's a valid PDF
    if not file_bytes.startswith(b'%PDF'):
        return False, "Invalid PDF file format"
    
    return True, None
