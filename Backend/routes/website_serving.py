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
from config.database import get_sync_db

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


@router.get(
    "/{website_id}",
    response_class=HTMLResponse,
    summary="Serve website by ID or slug",
    description="Serve the main website page (index.html) for a given website ID/slug with any saved edits applied"
)
async def serve_website(
    website_id: str,
    request: Request,
    db: Session = Depends(get_sync_db)
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
        
        if not index_path.exists():
            logger.error(f"❌ Website files not found: {index_path}")
            raise HTTPException(
                status_code=404,
                detail=f"Website files not found for {website_id}"
            )
        
        # Read original HTML content
        with open(index_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
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
    db: Session = Depends(get_sync_db)
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
    db: Session = Depends(get_sync_db)
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
    db: Session = Depends(get_sync_db)
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