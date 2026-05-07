"""
Migration Script: SQLite to NeonDB
Migrates all data from local test.db to NeonDB cloud database
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database URLs
SQLITE_URL = "sqlite:///./test.db"
NEON_URL = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg", "postgresql")

if not NEON_URL or "sqlite" in NEON_URL:
    logger.error("❌ NeonDB URL not found in .env file!")
    logger.error("Please set DATABASE_URL in Backend/.env")
    sys.exit(1)

logger.info("=" * 60)
logger.info("🚀 Starting Migration: SQLite → NeonDB")
logger.info("=" * 60)

# Create engines
logger.info("📦 Connecting to SQLite (source)...")
sqlite_engine = create_engine(SQLITE_URL, echo=False)

logger.info("☁️  Connecting to NeonDB (destination)...")
try:
    neon_engine = create_engine(
        NEON_URL,
        echo=False,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"}
    )
    # Test connection
    with neon_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("✅ NeonDB connection successful")
except Exception as e:
    logger.error(f"❌ Failed to connect to NeonDB: {e}")
    sys.exit(1)

# Create sessions
SqliteSession = sessionmaker(bind=sqlite_engine)
NeonSession = sessionmaker(bind=neon_engine)

# Import models
from models.user import User
from db.models import BusinessAnalysis

def migrate_users():
    """Migrate users table"""
    logger.info("\n" + "=" * 60)
    logger.info("👥 Migrating Users...")
    logger.info("=" * 60)
    
    sqlite_session = SqliteSession()
    neon_session = NeonSession()
    
    try:
        # Get all users from SQLite using raw SQL to handle schema differences
        with sqlite_engine.connect() as conn:
            result = conn.execute(text("SELECT * FROM users"))
            users_data = result.fetchall()
            columns = result.keys()
        
        logger.info(f"📊 Found {len(users_data)} users in SQLite")
        
        if len(users_data) == 0:
            logger.warning("⚠️  No users to migrate")
            return
        
        migrated = 0
        skipped = 0
        
        for row in users_data:
            user_dict = dict(zip(columns, row))
            email = user_dict.get('email')
            
            # Check if user already exists in NeonDB
            existing = neon_session.query(User).filter(User.email == email).first()
            
            if existing:
                logger.info(f"⏭️  Skipping user: {email} (already exists)")
                skipped += 1
                continue
            
            # Create new user in NeonDB with available fields
            new_user = User(
                email=email,
                hashed_password=user_dict.get('hashed_password', ''),
                name=user_dict.get('name'),
                business_name=user_dict.get('business_name'),
                business_type=user_dict.get('business_type'),
                business_location=user_dict.get('business_location'),
                business_description=user_dict.get('business_description'),
                business_setup_completed=user_dict.get('business_setup_completed', False),
                created_at=user_dict.get('created_at')
            )
            neon_session.add(new_user)
            logger.info(f"✅ Migrated user: {email}")
            migrated += 1
        
        neon_session.commit()
        logger.info(f"\n✅ Users migration complete: {migrated} migrated, {skipped} skipped")
        
    except Exception as e:
        logger.error(f"❌ Error migrating users: {e}")
        neon_session.rollback()
        raise
    finally:
        sqlite_session.close()
        neon_session.close()


def migrate_business_analysis():
    """Migrate business_analysis table"""
    logger.info("\n" + "=" * 60)
    logger.info("📊 Migrating Business Analysis...")
    logger.info("=" * 60)
    
    sqlite_session = SqliteSession()
    neon_session = NeonSession()
    
    try:
        # Get all analyses from SQLite using raw SQL
        with sqlite_engine.connect() as conn:
            result = conn.execute(text("SELECT * FROM business_analysis"))
            analyses_data = result.fetchall()
            columns = result.keys()
        
        logger.info(f"📊 Found {len(analyses_data)} business analyses in SQLite")
        
        if len(analyses_data) == 0:
            logger.warning("⚠️  No business analyses to migrate")
            return
        
        migrated = 0
        
        for row in analyses_data:
            analysis_dict = dict(zip(columns, row))
            user_id_sqlite = analysis_dict.get('user_id')
            
            # Get user email from SQLite
            with sqlite_engine.connect() as conn:
                user_result = conn.execute(text(f"SELECT email FROM users WHERE id = {user_id_sqlite}"))
                user_row = user_result.fetchone()
            
            if not user_row:
                logger.warning(f"⚠️  User not found for analysis, skipping...")
                continue
            
            user_email = user_row[0]
            
            # Get corresponding user in NeonDB
            user = neon_session.query(User).filter(User.email == user_email).first()
            
            if not user:
                logger.warning(f"⚠️  User {user_email} not found in NeonDB, skipping...")
                continue
            
            # Check if analysis already exists
            business_name = analysis_dict.get('business_name')
            existing = neon_session.query(BusinessAnalysis).filter(
                BusinessAnalysis.user_id == user.id,
                BusinessAnalysis.business_name == business_name
            ).first()
            
            if existing:
                logger.info(f"⏭️  Updating existing analysis for: {business_name}")
                # Update all fields
                for key, value in analysis_dict.items():
                    if key not in ['id', 'user_id'] and hasattr(existing, key):
                        setattr(existing, key, value)
                existing.user_id = user.id
            else:
                # Create new analysis in NeonDB
                new_analysis = BusinessAnalysis(user_id=user.id)
                for key, value in analysis_dict.items():
                    if key not in ['id', 'user_id'] and hasattr(new_analysis, key):
                        setattr(new_analysis, key, value)
                
                neon_session.add(new_analysis)
                logger.info(f"✅ Migrated analysis for: {business_name}")
            
            migrated += 1
        
        neon_session.commit()
        logger.info(f"\n✅ Business analysis migration complete: {migrated} migrated")
        
    except Exception as e:
        logger.error(f"❌ Error migrating business analysis: {e}")
        neon_session.rollback()
        raise
    finally:
        sqlite_session.close()
        neon_session.close()


def main():
    """Main migration function"""
    try:
        # Migrate users first (foreign key dependency)
        migrate_users()
        
        # Migrate business analysis
        migrate_business_analysis()
        
        logger.info("\n" + "=" * 60)
        logger.info("🎉 Migration Complete!")
        logger.info("=" * 60)
        logger.info("✅ All data has been migrated to NeonDB")
        logger.info("💡 You can now delete test.db and restart the backend")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"\n❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
