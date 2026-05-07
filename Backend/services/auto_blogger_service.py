"""
Auto Blogger Service - Generate and publish blogs automatically
Uses Groq API for content generation
"""

import logging
import httpx
from datetime import datetime
from typing import Dict, Any

from config.settings import settings

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-70b-versatile"
GROQ_TIMEOUT = 30.0


async def generate_blog_content(topic: str, business_context: str = None, user_id: str = None) -> Dict[str, Any]:
    """
    Generate complete blog content using Groq API
    
    Args:
        topic: Blog topic or title
        business_context: Optional business context for personalization
        user_id: User ID for fetching business context
        
    Returns:
        Dict with title, content, excerpt, tags, meta_description
    """
    
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError("GROQ_API_KEY not configured")
    
    # If user_id provided and no business_context, try to fetch from database
    if user_id and not business_context:
        try:
            from services.firebase_service import get_user_profile
            profile = await get_user_profile(user_id)
            if profile and profile.get("business_profile"):
                bp = profile["business_profile"]
                business_context = f"{bp.get('business_name', '')} - {bp.get('business_type', '')}: {bp.get('business_description', '')}"
        except Exception as e:
            logger.warning(f"Could not fetch business context: {e}")
    
    system_prompt = """You are an expert blog writer and content strategist.
    
Your task is to create high-quality, SEO-optimized blog posts that are:
- Engaging and informative
- Well-structured with clear sections
- Optimized for search engines
- Professional yet conversational
- Include actionable insights

Format your response as JSON with these fields:
{
  "title": "Catchy, SEO-friendly title (60-70 characters)",
  "excerpt": "Compelling summary (150-160 characters)",
  "content": "Full blog post in HTML format with <h2>, <h3>, <p>, <ul>, <li> tags",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "meta_description": "SEO meta description (150-160 characters)",
  "reading_time": "Estimated reading time in minutes"
}

IMPORTANT:
- Use proper HTML formatting in content
- Include at least 3 main sections with <h2> headings
- Add bullet points where appropriate
- Make it at least 800-1000 words
- Include a conclusion section
- Add relevant internal linking suggestions"""

    user_prompt = f"""Generate a comprehensive blog post about: {topic}

{f"Business Context: {business_context}" if business_context else ""}

Create an engaging, informative blog post that provides real value to readers.
Include practical tips, examples, and actionable advice.

Return ONLY valid JSON, no additional text."""

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4000,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        timeout = httpx.Timeout(GROQ_TIMEOUT)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(GROQ_API_URL, json=payload, headers=headers)
            response.raise_for_status()

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        
        # Parse JSON response
        import json
        blog_data = json.loads(content)
        
        # Add metadata
        blog_data["generated_at"] = datetime.utcnow().isoformat()
        blog_data["status"] = "draft"
        
        logger.info(f"✅ Blog generated successfully: {blog_data.get('title')}")
        return blog_data
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse blog JSON: {e}")
        # Fallback: create structured response from raw content
        return {
            "title": topic,
            "excerpt": f"A comprehensive guide about {topic}",
            "content": f"<p>{content}</p>",
            "tags": ["blog", "article"],
            "meta_description": f"Learn about {topic}",
            "reading_time": "5",
            "generated_at": datetime.utcnow().isoformat(),
            "status": "draft"
        }
    except Exception as e:
        logger.error(f"Error generating blog: {e}")
        raise


async def generate_blog_ideas(business_type: str = None, count: int = 5) -> list:
    """
    Generate blog topic ideas based on business type
    
    Args:
        business_type: Type of business (optional)
        count: Number of ideas to generate
        
    Returns:
        List of blog topic ideas
    """
    
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError("GROQ_API_KEY not configured")
    
    system_prompt = """You are a content strategist specializing in blog topic ideation.
Generate engaging, SEO-friendly blog topics that will attract readers and drive traffic."""

    user_prompt = f"""Generate {count} blog topic ideas{f" for a {business_type} business" if business_type else ""}.

Requirements:
- Topics should be specific and actionable
- Include a mix of how-to, listicles, and thought leadership
- Focus on topics that solve real problems
- Make them SEO-friendly

Return as a JSON array of strings:
["Topic 1", "Topic 2", "Topic 3", ...]"""

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.8,
        "max_tokens": 500,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        timeout = httpx.Timeout(GROQ_TIMEOUT)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(GROQ_API_URL, json=payload, headers=headers)
            response.raise_for_status()

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        
        # Parse JSON response
        import json
        ideas = json.loads(content)
        
        logger.info(f"✅ Generated {len(ideas)} blog ideas")
        return ideas
        
    except Exception as e:
        logger.error(f"Error generating blog ideas: {e}")
        # Fallback ideas
        return [
            "10 Tips to Grow Your Business in 2024",
            "How to Improve Customer Engagement",
            "The Ultimate Guide to Social Media Marketing",
            "5 Common Business Mistakes to Avoid",
            "Building a Strong Brand Identity"
        ]


