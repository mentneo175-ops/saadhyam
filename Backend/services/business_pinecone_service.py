"""
Business Pinecone Service
Stores business analysis data and web-fetched data in Pinecone for fast retrieval
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from services.vector_storage_service import vector_storage
from services.embedding_service import generate_embedding
from config.pinecone_config import NAMESPACE_BUSINESS_INSIGHTS

logger = logging.getLogger(__name__)


async def store_business_analysis_in_pinecone(
    user_id: int,
    business_data: Dict[str, Any]
) -> bool:
    """
    Store business analysis data in Pinecone for fast semantic retrieval
    
    Args:
        user_id: User ID
        business_data: Business analysis data from Gemini API
    
    Returns:
        bool: True if successful
    """
    
    if not vector_storage.enabled:
        logger.warning("Pinecone not enabled, skipping business data storage")
        return False
    
    try:
        logger.info(f"[BusinessPinecone] Storing business analysis for user {user_id}")
        
        vectors_to_store = []
        
        # 1. Store business summary
        if business_data.get("business_details", {}).get("summary"):
            summary = business_data["business_details"]["summary"]
            vectors_to_store.append({
                'id': f"user_{user_id}_business_summary",
                'text': summary,
                'metadata': {
                    'user_id': user_id,
                    'type': 'business_summary',
                    'business_name': business_data["business_details"].get("business_name", ""),
                    'business_type': business_data["business_details"].get("business_type", ""),
                    'location': business_data["business_details"].get("location", "")
                }
            })
        
        # 2. Store strengths
        if business_data.get("strengths"):
            for idx, strength in enumerate(business_data["strengths"]):
                vectors_to_store.append({
                    'id': f"user_{user_id}_strength_{idx}",
                    'text': f"Business strength: {strength}",
                    'metadata': {
                        'user_id': user_id,
                        'type': 'strength',
                        'category': 'business_analysis'
                    }
                })
        
        # 3. Store growth opportunities
        if business_data.get("growth_opportunities"):
            for idx, opportunity in enumerate(business_data["growth_opportunities"]):
                vectors_to_store.append({
                    'id': f"user_{user_id}_opportunity_{idx}",
                    'text': f"Growth opportunity: {opportunity}",
                    'metadata': {
                        'user_id': user_id,
                        'type': 'opportunity',
                        'category': 'business_analysis'
                    }
                })
        
        # 4. Store local market insights
        if business_data.get("local_market_insights"):
            insights = business_data["local_market_insights"]
            
            if insights.get("local_demand"):
                vectors_to_store.append({
                    'id': f"user_{user_id}_local_demand",
                    'text': f"Local market demand: {insights['local_demand']}",
                    'metadata': {
                        'user_id': user_id,
                        'type': 'market_insight',
                        'category': 'local_demand'
                    }
                })
            
            if insights.get("customer_behavior"):
                vectors_to_store.append({
                    'id': f"user_{user_id}_customer_behavior",
                    'text': f"Customer behavior: {insights['customer_behavior']}",
                    'metadata': {
                        'user_id': user_id,
                        'type': 'market_insight',
                        'category': 'customer_behavior'
                    }
                })
        
        # 5. Store competitor analysis
        if business_data.get("competitor_analysis"):
            comp_analysis = business_data["competitor_analysis"]
            
            if comp_analysis.get("market_gaps"):
                for idx, gap in enumerate(comp_analysis["market_gaps"]):
                    vectors_to_store.append({
                        'id': f"user_{user_id}_market_gap_{idx}",
                        'text': f"Market gap: {gap}",
                        'metadata': {
                            'user_id': user_id,
                            'type': 'market_gap',
                            'category': 'competitor_analysis'
                        }
                    })
            
            if comp_analysis.get("differentiation_ideas"):
                for idx, idea in enumerate(comp_analysis["differentiation_ideas"]):
                    vectors_to_store.append({
                        'id': f"user_{user_id}_differentiation_{idx}",
                        'text': f"Differentiation idea: {idea}",
                        'metadata': {
                            'user_id': user_id,
                            'type': 'differentiation',
                            'category': 'competitor_analysis'
                        }
                    })
        
        # 6. Store SEO tips
        if business_data.get("seo_google_maps_tips"):
            seo_tips = business_data["seo_google_maps_tips"]
            
            if seo_tips.get("keywords"):
                keywords_text = f"SEO keywords: {', '.join(seo_tips['keywords'])}"
                vectors_to_store.append({
                    'id': f"user_{user_id}_seo_keywords",
                    'text': keywords_text,
                    'metadata': {
                        'user_id': user_id,
                        'type': 'seo_keywords',
                        'category': 'seo'
                    }
                })
            
            if seo_tips.get("local_visibility_ideas"):
                for idx, idea in enumerate(seo_tips["local_visibility_ideas"]):
                    vectors_to_store.append({
                        'id': f"user_{user_id}_visibility_idea_{idx}",
                        'text': f"Local visibility idea: {idea}",
                        'metadata': {
                            'user_id': user_id,
                            'type': 'visibility_idea',
                            'category': 'seo'
                        }
                    })
        
        # Store all vectors in Pinecone
        if vectors_to_store:
            success = await asyncio.to_thread(
                vector_storage.store_vectors_batch,
                vectors_to_store,
                NAMESPACE_BUSINESS_INSIGHTS,
            )

            if success:
                logger.info(f"[BusinessPinecone] ✅ Stored {len(vectors_to_store)} business insights in Pinecone")
                return True
            else:
                logger.error(f"[BusinessPinecone] ❌ Failed to store business insights")
                return False
        else:
            logger.warning(f"[BusinessPinecone] No business insights to store")
            return False
        
    except Exception as e:
        logger.error(f"[BusinessPinecone] ❌ Error storing business data: {e}", exc_info=True)
        return False


async def get_business_context_from_pinecone(
    user_id: int,
    query: str,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Get relevant business context from Pinecone based on query
    
    Args:
        user_id: User ID
        query: Query text
        top_k: Number of results to return
    
    Returns:
        List of relevant business insights
    """
    
    if not vector_storage.enabled:
        logger.warning("Pinecone not enabled, returning empty results")
        return []
    
    try:
        logger.info(f"[BusinessPinecone] Searching business context for: {query}")
        
        # Search Pinecone
        results = await asyncio.to_thread(
            vector_storage.search_similar,
            query_text=query,
            namespace=NAMESPACE_BUSINESS_INSIGHTS,
            top_k=top_k,
            filter_dict={'user_id': user_id},
        )
        
        logger.info(f"[BusinessPinecone] ✅ Found {len(results)} relevant business insights")
        
        return results
        
    except Exception as e:
        logger.error(f"[BusinessPinecone] ❌ Error searching business context: {e}", exc_info=True)
        return []


