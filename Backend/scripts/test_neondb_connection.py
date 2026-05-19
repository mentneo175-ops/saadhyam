"""
Test NeonDB connection with updated credentials
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 80)
print("  TESTING NEONDB CONNECTION")
print("=" * 80)
print()
print(f"Database URL: {DATABASE_URL[:60]}...")
print()

try:
    # Convert asyncpg URL to psycopg2 for testing
    sync_url = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
    
    print("🔄 Creating engine...")
    engine = create_engine(
        sync_url,
        echo=False,
        pool_pre_ping=True,
        connect_args={
            "connect_timeout": 10,
            "sslmode": "require"
        }
    )
    
    print("🔄 Attempting connection...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        
        print()
        print("✅ CONNECTION SUCCESSFUL!")
        print()
        print(f"PostgreSQL Version: {version[:80]}...")
        print()
        
        # Test if users table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            )
        """))
        users_table_exists = result.fetchone()[0]
        
        if users_table_exists:
            print("✅ Users table exists")
            
            # Count users
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.fetchone()[0]
            print(f"📊 Total users: {user_count}")
            
            if user_count > 0:
                # Show users
                result = conn.execute(text("SELECT id, email, name FROM users LIMIT 5"))
                print()
                print("Users in database:")
                for row in result:
                    print(f"  - ID: {row[0]}, Email: {row[1]}, Name: {row[2] or 'N/A'}")
        else:
            print("⚠️  Users table does not exist yet")
            print("   Tables will be created when backend starts")
        
    print()
    print("=" * 80)
    print("  ✅ NEONDB IS READY TO USE!")
    print("=" * 80)
    print()
    print("Next steps:")
    print("1. Stop the backend if running")
    print("2. Delete SQLite files: del *.db")
    print("3. Restart backend")
    print("4. Register with suryasagar5659@gmail.com")
    print()
    
    engine.dispose()
    
except Exception as e:
    print()
    print("❌ CONNECTION FAILED!")
    print()
    print(f"Error: {e}")
    print()
    print("=" * 80)
    print("  TROUBLESHOOTING")
    print("=" * 80)
    print()
    print("1. Check your NeonDB credentials at: https://console.neon.tech/")
    print("2. Make sure the database is not paused")
    print("3. Verify the connection string in .env file")
    print()
