"""
Test authentication and token validation
"""

import sys
from config.database import SyncSessionLocal
from models.user import User
from utils.security import create_access_token, decode_token

def test_auth():
    """Test authentication flow"""
    db = SyncSessionLocal()
    
    try:
        # Find user
        user = db.query(User).filter(User.email == "suryasagar5659@gmail.com").first()
        
        if not user:
            print("❌ User not found")
            print("Please register first at: http://localhost:8080/register")
            return
        
        print("=" * 60)
        print("  AUTHENTICATION TEST")
        print("=" * 60)
        print()
        print(f"✅ User found:")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.name or 'Not set'}")
        print()
        
        # Generate token
        token = create_access_token(user.id, user.email)
        print(f"🔑 Generated Token:")
        print(f"   {token[:50]}...")
        print()
        
        # Decode token
        payload = decode_token(token)
        print(f"✅ Token decoded successfully:")
        print(f"   User ID: {payload.get('user_id')}")
        print(f"   Email: {payload.get('email')}")
        print()
        
        print("=" * 60)
        print("  TEST CURL COMMAND")
        print("=" * 60)
        print()
        print("Test the API with this curl command:")
        print()
        print(f'curl -X GET "http://localhost:8000/api/profile/business" \\')
        print(f'  -H "Authorization: Bearer {token}"')
        print()
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()


if __name__ == "__main__":
    test_auth()
