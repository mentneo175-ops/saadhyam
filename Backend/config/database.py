"""
Database Configuration - Fully Async Architecture
"""

import logging
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv

load_dotenv(override=True)

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
    # For SQLite, use async engine with aiosqlite
    logger.info("📦 Using SQLite database with async support")
    
    # Convert to async SQLite URL
    async_sqlite_url = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
    
    # Async engine for SQLite
    async_engine = create_async_engine(
        async_sqlite_url,
        echo=False,
    )
    
    # Keep sync engine for migrations only
    sync_engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )
    
else:
    # For PostgreSQL, use asyncpg for full async support
    logger.info("🔄 Attempting to connect to PostgreSQL with asyncpg...")
    try:
        # Convert to asyncpg URL if needed and handle SSL
        if "postgresql://" in DATABASE_URL and "postgresql+asyncpg://" not in DATABASE_URL:
            ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
        else:
            ASYNC_DATABASE_URL = DATABASE_URL
        
        # Remove sslmode and channel_binding from URL query string if present, as asyncpg handles SSL differently
        from urllib.parse import urlparse, parse_qs, urlunparse, urlencode
        parsed_url = urlparse(ASYNC_DATABASE_URL)
        query_params = parse_qs(parsed_url.query)
        query_params.pop("sslmode", None)
        query_params.pop("channel_binding", None)
        new_query = urlencode(query_params, doseq=True)
        parsed_url = parsed_url._replace(query=new_query)
        ASYNC_DATABASE_URL = urlunparse(parsed_url)
        
        # Create async engine with asyncpg
        async_engine = create_async_engine(
            ASYNC_DATABASE_URL,
            echo=False,
            pool_pre_ping=True,          # Verify connections before use
            pool_size=20,                # Number of connections to maintain
            max_overflow=10,             # Additional connections when pool is full
            pool_timeout=30,             # Timeout for getting connection (seconds)
            pool_recycle=280,            # Recycle connections before Neon drops them (5 min idle)
            connect_args={
                "ssl": "require",        # asyncpg SSL configuration
                "server_settings": {
                    "application_name": "sadhyam_backend",
                }
            }
        )
        
        # Keep sync engine for migrations only (with original URL format)
        sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        sync_engine = create_engine(
            sync_url,
            echo=False,
            pool_pre_ping=True,
            pool_recycle=280,
            connect_args={
                "sslmode": "require",
                "connect_timeout": 30
            }
        )
        
        IS_SQLITE = False
        logger.info("✅ Using PostgreSQL (Neon DB) database with asyncpg")
        
    except Exception as e:
        logger.error(f"❌ PostgreSQL (NeonDB) async connection failed: {e}")
        logger.error("❌ SQLite fallback is disabled. NeonDB connection is required!")
        logger.error("Please check your DATABASE_URL in .env file")
        raise Exception(f"NeonDB async connection failed: {e}")

# Async Session factory (primary)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Sync Session factory (migrations only)
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get async database session (primary dependency)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_db_sync() -> Generator[Session, None, None]:
    """
    Get sync database session (DEPRECATED - use get_db() instead)
    Only for migrations and legacy code
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
    Initialize database tables using async engine
    """
    try:
        logger.info("🔄 Initializing database... (skipping table creation to avoid locks)")
        
        # Use async engine for table creation
        # async with async_engine.begin() as conn:
        #     await conn.run_sync(Base.metadata.create_all)
        
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise


async def close_db():
    """
    Close database connections
    """
    try:
        await async_engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database: {e}")