async def store_web_fetched_data_in_pinecone(
    user_id: int,
    query: str,
    web_data: str,
    source: str = "web_search"
) -> bool:
    """
    Store web-fetched data in Pinecone for future retrieval
    
    Args:
        user_id: User ID
        query: Original query
        web_data: Fetched web data
        source: Source of data (web_search, google_search, etc.)
    
    Returns:
        bool: True if successful
    """
    
    if not vector_storage.enabled:
        logger.warning("Pinecone not enabled, skipping web data storage")
        return False
    
    try:
        logger.info(f"[BusinessPinecone] Storing web-fetched data for user {user_id}")
        
        # Create unique ID based on query hash
        import hashlib
        query_hash = hashlib.md5(query.encode()).hexdigest()[:8]
        
        vector_id = f"user_{user_id}_web_data_{query_hash}"
        
        # Store in Pinecone
        success = await asyncio.to_thread(
            vector_storage.store_vector,
            vector_id=vector_id,
            text=web_data,
            namespace=NAMESPACE_BUSINESS_INSIGHTS,
            metadata={
                'user_id': user_id,
                'type': 'web_data',
                'query': query,
                'source': source,
                'category': 'web_fetched',
            },
        )
        
        if success:
            logger.info(f"[BusinessPinecone] ✅ Stored web-fetched data in Pinecone")
            return True
        else:
            logger.error(f"[BusinessPinecone] ❌ Failed to store web-fetched data")
            return False
        
    except Exception as e:
        logger.error(f"[BusinessPinecone] ❌ Error storing web data: {e}", exc_info=True)
        return False
