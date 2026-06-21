"""
Website Serving Routes
Scalable website serving system with custom domain support
"""

import logging
import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from config.database import get_db_sync

# Import website AI models
try:
    from ai_models.website_ai.app.db.models.website import Website
    from ai_models.website_ai.app.utils.uuid_helpers import validate_and_convert_uuid
    website_ai_available = True
except ImportError:
    website_ai_available = False

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/saadhyam",
    tags=["Website Serving"]
)

# Configuration
BASE_DIR = Path(__file__).resolve().parent.parent
WEBSITES_DIR = BASE_DIR / "websites"
WEBSITES_DIR.mkdir(parents=True, exist_ok=True)


class WebsiteNotFoundError(Exception):
    """Custom exception for website not found"""
    pass


class WebsiteFileNotFoundError(Exception):
    """Custom exception for website files not found"""
    pass


def get_website_directory(website_id: str) -> Path:
    """Get the directory path for a website"""
    return WEBSITES_DIR / website_id


def get_website_file_path(website_id: str, file_path: str = "index.html") -> Path:
    """Get the full path to a website file"""
    website_dir = get_website_directory(website_id)
    
    # Security: Prevent directory traversal
    if ".." in file_path or file_path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    return website_dir / file_path


async def get_website_from_db(identifier: str, db: Session) -> Optional[Website]:
    """
    Get website record from database by ID, slug, or business name
    Tries in order: slug -> UUID -> business name
    """
    if not website_ai_available:
        return None
    
    try:
        # Try 1: Look up by slug (most common for user-friendly URLs)
        website = db.query(Website).filter(
            Website.slug == identifier,
            Website.status == "active"
        ).first()
        
        if website:
            logger.info(f"✅ Found website by slug: {identifier}")
            return website
        
        # Try 2: Look up by UUID
        try:
            website_uuid = validate_and_convert_uuid(identifier)
            website = db.query(Website).filter(
                Website.id == website_uuid,
                Website.status == "active"
            ).first()
            
            if website:
                logger.info(f"✅ Found website by UUID: {identifier}")
                return website
        except:
            pass  # Not a valid UUID, continue to business name lookup
        
        # Try 3: Look up by business name (fallback)
        website = db.query(Website).filter(
            Website.business_name == identifier,
            Website.status == "active"
        ).first()
        
        if website:
            logger.info(f"✅ Found website by business name: {identifier}")
            return website
        
        logger.warning(f"❌ Website not found for identifier: {identifier}")
        return None
        
    except Exception as e:
        logger.error(f"Error fetching website {identifier}: {e}")
        return None


def get_content_type(file_path: str) -> str:
    """Get content type based on file extension"""
    extension = Path(file_path).suffix.lower()
    content_types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject'
    }
    return content_types.get(extension, 'text/plain')


from html.parser import HTMLParser

class _WebsiteHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.headline = ""
        self.about = ""
        self.contact = ""
        self.services = []
        self.faq = []
        
        # State tracking
        self.in_h1 = False
        self.in_details = False
        self.in_summary = False
        self.in_details_p = False
        self.in_hero_p = False
        self.in_contact_box = False
        self.in_contact_p = False
        
        # Service tracking
        self.in_service_card = False
        self.in_service_h3 = False
        self.in_service_p = False
        
        # Temp variables
        self.temp_question = ""
        self.temp_answer = ""
        self.current_service_name = ""
        self.current_service_desc = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        class_name = attrs_dict.get("class", "")
        
        if tag == "h1":
            self.in_h1 = True
        elif tag == "details":
            self.in_details = True
            self.temp_question = ""
            self.temp_answer = ""
        elif tag == "summary" and self.in_details:
            self.in_summary = True
        elif tag == "p" and self.in_details:
            self.in_details_p = True
        elif any(c in class_name for c in ["service-card", "service-item", "menu-item", "bento-item", "work-card", "card"]):
            self.in_service_card = True
            self.current_service_name = ""
            self.current_service_desc = ""
        elif tag == "h3" and self.in_service_card:
            self.in_service_h3 = True
        elif tag == "p" and self.in_service_card:
            self.in_service_p = True
        elif any(c in class_name for c in ["contact-box", "contact-card", "contact-section"]):
            self.in_contact_box = True
        elif tag == "p" and self.in_contact_box:
            self.in_contact_p = True
        elif tag == "p" and not self.about:
            self.in_hero_p = True

    def handle_endtag(self, tag):
        if tag == "h1":
            self.in_h1 = False
        elif tag == "details":
            self.in_details = False
            if self.temp_question.strip() and self.temp_answer.strip():
                self.faq.append({
                    "question": self.temp_question.strip(),
                    "answer": self.temp_answer.strip()
                })
        elif tag == "summary":
            self.in_summary = False
        elif tag == "p" and self.in_details:
            self.in_details_p = False
        elif tag == "h3" and self.in_service_card:
            self.in_service_h3 = False
        elif tag == "p" and self.in_service_card:
            self.in_service_p = False
        elif tag == "p" and self.in_contact_box:
            self.in_contact_p = False
        elif tag in ["div", "section"] and self.in_contact_box:
            self.in_contact_box = False
        elif tag == "p" and self.in_hero_p:
            self.in_hero_p = False
            
        if tag in ["div", "article"] and self.in_service_card:
            if self.current_service_name.strip():
                self.services.append({
                    "name": self.current_service_name.strip(),
                    "description": self.current_service_desc.strip()
                })
            self.in_service_card = False

    def handle_data(self, data):
        if self.in_h1:
            self.headline += data
        elif self.in_summary:
            self.temp_question += data
        elif self.in_details_p:
            self.temp_answer += data
        elif self.in_service_h3:
            self.current_service_name += data
        elif self.in_service_p:
            self.current_service_desc += data
        elif self.in_contact_p:
            self.contact += data
        elif self.in_hero_p:
            self.about += data


