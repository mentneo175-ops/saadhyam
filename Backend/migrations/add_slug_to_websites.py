"""
Migration: Add slug column to websites table
"""
import logging
import re
from sqlalchemy import create_engine, text
from config.settings import settings

logger = logging.getLogger(__name__)


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
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


def run_migration():
    """Add slug column to websites table and populate it"""
    try:
        logger.info("🔄 Running migration: add_slug_to_websites")
        
        # Use sync database URL
        database_url = settings.DATABASE_URL
        if database_url.startswith("postgresql+asyncpg://"):
            database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
        
        engine = create_engine(database_url)
        is_sqlite = "sqlite" in database_url
        
        with engine.connect() as conn:
            # Check if column already exists
            if is_sqlite:
                result = conn.execute(text("PRAGMA table_info(websites)"))
                columns = [row[1] for row in result.fetchall()]
                column_exists = 'slug' in columns
            else:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='websites' AND column_name='slug';
                """))
                column_exists = result.fetchone() is not None
            
            if column_exists:
                logger.info("   ⏭️  Column 'slug' already exists")
            else:
                # Add the column
                conn.execute(text("""
                    ALTER TABLE websites 
                    ADD COLUMN slug VARCHAR(150);
                """))
                logger.info("✅ Column 'slug' added to websites table")
            
            # Populate slugs for existing websites
            result = conn.execute(text("""
                SELECT id, business_name, slug FROM websites WHERE slug IS NULL OR slug = '';
            """))
            websites_without_slugs = result.fetchall()
            
            if websites_without_slugs:
                logger.info(f"📝 Generating slugs for {len(websites_without_slugs)} websites...")
                
                # Track used slugs to ensure uniqueness
                result = conn.execute(text("SELECT slug FROM websites WHERE slug IS NOT NULL AND slug != '';"))
                used_slugs = {row[0] for row in result.fetchall()}
                
                for website_id, business_name, current_slug in websites_without_slugs:
                    # Generate base slug
                    base_slug = slugify(business_name)
                    slug = base_slug
                    
                    # Ensure uniqueness by adding number suffix if needed
                    counter = 1
                    while slug in used_slugs:
                        slug = f"{base_slug}-{counter}"
                        counter += 1
                    
                    # Update the website with the slug
                    conn.execute(
                        text("UPDATE websites SET slug = :slug WHERE id = :id"),
                        {"slug": slug, "id": str(website_id)}
                    )
                    used_slugs.add(slug)
                    logger.info(f"   ✅ {business_name} → {slug}")
            
            conn.commit()
            logger.info("✅ Migration completed: slug column added and populated")
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    run_migration()
