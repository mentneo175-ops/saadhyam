"""
Blog Routes
API endpoints for blog management
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from utils.dependencies import get_current_user
from config.database import get_sync_db
from models.user import User
from sqlalchemy.orm import Session
from services.blog_service import (
    create_blog_from_auto_blogger,
    publish_blog,
    get_user_blogs,
    get_blog_by_id,
    get_blog_by_slug,
    delete_blog
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/blogs",
    tags=["Blogs"]
)


# ============ Request Models ============

class BlogGenerateRequest(BaseModel):
    """Request model for blog generation"""
    topic: Optional[str] = None
    keywords: Optional[List[str]] = None


class BlogPublishRequest(BaseModel):
    """Request model for blog publishing"""
    blog_id: int


# ============ Routes ============

@router.post(
    "/generate",
    summary="Generate Blog Post",
    description="Generate SEO-optimized blog post using Auto Blogger (with rate limiting)"
)
async def generate_blog(
    request: BlogGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> Dict[str, Any]:
    """
    Generate and save blog post
    
    Uses:
    - Business context from Pinecone
    - Web search for latest trends
    - Gemini API for content generation
    - Rate limiting (5 requests/minute)
    
    Returns:
    - Blog post data
    - Blog ID for publishing
    """
    
    result = await create_blog_from_auto_blogger(
        user=current_user,
        db=db,
        topic=request.topic,
        keywords=request.keywords
    )
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to generate blog")
        )
    
    return result


@router.post(
    "/publish",
    summary="Publish Blog Post",
    description="Publish a blog post to make it visible"
)
async def publish_blog_endpoint(
    request: BlogPublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> Dict[str, Any]:
    """
    Publish a blog post
    
    Changes status from draft to published
    Sets published_at timestamp
    Makes blog visible in blog list
    """
    
    result = await publish_blog(
        user=current_user,
        blog_id=request.blog_id,
        db=db
    )
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("message", "Failed to publish blog")
        )
    
    return result


@router.get(
    "/",
    summary="Get User Blogs",
    description="Get all blogs for current user"
)
async def get_blogs(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> Dict[str, Any]:
    """
    Get user's blogs
    
    Query params:
    - status: Filter by status (draft, published, archived)
    - limit: Maximum number of blogs (default: 20)
    - offset: Offset for pagination (default: 0)
    """
    
    blogs = await get_user_blogs(
        user=current_user,
        db=db,
        status=status,
        limit=limit,
        offset=offset
    )
    
    return {
        "status": "success",
        "blogs": blogs,
        "total": len(blogs)
    }


@router.get(
    "/{blog_id}",
    summary="Get Blog by ID",
    description="Get a specific blog by ID"
)
async def get_blog(
    blog_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> Dict[str, Any]:
    """
    Get blog by ID
    """
    
    blog = await get_blog_by_id(
        user=current_user,
        blog_id=blog_id,
        db=db
    )
    
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog not found"
        )
    
    return {
        "status": "success",
        "blog": blog
    }


@router.get(
    "/slug/{slug}",
    summary="Get Blog by Slug",
    description="Get a specific blog by slug"
)
async def get_blog_by_slug_endpoint(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> Dict[str, Any]:
    """
    Get blog by slug
    """
    
    blog = await get_blog_by_slug(
        user=current_user,
        slug=slug,
        db=db
    )
    
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog not found"
        )
    
    return {
        "status": "success",
        "blog": blog
    }


@router.delete(
    "/{blog_id}",
    summary="Delete Blog",
    description="Delete a blog post"
)
async def delete_blog_endpoint(
    blog_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
) -> Dict[str, Any]:
    """
    Delete a blog post
    """
    
    result = await delete_blog(
        user=current_user,
        blog_id=blog_id,
        db=db
    )
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("message", "Failed to delete blog")
        )
    
    return result


@router.get(
    "/public/{user_id}/{slug}",
    summary="Get Published Blog (Public)",
    description="Get a published blog post without authentication (for website display)"
)
async def get_public_blog(
    user_id: int,
    slug: str,
    db: Session = Depends(get_sync_db)
):
    """
    Get published blog by user ID and slug (public access)
    Returns HTML page for blog display
    Only returns published blogs
    """
    
    from db.blog_models import Blog
    from fastapi.responses import HTMLResponse
    
    blog = db.query(Blog).filter(
        Blog.user_id == user_id,
        Blog.slug == slug,
        Blog.is_published == True
    ).first()
    
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog not found or not published"
        )
    
    # Format date
    published_at = blog.published_at or blog.created_at
    formatted_date = published_at.strftime("%B %d, %Y") if published_at else "Recently"
    
    # Prepare tags HTML
    tags_html = ""
    if blog.tags:
        tags_items = ''.join([f'<span class="tag">#{tag}</span>' for tag in blog.tags])
        tags_html = f'''
        <div class="blog-tags">
            <h3>Tags</h3>
            <div class="tags-list">
                {tags_items}
            </div>
        </div>
        '''
    
    # Prepare FAQ HTML
    faq_html = ""
    if blog.faq:
        faq_items = ''.join([f'''
        <div class="faq-item">
            <div class="faq-question">{faq.get('question', '')}</div>
            <div class="faq-answer">{faq.get('answer', '')}</div>
        </div>
        ''' for faq in blog.faq])
        faq_html = f'''
        <div class="blog-faq">
            <h3>Frequently Asked Questions</h3>
            {faq_items}
        </div>
        '''
    
    # Prepare CTA HTML
    cta_html = ""
    if blog.cta:
        cta_html = f'''
        <div class="blog-cta">
            <h3>{blog.cta.get('heading', 'Get Started Today')}</h3>
            <p>{blog.cta.get('text', 'Ready to take the next step?')}</p>
            <a href="{blog.cta.get('button_url', '#')}" class="cta-button">{blog.cta.get('button_text', 'Learn More')}</a>
        </div>
        '''
    
    # Create HTML page for blog
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="{blog.meta_description or ''}">
        <meta name="keywords" content="{', '.join(blog.seo_keywords or [])}">
        <title>{blog.title}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background: #f9fafb;
            }}
            
            .container {{
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
            }}
            
            .blog-header {{
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }}
            
            .blog-category {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 20px;
            }}
            
            .blog-title {{
                font-size: 2.5rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 20px;
                line-height: 1.2;
            }}
            
            .blog-meta {{
                display: flex;
                align-items: center;
                gap: 20px;
                font-size: 0.875rem;
                color: #6b7280;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
            }}
            
            .blog-meta-item {{
                display: flex;
                align-items: center;
                gap: 6px;
            }}
            
            .blog-content {{
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }}
            
            .blog-section {{
                margin-bottom: 30px;
            }}
            
            .blog-section h2 {{
                font-size: 1.75rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 3px solid #667eea;
            }}
            
            .blog-section p {{
                font-size: 1.125rem;
                line-height: 1.8;
                color: #4b5563;
                margin-bottom: 15px;
            }}
            
            .blog-tags {{
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }}
            
            .blog-tags h3 {{
                font-size: 1.25rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 15px;
            }}
            
            .tags-list {{
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }}
            
            .tag {{
                background: #e5e7eb;
                color: #374151;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 500;
            }}
            
            .blog-faq {{
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }}
            
            .blog-faq h3 {{
                font-size: 1.5rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 20px;
            }}
            
            .faq-item {{
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
            }}
            
            .faq-item:last-child {{
                border-bottom: none;
            }}
            
            .faq-question {{
                font-size: 1.125rem;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 10px;
            }}
            
            .faq-answer {{
                font-size: 1rem;
                color: #4b5563;
                line-height: 1.6;
            }}
            
            .blog-cta {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                margin-bottom: 30px;
            }}
            
            .blog-cta h3 {{
                font-size: 1.75rem;
                font-weight: bold;
                margin-bottom: 15px;
            }}
            
            .blog-cta p {{
                font-size: 1.125rem;
                margin-bottom: 20px;
                opacity: 0.9;
            }}
            
            .cta-button {{
                display: inline-block;
                background: white;
                color: #667eea;
                padding: 12px 30px;
                border-radius: 8px;
                font-weight: 600;
                text-decoration: none;
                transition: transform 0.3s;
            }}
            
            .cta-button:hover {{
                transform: translateY(-2px);
            }}
            
            .back-link {{
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: #667eea;
                font-weight: 600;
                text-decoration: none;
                margin-bottom: 20px;
            }}
            
            .back-link:hover {{
                text-decoration: underline;
            }}
            
            @media (max-width: 768px) {{
                .blog-title {{
                    font-size: 2rem;
                }}
                
                .blog-header, .blog-content, .blog-tags, .blog-faq, .blog-cta {{
                    padding: 20px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <a href="javascript:history.back()" class="back-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Website
            </a>
            
            <div class="blog-header">
                <span class="blog-category">{blog.category or 'Blog'}</span>
                <h1 class="blog-title">{blog.title}</h1>
                <div class="blog-meta">
                    <div class="blog-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {formatted_date}
                    </div>
                    <div class="blog-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {blog.reading_time or 5} min read
                    </div>
                    <div class="blog-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        {blog.word_count or 0} words
                    </div>
                </div>
            </div>
            
            <div class="blog-content">
                <div class="blog-section">
                    <h2>Introduction</h2>
                    <p>{blog.introduction or ''}</p>
                </div>
                
                <div class="blog-section">
                    <h2>Main Content</h2>
                    <p>{blog.main_content or ''}</p>
                </div>
                
                <div class="blog-section">
                    <h2>Conclusion</h2>
                    <p>{blog.conclusion or ''}</p>
                </div>
            </div>
            
            {tags_html}
            
            {faq_html}
            
            {cta_html}
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@router.get(
    "/health",
    summary="Health check for blog service"
)
async def health_check():
    """Check if blog service is healthy"""
    
    return {
        "status": "healthy",
        "service": "Blog Management System",
        "version": "1.0.0",
        "features": [
            "Auto blog generation with Gemini API",
            "Rate limiting (5 requests/minute)",
            "SEO optimization",
            "Blog publishing",
            "Blog management (CRUD)"
        ]
    }
