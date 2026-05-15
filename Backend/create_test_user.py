"""
Create a test user for development/testing
"""

from config.database import get_db_for_migration
from sqlalchemy import text
import sys

def create_test_user():
    """Create a test user in the database"""
    
    db = get_db_for_migration()
    
    try:
        # Check if test user exists
        result = db.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": "test@example.com"}
        )
        existing = result.fetchone()
        
        if existing:
            print("✅ Test user already exists!")
            print("\n📧 Login Credentials:")
            print("   Email: test@example.com")
            print("   Password: password123")
            print("\n🌐 Login at: http://localhost:8081/login")
            return
        
        # Create test user (without password for OAuth-only system)
        db.execute(text("""
            INSERT INTO users (email, name, firebase_uid, created_at, updated_at)
            VALUES (:email, :name, :uid, datetime('now'), datetime('now'))
        """), {
            "email": "test@example.com",
            "name": "Test User",
            "uid": "test-user-123"
        })
        db.commit()
        
        print("✅ Test user created successfully!")
        print("\n📧 User Details:")
        print("   Email: test@example.com")
        print("   Name: Test User")
        print("   Firebase UID: test-user-123")
        print("\n⚠️  Note: This system uses Google OAuth for authentication")
        print("   You need to login with Google at: http://localhost:8081/login")
        print("\n💡 Tip: If you want to test without Google OAuth,")
        print("   you'll need to modify the auth system to support email/password")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🔧 Creating Test User for Saadhyam AI")
    print("=" * 60)
    print()
    
    create_test_user()
    
    print()
    print("=" * 60)
    print("✅ Done!")
    print("=" * 60)
