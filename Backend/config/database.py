"""
Database Configuration
"""

import logging
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.engine import make_url

load_dotenv()

logger = logging.getLogger(__name__)

# Base for all models
Base = declarative_base()

# Database URL (Neon/PostgreSQL only)
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required and must point to Neon/PostgreSQL.")

url = make_url(DATABASE_URL)
if url.drivername != "postgresql+asyncpg":
    raise RuntimeError(
        "DATABASE_URL must use the asyncpg driver: postgresql+asyncpg://user:pass@host/db"
    )

logger.info("🔄 Attempting to connect to PostgreSQL...")

# Async engine for FastAPI
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={
        "ssl": True,
        "server_settings": {"jit": "off"}
    },
)

# Sync engine for Celery or sync tasks
SYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
sync_engine = create_engine(
    SYNC_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={
        "sslmode": "require"
    },
)

# Session factories
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

from sqlalchemy.orm import sessionmaker
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    expire_on_commit=False,
)


async def get_db():
    """
    Async DB session for FastAPI routes
    """
    async with AsyncSessionLocal() as session:
        yield session


def get_sync_db():
    """
    Sync DB session for Celery tasks
    """
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


async def init_db():
    """
    Initialize database tables using async engine
    """
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
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
        sync_engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database: {e}")
