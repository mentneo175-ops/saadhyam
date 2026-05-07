"""
Business Input Routes
Handle PDF upload, voice input, and website import
"""

import logging
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session

from config.database import get_db
from models.business_profile import BusinessProfile
from models.user import User
from utils.dependencies import get_current_user
from services.business_parser import parse_business_content, merge_business_descriptions
from services.pdf_service import extract_text_from_pdf_bytes, validate_pdf_file
from services.text_cleaner import clean_text
from services.website_service import scrape_website, format_website_content

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/business", tags=["Business Input"])

# Create upload directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


# ============ Request/Response Models ============

class WebsiteImportRequest(BaseModel):
    url: str


class BusinessProfileResponse(BaseModel):
    success: bool
    business_description: Optional[str] = None
    pdf_file_url: Optional[str] = None
    audio_file_url: Optional[str] = None
    website_url: Optional[str] = None
    pdf_extracted_text: Optional[str] = None
    audio_extracted_text: Optional[str] = None
    website_extracted_text: Optional[str] = None


class UploadResponse(BaseModel):
    success: bool
    source: str
    file_url: Optional[str] = None
    website_url: Optional[str] = None
    title: Optional[str] = None
    text: str
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool
    message: str


# ============ PDF Upload ============

@router.post("/upload-pdf", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload PDF and extract business description
    """
    try:
        logger.info(f"📄 PDF upload request from user {current_user.id}")
        
        # Read file content
        file_content = await file.read()
        
        # Validate PDF
        is_valid, error = validate_pdf_file(file_content, max_size_mb=10)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"user_{current_user.id}_{timestamp}_{file.filename}"
        file_path = UPLOADS_DIR / safe_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        logger.info(f"✅ PDF saved: {file_path}")
        
        # Extract text
        success, extracted_text, error = extract_text_from_pdf_bytes(file_content, file.filename)
        
        if not success:
            # Clean up file
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail=error)
        
        # Parse and clean text
        parsed_text = parse_business_content(extracted_text)
        cleaned_text = clean_text(parsed_text, max_length=5000)
        
        # Get or create business profile
        profile = db.query(BusinessProfile).filter(
            BusinessProfile.user_id == current_user.id
        ).first()
        
        if not profile:
            profile = BusinessProfile(user_id=current_user.id)
            db.add(profile)
        
        # Update profile
        profile.pdf_file_url = f"/uploads/{safe_filename}"
        profile.pdf_extracted_text = cleaned_text
        
        # Also update user table for easy access in edit mode
        current_user.pdf_file_url = f"/uploads/{safe_filename}"
        
        # Merge with existing description
        profile.business_description = merge_business_descriptions(
            manual_text=profile.business_description,
            pdf_text=cleaned_text,
            voice_text=profile.audio_extracted_text,
            website_text=profile.website_extracted_text
        )
        
        db.commit()
        
        logger.info(f"✅ PDF processed successfully for user {current_user.id}")
        logger.info(f"📤 Returning text (first 200 chars): {cleaned_text[:200]}")
        
        return UploadResponse(
            success=True,
            source="pdf",
            file_url=f"/uploads/{safe_filename}",
            text=cleaned_text,
            message="PDF uploaded and processed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ PDF upload error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF upload failed: {str(e)}")


# ============ Website Import ============

@router.post("/import-website", response_model=UploadResponse)
async def import_website(
    request: WebsiteImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import business information from website
    """
    try:
        logger.info(f"🌐 Website import request from user {current_user.id}: {request.url}")
        
        # Import async scraper
        from services.website_service import scrape_website_async_wrapper
        
        # Scrape website (async)
        success, extracted_data, error = await scrape_website_async_wrapper(request.url)
        
        if not success:
            raise HTTPException(status_code=400, detail=error)
        
        # Format content
        formatted_content = format_website_content(extracted_data)
        
        # Parse and clean
        parsed_text = parse_business_content(formatted_content)
        cleaned_text = clean_text(parsed_text, max_length=5000)
        
        # Check if we got any meaningful content
        if not cleaned_text or len(cleaned_text.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract meaningful content from website. The site may have anti-scraping protection or no readable content. Please try a different URL or use PDF/Voice input instead."
            )
        
        # Get or create business profile
        profile = db.query(BusinessProfile).filter(
            BusinessProfile.user_id == current_user.id
        ).first()
        
        if not profile:
            profile = BusinessProfile(user_id=current_user.id)
            db.add(profile)
        
        # Update profile
        profile.website_url = request.url
        profile.website_extracted_text = cleaned_text
        
        # Also update user table for easy access in edit mode
        current_user.website_url = request.url
        
        # Merge with existing description
        profile.business_description = merge_business_descriptions(
            manual_text=profile.business_description,
            pdf_text=profile.pdf_extracted_text,
            voice_text=profile.audio_extracted_text,
            website_text=cleaned_text
        )
        
        db.commit()
        
        logger.info(f"✅ Website imported successfully for user {current_user.id}")
        logger.info(f"📤 Returning text length: {len(cleaned_text)} chars")
        logger.info(f"📤 Returning text (first 200 chars): {cleaned_text[:200]}")
        
        return UploadResponse(
            success=True,
            source="website",
            website_url=request.url,
            title=extracted_data.get('title', ''),
            text=cleaned_text,
            message="Website imported successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Website import error: {e}")
        raise HTTPException(status_code=500, detail=f"Website import failed: {str(e)}")


# ============ Get Business Profile ============

@router.get("/profile", response_model=BusinessProfileResponse)
async def get_business_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's business profile with all inputs
    """
    try:
        profile = db.query(BusinessProfile).filter(
            BusinessProfile.user_id == current_user.id
        ).first()
        
        if not profile:
            return BusinessProfileResponse(
                success=True,
                business_description=None
            )
        
        return BusinessProfileResponse(
            success=True,
            business_description=profile.business_description,
            pdf_file_url=profile.pdf_file_url,
            audio_file_url=profile.audio_file_url,
            website_url=profile.website_url,
            pdf_extracted_text=profile.pdf_extracted_text,
            audio_extracted_text=profile.audio_extracted_text,
            website_extracted_text=profile.website_extracted_text
        )
        
    except Exception as e:
        logger.error(f"❌ Get profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")


# ============ Update Business Profile ============

@router.put("/profile")
async def update_business_profile(
    business_description: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update business description manually
    """
    try:
        profile = db.query(BusinessProfile).filter(
            BusinessProfile.user_id == current_user.id
        ).first()
        
        if not profile:
            profile = BusinessProfile(user_id=current_user.id)
            db.add(profile)
        
        profile.business_description = business_description
        db.commit()
        
        return {"success": True, "message": "Business profile updated"}
        
    except Exception as e:
        logger.error(f"❌ Update profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


# ============ Delete File ============

@router.delete("/profile/file")
async def delete_profile_file(
    file_type: str = Form(...),  # 'pdf' only
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete uploaded file (PDF only)
    """
    try:
        profile = db.query(BusinessProfile).filter(
            BusinessProfile.user_id == current_user.id
        ).first()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        if file_type == "pdf":
            if profile.pdf_file_url:
                # Delete file
                file_path = BASE_DIR / profile.pdf_file_url.lstrip('/')
                if file_path.exists():
                    file_path.unlink()
                
                # Clear database fields
                profile.pdf_file_url = None
                profile.pdf_extracted_text = None
        else:
            raise HTTPException(status_code=400, detail="Invalid file_type. Use 'pdf'")
        
        # Recompute merged description
        profile.business_description = merge_business_descriptions(
            manual_text=profile.business_description,
            pdf_text=profile.pdf_extracted_text,
            voice_text=profile.audio_extracted_text,
            website_text=profile.website_extracted_text
        )
        
        db.commit()
        
        return {"success": True, "message": f"{file_type.upper()} file deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Delete file error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
