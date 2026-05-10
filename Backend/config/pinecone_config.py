"""
Pinecone Configuration
Vector database for semantic search and embeddings
"""

import os
import logging
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Pinecone configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "saadhyam-aeo-geo")

# Embedding configuration
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"  # Fast, good quality, free
EMBEDDING_DIMENSION = 384  # Dimension for all-MiniLM-L6-v2

# Pinecone namespaces
NAMESPACE_AEO_QUESTIONS = "aeo-questions"
NAMESPACE_AEO_CONTENT = "aeo-content"
NAMESPACE_BUSINESS_INSIGHTS = "business-insights"
NAMESPACE_COMPETITOR_DATA = "competitor-data"
NAMESPACE_MARKET_TRENDS = "market-trends"

# Search configuration
DEFAULT_TOP_K = 5  # Number of results to return
SIMILARITY_THRESHOLD = 0.7  # Minimum similarity score (0-1)


def get_pinecone_client():
    """
    Get Pinecone client instance
    
    Returns:
        Pinecone client or None if not configured
    """
    if not PINECONE_API_KEY or PINECONE_API_KEY == "your_pinecone_api_key_here":
        logger.warning("Pinecone API key not configured")
        return None
    
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        logger.info("✅ Pinecone client initialized")
        return pc
    except Exception as e:
        logger.error(f"❌ Failed to initialize Pinecone: {e}")
        return None


def ensure_index_exists(pc: Pinecone):
    """
    Ensure Pinecone index exists, create if not
    
    Args:
        pc: Pinecone client
    
    Returns:
        bool: True if index exists or was created
    """
    if not pc:
        return False
    
    try:
        # Check if index exists
        existing_indexes = pc.list_indexes()
        index_names = [idx.name for idx in existing_indexes]
        
        if PINECONE_INDEX_NAME in index_names:
            logger.info(f"✅ Pinecone index '{PINECONE_INDEX_NAME}' already exists")
            return True
        
        # Create index if it doesn't exist
        logger.info(f"Creating Pinecone index '{PINECONE_INDEX_NAME}'...")
        
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",  # Cosine similarity for semantic search
            spec=ServerlessSpec(
                cloud="aws",
                region=PINECONE_ENVIRONMENT
            )
        )
        
        logger.info(f"✅ Pinecone index '{PINECONE_INDEX_NAME}' created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to ensure index exists: {e}")
        return False


def get_pinecone_index(pc: Pinecone):
    """
    Get Pinecone index instance
    
    Args:
        pc: Pinecone client
    
    Returns:
        Pinecone index or None
    """
    if not pc:
        return None
    
    try:
        # Ensure index exists
        if not ensure_index_exists(pc):
            return None
        
        index = pc.Index(PINECONE_INDEX_NAME)
        logger.info(f"✅ Connected to Pinecone index '{PINECONE_INDEX_NAME}'")
        return index
        
    except Exception as e:
        logger.error(f"❌ Failed to get Pinecone index: {e}")
        return None
