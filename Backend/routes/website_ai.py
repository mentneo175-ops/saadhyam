"""
Website AI Routes
API endpoints for AI-powered website generation and content creation
"""

import logging
import os
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from config.database import get_db_sync
from utils.dependencies import get_current_user
from models.user import User
from utils.feature_gate import check_feature_access
from templates.website_templates import get_template_by_theme

logger = logging.getLogger(__name__)

# Get API URL from environment or use default
API_URL = os.getenv("API_URL", "http://localhost:8000")

router = APIRouter(
    prefix="/website-ai/api",
    tags=["Website AI"]
)


# ============ Pydantic Models ============

class WebsiteGenerationRequest(BaseModel):
    """Request model for website generation"""
    business_name: str = Field(..., min_length=1, max_length=255)
    business_type: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)  # Match frontend field name
    target_audience: Optional[str] = Field(None, max_length=500)
    services: Optional[List[str]] = Field(default_factory=list)  # Match frontend field name
    brand_colors: Optional[Dict[str, str]] = Field(default_factory=dict)
    
    # Additional fields from frontend
    tone: Optional[str] = Field(None, max_length=100)
    branding_style: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    website_url: Optional[str] = Field(None, max_length=500)
    
    class Config:
        example = {
            "business_name": "The Italian Kitchen",
            "business_type": "Restaurant",
            "description": "A cozy Italian restaurant serving authentic cuisine with fresh ingredients",
            "target_audience": "Food lovers and families looking for authentic Italian dining",
            "services": ["Dine-in", "Takeout", "Catering"],
            "tone": "warm and welcoming",
            "branding_style": "rustic and authentic",
            "contact_email": "info@italiankitchen.com",
            "contact_phone": "+1-555-0123",
            "brand_colors": {"primary": "#8B4513", "secondary": "#228B22"}
        }


class WebsiteSection(BaseModel):
    """Website section model"""
    section_type: str
    title: str
    content: str
    order: int


class WebsiteGenerationResponse(BaseModel):
    """Response model for website generation"""
    success: bool
    website_id: Optional[str] = None
    theme: str
    sections: List[WebsiteSection]
    meta_data: Dict[str, Any]
    preview_url: Optional[str] = None
    html_file: Optional[str] = None  # Add HTML file field
    error: Optional[str] = None
    
    class Config:
        example = {
            "success": True,
            "website_id": "web_123456",
            "theme": "hero-split",
            "sections": [
                {
                    "section_type": "hero",
                    "title": "Welcome to The Italian Kitchen",
                    "content": "Authentic Italian cuisine made with love and fresh ingredients",
                    "order": 1
                }
            ],
            "meta_data": {
                "generated_at": "2024-01-01T12:00:00Z",
                "word_count": 250,
                "estimated_pages": 3
            },
            "preview_url": "https://preview.saadhyam.ai/web_123456"
        }


# ============ Routes ============

