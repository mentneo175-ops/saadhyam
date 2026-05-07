"""
Migration: Add PDF and Website URL fields to users table
This allows users to edit their business profile and re-upload/re-import
"""

from sqlalchemy import text
from config.database import sync_engine


def upgrade():
    """Add pdf_file_url and website_url columns to users table"""
    
    with sync_engine.connect() as conn:
        # Add pdf_file_url column
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS pdf_file_url TEXT;
        """))
        
        # Add website_url column
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS website_url TEXT;
        """))
        
        conn.commit()
        
    print("✅ Migration completed: Added pdf_file_url and website_url to users table")


def downgrade():
    """Remove pdf_file_url and website_url columns from users table"""
    
    with sync_engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE users 
            DROP COLUMN IF EXISTS pdf_file_url;
        """))
        
        conn.execute(text("""
            ALTER TABLE users 
            DROP COLUMN IF EXISTS website_url;
        """))
        
        conn.commit()
        
    print("✅ Migration rolled back: Removed pdf_file_url and website_url from users table")


if __name__ == "__main__":
    print("🔄 Running migration: add_pdf_website_to_users")
    upgrade()
