"""
Public API Routes - No authentication required
Handles waitlist, contact forms, and other public endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import logging

router = APIRouter(prefix="/api/public", tags=["public"])
logger = logging.getLogger(__name__)


class WaitlistEntry(BaseModel):
    name: str
    email: EmailStr
    phone: str
    business_type: str
    goals: str


class ContactForm(BaseModel):
    name: str
    email: EmailStr
    message: str
    phone: Optional[str] = None


# In-memory storage for waitlist (replace with database in production)
waitlist_entries = []


@router.post("/waitlist")
async def submit_waitlist(entry: WaitlistEntry):
    """
    Submit waitlist entry - No authentication required
    Stores lead information for early access program
    """
    try:
        # Add timestamp
        entry_data = entry.dict()
        entry_data["timestamp"] = datetime.utcnow().isoformat()
        entry_data["status"] = "pending"
        
        # Store in memory (in production, save to database)
        waitlist_entries.append(entry_data)
        
        logger.info(f"✅ Waitlist entry received: {entry.email}")
        logger.info(f"📊 Total waitlist entries: {len(waitlist_entries)}")
        
        # TODO: Send welcome email via Resend API
        # TODO: Notify admin via email/Slack
        # TODO: Store in database
        
        return {
            "success": True,
            "message": "Thank you for joining our waitlist! We'll be in touch soon.",
            "data": {
                "email": entry.email,
                "timestamp": entry_data["timestamp"]
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Waitlist submission error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process waitlist entry: {str(e)}")


@router.post("/contact")
async def submit_contact(form: ContactForm):
    """
    Submit contact form - No authentication required
    """
    try:
        contact_data = form.dict()
        contact_data["timestamp"] = datetime.utcnow().isoformat()
        
        logger.info(f"✅ Contact form received from: {form.email}")
        
        # TODO: Send email notification
        # TODO: Store in database
        
        return {
            "success": True,
            "message": "Thank you for contacting us! We'll respond within 24 hours.",
            "data": {
                "email": form.email,
                "timestamp": contact_data["timestamp"]
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Contact form error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process contact form: {str(e)}")


@router.get("/waitlist/count")
async def get_waitlist_count():
    """Get total waitlist count - No authentication required"""
    return {
        "count": len(waitlist_entries),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health")
async def public_health():
    """Public health check endpoint"""
    return {
        "status": "healthy",
        "service": "Saadhyam AI Public API",
        "timestamp": datetime.utcnow().isoformat()
    }


import os
from fastapi import Request

@router.get("/cors-info")
async def get_cors_info(request: Request):
    cors_middleware = None
    # Check both request.app.user_middleware and compiled middleware list
    middleware_details = {}
    
    for middleware in request.app.user_middleware:
        if "CORSMiddleware" in str(middleware.cls):
            middleware_details["user_middleware"] = {
                "allow_origins": middleware.options.get("allow_origins"),
                "allow_origin_regex": middleware.options.get("allow_origin_regex"),
            }
            break
            
    # Also attempt to read from active middleware stack if compiled
    try:
        for route in request.app.routes:
            pass # just referencing request.app
    except Exception:
        pass
        
    return {
        "middleware_details": middleware_details,
        "environment": os.getenv("ENVIRONMENT"),
        "allowed_origins_env": os.getenv("ALLOWED_ORIGINS")
    }

