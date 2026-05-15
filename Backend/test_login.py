"""
Test login endpoint directly
"""
from config.database import get_db_for_migration
from services.auth_service_sync import authenticate_user
from utils.security import create_access_token
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_login():
    """Test login with existing user"""
    db = get_db_for_migration()
    
    try:
        # Try to authenticate with one of the existing users
        email = "suryasagar5659@gmail.com"
        password = "test123"  # You'll need to know the actual password
        
        logger.info(f"Testing login for: {email}")
        
        try:
            user = authenticate_user(db, email, password)
            logger.info(f"✅ Authentication successful: {user.email}")
            
            # Create token
            token = create_access_token(user.id, user.email)
            logger.info(f"✅ Token created: {token[:50]}...")
            
            return True
        except Exception as e:
            logger.error(f"❌ Authentication failed: {e}")
            return False
            
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
