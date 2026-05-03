"""
Business Intelligence API endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Literal, Dict, Any
from utils.dependencies import get_current_user
from models.user import User
from services.business_intelligence import get_bi_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/business-intelligence", tags=["Business Intelligence"])


class BusinessAnalysisRequest(BaseModel):
    """Business analysis request"""
    input_type: Literal["text", "url", "pdf", "audio"] = Field(
        default="text",
        description="Type of input data"
    )
    data: str = Field(
        ...,
        description="Business description or data source"
    )


class BusinessAnalysisResponse(BaseModel):
    """Business analysis response"""
    status: str
    data: Dict[str, Any]


@router.post(
    "/analyze",
    response_model=BusinessAnalysisResponse,
    summary="Analyze business and get insights",
    responses={
        200: {"description": "Analysis successful"},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"},
        500: {"description": "Analysis failed"},
    },
)
async def analyze_business(
    request: BusinessAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Analyze business and return AI-powered insights.
    
    Supports multiple input types:
    - text: Direct business description
    - url: Website URL (future)
    - pdf: PDF document (future)
    - audio: Audio file (future)
    
    Returns:
    - Business health score
    - AI visibility metrics
    - Lead conversion rates
    - Content activity
    - Growth journey
    - Recommended actions
    """
    try:
        logger.info(f"📊 Analyzing business for user {current_user.id}")
        logger.info(f"   Input type: {request.input_type}")
        logger.info(f"   Data length: {len(request.data)} chars")
        
        # Validate input
        if not request.data or len(request.data.strip()) < 10:
            logger.warning("❌ Business description too short")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Business description must be at least 10 characters"
            )
        
        if len(request.data) > 5000:
            logger.warning("❌ Business description too long")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Business description must be less than 5000 characters"
            )
        
        # Process input based on type
        logger.info(f"🔄 Processing {request.input_type} input...")
        business_text = await _process_input(request.input_type, request.data)
        
        if not business_text:
            logger.error("❌ Failed to process input")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process input data"
            )
        
        # Get BI engine
        logger.info("🤖 Getting BI engine...")
        bi_engine = get_bi_engine()
        
        # Analyze
        logger.info("🔍 Running analysis...")
        analysis_result = bi_engine.analyze(business_text)
        
        if not analysis_result:
            logger.error("❌ Analysis failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Analysis failed"
            )
        
        logger.info("✅ Analysis complete")
        
        return BusinessAnalysisResponse(
            status="success",
            data=analysis_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error analyzing business: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze business"
        )


async def _process_input(input_type: str, data: str) -> str:
    """
    Process input based on type
    
    Args:
        input_type: Type of input
        data: Input data
        
    Returns:
        Processed text
    """
    try:
        if input_type == "text":
            logger.info("📝 Processing text input")
            return data
        
        elif input_type == "url":
            logger.info("🌐 Processing URL input")
            try:
                import requests
                from bs4 import BeautifulSoup
                
                response = requests.get(data, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Extract text from paragraphs and headings
                text_elements = soup.find_all(["p", "h1", "h2", "h3"])
                text = " ".join([elem.get_text() for elem in text_elements])
                
                logger.info(f"✅ Extracted {len(text)} chars from URL")
                return text if text else data
                
            except Exception as e:
                logger.error(f"❌ Failed to process URL: {e}")
                return data
        
        elif input_type == "pdf":
            logger.info("📄 Processing PDF input")
            try:
                from PyPDF2 import PdfReader
                
                reader = PdfReader(data)
                text = ""
                
                for page_num, page in enumerate(reader.pages):
                    text += page.extract_text()
                    logger.info(f"   Extracted page {page_num + 1}")
                
                logger.info(f"✅ Extracted {len(text)} chars from PDF")
                return text if text else data
                
            except Exception as e:
                logger.error(f"❌ Failed to process PDF: {e}")
                return data
        
        elif input_type == "audio":
            logger.info("🎙️ Processing audio input")
            try:
                import whisper
                
                logger.info("   Loading Whisper model...")
                model = whisper.load_model("base")
                
                logger.info("   Transcribing audio...")
                result = model.transcribe(data)
                
                text = result.get("text", "")
                logger.info(f"✅ Transcribed {len(text)} chars from audio")
                return text if text else data
                
            except Exception as e:
                logger.error(f"❌ Failed to process audio: {e}")
                return data
        
        else:
            logger.warning(f"⚠️ Unknown input type: {input_type}")
            return data
            
    except Exception as e:
        logger.error(f"❌ Error processing input: {e}")
        return data


@router.get(
    "/health",
    summary="Check BI engine health",
    responses={
        200: {"description": "Engine is healthy"},
    },
)
async def bi_health(current_user: User = Depends(get_current_user)):
    """Check if Business Intelligence engine is running"""
    try:
        bi_engine = get_bi_engine()
        
        is_ready = bi_engine.model is not None and bi_engine.tokenizer is not None
        
        return {
            "status": "healthy" if is_ready else "initializing",
            "model_loaded": is_ready,
            "device": bi_engine.device
        }
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return {
            "status": "error",
            "model_loaded": False,
            "error": str(e)
        }
