"""
Database Configuration
"""

import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
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
        # For PostgreSQL without asyncpg
        import ssl
        
        # Use psycopg2 (sync) - asyncpg not available
        sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        
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
        
        # No async engine available without asyncpg
        async_engine = None
        
        # Sync engine for sync operations
        SYNC_DATABASE_URL = sync_url
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
        logger.info("✅ Using PostgreSQL (Neon DB) database with psycopg2")
        
    except Exception as e:
        logger.error(f"❌ PostgreSQL (NeonDB) connection failed: {e}")
        logger.error("❌ SQLite fallback is disabled. NeonDB connection is required!")
        logger.error("Please check your DATABASE_URL in .env file")
        raise Exception(f"NeonDB connection failed: {e}")

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


def get_db() -> Generator[Session, None, None]:
    """
    Get database session (sync for SQLite, sync for PostgreSQL)
    """
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_sync() -> Generator[Session, None, None]:
    """
    Get sync database session for Depends()
    Properly closes connection after use
    """
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_for_migration() -> Session:
    """
    Get sync database session for migrations
    Returns session directly (not a generator)
    Caller must close the session manually
    """
    return SyncSessionLocal()


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