def format_blog_for_website(blog_data: Dict[str, Any]) -> str:
    """
    Format blog data into HTML section for website integration
    
    Args:
        blog_data: Blog data dictionary
        
    Returns:
        HTML blog section (not a complete page)
    """
    
    html = f"""
<article class="blog-post" id="blog-{blog_data.get('id', '')}">
    <header class="blog-header">
        <h1 class="blog-title">{blog_data.get('title', 'Untitled')}</h1>
        <div class="blog-meta">
            <span class="reading-time">📖 {blog_data.get('reading_time', '5')} min read</span>
            <span class="separator"> • </span>
            <span class="publish-date">📅 {datetime.fromisoformat(blog_data.get('generated_at', datetime.utcnow().isoformat())).strftime('%B %d, %Y')}</span>
        </div>
        <p class="blog-excerpt">{blog_data.get('excerpt', '')}</p>
    </header>
    
    <div class="blog-content">
        {blog_data.get('content', '')}
    </div>
    
    <footer class="blog-footer">
        <div class="blog-tags">
            <strong>Tags:</strong>
            {' '.join([f'<span class="tag">{tag}</span>' for tag in blog_data.get('tags', [])])}
        </div>
    </footer>
</article>

<style>
.blog-post {{
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
}}

.blog-header {{
    margin-bottom: 40px;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 20px;
}}

.blog-title {{
    font-size: 2.5em;
    font-weight: 700;
    margin-bottom: 15px;
    color: #1a1a1a;
    line-height: 1.2;
}}

.blog-meta {{
    color: #6b7280;
    font-size: 0.95em;
    margin-bottom: 15px;
}}

.blog-excerpt {{
    font-size: 1.15em;
    color: #4b5563;
    font-style: italic;
    margin-top: 15px;
}}

.blog-content {{
    font-size: 1.05em;
    line-height: 1.8;
    color: #374151;
}}

.blog-content h2 {{
    font-size: 1.8em;
    margin-top: 40px;
    margin-bottom: 15px;
    color: #1f2937;
    font-weight: 600;
}}

.blog-content h3 {{
    font-size: 1.4em;
    margin-top: 30px;
    margin-bottom: 12px;
    color: #374151;
    font-weight: 600;
}}

.blog-content p {{
    margin-bottom: 20px;
}}

.blog-content ul, .blog-content ol {{
    margin-bottom: 20px;
    padding-left: 30px;
}}

.blog-content li {{
    margin-bottom: 10px;
}}

.blog-footer {{
    margin-top: 50px;
    padding-top: 30px;
    border-top: 1px solid #e5e7eb;
}}

.blog-tags {{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
}}

.blog-tags strong {{
    color: #374151;
    margin-right: 5px;
}}

.tag {{
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.85em;
    font-weight: 500;
}}
</style>
"""
    
    return html


async def integrate_blog_with_website(blog_id: str, user_id: str) -> Dict[str, Any]:
    """
    Integrate a blog post into the user's existing website
    
    Args:
        blog_id: Blog ID to integrate
        user_id: User ID who owns the blog
        
    Returns:
        Dict with success status and updated website info
    """
    from pathlib import Path
    import json
    
    # Load blog data
    blogs_dir = Path("Backend/blogs")
    blog_file = blogs_dir / f"{blog_id}.json"
    
    if not blog_file.exists():
        raise ValueError(f"Blog {blog_id} not found")
    
    with open(blog_file, 'r', encoding='utf-8') as f:
        blog_data = json.load(f)
    
    # Find user's latest website
    websites_db = Path("Backend/ai_models/website_ai/data/websites.json")
    if not websites_db.exists():
        raise ValueError("No websites found. Please generate a website first.")
    
    with open(websites_db, 'r', encoding='utf-8') as f:
        websites_data = json.load(f)
    
    # Find the user's most recent website (you'll need to add user_id tracking to websites)
    # For now, we'll use the most recent website
    if not websites_data.get("websites"):
        raise ValueError("No websites found. Please generate a website first.")
    
    # Get the most recent website
    latest_website = max(websites_data["websites"], key=lambda w: w.get("created_at", ""))
    website_id = latest_website["id"]
    
    # Load the website HTML
    from ai_models.website_ai.app.core.services.storage_service import StorageService
    storage = StorageService()
    website_dir = storage.get_website_directory(website_id)
    html_file = website_dir / "index.html"
    
    if not html_file.exists():
        raise ValueError(f"Website HTML not found for {website_id}")
    
    with open(html_file, 'r', encoding='utf-8') as f:
        website_html = f.read()
    
    # Format blog content
    blog_html = format_blog_for_website(blog_data)
    
    # Create or update blog section in website
    # Look for existing blog section or add before footer
    if '<section id="blog"' in website_html or '<div id="blog"' in website_html:
        # Blog section exists, append to it
        import re
        # Find the blog section and append the new blog
        blog_section_pattern = r'(<(?:section|div)[^>]*id="blog"[^>]*>)(.*?)(</(?:section|div)>)'
        match = re.search(blog_section_pattern, website_html, re.DOTALL)
        
        if match:
            section_start, section_content, section_end = match.groups()
            # Add new blog to the section
            new_section = f"{section_start}{section_content}\n{blog_html}\n{section_end}"
            website_html = website_html.replace(match.group(0), new_section)
    else:
        # No blog section exists, create one before footer
        blog_section = f"""
<section id="blog" class="blog-section">
    <div class="container">
        <h2 class="section-title">Latest Blog Posts</h2>
        {blog_html}
    </div>
</section>

<style>
.blog-section {{
    padding: 80px 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}}

.section-title {{
    text-align: center;
    font-size: 2.5em;
    font-weight: 700;
    margin-bottom: 50px;
    color: #1a1a1a;
}}

.container {{
    max-width: 1200px;
    margin: 0 auto;
}}
</style>
"""
        
        # Insert before footer or at the end of body
        if '</footer>' in website_html:
            website_html = website_html.replace('</footer>', f'{blog_section}\n</footer>')
        elif '</body>' in website_html:
            website_html = website_html.replace('</body>', f'{blog_section}\n</body>')
        else:
            website_html += blog_section
    
    # Save updated website
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(website_html)
    
    logger.info(f"✅ Blog {blog_id} integrated into website {website_id}")
    
    return {
        "success": True,
        "website_id": website_id,
        "blog_id": blog_id,
        "message": f"Blog published to website successfully"
    }
