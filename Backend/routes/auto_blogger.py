"""
Auto Blogger API Routes
Generate and publish blogs automatically
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path
import json
from datetime import datetime

from services.auto_blogger_service import (
    generate_blog_content,
    generate_blog_ideas,
    format_blog_for_website
)
from utils.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/auto-blogger", tags=["auto-blogger"])


class BlogGenerateRequest(BaseModel):
    topic: str
    business_context: Optional[str] = None


class BlogIdeasRequest(BaseModel):
    business_type: Optional[str] = None
    count: int = 5


class BlogPublishRequest(BaseModel):
    blog_id: str


class BlogResponse(BaseModel):
    id: str
    title: str
    excerpt: str
    content: str
    tags: List[str]
    meta_description: str
    reading_time: str
    status: str
    generated_at: str
    published_at: Optional[str] = None
    url: Optional[str] = None
    website_id: Optional[str] = None


# Storage directory for blogs
BLOGS_DIR = Path("Backend/blogs")
BLOGS_DIR.mkdir(exist_ok=True)

PUBLISHED_BLOGS_DIR = Path("Backend/website_ai_output/blogs")
PUBLISHED_BLOGS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/generate", response_model=BlogResponse)
async def generate_blog(
    request: BlogGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new blog post using AI
    
    - **topic**: Blog topic or title
    - **business_context**: Optional business context for personalization
    """
    try:
        # Generate blog content with user context
        blog_data = await generate_blog_content(
            topic=request.topic,
            business_context=request.business_context,
            user_id=current_user.id
        )
        
        # Generate unique ID
        blog_id = f"blog_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        blog_data["id"] = blog_id
        blog_data["user_id"] = current_user.id
        
        # Save to storage
        blog_file = BLOGS_DIR / f"{blog_id}.json"
        with open(blog_file, 'w', encoding='utf-8') as f:
            json.dump(blog_data, f, indent=2, ensure_ascii=False)
        
        return BlogResponse(**blog_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate blog: {str(e)}"
        )


@router.post("/publish", response_model=BlogResponse)
async def publish_blog(
    request: BlogPublishRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Publish a generated blog to the user's existing website
    
    - **blog_id**: ID of the blog to publish
    """
    try:
        # Load blog data
        blog_file = BLOGS_DIR / f"{request.blog_id}.json"
        if not blog_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog not found"
            )
        
        with open(blog_file, 'r', encoding='utf-8') as f:
            blog_data = json.load(f)
        
        # Verify ownership
        if blog_data.get("user_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to publish this blog"
            )
        
        # Integrate blog with existing website
        from services.auto_blogger_service import integrate_blog_with_website
        result = await integrate_blog_with_website(request.blog_id, current_user.id)
        
        # Update blog status
        blog_data["status"] = "published"
        blog_data["published_at"] = datetime.utcnow().isoformat()
        blog_data["url"] = f"/website/{result['website_id']}#blog-{request.blog_id}"
        blog_data["website_id"] = result["website_id"]
        
        # Save updated data
        with open(blog_file, 'w', encoding='utf-8') as f:
            json.dump(blog_data, f, indent=2, ensure_ascii=False)
        
        return BlogResponse(**blog_data)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish blog: {str(e)}"
        )


@router.get("/list", response_model=List[BlogResponse])
async def list_blogs(
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = None
):
    """
    List all blogs for the current user
    
    - **status_filter**: Optional filter by status (draft, published)
    """
    try:
        blogs = []
        
        for blog_file in BLOGS_DIR.glob("*.json"):
            with open(blog_file, 'r', encoding='utf-8') as f:
                blog_data = json.load(f)
            
            # Filter by user
            if blog_data.get("user_id") != current_user.id:
                continue
            
            # Filter by status if provided
            if status_filter and blog_data.get("status") != status_filter:
                continue
            
            blogs.append(BlogResponse(**blog_data))
        
        # Sort by generated_at descending
        blogs.sort(key=lambda x: x.generated_at, reverse=True)
        
        return blogs
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list blogs: {str(e)}"
        )


@router.get("/{blog_id}", response_model=BlogResponse)
async def get_blog(
    blog_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific blog by ID
    """
    try:
        blog_file = BLOGS_DIR / f"{blog_id}.json"
        if not blog_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog not found"
            )
        
        with open(blog_file, 'r', encoding='utf-8') as f:
            blog_data = json.load(f)
        
        # Verify ownership
        if blog_data.get("user_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this blog"
            )
        
        return BlogResponse(**blog_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get blog: {str(e)}"
        )


@router.delete("/{blog_id}")
async def delete_blog(
    blog_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a blog
    """
    try:
        blog_file = BLOGS_DIR / f"{blog_id}.json"
        if not blog_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog not found"
            )
        
        with open(blog_file, 'r', encoding='utf-8') as f:
            blog_data = json.load(f)
        
        # Verify ownership
        if blog_data.get("user_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this blog"
            )
        
        # Delete blog file
        blog_file.unlink()
        
        # Delete published file if exists
        published_file = PUBLISHED_BLOGS_DIR / f"{blog_id}.html"
        if published_file.exists():
            published_file.unlink()
        
        return {"message": "Blog deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete blog: {str(e)}"
        )


@router.post("/ideas", response_model=List[str])
async def get_blog_ideas(
    request: BlogIdeasRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate blog topic ideas
    
    - **business_type**: Optional business type for personalized ideas
    - **count**: Number of ideas to generate (default: 5)
    """
    try:
        ideas = await generate_blog_ideas(
            business_type=request.business_type,
            count=request.count
        )
        
        return ideas
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ideas: {str(e)}"
        )
