"""
Customer Retention API Routes
AI-powered customer analysis and retention strategies
Enhanced with bulk campaigns, analytics, and campaign history
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import List
import sys
import os
import tempfile

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.customer_retention_service import CustomerRetentionService
from services.retention_email_service import RetentionEmailService

router = APIRouter(prefix="/api/customer-retention", tags=["Customer Retention"])


class SendEmailRequest(BaseModel):
    """Request model for sending retention email"""
    customer_name: str
    customer_email: EmailStr
    inactive_days: int
    visit_count: int
    total_spent: float


class BulkCampaignRequest(BaseModel):
    """Request model for bulk campaign"""
    customers: List[dict]


@router.post("/analyze")
async def analyze_customers(file: UploadFile = File(...)):
    """
    Analyze customer CSV and generate retention insights
    """
    try:
        # Validate file type
        if not file.filename.endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are supported"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Analyze customer data
            analysis = CustomerRetentionService.analyze_csv(temp_file_path)
            
            return JSONResponse(content=analysis)
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing customer data: {str(e)}"
        )


@router.post("/send-email")
async def send_retention_email(request: SendEmailRequest):
    """
    Send AI-generated retention email to inactive customer
    """
    try:
        # Validate inactive days
        if request.inactive_days < 30:
            raise HTTPException(
                status_code=400,
                detail="Customer must be inactive for at least 30 days"
            )
        
        # Initialize email service
        email_service = RetentionEmailService()
        
        # Send email
        result = await email_service.send_retention_email(
            customer_name=request.customer_name,
            customer_email=request.customer_email,
            inactive_days=request.inactive_days,
            visit_count=request.visit_count,
            total_spent=request.total_spent
        )
        
        if result["success"]:
            return JSONResponse(content={
                "success": True,
                "message": result["message"],
                "email_id": result.get("email_id"),
                "offer": result.get("offer")
            })
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to send email")
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending retention email: {str(e)}"
        )


@router.post("/send-bulk-campaign")
async def send_bulk_campaign(request: BulkCampaignRequest):
    """
    Send retention emails to multiple inactive customers
    """
    try:
        # Validate customers
        if not request.customers:
            raise HTTPException(
                status_code=400,
                detail="No customers provided"
            )
        
        # Filter inactive customers (30+ days)
        inactive_customers = [
            c for c in request.customers
            if c.get("inactive_days", 0) >= 30
        ]
        
        if not inactive_customers:
            raise HTTPException(
                status_code=400,
                detail="No inactive customers found (30+ days required)"
            )
        
        # Initialize email service
        email_service = RetentionEmailService()
        
        # Send bulk campaign
        results = await email_service.send_bulk_campaign(inactive_customers)
        
        return JSONResponse(content={
            "success": True,
            "total": results["total"],
            "sent": results["sent"],
            "failed": results["failed"],
            "completion_percentage": round((results["sent"] / results["total"]) * 100, 2) if results["total"] > 0 else 0,
            "errors": results["errors"],
            "details": results["details"]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending bulk campaign: {str(e)}"
        )


@router.get("/campaign-history")
async def get_campaign_history(limit: int = 50):
    """
    Get campaign history
    """
    try:
        email_service = RetentionEmailService()
        history = email_service.get_campaign_history(limit=limit)
        
        return JSONResponse(content={
            "success": True,
            "campaigns": history
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching campaign history: {str(e)}"
        )


@router.get("/analytics")
async def get_analytics():
    """
    Get campaign analytics
    """
    try:
        email_service = RetentionEmailService()
        analytics = email_service.get_analytics()
        
        return JSONResponse(content={
            "success": True,
            "analytics": analytics
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching analytics: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Customer Retention Agent",
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "resend_configured": bool(os.getenv("RESEND_API_KEY"))
    }