@router.get(
    "/{website_id}",
    response_class=HTMLResponse,
    summary="Serve website by ID or slug",
    description="Serve the main website page (index.html) for a given website ID/slug with any saved edits applied"
)
async def serve_website(
    website_id: str,
    request: Request,
    theme: Optional[str] = None,
    db: Session = Depends(get_db_sync)
):
    """
    Serve website by ID, slug, or business name with saved edits applied
    
    This endpoint serves the main website page (index.html) for a given website.
    It supports:
    - Slug-based URLs (e.g., /saadhyam/apple-store)
    - Direct website access via UUID
    - Business name lookup (fallback)
    - Inline content edits (applies saved edits if they exist)
    - Future custom domain mapping
    - Proper error handling for missing websites
    
    Args:
        website_id: Slug, UUID string, or business name of the website
        request: FastAPI request object (for future domain mapping)
        theme: Optional theme to dynamically switch template
        db: Database session
    
    Returns:
        HTML content of the website (with edits applied if any)
    
    Raises:
        404: Website not found or inactive
        500: Server error reading website files
    """
    logger.info(f"🌐 Serving website: {website_id}")
    
    try:
        # Validate website exists and is active (supports slug, UUID, or business name)
        website = await get_website_from_db(website_id, db)
        if not website:
            logger.warning(f"❌ Website not found or inactive: {website_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Website {website_id} not found or is not active"
            )
        
        # Use the actual website UUID for file operations
        from ai_models.website_ai.app.utils.uuid_helpers import uuid_to_string
        actual_website_id = uuid_to_string(website.id)
        
        # Get website file path
        index_path = get_website_file_path(actual_website_id, "index.html")
        
        # Support dynamic theme switching from URL parameter
        if theme:
            try:
                from ai_models.website_ai.app.services.template_service import list_themes, render_website
                from ai_models.website_ai.app.models.schema import WebsiteContent, WebsiteRequest
                from ai_models.website_ai.app.core.services.storage_service import StorageService
                
                available_themes = list_themes()
                if theme in available_themes and theme != website.theme:
                    logger.info(f"🔄 Dynamic theme switch requested: {website.theme} -> {theme} for website: {actual_website_id}")
                    
                    # 1. Try to extract edited content from existing index.html
                    extracted = {}
                    if index_path.exists():
                        try:
                            parser = _WebsiteHTMLParser()
                            with open(index_path, "r", encoding="utf-8") as f:
                                parser.feed(f.read())
                            extracted = {
                                "headline": parser.headline.strip(),
                                "about": parser.about.strip(),
                                "contact": parser.contact.strip(),
                                "services": parser.services,
                                "faq": parser.faq
                            }
                            logger.info(f"✨ Extracted content from existing index.html for {actual_website_id}")
                        except Exception as parse_err:
                            logger.warning(f"⚠️ Failed to parse existing index.html: {parse_err}")
                    
                    # 2. Construct content object, preferring extracted edits over default DB values
                    about_text = (extracted.get("about") or website.description or 
                                  f"{website.business_name} provides professional services.")
                    
                    services_list = (extracted.get("services") or website.services or [])
                    
                    faq_list = (extracted.get("faq") or [])
                    if not faq_list:
                        # Fallback default FAQs
                        faq_list = [
                            {"question": "What services do you offer?", "answer": f"We offer a wide range of professional services tailored to your needs. Please see our services section for details."},
                            {"question": "How can I contact you?", "answer": f"You can reach us via email at {website.contact_email or 'info@' + website.business_name.lower().replace(' ', '') + '.com'} or by calling {website.contact_phone or 'our office'}."},
                            {"question": "Where are you located?", "answer": f"We serve clients globally. You can find more contact options in our contact section."}
                        ]
                        
                    contact_text = (extracted.get("contact") or website.description or 
                                    f"Contact {website.business_name} for more information.")
                                    
                    demo_content = WebsiteContent(
                        about=about_text,
                        services=services_list,
                        faq=faq_list,
                        contact=contact_text,
                        audience=website.target_audience or "general customers",
                        tone=website.tone or "friendly and professional",
                        branding_style=website.branding_style or "clean and modern",
                    )
                    
                    demo_request = WebsiteRequest(
                        business_name=website.business_name,
                        business_type=website.business_type,
                        theme=theme
                    )
                    
                    # 3. Render new template
                    new_html = render_website(theme, demo_content, demo_request)
                    
                    # 4. Save files using storage system
                    storage_service = StorageService()
                    file_path, s3_key = storage_service.save_website_files(
                        website_id=actual_website_id,
                        html=new_html
                    )
                    
                    # 5. Update website record in database
                    website.theme = theme
                    if file_path:
                        website.html_file_path = file_path
                    if s3_key:
                        website.s3_key = s3_key
                    db.commit()
                    db.refresh(website)
                    
                    logger.info(f"✅ Website {actual_website_id} theme switched and saved to database successfully")
                    
                    # Update index_path to point to the new file path
                    index_path = get_website_file_path(actual_website_id, "index.html")
            except Exception as e:
                logger.error(f"❌ Failed to switch theme dynamically: {e}", exc_info=True)

        html_content = None
        
        # 1. Check if the website has a Cloudinary URL stored
        if website.html_file_path and website.html_file_path.startswith("http"):
            # Check if we already have it cached locally
            if index_path.exists():
                logger.info(f"📂 Serving cached website HTML from disk for {actual_website_id}")
                try:
                    with open(index_path, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                except Exception as read_err:
                    logger.warning(f"⚠️ Failed to read cached file: {read_err}")
            
            # If not cached locally (e.g. after container restart), download and cache it
            if not html_content:
                logger.info(f"☁️ Downloading website HTML from Cloudinary: {website.html_file_path}")
                try:
                    import urllib.request
                    # Create parent directory if missing
                    index_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Download HTML
                    response = urllib.request.urlopen(website.html_file_path, timeout=10)
                    html_content = response.read().decode('utf-8')
                    
                    # Write to local disk for fast serving next time and local asset resolution
                    with open(index_path, 'w', encoding='utf-8') as f:
                        f.write(html_content)
                    logger.info(f"✅ Successfully cached Cloudinary website locally to {index_path}")
                except Exception as dl_err:
                    logger.error(f"❌ Failed to download website from Cloudinary: {dl_err}")

        # 2. If it is a local path (or Cloudinary download failed), read local file
        if not html_content:
            if index_path.exists():
                logger.info(f"📂 Serving website HTML from disk for {actual_website_id}")
                try:
                    with open(index_path, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                except Exception as e:
                    logger.error(f"❌ Failed to read local website file: {e}")

        # 3. Fallback: If website HTML is still missing, dynamically regenerate it (Self-Healing)
        if not html_content:
            logger.warning(f"⚠️ Website files not found for {actual_website_id}. Automatically regenerating on-the-fly...")
            try:
                from ai_models.website_ai.app.services.template_service import render_website
                from ai_models.website_ai.app.models.schema import WebsiteContent, WebsiteRequest
                from ai_models.website_ai.app.core.services.storage_service import StorageService
                
                # Retrieve default values from the website record
                about_text = website.description or f"{website.business_name} provides professional services."
                services_list = website.services or []
                
                faq_list = [
                    {"question": "What services do you offer?", "answer": f"We offer a wide range of professional services tailored to your needs. Please see our services section for details."},
                    {"question": "How can I contact you?", "answer": f"You can reach us via email at {website.contact_email or 'info@' + website.business_name.lower().replace(' ', '') + '.com'} or by calling {website.contact_phone or 'our office'}."},
                    {"question": "Where are you located?", "answer": f"We serve clients globally. You can find more contact options in our contact section."}
                ]
                
                demo_content = WebsiteContent(
                    about=about_text,
                    services=services_list,
                    faq=faq_list,
                    contact=about_text,
                    audience=website.target_audience or "general customers",
                    tone=website.tone or "friendly and professional",
                    branding_style=website.branding_style or "clean and modern",
                )
                
                demo_request = WebsiteRequest(
                    business_name=website.business_name,
                    business_type=website.business_type,
                    theme=website.theme
                )
                
                html_content = render_website(website.theme, demo_content, demo_request)
                
                # Save files back to local storage (which will also upload to Cloudinary if configured)
                storage_service = StorageService()
                file_path, s3_key = storage_service.save_website_files(
                    website_id=actual_website_id,
                    html=html_content
                )
                
                # Update website record with the new path/url (file_path may be a Cloudinary URL)
                if file_path:
                    website.html_file_path = file_path
                    if s3_key:
                        website.s3_key = s3_key
                    db.commit()
                    if file_path.startswith("http"):
                        logger.info(f"✅ Successfully regenerated website and uploaded to Cloudinary: {file_path}")
                    else:
                        logger.info(f"✅ Successfully regenerated website to local disk: {file_path}")
                else:
                    logger.warning(f"⚠️ Regenerated website but no file_path returned — website may not persist across restarts")
                    
                logger.info(f"✅ Self-healing complete for website: {actual_website_id}")
            except Exception as regen_err:
                logger.error(f"❌ Failed to automatically regenerate website: {regen_err}", exc_info=True)
                raise HTTPException(
                    status_code=404,
                    detail=f"Website files not found for {website_id} and regeneration failed"
                )
        
        # Check if there are saved content edits
        try:
            from ai_models.website_ai.app.services.database import get_content
            saved_edits = get_content(actual_website_id)
            
            if saved_edits and saved_edits.get('content'):
                logger.info(f"✏️  Applying saved edits to website: {actual_website_id} (version {saved_edits.get('version', 1)})")
                
                content_data = saved_edits.get('content', {})
                
                # Check if full HTML was saved
                if 'html' in content_data and isinstance(content_data['html'], str):
                    # Use the saved HTML directly
                    html_content = content_data['html']
                    logger.info(f"✅ Using saved HTML version for website: {actual_website_id}")
                else:
                    # Apply individual element edits
                    import re
                    from html import escape, unescape
                    
                    edits_applied = 0
                    for element_id, new_content in content_data.items():
                        if isinstance(new_content, str):
                            # Try to find and replace element content by ID
                            # Pattern matches: <tag id="element_id">content</tag>
                            pattern = f'(<[^>]*\\bid=["\']?{re.escape(element_id)}["\']?[^>]*>)(.*?)(</[^>]+>)'
                            
                            def replacer(match):
                                nonlocal edits_applied
                                edits_applied += 1
                                return f'{match.group(1)}{new_content}{match.group(3)}'
                            
                            html_content = re.sub(
                                pattern,
                                replacer,
                                html_content,
                                flags=re.DOTALL | re.IGNORECASE
                            )
                    
                    if edits_applied > 0:
                        logger.info(f"✅ Applied {edits_applied} element edit(s) to website: {actual_website_id}")
                    else:
                        logger.warning(f"⚠️  No edits could be applied (0/{len(content_data)} elements found)")
        except Exception as e:
            logger.warning(f"⚠️  Could not apply saved edits: {e}")
            # Continue with original HTML if edits fail to apply
        
        logger.info(f"✅ Successfully served website: {website_id} (UUID: {actual_website_id})")
        
        # Inject website ID into HTML for editor
        # Add a script tag with the website ID before </head>
        website_id_script = f'''
    <script>
        // Website ID for editor
        window.WEBSITE_ID = '{actual_website_id}';
        console.log('🆔 Website ID:', window.WEBSITE_ID);
    </script>
'''
        html_content = html_content.replace('</head>', website_id_script + '</head>')
        
        return HTMLResponse(content=html_content)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error serving website {website_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error while serving website"
        )


@router.get(
    "/{website_id}/{file_path:path}",
    summary="Serve website assets",
    description="Serve static assets (CSS, JS, images) for a website"
)
async def serve_website_asset(
    website_id: str,
    file_path: str,
    request: Request,
    db: Session = Depends(get_db_sync)
):
    """
    Serve website assets (CSS, JS, images, etc.)
    
    This endpoint serves static assets for a website including:
    - CSS files
    - JavaScript files
    - Images (PNG, JPG, SVG, etc.)
    - Fonts
    - Other static resources
    
    Args:
        website_id: Slug, UUID string, or business name of the website
        file_path: Path to the asset file within the website directory
        request: FastAPI request object
        db: Database session
    
    Returns:
        File content with appropriate content type
    
    Raises:
        404: Website or file not found
        400: Invalid file path (security)
        500: Server error reading files
    """
    logger.info(f"📁 Serving asset: {website_id}/{file_path}")
    
    try:
        # Validate website exists and is active (supports slug, UUID, or business name)
        website = await get_website_from_db(website_id, db)
        if not website:
            logger.warning(f"❌ Website not found for asset: {website_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Website {website_id} not found"
            )
        
        # Use the actual website UUID for file operations
        from ai_models.website_ai.app.utils.uuid_helpers import uuid_to_string
        actual_website_id = uuid_to_string(website.id)
        
        # Get asset file path (with security validation)
        asset_path = get_website_file_path(actual_website_id, file_path)
        
        if not asset_path.exists():
            logger.warning(f"❌ Asset not found: {asset_path}")
            raise HTTPException(
                status_code=404,
                detail=f"Asset {file_path} not found for website {website_id}"
            )
        
        # Determine content type
        content_type = get_content_type(file_path)
        
        # Return file with appropriate content type
        logger.info(f"✅ Successfully served asset: {website_id}/{file_path}")
        return FileResponse(
            path=str(asset_path),
            media_type=content_type,
            filename=Path(file_path).name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error serving asset {website_id}/{file_path}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error while serving asset"
        )


# ============ Domain Mapping Support (Future) ============

@router.get(
    "/domain/{domain}",
    response_class=HTMLResponse,
    summary="Serve website by custom domain (Future)",
    description="Serve website mapped to a custom domain - for future implementation"
)
async def serve_website_by_domain(
    domain: str,
    request: Request,
    db: Session = Depends(get_db_sync)
):
    """
    Serve website by custom domain (Future feature)
    
    This endpoint will support custom domain mapping in the future.
    For now, it returns a placeholder response.
    
    Future implementation will:
    1. Look up website_id by domain mapping
    2. Serve the website content
    3. Support subdomain routing
    
    Args:
        domain: Custom domain name
        request: FastAPI request object
        db: Database session
    
    Returns:
        HTML content or placeholder
    """
    logger.info(f"🌍 Domain mapping request: {domain}")
    
    # TODO: Implement domain mapping
    # 1. Query domain_mappings table for website_id
    # 2. Call serve_website with the mapped website_id
    
    return HTMLResponse(
        content="""
        <html>
            <head><title>Domain Mapping - Coming Soon</title></head>
            <body>
                <h1>Custom Domain Support</h1>
                <p>Domain mapping for <strong>{domain}</strong> is coming soon!</p>
                <p>This feature will allow websites to be served from custom domains.</p>
            </body>
        </html>
        """.format(domain=domain)
    )


# ============ Utility Endpoints ============

@router.get(
    "/{website_id}/info",
    summary="Get website information",
    description="Get metadata about a website without serving the content"
)
async def get_website_info(
    website_id: str,
    db: Session = Depends(get_db_sync)
):
    """
    Get website information and metadata
    
    Returns basic information about a website including:
    - Business name and type
    - Theme used
    - Creation date
    - File availability
    
    Args:
        website_id: UUID string of the website
        db: Database session
    
    Returns:
        Website metadata and file information
    """
    logger.info(f"ℹ️  Getting info for website: {website_id}")
    
    try:
        # Get website from database
        website = await get_website_from_db(website_id, db)
        if not website:
            raise HTTPException(
                status_code=404,
                detail=f"Website {website_id} not found"
            )
        
        # Check file availability
        website_dir = get_website_directory(website_id)
        index_exists = (website_dir / "index.html").exists()
        
        # Get file list
        files = []
        if website_dir.exists():
            files = [f.name for f in website_dir.iterdir() if f.is_file()]
        
        return {
            "website_id": website_id,
            "business_name": website.business_name,
            "business_type": website.business_type,
            "theme": website.theme,
            "status": website.status,
            "created_at": website.created_at.isoformat(),
            "updated_at": website.updated_at.isoformat(),
            "files": {
                "index_exists": index_exists,
                "total_files": len(files),
                "file_list": files
            },
            "urls": {
                "website_url": f"/saadhyam/{website_id}",
                "info_url": f"/saadhyam/{website_id}/info"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting website info {website_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error while getting website info"
        )