@router.post(
    "/websites",
    response_model=WebsiteGenerationResponse,
    summary="Generate AI-powered website",
    responses={
        200: {"description": "Website generated successfully"},
        400: {"description": "Invalid request data"},
        401: {"description": "Not authenticated"},
        503: {"description": "AI service unavailable"}
    }
)
async def generate_website(
    request: WebsiteGenerationRequest,
    theme: str = Query("hero-split", description="Website theme template"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> WebsiteGenerationResponse:
    """
    Generate an AI-powered website based on business information
    
    Themes available:
    - hero-split: Split hero section with image and text
    - minimal: Clean, minimal design
    - modern: Modern gradient design
    - classic: Traditional business layout
    """
    
    try:
        # Check feature access
        await check_feature_access(current_user, "website_ai")
        
        logger.info(f"🌐 Generating website for user: {current_user.email}")
        logger.info(f"   Business: {request.business_name}")
        logger.info(f"   Theme: {theme}")
        
        # Validate theme
        available_themes = [
            "hero-split",
            "card-masonry",
            "timeline-vertical",
            "magazine-grid",
            "bento-box",
            "parallax-scroll",
            "minimal-modern",
            "agency-dark",
            "retro-brutalism",
            "restaurant-showcase",
            "saas-dashboard",
            "creative-portfolio"
        ]
        if theme not in available_themes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid theme. Available themes: {', '.join(available_themes)}"
            )
        
        # Convert services from array to list if needed
        services_list = request.services or []
        if isinstance(services_list, str):
            services_list = [s.strip() for s in services_list.split(",") if s.strip()]
        
        # Generate website sections based on business info
        sections = generate_website_sections(request, theme, services_list)
        
        # Create website metadata
        meta_data = {
            "generated_at": "2024-01-01T12:00:00Z",
            "theme": theme,
            "business_type": request.business_type,
            "word_count": sum(len(section.content.split()) for section in sections),
            "estimated_pages": len(sections),
            "user_id": current_user.id,
            "tone": request.tone,
            "branding_style": request.branding_style,
            "contact_info": {
                "email": request.contact_email,
                "phone": request.contact_phone,
                "website": request.website_url
            }
        }
        
        # Generate unique website ID
        website_id = f"web_{current_user.id}_{theme}_{len(sections)}"
        
        # TODO: Store website in database
        # website_record = Website(
        #     id=website_id,
        #     user_id=current_user.id,
        #     theme=theme,
        #     sections=sections,
        #     meta_data=meta_data
        # )
        # db.add(website_record)
        # db.commit()
        
        logger.info(f"✅ Website generated successfully")
        logger.info(f"   Website ID: {website_id}")
        logger.info(f"   Sections: {len(sections)}")
        
        # Generate HTML file for preview
        html_content = generate_html_preview(request, theme, sections, services_list)
        html_filename = f"{website_id}.html"
        
        # Create output directory if it doesn't exist
        from pathlib import Path
        output_dir = Path("ai_models/website_ai/output")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Write HTML file
        html_path = output_dir / html_filename
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        
        logger.info(f"✅ HTML file generated: {html_filename}")
        
        return WebsiteGenerationResponse(
            success=True,
            website_id=website_id,
            theme=theme,
            sections=sections,
            meta_data=meta_data,
            preview_url=f"{API_URL}/website-ai/output/{html_filename}",
            html_file=html_filename,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating website: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate website"
        )


def generate_html_preview(request: WebsiteGenerationRequest, theme: str, sections: List[WebsiteSection], services_list: List[str]) -> str:
    """Generate HTML preview of the website using theme-specific templates"""
    return get_template_by_theme(theme, request, sections, services_list)


def generate_website_sections(request: WebsiteGenerationRequest, theme: str, services_list: List[str]) -> List[WebsiteSection]:
    """Generate website sections based on business info and theme"""
    
    sections = []
    
    # Use description if available, otherwise use a default
    description = request.description or f"Welcome to {request.business_name}, your trusted {request.business_type.lower()} provider."
    
    # Hero Section
    hero_content = f"Welcome to {request.business_name}. {description[:100]}..."
    if request.tone:
        hero_content += f" Experience our {request.tone} approach to {request.business_type.lower()}."
    
    sections.append(WebsiteSection(
        section_type="hero",
        title=f"Welcome to {request.business_name}",
        content=hero_content,
        order=1
    ))
    
    # About Section
    about_content = f"At {request.business_name}, we specialize in {request.business_type.lower()} services. {description}"
    if request.branding_style:
        about_content += f" Our {request.branding_style} style sets us apart in the industry."
    if request.target_audience:
        about_content += f" We proudly serve {request.target_audience}."
    
    sections.append(WebsiteSection(
        section_type="about",
        title="About Us",
        content=about_content,
        order=2
    ))
    
    # Services Section (if provided)
    if services_list:
        services_content = f"We offer a comprehensive range of services including: {', '.join(services_list)}. "
        services_content += f"Contact us to learn more about how our {request.business_type.lower()} expertise can help you."
        sections.append(WebsiteSection(
            section_type="services",
            title="Our Services",
            content=services_content,
            order=3
        ))
    
    # Contact Section
    contact_content = f"Ready to experience what {request.business_name} has to offer? Get in touch with us today!"
    if request.contact_email or request.contact_phone:
        contact_content += "\n\nContact Information:"
        if request.contact_email:
            contact_content += f"\nEmail: {request.contact_email}"
        if request.contact_phone:
            contact_content += f"\nPhone: {request.contact_phone}"
        if request.website_url:
            contact_content += f"\nWebsite: {request.website_url}"
    
    sections.append(WebsiteSection(
        section_type="contact",
        title="Contact Us",
        content=contact_content,
        order=4
    ))
    
    return sections


@router.get(
    "/websites/{website_id}",
    response_model=WebsiteGenerationResponse,
    summary="Get generated website",
    responses={
        200: {"description": "Website retrieved successfully"},
        401: {"description": "Not authenticated"},
        404: {"description": "Website not found"}
    }
)
async def get_website(
    website_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
) -> WebsiteGenerationResponse:
    """Get a previously generated website by ID"""
    
    try:
        logger.info(f"🔍 Getting website: {website_id} for user: {current_user.email}")
        
        # Forward request to website AI microservice
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://localhost:8000/api/v1/website-ai/websites/{website_id}",
                headers={"Authorization": f"Bearer {current_user.id}"}  # Pass user context
            )
            
            if response.status_code == 200:
                website_data = response.json()
                return WebsiteGenerationResponse(**website_data)
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Website not found"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve website"
                )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving website: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve website"
        )


