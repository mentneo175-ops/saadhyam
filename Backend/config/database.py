"""
Database Configuration
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Base for all models
Base = declarative_base()

# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./test.db"
)

# Check if using SQLite or PostgreSQL
IS_SQLITE = "sqlite" in DATABASE_URL

if IS_SQLITE:
    # For SQLite, use sync engine only
    logger.info("📦 Using SQLite database")
    sync_engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )
    async_engine = None
else:
    # For PostgreSQL, try to connect, fallback to SQLite if fails
    logger.info("🔄 Attempting to connect to PostgreSQL...")
    try:
        # For asyncpg, we need to handle SSL differently
        import ssl
        
        # Test connection with psycopg2 first (sync)
        sync_url = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
        
        # Add SSL context for psycopg2
        test_engine = create_engine(
            sync_url,
            echo=False,
            pool_pre_ping=True,
            connect_args={
                "connect_timeout": 10,
                "sslmode": "require"
            }
        )
        
        with test_engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ PostgreSQL connection successful")
        
        # Create SSL context for asyncpg
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Use async engine for PostgreSQL with SSL
        async_engine = create_async_engine(
            DATABASE_URL,
            echo=False,
            future=True,
            pool_pre_ping=True,
            pool_size=20,
            max_overflow=0,
            connect_args={
                "ssl": ssl_context,
                "server_settings": {"jit": "off"}
            }
        )
        
        # Sync engine for sync operations
        SYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
        sync_engine = create_engine(
            SYNC_DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=0,
            connect_args={
                "sslmode": "require"
            }
        )
        IS_SQLITE = False
        test_engine.dispose()
        logger.info("✅ Using PostgreSQL (Neon DB) database")
        
    except Exception as e:
        logger.warning(f"⚠️  PostgreSQL connection failed: {e}")
        logger.warning("🔄 Falling back to SQLite...")
        
        # Fallback to SQLite
        DATABASE_URL = "sqlite:///./test.db"
        IS_SQLITE = True
        sync_engine = create_engine(
            DATABASE_URL,
            echo=False,
            connect_args={"check_same_thread": False}
        )
        async_engine = None
        logger.info("✅ Using SQLite as fallback database")

# Session factories
if not IS_SQLITE:
    AsyncSessionLocal = sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    expire_on_commit=False
)


async def get_db():
    """
    Get database session (sync for SQLite, sync for PostgreSQL)
    """
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_sync_db():
    """
    Get sync database session
    """
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


async def init_db():
    """
    Initialize database tables
    """
    try:
        logger.info("🔄 Initializing database...")
        
        if IS_SQLITE:
            # For SQLite, use sync
            Base.metadata.create_all(bind=sync_engine)
        else:
            # For PostgreSQL, use sync (easier for initialization)
            Base.metadata.create_all(bind=sync_engine)
        
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise


async def close_db():
    """
    Close database connections
    """
    try:
        if not IS_SQLITE and async_engine:
            await async_engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database: {e}")
