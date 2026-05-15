"""
Create a simple test user for login testing
"""
import logging
from config.database import get_db_for_migration
from models.user import User
from utils.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_user():
    """Create a test user with known credentials"""
    db = get_db_for_migration()
    
    try:
        email = "testuser@example.com"
        password = "password123"
        
        # Check if user exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            logger.info(f"✅ Test user already exists: {email}")
            logger.info(f"   Password: {password}")
            return
        
        # Create new test user
        hashed_pw = hash_password(password)
        user = User(
            email=email,
            hashed_password=hashed_pw,
            name="Test User",
            auth_provider="email",
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"✅ Test user created successfully!")
        logger.info(f"   Email: {email}")
        logger.info(f"   Password: {password}")
        logger.info(f"   User ID: {user.id}")
        
    except Exception as e:
        logger.error(f"❌ Failed to create test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
