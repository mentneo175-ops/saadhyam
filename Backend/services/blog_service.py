"""
Blog Service
Manages blog generation, storage, and publishing with rate limiting
"""

import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from db.blog_models import Blog
from models.user import User
from services.auto_blogger_service import generate_blog_post
from services.business_pinecone_service import get_business_context_from_pinecone
from datetime import datetime
import re

logger = logging.getLogger(__name__)


async def create_blog_from_auto_blogger(
    user: User,
    db: Session,
    topic: Optional[str] = None,
    keywords: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generate and save blog post using Auto Blogger with rate limiting
    
    Args:
        user: User object
        db: Database session
        topic: Optional blog topic
        keywords: Optional SEO keywords
    
    Returns:
        Dict with blog data and status
    """
    
    try:
        logger.info(f"[BlogService] Creating blog for user {user.id}")
        
        # Get business details
        business_name = user.business_name or "Business"
        business_type = user.business_type or "Business"
        location = user.business_location or "Location"
        
        # Generate blog post (with rate limiting inside)
        result = await generate_blog_post(
            user_id=user.id,
            business_name=business_name,
            business_type=business_type,
            location=location,
            topic=topic,
            keywords=keywords
        )
        
        if result.get("status") == "error":
            return result
        
        blog_post = result["blog_post"]
        
        # Create slug from title
        slug = create_slug(blog_post["title"])
        
        # Check if slug already exists
        existing = db.query(Blog).filter(
            Blog.user_id == user.id,
            Blog.slug == slug
        ).first()
        
        if existing:
            # Append timestamp to make unique
            slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
        
        # Create blog record
        new_blog = Blog(
            user_id=user.id,
            title=blog_post["title"],
            slug=slug,
            meta_description=blog_post["meta_description"],
            featured_image_prompt=blog_post["featured_image_prompt"],
            introduction=blog_post["introduction"],
            main_content=blog_post["main_content"],
            conclusion=blog_post["conclusion"],
            seo_keywords=blog_post["seo_keywords"],
            tags=blog_post["tags"],
            category=blog_post["category"],
            reading_time=blog_post["reading_time"],
            word_count=blog_post["word_count"],
            faq=blog_post.get("faq", []),
            internal_links=blog_post.get("internal_links", []),
            cta=blog_post.get("cta", {}),
            status="draft",
            is_published=False,
            source="auto_blogger"
        )
        
        db.add(new_blog)
        db.commit()
        db.refresh(new_blog)
        
        logger.info(f"[BlogService] ✅ Blog created (ID: {new_blog.id})")
        
        return {
            "status": "success",
            "blog_id": new_blog.id,
            "blog": format_blog_response(new_blog),
            "message": "Blog post generated successfully"
        }
        
    except Exception as e:
        logger.error(f"[BlogService] ❌ Error creating blog: {e}", exc_info=True)
        db.rollback()
        return {
            "status": "error",
            "message": f"Failed to create blog: {str(e)}"
        }


async def publish_blog(
    user: User,
    blog_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    Publish a blog post and add it to the website
    
    Args:
        user: User object
        blog_id: Blog ID
        db: Database session
    
    Returns:
        Dict with publish status
    """
    
    try:
        # Get blog
        blog = db.query(Blog).filter(
            Blog.id == blog_id,
            Blog.user_id == user.id
        ).first()
        
        if not blog:
            return {
                "status": "error",
                "message": "Blog not found"
            }
        
        # Update status
        blog.status = "published"
        blog.is_published = True
        blog.published_at = datetime.utcnow()
        
        db.commit()
        db.refresh(blog)
        
        logger.info(f"[BlogService] ✅ Blog published (ID: {blog_id})")
        
        # Publish to website
        from services.auto_blogger_service import publish_blog_to_website
        
        # Format blog data for publishing
        blog_data = {
            "id": blog.id,
            "title": blog.title,
            "slug": blog.slug,
            "meta_description": blog.meta_description,
            "introduction": blog.introduction,
            "main_content": blog.main_content,
            "conclusion": blog.conclusion,
            "category": blog.category,
            "reading_time": blog.reading_time,
            "faq": blog.faq,
            "cta": blog.cta,
            "tags": blog.tags,
            "seo_keywords": blog.seo_keywords,
            "published_at": blog.published_at.isoformat() if blog.published_at else datetime.utcnow().isoformat()
        }
        
        business_name = user.business_name or "Business"
        
        publish_result = await publish_blog_to_website(
            user_id=user.id,
            blog_post=blog_data,
            business_name=business_name
        )
        
        if publish_result.get("status") == "error":
            logger.warning(f"[BlogService] ⚠️ Blog published to DB but failed to publish to website: {publish_result.get('message')}")
            return {
                "status": "partial_success",
                "blog": format_blog_response(blog),
                "message": "Blog published to database but failed to publish to website",
                "website_error": publish_result.get("message")
            }
        
        logger.info(f"[BlogService] ✅ Blog published to website")
        
        return {
            "status": "success",
            "blog": format_blog_response(blog),
            "message": "Blog published successfully to database and website",
            "website_urls": {
                "blog_url": publish_result.get("blog_url"),
                "blogs_page_url": publish_result.get("blogs_page_url")
            }
        }
        
    except Exception as e:
        logger.error(f"[BlogService] ❌ Error publishing blog: {e}", exc_info=True)
        db.rollback()
        return {
            "status": "error",
            "message": f"Failed to publish blog: {str(e)}"
        }


async def get_user_blogs(
    user: User,
    db: Session,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Get user's blogs
    
    Args:
        user: User object
        db: Database session
        status: Filter by status (draft, published, archived)
        limit: Maximum number of blogs
        offset: Offset for pagination
    
    Returns:
        List of blogs
    """
    
    try:
        query = db.query(Blog).filter(Blog.user_id == user.id)
        
        if status:
            query = query.filter(Blog.status == status)
        
        blogs = query.order_by(Blog.created_at.desc()).limit(limit).offset(offset).all()
        
        return [format_blog_response(blog) for blog in blogs]
        
    except Exception as e:
        logger.error(f"[BlogService] ❌ Error getting blogs: {e}", exc_info=True)
        return []


async def get_blog_by_id(
    user: User,
    blog_id: int,
    db: Session
) -> Optional[Dict[str, Any]]:
    """
    Get blog by ID
    
    Args:
        user: User object
        blog_id: Blog ID
        db: Database session
    
    Returns:
        Blog data or None
    """
    
    try:
        blog = db.query(Blog).filter(
            Blog.id == blog_id,
            Blog.user_id == user.id
        ).first()
        
        if not blog:
            return None
        
        return format_blog_response(blog)
        
    except Exception as e:
        logger.error(f"[BlogService] ❌ Error getting blog: {e}", exc_info=True)
        return None


async def get_blog_by_slug(
    user: User,
    slug: str,
    db: Session
) -> Optional[Dict[str, Any]]:
    """
    Get blog by slug
    
    Args:
        user: User object
        slug: Blog slug
        db: Database session
    
    Returns:
        Blog data or None
    """
    
    try:
        blog = db.query(Blog).filter(
            Blog.slug == slug,
            Blog.user_id == user.id
        ).first()
        
        if not blog:
            return None
        
        return format_blog_response(blog)
        
    except Exception as e:
        logger.error(f"[BlogService] ❌ Error getting blog by slug: {e}", exc_info=True)
        return None


async def delete_blog(
    user: User,
    blog_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    Delete a blog post
    
    Args:
        user: User object
        blog_id: Blog ID
        db: Database session
    
    Returns:
        Dict with delete status
    """
    
    try:
        blog = db.query(Blog).filter(
            Blog.id == blog_id,
            Blog.user_id == user.id
        ).first()
        
        if not blog:
            return {
                "status": "error",
                "message": "Blog not found"
            }
        
        db.delete(blog)
        db.commit()
        
        logger.info(f"[BlogService] ✅ Blog deleted (ID: {blog_id})")
        
        return {
            "status": "success",
            "message": "Blog deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"[BlogService] ❌ Error deleting blog: {e}", exc_info=True)
        db.rollback()
        return {
            "status": "error",
            "message": f"Failed to delete blog: {str(e)}"
        }


def create_slug(title: str) -> str:
    """
    Create URL-friendly slug from title
    
    Args:
        title: Blog title
    
    Returns:
        URL-friendly slug
    """
    
    # Convert to lowercase
    slug = title.lower()
    
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    
    # Remove special characters
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    
    # Remove multiple hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    # Limit length
    slug = slug[:100]
    
    return slug


def format_blog_response(blog: Blog) -> Dict[str, Any]:
    """
    Format blog for API response
    
    Args:
        blog: Blog object
    
    Returns:
        Formatted blog data
    """
    
    return {
        "id": blog.id,
        "title": blog.title,
        "slug": blog.slug,
        "meta_description": blog.meta_description,
        "featured_image_url": blog.featured_image_url,
        "featured_image_prompt": blog.featured_image_prompt,
        "introduction": blog.introduction,
        "main_content": blog.main_content,
        "conclusion": blog.conclusion,
        "seo_keywords": blog.seo_keywords,
        "tags": blog.tags,
        "category": blog.category,
        "reading_time": blog.reading_time,
        "word_count": blog.word_count,
        "faq": blog.faq,
        "internal_links": blog.internal_links,
        "cta": blog.cta,
        "status": blog.status,
        "is_published": blog.is_published,
        "published_at": blog.published_at.isoformat() if blog.published_at else None,
        "created_at": blog.created_at.isoformat() if blog.created_at else None,
        "updated_at": blog.updated_at.isoformat() if blog.updated_at else None,
        "source": blog.source
    }
