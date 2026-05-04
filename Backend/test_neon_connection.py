"""
Test NeonDB Connection
Run this script to test your NeonDB connection string
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def test_connection():
    """Test NeonDB connection with different configurations"""
    
    # Get the DATABASE_URL from .env
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not found in .env file")
        return
    
    print(f"📋 Testing connection to NeonDB...")
    print(f"🔗 URL: {database_url.split('@')[1] if '@' in database_url else 'Invalid URL'}")
    print()
    
    # Convert asyncpg URL to psycopg2 URL for testing
    sync_url = database_url.replace("postgresql+asyncpg", "postgresql")
    
    try:
        print("🔄 Attempting connection...")
        engine = create_engine(
            sync_url,
            echo=False,
            connect_args={
                "connect_timeout": 10,
                "sslmode": "require"
            }
        )
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print("✅ Connection successful!")
            print(f"📊 PostgreSQL version: {version[:50]}...")
            
            # Test if tables exist
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = result.fetchall()
            
            if tables:
                print(f"\n📁 Found {len(tables)} tables:")
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print("\n⚠️  No tables found in database")
            
            # Check for users table
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'users'
            """))
            has_users = result.fetchone()[0] > 0
            
            if has_users:
                result = conn.execute(text("SELECT COUNT(*) FROM users"))
                user_count = result.fetchone()[0]
                print(f"\n👥 Users table exists with {user_count} users")
            else:
                print("\n⚠️  Users table not found - database may need initialization")
        
        engine.dispose()
        print("\n✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed!")
        print(f"Error: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("1. Check your NeonDB dashboard for the correct connection string")
        print("2. Verify the password is correct")
        print("3. Ensure the database name is correct")
        print("4. Check if your IP is allowed (NeonDB usually allows all IPs)")
        return False

if __name__ == "__main__":
    test_connection()
