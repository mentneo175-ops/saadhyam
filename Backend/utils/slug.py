"""
Slug generation utilities
"""
import re
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text


def slugify(text: str) -> str:
    """
    Convert text to URL-friendly slug
    
    Examples:
        "Apple Store" -> "apple-store"
        "My Business & Co." -> "my-business-co"
        "Test___Business" -> "test-business"
    
    Args:
        text: Text to convert to slug
        
    Returns:
        URL-friendly slug
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    # Replace spaces and underscores with hyphens
    text = re.sub(r'[\s_]+', '-', text)
    # Remove special characters except hyphens
    text = re.sub(r'[^\w\-]', '', text)
    # Remove multiple consecutive hyphens
    text = re.sub(r'-+', '-', text)
    # Strip hyphens from start and end
    text = text.strip('-')
    
    return text


def generate_unique_slug(base_text: str, db: Session, table_name: str = "websites") -> str:
    """
    Generate a unique slug by adding number suffix if needed
    
    Args:
        base_text: Text to convert to slug
        db: Database session
        table_name: Table name to check for uniqueness
        
    Returns:
        Unique slug
    """
    base_slug = slugify(base_text)
    
    if not base_slug:
        # Fallback to random string if slug is empty
        import uuid
        base_slug = f"website-{str(uuid.uuid4())[:8]}"
    
    slug = base_slug
    counter = 1
    
    # Check if slug exists
    while True:
        result = db.execute(
            text(f"SELECT COUNT(*) FROM {table_name} WHERE slug = :slug"),
            {"slug": slug}
        )
        count = result.scalar()
        
        if count == 0:
            # Slug is unique
            break
        
        # Try with number suffix
        slug = f"{base_slug}-{counter}"
        counter += 1
        
        # Safety limit to prevent infinite loop
        if counter > 1000:
            import uuid
            slug = f"{base_slug}-{str(uuid.uuid4())[:8]}"
            break
    
    return slug


def update_slug_if_needed(website_id: str, business_name: str, current_slug: Optional[str], db: Session) -> str:
    """
    Update slug if business name changed or slug is missing
    
    Args:
        website_id: Website ID
        business_name: Current business name
        current_slug: Current slug (may be None)
        db: Database session
        
    Returns:
        Updated or existing slug
    """
    # If no slug exists, generate one
    if not current_slug:
        new_slug = generate_unique_slug(business_name, db)
        db.execute(
            text("UPDATE websites SET slug = :slug WHERE id = :id"),
            {"slug": new_slug, "id": website_id}
        )
        db.commit()
        return new_slug
    
    # Check if business name changed significantly
    expected_slug = slugify(business_name)
    
    # If slug doesn't match business name (ignoring number suffixes), update it
    if not current_slug.startswith(expected_slug):
        new_slug = generate_unique_slug(business_name, db)
        db.execute(
            text("UPDATE websites SET slug = :slug WHERE id = :id"),
            {"slug": new_slug, "id": website_id}
        )
        db.commit()
        return new_slug
    
    return current_slug
