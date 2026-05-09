"""
Simple migration script to add latitude and longitude columns
Run this from Backend directory: python migrations/run_location_migration.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def run_migration():
    """Run the migration using environment variables"""
    try:
        # Import after path is set
        from sqlalchemy import create_engine, text
        from dotenv import load_dotenv
        
        # Load environment variables
        load_dotenv()
        
        # Get database URL from environment
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            print("❌ DATABASE_URL not found in .env file")
            print("Please set DATABASE_URL in Backend/.env")
            return False
        
        # Convert asyncpg URL to psycopg2 for sync operations
        if "postgresql+asyncpg://" in database_url:
            database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
        
        print(f"🔄 Connecting to database...")
        print(f"   URL: {database_url.split('@')[1] if '@' in database_url else 'localhost'}")
        
        # Remove sslmode from URL and add it to connect_args
        clean_url = database_url.replace("?sslmode=require", "")
        
        # Create engine with SSL support
        engine = create_engine(
            clean_url,
            connect_args={"sslmode": "require"}
        )
        
        # Run migration
        with engine.connect() as conn:
            print("🔄 Adding latitude column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude VARCHAR(50)"))
            
            print("🔄 Adding longitude column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude VARCHAR(50)"))
            
            conn.commit()
            
            print("✅ Migration completed successfully!")
            
            # Verify columns exist
            print("\n🔍 Verifying columns...")
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('latitude', 'longitude')
            """))
            
            columns = result.fetchall()
            if len(columns) == 2:
                print("✅ Columns verified:")
                for col in columns:
                    print(f"   - {col[0]}: {col[1]}")
            else:
                print("⚠️  Warning: Could not verify all columns")
            
            return True
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("\nMake sure you have installed dependencies:")
        print("   pip install sqlalchemy python-dotenv psycopg2-binary")
        return False
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("\nTroubleshooting:")
        print("1. Check DATABASE_URL in Backend/.env")
        print("2. Verify database is running")
        print("3. Check database credentials")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("B2B Network - Location Coordinates Migration")
    print("=" * 60)
    print()
    
    success = run_migration()
    
    print()
    print("=" * 60)
    if success:
        print("✅ Migration completed! You can now use the B2B Network.")
        print("\nNext steps:")
        print("1. Restart your backend server")
        print("2. Navigate to B2B Network page")
        print("3. Enjoy city-wide business discovery!")
    else:
        print("❌ Migration failed. Please check the errors above.")
        print("\nAlternative: Run the SQL manually:")
        print("   psql -U username -d database -f migrations/add_location_coords_simple.sql")
    print("=" * 60)
