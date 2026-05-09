"""
Reset Pinecone Index
Deletes and recreates the Pinecone index with correct dimensions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.pinecone_config import get_pinecone_client, PINECONE_INDEX_NAME, EMBEDDING_DIMENSION
from pinecone import ServerlessSpec
import time

def reset_index():
    """Delete and recreate Pinecone index"""
    
    pc = get_pinecone_client()
    if not pc:
        print("❌ Failed to get Pinecone client")
        return False
    
    try:
        # Check if index exists
        existing_indexes = pc.list_indexes()
        index_names = [idx.name for idx in existing_indexes]
        
        if PINECONE_INDEX_NAME in index_names:
            print(f"🗑️  Deleting existing index '{PINECONE_INDEX_NAME}'...")
            pc.delete_index(PINECONE_INDEX_NAME)
            print(f"✅ Index deleted")
            
            # Wait for deletion to complete
            print("⏳ Waiting for deletion to complete...")
            time.sleep(5)
        
        # Create new index with correct dimensions
        print(f"📝 Creating new index '{PINECONE_INDEX_NAME}' with dimension {EMBEDDING_DIMENSION}...")
        
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        
        print(f"✅ Index created successfully!")
        
        # Wait for index to be ready
        print("⏳ Waiting for index to be ready...")
        time.sleep(10)
        
        # Verify index
        index = pc.Index(PINECONE_INDEX_NAME)
        stats = index.describe_index_stats()
        print(f"\n📊 Index Stats:")
        print(f"   - Dimension: {stats.dimension}")
        print(f"   - Metric: {stats.metric}")
        print(f"   - Total vectors: {stats.total_vector_count}")
        
        if stats.dimension == EMBEDDING_DIMENSION:
            print(f"\n✅ Index reset successful! Dimension matches: {EMBEDDING_DIMENSION}")
            return True
        else:
            print(f"\n❌ Dimension mismatch! Expected {EMBEDDING_DIMENSION}, got {stats.dimension}")
            return False
        
    except Exception as e:
        print(f"❌ Error resetting index: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Pinecone Index Reset")
    print("=" * 60)
    print(f"Index Name: {PINECONE_INDEX_NAME}")
    print(f"Target Dimension: {EMBEDDING_DIMENSION}")
    print("=" * 60)
    print()
    
    success = reset_index()
    
    if success:
        print("\n✅ All done! You can now use Pinecone with the correct dimensions.")
    else:
        print("\n❌ Reset failed. Please check the error messages above.")
