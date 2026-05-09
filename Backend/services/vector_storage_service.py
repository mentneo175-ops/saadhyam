"""
Vector Storage Service
Store and retrieve vectors from Pinecone
"""

import logging
from typing import List, Dict, Any, Optional
from config.pinecone_config import (
    get_pinecone_client,
    get_pinecone_index,
    DEFAULT_TOP_K,
    SIMILARITY_THRESHOLD,
    NAMESPACE_AEO_QUESTIONS,
    NAMESPACE_AEO_CONTENT,
)
from services.embedding_service import generate_embedding, generate_embeddings_batch

logger = logging.getLogger(__name__)


class VectorStorageService:
    """Service for storing and retrieving vectors from Pinecone"""
    
    def __init__(self):
        self.pc = get_pinecone_client()
        self.index = get_pinecone_index(self.pc) if self.pc else None
        self.enabled = self.index is not None
        
        if not self.enabled:
            logger.warning("⚠️ Pinecone not configured - vector storage disabled")
    
    def store_vector(
        self,
        vector_id: str,
        text: str,
        namespace: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Store a single vector in Pinecone
        
        Args:
            vector_id: Unique ID for the vector
            text: Text to convert to embedding
            namespace: Pinecone namespace
            metadata: Additional metadata to store
        
        Returns:
            bool: True if successful
        """
        if not self.enabled:
            logger.warning("Pinecone not enabled, skipping vector storage")
            return False
        
        try:
            # Generate embedding
            embedding = generate_embedding(text)
            
            # Prepare metadata
            meta = metadata or {}
            meta['text'] = text  # Store original text
            
            # Upsert to Pinecone
            self.index.upsert(
                vectors=[(vector_id, embedding, meta)],
                namespace=namespace
            )
            
            logger.info(f"✅ Stored vector {vector_id} in namespace {namespace}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store vector: {e}")
            return False
    
    def store_vectors_batch(
        self,
        vectors: List[Dict[str, Any]],
        namespace: str
    ) -> bool:
        """
        Store multiple vectors in batch
        
        Args:
            vectors: List of dicts with 'id', 'text', and 'metadata'
            namespace: Pinecone namespace
        
        Returns:
            bool: True if successful
        """
        if not self.enabled:
            logger.warning("Pinecone not enabled, skipping batch storage")
            return False
        
        try:
            # Extract texts
            texts = [v['text'] for v in vectors]
            
            # Generate embeddings in batch
            embeddings = generate_embeddings_batch(texts)
            
            # Prepare vectors for upsert
            upsert_data = []
            for i, vector in enumerate(vectors):
                vector_id = vector['id']
                embedding = embeddings[i]
                metadata = vector.get('metadata', {})
                metadata['text'] = vector['text']
                
                upsert_data.append((vector_id, embedding, metadata))
            
            # Upsert to Pinecone in batches of 100
            batch_size = 100
            for i in range(0, len(upsert_data), batch_size):
                batch = upsert_data[i:i + batch_size]
                self.index.upsert(vectors=batch, namespace=namespace)
            
            logger.info(f"✅ Stored {len(vectors)} vectors in namespace {namespace}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store batch vectors: {e}")
            return False
    
    def search_similar(
        self,
        query_text: str,
        namespace: str,
        top_k: int = DEFAULT_TOP_K,
        min_score: float = SIMILARITY_THRESHOLD,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors
        
        Args:
            query_text: Query text
            namespace: Pinecone namespace
            top_k: Number of results to return
            min_score: Minimum similarity score
            filter_dict: Metadata filters
        
        Returns:
            List of matching results with scores
        """
        if not self.enabled:
            logger.warning("Pinecone not enabled, returning empty results")
            return []
        
        try:
            # Generate query embedding
            query_embedding = generate_embedding(query_text)
            
            # Search Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                namespace=namespace,
                include_metadata=True,
                filter=filter_dict
            )
            
            # Filter by minimum score and format results
            matches = []
            for match in results.matches:
                if match.score >= min_score:
                    matches.append({
                        'id': match.id,
                        'score': match.score,
                        'text': match.metadata.get('text', ''),
                        'metadata': match.metadata
                    })
            
            logger.info(f"✅ Found {len(matches)} similar vectors in namespace {namespace}")
            return matches
            
        except Exception as e:
            logger.error(f"❌ Failed to search vectors: {e}")
            return []
    
    def delete_vector(self, vector_id: str, namespace: str) -> bool:
        """
        Delete a vector from Pinecone
        
        Args:
            vector_id: Vector ID to delete
            namespace: Pinecone namespace
        
        Returns:
            bool: True if successful
        """
        if not self.enabled:
            return False
        
        try:
            self.index.delete(ids=[vector_id], namespace=namespace)
            logger.info(f"✅ Deleted vector {vector_id} from namespace {namespace}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete vector: {e}")
            return False
    
    def get_stats(self, namespace: str) -> Dict[str, Any]:
        """
        Get statistics for a namespace
        
        Args:
            namespace: Pinecone namespace
        
        Returns:
            Dict with statistics
        """
        if not self.enabled:
            return {'enabled': False}
        
        try:
            stats = self.index.describe_index_stats()
            namespace_stats = stats.namespaces.get(namespace, {})
            
            return {
                'enabled': True,
                'total_vectors': namespace_stats.get('vector_count', 0),
                'dimension': stats.dimension,
                'index_fullness': stats.index_fullness
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get stats: {e}")
            return {'enabled': True, 'error': str(e)}


# Global instance
vector_storage = VectorStorageService()
