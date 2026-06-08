"""
Website Blog Integrator Service
Automatically injects published blogs into user's confirmed website
"""

import logging
from typing import Dict, Any, Optional
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


async def integrate_blog_into_website(
    user_id: int,
    website_id: str,
    blog_post: Dict[str, Any],
    db: Session
) -> Dict[str, Any]:
    """
    Integrate a published blog post into the user's confirmed website
    
    Args:
        user_id: User ID
        website_id: UUID of the confirmed website
        blog_post: Blog post data
        db: Database session
    
    Returns:
        Dict with integration status
    """
    
    try:
        logger.info(f"[BlogIntegrator] Integrating blog '{blog_post['title']}' into website {website_id}")
        
        # Import here to avoid circular imports
        from ai_models.website_ai.app.db.models.website import Website
        
        # Get website from database - safely check if website_id is a valid UUID first
        import uuid
        is_uuid = False
        try:
            uuid.UUID(str(website_id))
            is_uuid = True
        except ValueError:
            pass

        if is_uuid:
            website = db.query(Website).filter(Website.id == website_id).first()
        else:
            website = db.query(Website).filter(Website.slug == website_id).first()
        
        if not website:
            logger.error(f"[BlogIntegrator] Website {website_id} not found")
            return {
                "status": "error",
                "message": f"Website {website_id} not found"
            }
        
        # Get HTML file path
        html_file_path = website.html_file_path
        
        # Handle both absolute and relative paths
        if html_file_path and not Path(html_file_path).exists():
            # Try relative to project root
            from pathlib import Path as PathlibPath
            project_root = PathlibPath(__file__).resolve().parent.parent
            html_file_path = str(project_root / html_file_path)
        
        # Also check in websites directory
        if html_file_path and not Path(html_file_path).exists():
            websites_dir = project_root / "websites" / str(website_id) / "index.html"
            if websites_dir.exists():
                html_file_path = str(websites_dir)
        
        if not html_file_path or not Path(html_file_path).exists():
            logger.error(f"[BlogIntegrator] HTML file not found: {html_file_path}")
            return {
                "status": "error",
                "message": "Website HTML file not found"
            }
        
        # Read existing HTML
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Create blog card HTML with user_id
        blog_card_html = create_blog_card_html(blog_post, user_id)
        
        # Find or create blog section
        blog_section = find_or_create_blog_section(soup)
        
        # Add blog card to section
        blog_card_soup = BeautifulSoup(blog_card_html, 'html.parser')
        
        # Find the blog container within the section
        blog_container = blog_section.find('div', class_='blog-posts-container')
        if not blog_container:
            blog_container = blog_section.find('div', class_='blogs-grid')
        if not blog_container:
            blog_container = blog_section.find('div', class_='blog-list')
        
        if blog_container:
            # Check if blog already exists (by slug)
            existing_blog = blog_container.find('article', attrs={'data-slug': blog_post['slug']})
            if existing_blog:
                # Update existing blog
                existing_blog.replace_with(blog_card_soup)
                logger.info(f"[BlogIntegrator] Updated existing blog card for '{blog_post['slug']}'")
            else:
                # Add new blog at the beginning
                blog_container.insert(0, blog_card_soup)
                logger.info(f"[BlogIntegrator] Added new blog card for '{blog_post['slug']}'")
        else:
            # No container found, create one and add blog
            container_html = f'<div class="blog-posts-container">{blog_card_html}</div>'
            container_soup = BeautifulSoup(container_html, 'html.parser')
            blog_section.append(container_soup)
            logger.info(f"[BlogIntegrator] Created new blog container and added blog card")
        
        # Save updated HTML
        updated_html = str(soup)
        with open(html_file_path, 'w', encoding='utf-8') as f:
            f.write(updated_html)
        
        logger.info(f"[BlogIntegrator] ✅ Blog integrated successfully into website {website_id}")
        
        return {
            "status": "success",
            "message": "Blog integrated into website successfully",
            "website_id": website_id,
            "blog_slug": blog_post['slug']
        }
        
    except Exception as e:
        logger.error(f"[BlogIntegrator] ❌ Error integrating blog: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to integrate blog: {str(e)}"
        }


