"""
Auto Blogger Service
Generates SEO-optimized blog posts based on business details and web search
Publishes to customer website automatically
Uses multiple API keys with automatic fallback
"""

import logging
import json
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import pytz
import google.generativeai as genai
from config.settings import settings
from services.rate_limiter import gemini_rate_limiter
from services.business_pinecone_service import get_business_context_from_pinecone, store_web_fetched_data_in_pinecone

logger = logging.getLogger(__name__)

# Multiple Gemini API Keys for fallback - Read from environment variables
GEMINI_API_KEYS = []

# Try to get API keys from environment variables
gemini_key_1 = os.getenv("GEMINI_API_KEY")
gemini_key_2 = os.getenv("GEMINI_API_KEY_2")
gemini_key_3 = os.getenv("GEMINI_API_KEY_3")

# Add keys to list if they exist
if gemini_key_1:
    GEMINI_API_KEYS.append(gemini_key_1)
if gemini_key_2:
    GEMINI_API_KEYS.append(gemini_key_2)
if gemini_key_3:
    GEMINI_API_KEYS.append(gemini_key_3)

# Fallback to hardcoded keys if no env vars found (for backward compatibility)
if not GEMINI_API_KEYS:
    logger.warning("[AutoBlogger] No GEMINI_API_KEY found in environment variables, using fallback keys")
    GEMINI_API_KEYS = [
        "AIzaSyCcyGPNjLNBrjylqIOlaoU8Oa2RVM2zoC0",  # Primary key (likely exhausted)
        "AIzaSyCFxC-0DBXbdCZyNnVYAk3A9pAh0H5hI7w",  # Secondary key (likely exhausted)
    ]

logger.info(f"[AutoBlogger] Loaded {len(GEMINI_API_KEYS)} API key(s) for fallback")

# Track which key index to use
current_key_index = 0


def get_next_api_key():
    """Get next available API key"""
    global current_key_index
    if current_key_index >= len(GEMINI_API_KEYS):
        current_key_index = 0  # Reset to first key
    key = GEMINI_API_KEYS[current_key_index]
    logger.info(f"[AutoBlogger] Using API key #{current_key_index + 1}")
    return key


def switch_to_next_key():
    """Switch to next API key"""
    global current_key_index
    current_key_index += 1
    if current_key_index < len(GEMINI_API_KEYS):
        key = GEMINI_API_KEYS[current_key_index]
        genai.configure(api_key=key)
        logger.info(f"[AutoBlogger] Switched to API key #{current_key_index + 1}")
        return True
    return False


# Configure with first API key
genai.configure(api_key=GEMINI_API_KEYS[0])


