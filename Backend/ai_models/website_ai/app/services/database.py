"""Database service for storing website records"""
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from ai_models.website_ai.app.models.schema import StoredWebsite, WebsiteListItem, BusinessDetailsInput


DB_DIR = Path(__file__).parent.parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
WEBSITES_DB = DB_DIR / "websites.json"


def _load_db() -> dict:
    """Load the websites database"""
    if WEBSITES_DB.exists():
        try:
            with open(WEBSITES_DB, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {"websites": []}
    return {"websites": []}


def _save_db(data: dict) -> None:
    """Save the websites database"""
    with open(WEBSITES_DB, "w") as f:
        json.dump(data, f, indent=2)


def save_website(
    business_details: BusinessDetailsInput,
    theme: str,
    html_file: str
) -> StoredWebsite:
    """Save a generated website record"""
    db = _load_db()

    website_id = str(uuid.uuid4())[:8]
    now = datetime.now().isoformat()

    website = {
        "id": website_id,
        "business_name": business_details.business_name,
        "business_type": business_details.business_type,
        "description": business_details.description,
        "services": business_details.services,
        "target_audience": business_details.target_audience,
        "tone": business_details.tone,
        "branding_style": business_details.branding_style,
        "contact_email": business_details.contact_email,
        "contact_phone": business_details.contact_phone,
        "website_url": business_details.website_url,
        "theme": theme,
        "html_file": html_file,
        "created_at": now,
        "updated_at": now,
    }

    db["websites"].append(website)
    _save_db(db)

    return StoredWebsite(**website)


def get_all_websites() -> List[WebsiteListItem]:
    """Get all stored websites"""
    db = _load_db()
    websites = []

    for website in db.get("websites", []):
        websites.append(WebsiteListItem(
            id=website["id"],
            business_name=website["business_name"],
            business_type=website["business_type"],
            theme=website["theme"],
            created_at=website["created_at"],
            html_file=website["html_file"],
        ))

    # Sort by created_at descending (newest first)
    websites.sort(key=lambda x: x.created_at, reverse=True)
    return websites


def get_website(website_id: str) -> Optional[StoredWebsite]:
    """Get a specific website by ID"""
    db = _load_db()

    for website in db.get("websites", []):
        if website["id"] == website_id:
            return StoredWebsite(**website)

    return None


def delete_website(website_id: str) -> bool:
    """Delete a website record"""
    db = _load_db()

    original_count = len(db.get("websites", []))
    db["websites"] = [w for w in db.get("websites", []) if w["id"] != website_id]

    if len(db["websites"]) < original_count:
        _save_db(db)
        return True

    return False


def update_website(website_id: str, business_details: BusinessDetailsInput, theme: str) -> Optional[StoredWebsite]:
    """Update a website record"""
    db = _load_db()

    for website in db.get("websites", []):
        if website["id"] == website_id:
            website.update({
                "business_name": business_details.business_name,
                "business_type": business_details.business_type,
                "description": business_details.description,
                "services": business_details.services,
                "target_audience": business_details.target_audience,
                "tone": business_details.tone,
                "branding_style": business_details.branding_style,
                "contact_email": business_details.contact_email,
                "contact_phone": business_details.contact_phone,
                "website_url": business_details.website_url,
                "theme": theme,
                "updated_at": datetime.now().isoformat(),
            })
            _save_db(db)
            return StoredWebsite(**website)

    return None


def save_content(website_id: str, content: dict, theme: Optional[str] = None) -> dict:
    """Save inline-edited content for a website"""
    db = _load_db()

    # Initialize content storage if it doesn't exist
    if "content" not in db:
        db["content"] = {}

    now = datetime.now().isoformat()

    # Store the edited content
    # If 'html' key exists, it means the entire HTML was saved
    # Otherwise, it's individual element edits
    db["content"][website_id] = {
        "website_id": website_id,
        "content": content,
        "theme": theme,
        "updated_at": now,
        "version": db["content"].get(website_id, {}).get("version", 0) + 1
    }

    _save_db(db)
    
    # If full HTML was saved, write it back to the actual HTML file
    if "html" in content:
        # Use the new website ID-based directory structure
        # Path: Backend/websites/{website_id}/index.html
        backend_dir = Path(__file__).parent.parent.parent.parent.parent
        websites_dir = backend_dir / "websites" / website_id
        html_file_path = websites_dir / "index.html"
        
        # Write the updated HTML to the file
        try:
            websites_dir.mkdir(parents=True, exist_ok=True)
            html_file_path.write_text(content["html"], encoding="utf-8")
            print(f"✅ Updated local HTML file: {html_file_path}")
            
            # Also upload the updated HTML to Cloudinary if configured!
            import os
            cloudinary_configured = (
                os.getenv("CLOUDINARY_CLOUD_NAME") and
                os.getenv("CLOUDINARY_API_KEY") and
                os.getenv("CLOUDINARY_API_SECRET")
            )
            if cloudinary_configured:
                try:
                    import cloudinary.uploader
                    import cloudinary
                    cloudinary.config(
                        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
                        api_key=os.getenv("CLOUDINARY_API_KEY"),
                        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
                        secure=True
                    )
                    print(f"☁️ Uploading updated HTML to Cloudinary for ID: {website_id}")
                    upload_result = cloudinary.uploader.upload(
                        content["html"].encode("utf-8"),
                        resource_type="raw",
                        public_id=f"websites/{website_id}/index.html",
                        invalidate=True  # Invalidate Cloudinary CDN cache
                    )
                    print(f"✅ Updated HTML on Cloudinary: {upload_result.get('secure_url')}")
                except Exception as cloud_err:
                    print(f"❌ Failed to upload updated HTML to Cloudinary: {cloud_err}")
        except Exception as e:
            print(f"❌ Failed to write HTML file: {e}")
    
    return db["content"][website_id]


def get_content(website_id: str) -> Optional[dict]:
    """Get inline-edited content for a website"""
    db = _load_db()

    if "content" not in db:
        return None

    return db["content"].get(website_id)

