"""
Schema Markup Generator Service
Generates JSON-LD schema markup for AEO content
"""

import logging
import json
from typing import Dict, Any, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.aeo_geo_models import SchemaMarkup, AEOContent
from models.user import User
from db.models import BusinessAnalysis
from datetime import datetime

logger = logging.getLogger(__name__)


async def generate_faq_schema(
    user: User,
    content_id: int,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Generate FAQ schema for AEO content
    
    Args:
        user: User object
        content_id: Content ID
        db: Database session
    
    Returns:
        Dict with schema markup
    """
    
    try:
        # Get content
        content_stmt = (
            select(AEOContent)
            .where(
                AEOContent.id == content_id,
                AEOContent.user_id == user.id
            )
            .limit(1)
        )
        content_result = await db.execute(content_stmt)
        content = content_result.scalars().first()
        
        if not content:
            return {
                "status": "error",
                "message": "Content not found"
            }
        
        # Generate FAQ schema
        schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": content.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": content.direct_answer
                    }
                }
            ]
        }
        
        # Store schema in database
        new_schema = SchemaMarkup(
            user_id=user.id,
            content_id=content_id,
            schema_type="FAQ",
            schema_json=schema,
            is_valid=True
        )
        
        db.add(new_schema)
        await db.commit()
        await db.refresh(new_schema)
        
        logger.info(f"[SchemaGenerator] ✅ FAQ schema generated (ID: {new_schema.id})")
        
        return {
            "status": "success",
            "schema_id": new_schema.id,
            "schema": schema
        }
        
    except Exception as e:
        logger.error(f"[SchemaGenerator] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to generate FAQ schema: {str(e)}"
        }


async def generate_local_business_schema(
    user: User,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Generate LocalBusiness schema
    
    Args:
        user: User object
        db: Database session
    
    Returns:
        Dict with schema markup
    """
    
    try:
        # Get business analysis
        analysis_stmt = (
            select(BusinessAnalysis)
            .where(
                BusinessAnalysis.user_id == user.id,
                BusinessAnalysis.analysis_status == 'completed'
            )
            .order_by(BusinessAnalysis.last_analyzed_at.desc())
            .limit(1)
        )
        analysis_result = await db.execute(analysis_stmt)
        analysis = analysis_result.scalars().first()
        
        if not analysis:
            return {
                "status": "error",
                "message": "No business analysis found"
            }
        
        business_name = analysis.business_name or user.business_name or "Business"
        business_type = analysis.business_type or user.business_type or "LocalBusiness"
        location = analysis.location or user.business_location or "Location"
        
        # Generate LocalBusiness schema
        schema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": business_name,
            "description": analysis.business_summary or f"{business_name} - {business_type} in {location}",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": location
            },
            "priceRange": "$$"
        }
        
        # Store schema in database
        new_schema = SchemaMarkup(
            user_id=user.id,
            schema_type="LocalBusiness",
            schema_json=schema,
            is_valid=True
        )
        
        db.add(new_schema)
        await db.commit()
        await db.refresh(new_schema)
        
        logger.info(f"[SchemaGenerator] ✅ LocalBusiness schema generated (ID: {new_schema.id})")
        
        return {
            "status": "success",
            "schema_id": new_schema.id,
            "schema": schema
        }
        
    except Exception as e:
        logger.error(f"[SchemaGenerator] ❌ Error: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to generate LocalBusiness schema: {str(e)}"
        }


async def get_all_schemas(
    user: User,
    db: AsyncSession
) -> List[Dict[str, Any]]:
    """Get all schema markups for user"""
    
    try:
        schemas_stmt = (
            select(SchemaMarkup)
            .where(
                SchemaMarkup.user_id == user.id,
                SchemaMarkup.is_active == True
            )
            .order_by(SchemaMarkup.created_at.desc())
        )
        schemas_result = await db.execute(schemas_stmt)
        schemas = schemas_result.scalars().all()
        
        return [
            {
                "id": s.id,
                "schema_type": s.schema_type,
                "schema_json": s.schema_json,
                "is_valid": s.is_valid,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in schemas
        ]
        
    except Exception as e:
        logger.error(f"[SchemaGenerator] ❌ Error getting schemas: {e}", exc_info=True)
        return []
