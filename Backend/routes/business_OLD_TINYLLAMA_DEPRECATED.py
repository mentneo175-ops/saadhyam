"""
Business Analysis Routes
API endpoints for analyzing businesses and providing insights
Calls separate business_model.py server on port 9001
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from config.database import get_db_sync
from utils.dependencies import get_current_user
from models.user import User
import httpx

logger = logging.getLogger(__name__)

# Business model server configuration
BUSINESS_MODEL_SERVER_URL = "http://localhost:9001"
BUSINESS_MODEL_TIMEOUT = 600  # 10 minutes timeout (CPU mode is slow)

router = APIRouter(
    prefix="/api/business",
    tags=["Business Analysis"]
)


# ============ Pydantic Models ============

class AnalyzeBusinessRequest(BaseModel):
    """Request model for business analysis"""
    description: str = Field(
        ...,
        min_length=20,
        max_length=2000,
        description="Business description to analyze"
    )
    
    class Config:
        example = {
            "description": "We are a restaurant in downtown area serving Italian cuisine. We have 50 seats, open 6 days a week. We have Instagram and Facebook but post irregularly. We get about 30 customers per day."
        }


class AnalyzeBusinessResponse(BaseModel):
    """Response model for business analysis"""
    success: bool
    business_score: int = Field(..., ge=1, le=10, description="Overall business health (1-10)")
    ai_visibility_score: int = Field(..., ge=0, le=100, description="AI/Online visibility percentage")
    conversion_score: int = Field(..., ge=0, le=100, description="Lead conversion potential")
    strengths: List[str] = Field(..., description="Key business strengths")
    weaknesses: List[str] = Field(..., description="Key business weaknesses")
    opportunities: List[str] = Field(..., description="Growth opportunities")
    threats: List[str] = Field(..., description="Potential threats")
    recommendations: List[str] = Field(..., description="Actionable recommendations")
    error: Optional[str] = None
    
    class Config:
        example = {
            "success": True,
            "business_score": 7,
            "ai_visibility_score": 45,
            "conversion_score": 60,
            "strengths": [
                "Good location in downtown",
                "Consistent customer base",
                "Established brand"
            ],
            "weaknesses": [
                "Irregular social media presence",
                "Limited online visibility",
                "No online ordering system"
            ],
            "opportunities": [
                "Launch online ordering platform",
                "Increase social media engagement",
                "Partner with delivery services"
            ],
            "threats": [
                "New competitors opening nearby",
                "Changing customer preferences",
                "Rising food costs"
            ],
            "recommendations": [
                "Post on social media 3x per week",
                "Implement online ordering",
                "Run targeted local ads",
                "Create loyalty program",
                "Optimize Google Business profile",
                "Engage with customer reviews"
            ],
            "error": None
        }


class BatchAnalysisRequest(BaseModel):
    """Request model for batch analysis"""
    descriptions: List[str] = Field(
        ...,
        min_items=1,
        max_items=10,
        description="List of business descriptions to analyze"
    )


class BatchAnalysisResponse(BaseModel):
    """Response model for batch analysis"""
    success: bool
    count: int
    results: List[AnalyzeBusinessResponse]
    error: Optional[str] = None


class BusinessAnalysisHistoryResponse(BaseModel):
    """Response model for business analysis history"""
    id: int
    description: str
    business_score: int
    ai_visibility_score: int
    conversion_score: int
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]
    recommendations: List[str]
    created_at: str
    
    class Config:
        from_attributes = True


# ============ Routes ============

@router.post(
    "/analyze",
    response_model=AnalyzeBusinessResponse,
    summary="Analyze a business",
    responses={
        200: {"description": "Analysis completed successfully"},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"},
        503: {"description": "Model server unavailable"}
    }
)
async def analyze_business_endpoint(
    request: AnalyzeBusinessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> AnalyzeBusinessResponse:
    """
    Analyze a business description and provide insights
    Calls business_model.py server on port 9001
    
    Returns:
    - **business_score**: Overall business health (1-10)
    - **ai_visibility_score**: Online visibility percentage (0-100)
    - **conversion_score**: Lead conversion potential (0-100)
    - **strengths**: Key business strengths
    - **weaknesses**: Key business weaknesses
    - **opportunities**: Growth opportunities
    - **threats**: Potential threats
    - **recommendations**: Actionable recommendations
    """
    
    try:
        logger.info(f"📊 Analyzing business...")
        logger.info(f"   Description length: {len(request.description)} characters")
        
        # Validate input
        if not request.description or not request.description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Business description cannot be empty"
            )
        
        # Call business model server on port 9001
        logger.info(f"🔄 Calling business model server at {BUSINESS_MODEL_SERVER_URL}/analyze")
        try:
            async with httpx.AsyncClient(timeout=BUSINESS_MODEL_TIMEOUT) as client:
                response = await client.post(
                    f"{BUSINESS_MODEL_SERVER_URL}/analyze",
                    json={"description": request.description}
                )
                
                if response.status_code != 200:
                    logger.error(f"❌ Business model server error ({response.status_code})")
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Business analysis model server is not available. Ensure business_model.py is running on port 9001."
                    )
                
                result = response.json()
                
                logger.info(f"✅ Analysis completed")
                logger.info(f"   Business Score: {result.get('business_score')}")
                logger.info(f"   AI Visibility: {result.get('ai_visibility_score')}%")
                logger.info(f"   Conversion Score: {result.get('conversion_score')}%")
                
                # Store analysis in database
                try:
                    from db.models import BusinessAnalysis
                    from datetime import datetime
                    
                    analysis_record = BusinessAnalysis(
                        user_id=current_user.id,  # Associate with current user
                        description=request.description,
                        business_score=result.get('business_score'),
                        ai_visibility_score=result.get('ai_visibility_score'),
                        conversion_score=result.get('conversion_score'),
                        strengths=','.join(result.get('strengths', [])),
                        weaknesses=','.join(result.get('weaknesses', [])),
                        opportunities=','.join(result.get('opportunities', [])),
                        threats=','.join(result.get('threats', [])),
                        recommendations=','.join(result.get('recommendations', [])),
                        created_at=datetime.utcnow()
                    )
                    
                    db.add(analysis_record)
                    db.commit()
                    logger.info(f"💾 Analysis stored in database with ID: {analysis_record.id} for user: {current_user.email}")
                except Exception as e:
                    logger.warning(f"⚠️  Could not store analysis in database: {e}")
                
                return AnalyzeBusinessResponse(
                    success=result.get('success', True),
                    error=result.get('error'),
                    **{k: v for k, v in result.items() if k not in ['success', 'error']}
                )
                
        except httpx.ConnectError:
            logger.error(f"❌ Cannot connect to business model server at {BUSINESS_MODEL_SERVER_URL}")
            logger.error("   Make sure to run: python business_model.py on port 9001")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Business analysis model server is not running. Please start business_model.py on port 9001."
            )
        except httpx.TimeoutException:
            logger.error(f"❌ Business model server request timeout after {BUSINESS_MODEL_TIMEOUT} seconds")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Model server request timed out. Please try again."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error analyzing business: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze business"
        )


@router.post(
    "/analyze-batch",
    response_model=BatchAnalysisResponse,
    summary="Analyze multiple businesses",
    responses={
        200: {"description": "Batch analysis completed"},
        400: {"description": "Invalid request"},
        401: {"description": "Not authenticated"},
        503: {"description": "Model server unavailable"}
    }
)
async def analyze_batch_endpoint(
    request: BatchAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> BatchAnalysisResponse:
    """
    Analyze multiple business descriptions in batch
    Calls business_model.py server on port 9001
    
    Args:
        descriptions: List of business descriptions (max 10)
    
    Returns:
        List of analysis results
    """
    
    try:
        logger.info(f"📊 Batch analyzing {len(request.descriptions)} businesses...")
        
        # Validate input
        if not request.descriptions or len(request.descriptions) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one description required"
            )
        
        if len(request.descriptions) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 descriptions per batch"
            )
        
        # Analyze each business
        results = []
        for i, description in enumerate(request.descriptions, 1):
            logger.info(f"Processing business {i}/{len(request.descriptions)}")
            
            try:
                # Call business model server
                async with httpx.AsyncClient(timeout=BUSINESS_MODEL_TIMEOUT) as client:
                    response = await client.post(
                        f"{BUSINESS_MODEL_SERVER_URL}/analyze",
                        json={"description": description}
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        # Store in database
                        try:
                            from db.models import BusinessAnalysis
                            from datetime import datetime
                            
                            analysis_record = BusinessAnalysis(
                                user_id=current_user.id,  # Associate with current user
                                description=description,
                                business_score=result.get('business_score'),
                                ai_visibility_score=result.get('ai_visibility_score'),
                                conversion_score=result.get('conversion_score'),
                                strengths=','.join(result.get('strengths', [])),
                                weaknesses=','.join(result.get('weaknesses', [])),
                                opportunities=','.join(result.get('opportunities', [])),
                                threats=','.join(result.get('threats', [])),
                                recommendations=','.join(result.get('recommendations', [])),
                                created_at=datetime.utcnow()
                            )
                            
                            db.add(analysis_record)
                            db.commit()
                        except Exception as e:
                            logger.warning(f"⚠️  Could not store analysis in database: {e}")
                        
                        results.append(AnalyzeBusinessResponse(
                            success=result.get('success', True),
                            error=result.get('error'),
                            **{k: v for k, v in result.items() if k not in ['success', 'error']}
                        ))
                    else:
                        results.append(AnalyzeBusinessResponse(
                            success=False,
                            error="Model server error",
                            business_score=5,
                            ai_visibility_score=50,
                            conversion_score=50,
                            strengths=["Basic presence"],
                            weaknesses=["Low engagement"],
                            opportunities=["Marketing growth"],
                            threats=["Competition"],
                            recommendations=["Run ads"]
                        ))
                        
            except Exception as e:
                logger.warning(f"Error analyzing business {i}: {e}")
                results.append(AnalyzeBusinessResponse(
                    success=False,
                    error=str(e),
                    business_score=5,
                    ai_visibility_score=50,
                    conversion_score=50,
                    strengths=["Basic presence"],
                    weaknesses=["Low engagement"],
                    opportunities=["Marketing growth"],
                    threats=["Competition"],
                    recommendations=["Run ads"]
                ))
        
        logger.info(f"✅ Batch analysis complete")
        
        return BatchAnalysisResponse(
            success=True,
            count=len(results),
            results=results,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in batch analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Batch analysis failed"
        )


@router.get(
    "/history",
    response_model=List[BusinessAnalysisHistoryResponse],
    summary="Get user's business analysis history",
    responses={
        200: {"description": "Analysis history retrieved successfully"},
        401: {"description": "Not authenticated"}
    }
)
async def get_business_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
    limit: int = 10
) -> List[BusinessAnalysisHistoryResponse]:
    """
    Get the current user's business analysis history
    
    Args:
        limit: Maximum number of records to return (default: 10)
    
    Returns:
        List of business analysis records for the current user
    """
    
    try:
        logger.info(f"📊 Getting business analysis history for user: {current_user.email}")
        
        from db.models import BusinessAnalysis
        
        # Query user's analysis history
        analyses = db.query(BusinessAnalysis)\
            .filter(BusinessAnalysis.user_id == current_user.id)\
            .order_by(BusinessAnalysis.created_at.desc())\
            .limit(limit)\
            .all()
        
        logger.info(f"✅ Found {len(analyses)} analysis records for user: {current_user.email}")
        
        # Convert to response format
        results = []
        for analysis in analyses:
            results.append(BusinessAnalysisHistoryResponse(
                id=analysis.id,
                description=analysis.description,
                business_score=analysis.business_score,
                ai_visibility_score=analysis.ai_visibility_score,
                conversion_score=analysis.conversion_score,
                strengths=analysis.strengths.split(',') if analysis.strengths else [],
                weaknesses=analysis.weaknesses.split(',') if analysis.weaknesses else [],
                opportunities=analysis.opportunities.split(',') if analysis.opportunities else [],
                threats=analysis.threats.split(',') if analysis.threats else [],
                recommendations=analysis.recommendations.split(',') if analysis.recommendations else [],
                created_at=analysis.created_at.isoformat() if analysis.created_at else ""
            ))
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Error getting business analysis history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analysis history"
        )


@router.get(
    "/latest",
    response_model=Optional[BusinessAnalysisHistoryResponse],
    summary="Get user's latest business analysis",
    responses={
        200: {"description": "Latest analysis retrieved successfully"},
        401: {"description": "Not authenticated"},
        404: {"description": "No analysis found"}
    }
)
async def get_latest_business_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> Optional[BusinessAnalysisHistoryResponse]:
    """
    Get the current user's most recent business analysis
    
    Returns:
        Latest business analysis record for the current user, or None if no analysis exists
    """
    
    try:
        logger.info(f"📊 Getting latest business analysis for user: {current_user.email}")
        
        from db.models import BusinessAnalysis
        
        # Query user's latest analysis
        analysis = db.query(BusinessAnalysis)\
            .filter(BusinessAnalysis.user_id == current_user.id)\
            .order_by(BusinessAnalysis.created_at.desc())\
            .first()
        
        if not analysis:
            logger.info(f"📭 No analysis found for user: {current_user.email}")
            return None
        
        logger.info(f"✅ Found latest analysis (ID: {analysis.id}) for user: {current_user.email}")
        
        # Convert to response format
        return BusinessAnalysisHistoryResponse(
            id=analysis.id,
            description=analysis.description,
            business_score=analysis.business_score,
            ai_visibility_score=analysis.ai_visibility_score,
            conversion_score=analysis.conversion_score,
            strengths=analysis.strengths.split(',') if analysis.strengths else [],
            weaknesses=analysis.weaknesses.split(',') if analysis.weaknesses else [],
            opportunities=analysis.opportunities.split(',') if analysis.opportunities else [],
            threats=analysis.threats.split(',') if analysis.threats else [],
            recommendations=analysis.recommendations.split(',') if analysis.recommendations else [],
            created_at=analysis.created_at.isoformat() if analysis.created_at else ""
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting latest business analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve latest analysis"
        )


@router.get(
    "/health",
    summary="Health check for business analysis service"
)
async def health_check():
    """Check if business analysis service is healthy"""
    
    return {
        "status": "healthy",
        "service": "Business Analysis AI",
        "version": "1.0.0"
    }