@router.get(
    "/themes",
    summary="Get available website themes",
    responses={
        200: {"description": "Themes retrieved successfully"}
    }
)
async def get_available_themes() -> Dict[str, Any]:
    """Get list of available website themes"""
    
    themes = {
        "hero-split": {
            "name": "Hero Split",
            "description": "Split hero section with image and text",
            "preview": "https://preview.saadhyam.ai/themes/hero-split",
            "features": ["Responsive", "Modern", "Image-focused"]
        },
        "card-masonry": {
            "name": "Card Masonry",
            "description": "Pinterest-style card layout",
            "preview": "https://preview.saadhyam.ai/themes/card-masonry",
            "features": ["Grid", "Masonry", "Visual"]
        },
        "timeline-vertical": {
            "name": "Timeline",
            "description": "Vertical timeline storytelling layout",
            "preview": "https://preview.saadhyam.ai/themes/timeline-vertical",
            "features": ["Timeline", "Storytelling", "Clean"]
        },
        "magazine-grid": {
            "name": "Magazine Grid",
            "description": "Editorial print style layout",
            "preview": "https://preview.saadhyam.ai/themes/magazine-grid",
            "features": ["Editorial", "Bold", "Typography"]
        },
        "bento-box": {
            "name": "Bento Box",
            "description": "Grid-based modern interface layout",
            "preview": "https://preview.saadhyam.ai/themes/bento-box",
            "features": ["Bento", "Interactive", "Glassmorphism"]
        },
        "parallax-scroll": {
            "name": "Parallax Scroll",
            "description": "Dynamic scroll animations theme",
            "preview": "https://preview.saadhyam.ai/themes/parallax-scroll",
            "features": ["Parallax", "Animations", "Immersive"]
        },
        "minimal-modern": {
            "name": "Minimal Modern",
            "description": "Ultra-clean layout with beautiful typography",
            "preview": "https://preview.saadhyam.ai/themes/minimal-modern",
            "features": ["Minimal", "Clean", "Whitespace"]
        },
        "agency-dark": {
            "name": "Agency Dark",
            "description": "Dark glassmorphism digital agency theme",
            "preview": "https://preview.saadhyam.ai/themes/agency-dark",
            "features": ["Dark Mode", "Glassmorphism", "Tech"]
        },
        "retro-brutalism": {
            "name": "Retro Brutalism",
            "description": "Neo-brutalist cyberpunk theme",
            "preview": "https://preview.saadhyam.ai/themes/retro-brutalism",
            "features": ["Brutalist", "High Contrast", "Cyberpunk"]
        },
        "restaurant-showcase": {
            "name": "Restaurant Showcase",
            "description": "Serif typography and culinary showcase",
            "preview": "https://preview.saadhyam.ai/themes/restaurant-showcase",
            "features": ["Culinary", "Elegant", "Menu Grid"]
        },
        "saas-dashboard": {
            "name": "SaaS Dashboard",
            "description": "SaaS product dashboard mock panel theme",
            "preview": "https://preview.saadhyam.ai/themes/saas-dashboard",
            "features": ["Dashboard", "Analytics", "Tech"]
        },
        "creative-portfolio": {
            "name": "Creative Portfolio",
            "description": "Sleek portfolio with visual ornaments",
            "preview": "https://preview.saadhyam.ai/themes/creative-portfolio",
            "features": ["Portfolio", "Typography", "Artistic"]
        }
    }
    
    return {
        "success": True,
        "themes": themes,
        "total": len(themes)
    }


@router.get(
    "/health",
    summary="Health check for website AI service"
)
async def health_check():
    """Check if website AI service is healthy"""
    
    return {
        "status": "healthy",
        "service": "Website AI",
        "version": "1.0.0",
        "features": ["Website Generation", "Theme Templates", "Content AI"]
    }