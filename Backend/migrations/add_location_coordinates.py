"""
Add latitude and longitude columns to users table
"""

from sqlalchemy import text
from config.database import get_sync_db

def migrate_add_location_coordinates():
    """Add latitude and longitude columns"""
    db = next(get_sync_db())
    
    try:
        print("🔄 Adding location coordinate columns...")
        
        # Add latitude column
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS latitude FLOAT;
        """))
        
        # Add longitude column
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS longitude FLOAT;
        """))
        
        db.commit()
        print("✅ Location coordinate columns added successfully")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_add_location_coordinates()
