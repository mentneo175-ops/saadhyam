"""
Direct test of auth service to see the actual error
"""
import sys
import logging
from config.database import get_db_for_migration
from services.auth_service_sync import authenticate_user
from schemas.user_schema import UserLogin

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_auth():
    """Test authentication directly"""
    db = get_db_for_migration()
    
    try:
        logger.info("Testing authentication...")
        
        # Try with a test user
        email = "test@example.com"
        password = "test123"
        
        logger.info(f"Attempting login for: {email}")
        
        try:
            user = authenticate_user(db, email, password)
            logger.info(f"✅ Success: {user.email}")
        except Exception as e:
            logger.error(f"❌ Auth failed: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    test_auth()
