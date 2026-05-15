"""
Generate a fresh authentication token for testing
"""

from config.database import SyncSessionLocal
from models.user import User
from utils.security import create_access_token

def generate_token_for_user(email: str):
    """Generate a fresh token for a user"""
    db = SyncSessionLocal()
    
    try:
        # Find user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User not found: {email}")
            print("Please register first")
            return None
        
        # Generate token
        token = create_access_token(user.id, user.email)
        
        print("=" * 80)
        print("  FRESH AUTHENTICATION TOKEN")
        print("=" * 80)
        print()
        print(f"User: {user.email}")
        print(f"ID: {user.id}")
        print()
        print("Token:")
        print(token)
        print()
        print("=" * 80)
        print("  COPY THIS TOKEN TO FRONTEND")
        print("=" * 80)
        print()
        print("1. Open browser console (F12)")
        print("2. Run this command:")
        print()
        print(f'localStorage.setItem("token", "{token}");')
        print('location.reload();')
        print()
        print("=" * 80)
        
        return token
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    email = "suryasagar5659@gmail.com"
    if len(sys.argv) > 1:
        email = sys.argv[1]
    
    generate_token_for_user(email)