def find_or_create_blog_section(soup: BeautifulSoup) -> Any:
    """
    Find existing blog section or create a new one
    
    Args:
        soup: BeautifulSoup object
    
    Returns:
        Blog section element
    """
    
    # Try to find existing blog section
    blog_section = soup.find('section', id='blog')
    if not blog_section:
        blog_section = soup.find('section', id='blogs')
    if not blog_section:
        blog_section = soup.find('section', class_='blog-section')
    if not blog_section:
        blog_section = soup.find('section', class_='blogs-section')
    
    # If found, return it
    if blog_section:
        logger.info("[BlogIntegrator] Found existing blog section")
        return blog_section
    
    # Create new blog section
    logger.info("[BlogIntegrator] Creating new blog section")
    
    blog_section_html = """
    <section id="blog" class="blog-section" style="padding: 60px 20px; background: #f9fafb;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
            <div class="section-header" style="text-align: center; margin-bottom: 40px;">
                <h2 style="font-size: 2.5rem; font-weight: bold; color: #1f2937; margin-bottom: 10px;">Latest Blog Posts</h2>
                <p style="font-size: 1.1rem; color: #6b7280;">Stay updated with our latest insights and news</p>
            </div>
            <div class="blog-posts-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px;">
                <!-- Blog cards will be inserted here -->
            </div>
        </div>
    </section>
    """
    
    new_section = BeautifulSoup(blog_section_html, 'html.parser')
    
    # Try to insert before footer
    footer = soup.find('footer')
    if footer:
        footer.insert_before(new_section)
    else:
        # Insert at the end of body
        body = soup.find('body')
        if body:
            body.append(new_section)
        else:
            # Last resort: append to soup
            soup.append(new_section)
    
    # Return the newly created section
    return soup.find('section', id='blog')


def create_blog_card_html(blog_post: Dict[str, Any], user_id: int) -> str:
    """
    Create HTML for a blog card
    
    Args:
        blog_post: Blog post data
        user_id: User ID for creating the blog URL
    
    Returns:
        HTML string for blog card
    """
    
    # Format date
    published_at = blog_post.get('published_at', datetime.utcnow().isoformat())
    try:
        if isinstance(published_at, str):
            date_obj = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
        else:
            date_obj = published_at
        formatted_date = date_obj.strftime("%B %d, %Y")
    except:
        formatted_date = datetime.utcnow().strftime("%B %d, %Y")
    
    # Get blog data
    title = blog_post.get('title', 'Untitled')
    slug = blog_post.get('slug', 'untitled')
    meta_description = blog_post.get('meta_description', blog_post.get('introduction', '')[:150])
    category = blog_post.get('category', 'Blog')
    reading_time = blog_post.get('reading_time', 5)
    tags = blog_post.get('tags', [])
    
    # Create blog URL - public endpoint that doesn't require authentication
    blog_url = f"/api/blogs/public/{user_id}/{slug}"
    
    # Create blog card HTML with proper link
    blog_card = f"""
    <article class="blog-card" data-slug="{slug}" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 12px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';">
        <div class="blog-card-image" style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center; color: white; padding: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 10px;">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
                <p style="font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">{category}</p>
            </div>
        </div>
        <div class="blog-card-content" style="padding: 24px;">
            <div class="blog-meta" style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px; font-size: 0.875rem; color: #6b7280;">
                <span style="display: flex; align-items: center; gap: 5px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {formatted_date}
                </span>
                <span style="display: flex; align-items: center; gap: 5px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {reading_time} min read
                </span>
            </div>
            <h3 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 12px; line-height: 1.3;">{title}</h3>
            <p style="font-size: 1rem; color: #4b5563; line-height: 1.6; margin-bottom: 16px;">{meta_description}</p>
            <div class="blog-tags" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                {''.join([f'<span style="background: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500;">#{tag}</span>' for tag in tags[:3]])}
            </div>
            <a href="{blog_url}" class="blog-read-more" style="display: inline-flex; align-items: center; gap: 8px; color: #667eea; font-weight: 600; text-decoration: none; transition: gap 0.3s;" onmouseover="this.style.gap='12px';" onmouseout="this.style.gap='8px';">
                Read More
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </a>
        </div>
    </article>
    """
    
    return blog_card


async def get_user_confirmed_website_id(user_id: int, db: Session) -> Optional[str]:
    """
    Get user's confirmed website ID
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        Website ID or None
    """
    
    try:
        from models.user import User
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if user and user.last_generated_website_id:
            logger.info(f"[BlogIntegrator] User {user_id} has confirmed website: {user.last_generated_website_id}")
            return user.last_generated_website_id
        
        logger.info(f"[BlogIntegrator] User {user_id} has no confirmed website")
        return None
        
    except Exception as e:
        logger.error(f"[BlogIntegrator] Error getting confirmed website: {e}", exc_info=True)
        return None