async def generate_blog_post(
    user_id: int,
    business_name: str,
    business_type: str,
    location: str,
    topic: Optional[str] = None,
    keywords: Optional[list] = None
) -> Dict[str, Any]:
    """
    Generate SEO-optimized blog post using business details + web search + Pinecone context
    
    Args:
        user_id: User ID
        business_name: Business name
        business_type: Business type
        location: Business location
        topic: Optional specific topic for blog
        keywords: Optional SEO keywords to include
    
    Returns:
        Dict with generated blog post
    """
    
    try:
        logger.info(f"[AutoBlogger] Generating blog post for {business_name}")
        
        # Check if we have API keys configured
        if not GEMINI_API_KEYS or not GEMINI_API_KEYS[0]:
            return {
                "status": "error",
                "message": "Gemini API not configured. Cannot generate blog post."
            }
        
        # 1. Get business context from Pinecone
        query = topic if topic else f"{business_type} in {location} blog topics"
        business_context = await get_business_context_from_pinecone(user_id, query, top_k=5)
        
        # Format business context
        context_text = ""
        if business_context:
            context_text = "Business Insights:\n"
            for ctx in business_context:
                context_text += f"- {ctx['text']}\n"
        
        # 2. Perform web search for real-time data
        from services.web_search_service import web_search_service
        
        search_query = topic if topic else f"Latest trends and tips for {business_type} in {location}"
        search_results = await web_search_service.search(search_query, max_results=5)
        
        # Format search results for prompt
        web_research = ""
        if search_results.get('results'):
            web_research = web_search_service.format_search_results_for_prompt(search_results)
            logger.info(f"[AutoBlogger] ✅ Web search via {search_results['provider']} returned {len(search_results['results'])} results")
        else:
            web_research = "No web search results available. Will use Google Search Grounding instead."
            logger.info("[AutoBlogger] ⚠️ No web search results, will use Google Grounding")
        
        # 3. Build comprehensive prompt for Gemini
        prompt = f"""You are an expert content writer and SEO specialist.

Generate a comprehensive, SEO-optimized blog post for this business:

**Business Details:**
- Business Name: {business_name}
- Business Type: {business_type}
- Location: {location}
- Topic: {topic if topic else f"Best practices and tips for {business_type}"}
- SEO Keywords: {', '.join(keywords) if keywords else f"{business_type}, {location}, local business"}

**Business Context from Analysis:**
{context_text if context_text else "No additional context available"}

**Web Research Results:**
{web_research}

**Your Task:**
Based on the web research above and your knowledge, create a blog post that:
1. Incorporates insights from the web research
2. Addresses latest trends in {business_type} industry
3. Provides solutions to customer pain points
4. Includes local market insights for {location}
5. Answers popular questions people ask about {business_type}

Generate a blog post in this EXACT JSON format:

{{
  "title": "Compelling, SEO-optimized title (60-70 characters)",
  "meta_description": "Engaging meta description (150-160 characters)",
  "slug": "url-friendly-slug",
  "featured_image_prompt": "Detailed prompt for AI image generation",
  "introduction": "Engaging 2-3 paragraph introduction that hooks the reader",
  "main_content": [
    {{
      "heading": "H2 heading",
      "content": "2-3 paragraphs of valuable content",
      "subheadings": [
        {{
          "heading": "H3 subheading",
          "content": "1-2 paragraphs"
        }}
      ]
    }}
  ],
  "conclusion": "Strong conclusion with call-to-action",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "Main category",
  "reading_time": 5,
  "word_count": 1500,
  "faq": [
    {{
      "question": "Common question 1",
      "answer": "Detailed answer"
    }},
    {{
      "question": "Common question 2",
      "answer": "Detailed answer"
    }}
  ],
  "internal_links": [
    {{
      "anchor_text": "Link text",
      "url": "/related-page",
      "context": "Where to place this link"
    }}
  ],
  "cta": {{
    "text": "Call-to-action text",
    "button_text": "Button text",
    "link": "/contact"
  }}
}}

**CRITICAL REQUIREMENTS:**
1. Use REAL data from the web research provided above
2. Be specific to {location} and {business_type}
3. Include actual industry trends and insights from the research
4. Write in engaging, conversational tone
5. Optimize for SEO (keywords, headings, meta)
6. Include actionable tips and advice
7. Add FAQ section for voice search optimization
8. Suggest internal links for better SEO
9. Return ONLY valid JSON, no markdown formatting
10. Minimum 1500 words of high-quality content

Generate the blog post now:"""

        # Apply rate limiting
        await gemini_rate_limiter.acquire()
        
        remaining = gemini_rate_limiter.get_remaining_requests()
        logger.info(f"[AutoBlogger] 🔒 Rate limit check passed. Remaining requests: {remaining}/5")
        
        # Decide whether to use Google Grounding based on web search results
        use_grounding = not search_results.get('results')  # Use grounding only if no web search results
        
        # Try with current API key and models
        content_text = None
        models_to_try = [
            'models/gemini-2.5-flash',
            'models/gemini-2.0-flash',
            'models/gemini-flash-latest'
        ]
        
        for key_attempt in range(len(GEMINI_API_KEYS)):
            for model_name in models_to_try:
                try:
                    logger.info(f"[AutoBlogger] Trying {model_name} with API key #{current_key_index + 1}")
                    
                    model = genai.GenerativeModel(
                        model_name,
                        generation_config={
                            "temperature": 0.8,
                            "top_p": 0.95,
                            "top_k": 40,
                            "max_output_tokens": 8192,
                        }
                    )
                    
                    # Use Google Search grounding only if no web search results
                    if use_grounding:
                        logger.info(f"[AutoBlogger] Using Google Search grounding as fallback")
                        response = model.generate_content(
                            prompt,
                            tools='google_search_retrieval'
                        )
                    else:
                        logger.info(f"[AutoBlogger] Using web search results (no grounding needed)")
                        response = model.generate_content(prompt)
                    
                    content_text = response.text
                    logger.info(f"[AutoBlogger] ✅ Successfully used {model_name} with API key #{current_key_index + 1}")
                    break
                    
                except Exception as e:
                    error_msg = str(e)
                    logger.warning(f"[AutoBlogger] {model_name} failed: {error_msg[:150]}")
                    
                    # Check if it's a quota error
                    if "quota" in error_msg.lower() or "429" in error_msg:
                        logger.info(f"[AutoBlogger] Quota exceeded for API key #{current_key_index + 1}")
                        continue  # Try next model with same key
                    else:
                        continue  # Try next model
            
            # If we got content, break out of key loop
            if content_text:
                break
            
            # Try switching to next API key
            if key_attempt < len(GEMINI_API_KEYS) - 1:
                if switch_to_next_key():
                    logger.info(f"[AutoBlogger] Switched to next API key, retrying...")
                    await gemini_rate_limiter.acquire()  # Rate limit for new key
                else:
                    break
        
        # If still no content, all keys exhausted
        if not content_text:
            # Calculate time until quota reset
            pt = pytz.timezone('America/Los_Angeles')
            now_pt = datetime.now(pt)
            midnight_pt = now_pt.replace(hour=23, minute=59, second=59) + timedelta(seconds=1)
            time_until_reset = midnight_pt - now_pt
            hours = int(time_until_reset.total_seconds() // 3600)
            minutes = int((time_until_reset.total_seconds() % 3600) // 60)
            
            return {
                "status": "error",
                "message": f"All API keys exhausted. Free tier: 20 requests/day per key. Quota resets in ~{hours}h {minutes}m (midnight PT). Please try again later or upgrade at: https://ai.google.dev/pricing"
            }
        
        # Parse JSON response
        content_text = content_text.strip()
        if content_text.startswith('```json'):
            content_text = content_text[7:]
        if content_text.startswith('```'):
            content_text = content_text[3:]
        if content_text.endswith('```'):
            content_text = content_text[:-3]
        content_text = content_text.strip()
        
        blog_data = json.loads(content_text)
        
        # Store blog content in Pinecone for future reference
        blog_text = f"{blog_data['title']}. {blog_data['introduction']}"
        await store_web_fetched_data_in_pinecone(
            user_id=user_id,
            query=topic if topic else f"{business_type} blog",
            web_data=blog_text,
            source="auto_blogger"
        )
        
        logger.info(f"[AutoBlogger] ✅ Blog post generated successfully")
        logger.info(f"[AutoBlogger] Title: {blog_data['title']}")
        logger.info(f"[AutoBlogger] Word count: {blog_data.get('word_count', 'N/A')}")
        
        return {
            "status": "success",
            "blog_post": blog_data,
            "generated_at": datetime.utcnow().isoformat(),
            "source": "gemini_search_grounding"
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"[AutoBlogger] ❌ Failed to parse Gemini response as JSON: {e}")
        return {
            "status": "error",
            "message": "Failed to parse blog post. Please try again."
        }
    except Exception as e:
        logger.error(f"[AutoBlogger] ❌ Error generating blog post: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to generate blog post: {str(e)}"
        }


async def publish_blog_to_website(
    user_id: int,
    blog_post: Dict[str, Any],
    business_name: str
) -> Dict[str, Any]:
    """
    Publish blog post to customer website
    
    Args:
        user_id: User ID
        blog_post: Generated blog post data
        business_name: Business name for website identification
    
    Returns:
        Dict with publish status
    """
    
    try:
        logger.info(f"[AutoBlogger] Publishing blog to website for user {user_id}")
        
        from pathlib import Path
        from jinja2 import Environment, FileSystemLoader
        import json
        
        # Define paths
        website_output_dir = Path("ai_models/website_ai/output")
        website_output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create blog post HTML file
        template_dir = Path("ai_models/website_ai/app/templates")
        env = Environment(loader=FileSystemLoader(str(template_dir)))
        template = env.get_template("blog-post.html")
        
        # Format main content as HTML
        main_content_html = ""
        for section in blog_post.get("main_content", []):
            main_content_html += f"<h2>{section['heading']}</h2>\n"
            main_content_html += f"<p>{section['content']}</p>\n"
            
            for subsection in section.get("subheadings", []):
                main_content_html += f"<h3>{subsection['heading']}</h3>\n"
                main_content_html += f"<p>{subsection['content']}</p>\n"
        
        # Render blog post HTML
        blog_html = template.render(
            title=blog_post["title"],
            meta_description=blog_post["meta_description"],
            keywords=", ".join(blog_post.get("seo_keywords", [])),
            business_name=business_name,
            category=blog_post.get("category", "Blog"),
            published_date=blog_post.get("published_at", datetime.utcnow().strftime("%B %d, %Y")),
            reading_time=blog_post.get("reading_time", 5),
            introduction=blog_post["introduction"],
            main_content=main_content_html,
            conclusion=blog_post["conclusion"],
            faq=blog_post.get("faq", []),
            cta=blog_post.get("cta"),
            tags=blog_post.get("tags", [])
        )
        
        # Save blog post HTML
        blog_filename = f"blog-{blog_post['slug']}.html"
        blog_path = website_output_dir / blog_filename
        with open(blog_path, "w", encoding="utf-8") as f:
            f.write(blog_html)
        
        logger.info(f"[AutoBlogger] ✅ Blog post HTML created: {blog_filename}")
        
        # Update or create blogs.json file
        blogs_json_path = website_output_dir / "blogs.json"
        
        # Load existing blogs
        existing_blogs = []
        if blogs_json_path.exists():
            try:
                with open(blogs_json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    existing_blogs = data.get("blogs", [])
            except Exception as e:
                logger.warning(f"[AutoBlogger] Could not load existing blogs.json: {e}")
        
        # Add new blog to list (or update if exists)
        blog_entry = {
            "id": blog_post.get("id"),
            "title": blog_post["title"],
            "slug": blog_post["slug"],
            "meta_description": blog_post["meta_description"],
            "category": blog_post.get("category", "Blog"),
            "introduction": blog_post["introduction"],
            "reading_time": blog_post.get("reading_time", 5),
            "published_at": blog_post.get("published_at", datetime.utcnow().isoformat()),
            "tags": blog_post.get("tags", []),
            "url": blog_filename
        }
        
        # Check if blog already exists (update) or add new
        existing_index = next((i for i, b in enumerate(existing_blogs) if b.get("slug") == blog_post["slug"]), None)
        if existing_index is not None:
            existing_blogs[existing_index] = blog_entry
            logger.info(f"[AutoBlogger] Updated existing blog in blogs.json")
        else:
            existing_blogs.insert(0, blog_entry)  # Add to beginning (most recent first)
            logger.info(f"[AutoBlogger] Added new blog to blogs.json")
        
        # Save updated blogs.json
        with open(blogs_json_path, "w", encoding="utf-8") as f:
            json.dump({"blogs": existing_blogs}, f, indent=2)
        
        logger.info(f"[AutoBlogger] ✅ blogs.json updated")
        
        # Create/update blogs listing page
        blogs_page_template = env.get_template("blogs-page.html")
        blogs_page_html = blogs_page_template.render(business_name=business_name)
        
        blogs_page_path = website_output_dir / "blogs.html"
        with open(blogs_page_path, "w", encoding="utf-8") as f:
            f.write(blogs_page_html)
        
        logger.info(f"[AutoBlogger] ✅ blogs.html page created/updated")
        
        # Integrate blog into user's confirmed website (if they have one)
        from services.website_blog_integrator import integrate_blog_into_website
        from config.database import get_sync_db
        from ai_models.website_ai.app.db.session import get_db as get_website_db
        
        # Get both database sessions
        user_db = next(get_sync_db())
        website_db = next(get_website_db())
        
        try:
            # Check if user has a confirmed website
            from models.user import User
            user = user_db.query(User).filter(User.id == user_id).first()
            confirmed_website_id = user.last_generated_website_id if user else None
            
            if confirmed_website_id:
                logger.info(f"[AutoBlogger] User has confirmed website {confirmed_website_id}, integrating blog...")
                
                # Integrate blog into website
                integration_result = await integrate_blog_into_website(
                    user_id=user_id,
                    website_id=confirmed_website_id,
                    blog_post=blog_post,
                    db=website_db
                )
                
                if integration_result['status'] == 'success':
                    logger.info(f"[AutoBlogger] ✅ Blog integrated into confirmed website")
                else:
                    logger.warning(f"[AutoBlogger] ⚠️ Blog integration failed: {integration_result.get('message')}")
            else:
                logger.info(f"[AutoBlogger] User has no confirmed website, skipping integration")
        except Exception as e:
            logger.error(f"[AutoBlogger] ❌ Error during blog integration: {e}", exc_info=True)
        finally:
            user_db.close()
            website_db.close()
        
        return {
            "status": "success",
            "message": "Blog post published to website successfully",
            "blog_url": f"/website-ai/output/{blog_filename}",
            "blogs_page_url": f"/website-ai/output/blogs.html",
            "files_created": [blog_filename, "blogs.json", "blogs.html"],
            "integrated_into_website": confirmed_website_id is not None
        }
        
    except Exception as e:
        logger.error(f"[AutoBlogger] ❌ Error publishing blog: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Failed to publish blog: {str(e)}"
        }


def format_blog_content_html(blog_post: Dict[str, Any]) -> str:
    """
    Format blog post content as HTML
    
    Args:
        blog_post: Blog post data
    
    Returns:
        HTML formatted content
    """
    
    html = f"""
<article class="blog-post">
    <header>
        <h1>{blog_post['title']}</h1>
        <p class="meta-description">{blog_post['meta_description']}</p>
        <p class="reading-time">Reading time: {blog_post.get('reading_time', 5)} minutes</p>
    </header>
    
    <section class="introduction">
        {blog_post['introduction']}
    </section>
    
    <main class="main-content">
"""
    
    # Add main content sections
    for section in blog_post.get('main_content', []):
        html += f"""
        <section>
            <h2>{section['heading']}</h2>
            <p>{section['content']}</p>
"""
        
        # Add subheadings
        for subsection in section.get('subheadings', []):
            html += f"""
            <h3>{subsection['heading']}</h3>
            <p>{subsection['content']}</p>
"""
        
        html += """
        </section>
"""
    
    html += """
    </main>
    
    <section class="conclusion">
"""
    html += f"        {blog_post['conclusion']}\n"
    html += """
    </section>
"""
    
    # Add FAQ section
    if blog_post.get('faq'):
        html += """
    <section class="faq">
        <h2>Frequently Asked Questions</h2>
"""
        for faq in blog_post['faq']:
            html += f"""
        <div class="faq-item">
            <h3>{faq['question']}</h3>
            <p>{faq['answer']}</p>
        </div>
"""
        html += """
    </section>
"""
    
    # Add CTA
    if blog_post.get('cta'):
        cta = blog_post['cta']
        html += f"""
    <section class="cta">
        <p>{cta['text']}</p>
        <a href="{cta['link']}" class="cta-button">{cta['button_text']}</a>
    </section>
"""
    
    html += """
</article>
"""
    
    return html
