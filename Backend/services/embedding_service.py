"""
Embedding Service
Converts text to vector embeddings using Sentence Transformers
"""

import logging
from typing import List, Union

logger = logging.getLogger(__name__)

# Try to import sentence_transformers, but make it optional
try:
    from sentence_transformers import SentenceTransformer
    from config.pinecone_config import EMBEDDING_MODEL
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ sentence-transformers not available. Embedding features will be disabled.")
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    EMBEDDING_MODEL = None

# Global model instance (loaded once)
_model = None


def get_embedding_model():
    """
    Get or load the embedding model (singleton pattern)
    
    Returns:
        SentenceTransformer model or None if not available
    """
    global _model
    
    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        logger.warning("⚠️ Sentence transformers not available")
        return None
    
    if _model is None:
        try:
            logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
            _model = SentenceTransformer(EMBEDDING_MODEL)
            logger.info("✅ Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load embedding model: {e}")
            raise
    
    return _model


def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding for a single text
    
    Args:
        text: Input text
    
    Returns:
        List of floats representing the embedding, or empty list if not available
    """
    try:
        model = get_embedding_model()
        
        if model is None:
            logger.warning("⚠️ Embedding model not available, returning empty embedding")
            return []
        
        # Generate embedding
        embedding = model.encode(text, convert_to_numpy=True)
        
        # Convert to list
        return embedding.tolist()
        
    except Exception as e:
        logger.error(f"❌ Failed to generate embedding: {e}")
        return []


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple texts (batch processing)
    
    Args:
        texts: List of input texts
    
    Returns:
        List of embeddings, or empty lists if not available
    """
    try:
        model = get_embedding_model()
        
        if model is None:
            logger.warning("⚠️ Embedding model not available, returning empty embeddings")
            return [[] for _ in texts]
        
        # Generate embeddings in batch (more efficient)
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        
        # Convert to list of lists
        return [emb.tolist() for emb in embeddings]
        
    except Exception as e:
        logger.error(f"❌ Failed to generate batch embeddings: {e}")
        return [[] for _ in texts]


def compute_similarity(text1: str, text2: str) -> float:
    """
    Compute cosine similarity between two texts
    
    Args:
        text1: First text
        text2: Second text
    
    Returns:
        Similarity score (0-1), or 0.0 if not available
    """
    try:
        model = get_embedding_model()
        
        if model is None:
            logger.warning("⚠️ Embedding model not available, returning 0.0 similarity")
            return 0.0
        
        # Generate embeddings
        embeddings = model.encode([text1, text2], convert_to_numpy=True)
        
        # Compute cosine similarity
        from sklearn.metrics.pairwise import cosine_similarity
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        
        return float(similarity)
        
    except Exception as e:
        logger.error(f"❌ Failed to compute similarity: {e}")
        return 0.0
