"""
Check which users have business profiles and locations
"""

from config.database import SyncSessionLocal
from models.user import User

def check_users():
    """Check all users and their business profile status"""
    db = SyncSessionLocal()
    
    try:
        users = db.query(User).all()
        
        print(f"\n{'='*80}")
        print(f"Total users: {len(users)}")
        print(f"{'='*80}\n")
        
        for user in users:
            print(f"User ID: {user.id}")
            print(f"  Email: {user.email}")
            print(f"  Business Name: {user.business_name}")
            print(f"  Business Type: {user.business_type}")
            print(f"  Business Location: {user.business_location}")
            print(f"  Coordinates: {user.latitude}, {user.longitude}")
            print(f"  Setup Completed: {user.business_setup_completed}")
            
            # Check if user will show in B2B Network
            if (user.business_name and user.business_type and 
                user.latitude and user.longitude):
                print(f"  ✅ WILL SHOW in B2B Network")
            else:
                print(f"  ❌ WILL NOT SHOW in B2B Network")
                if not user.business_name:
                    print(f"     Missing: business_name")
                if not user.business_type:
                    print(f"     Missing: business_type")
                if not user.latitude or not user.longitude:
                    print(f"     Missing: coordinates")
            
            print()
        
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
