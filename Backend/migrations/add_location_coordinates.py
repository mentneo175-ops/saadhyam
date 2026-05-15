"""
Add latitude and longitude columns to users table
"""

from sqlalchemy import text
from config.database import get_db_for_migration

def migrate_add_location_coordinates():
    """Add latitude and longitude columns"""
    db = get_db_for_migration()
    
    try:
        print("[*] Adding location coordinate columns...")
        
        # Check database type
        from config.settings import settings
        is_sqlite = "sqlite" in settings.DATABASE_URL
        
        if is_sqlite:
            # SQLite doesn't support IF NOT EXISTS in ALTER TABLE
            # Check if columns exist first
            result = db.execute(text("PRAGMA table_info(users);"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'latitude' not in columns:
                db.execute(text("ALTER TABLE users ADD COLUMN latitude FLOAT;"))
            
            if 'longitude' not in columns:
                db.execute(text("ALTER TABLE users ADD COLUMN longitude FLOAT;"))
        else:
            # PostgreSQL supports IF NOT EXISTS
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS latitude FLOAT;
            """))
            
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS longitude FLOAT;
            """))
        
        db.commit()
        print("[OK] Location coordinate columns added successfully")
        
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_add_location_coordinates()
