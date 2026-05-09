"""
Script to update existing blog cards in confirmed websites with proper links
Run this to fix "Read More" links for already published blogs
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config.database import SyncSessionLocal
from models.user import User
from db.blog_models import Blog
from services.website_blog_integrator import integrate_blog_into_website
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def update_all_blog_links():
    """
    Update all published blogs in confirmed websites with proper links
    """
    
    db = SyncSessionLocal()
    
    try:
        # Get all users with confirmed websites
        users = db.query(User).filter(User.last_generated_website_id.isnot(None)).all()
        
        logger.info(f"Found {len(users)} users with confirmed websites")
        
        for user in users:
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing user: {user.email} (ID: {user.id})")
            logger.info(f"Website ID: {user.last_generated_website_id}")
            
            # Get all published blogs for this user
            published_blogs = db.query(Blog).filter(
                Blog.user_id == user.id,
                Blog.is_published == True
            ).all()
            
            logger.info(f"Found {len(published_blogs)} published blogs")
            
            if not published_blogs:
                logger.info("No published blogs to update")
                continue
            
            # Re-integrate each blog to update the links
            for blog in published_blogs:
                logger.info(f"\nUpdating blog: {blog.title} (slug: {blog.slug})")
                
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
                    "published_at": blog.published_at.isoformat() if blog.published_at else None
                }
                
                result = await integrate_blog_into_website(
                    user_id=user.id,
                    website_id=user.last_generated_website_id,
                    blog_post=blog_data,
                    db=db
                )
                
                if result.get("status") == "success":
                    logger.info(f"✅ Successfully updated blog: {blog.slug}")
                else:
                    logger.error(f"❌ Failed to update blog: {result.get('message')}")
        
        logger.info(f"\n{'='*60}")
        logger.info("✅ All blog links updated successfully!")
        
    except Exception as e:
        logger.error(f"❌ Error updating blog links: {e}", exc_info=True)
    
    finally:
        db.close()


if __name__ == "__main__":
    print("🔄 Updating blog links in confirmed websites...")
    print("This will update all 'Read More' links to work properly\n")
    
    asyncio.run(update_all_blog_links())
    
    print("\n✅ Done! Please refresh your website to see the changes.")
