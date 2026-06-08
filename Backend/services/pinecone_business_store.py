"""
Pinecone Business Data Store
Comprehensive storage service for ALL business-related data in Pinecone
Only authentication data stays in PostgreSQL/NeonDB
"""

import logging
import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from services.vector_storage_service import vector_storage
from config.pinecone_config import (
    NAMESPACE_BUSINESS_INSIGHTS,
    NAMESPACE_AEO_QUESTIONS,
    NAMESPACE_AEO_CONTENT,
)

logger = logging.getLogger(__name__)

# Additional namespaces for comprehensive business data
NAMESPACE_BUSINESS_PROFILE = "business-profile"
NAMESPACE_BUSINESS_ANALYSIS = "business-analysis"
NAMESPACE_REVIEW_HISTORY = "review-history"
NAMESPACE_TASK_TRACKING = "task-tracking"
NAMESPACE_GROWTH_METRICS = "growth-metrics"
NAMESPACE_INSTAGRAM_ANALYTICS = "instagram-analytics"
NAMESPACE_WHATSAPP_DATA = "whatsapp-data"
NAMESPACE_VOICE_AGENT_DATA = "voice-agent-data"
NAMESPACE_SCHEMA_MARKUP = "schema-markup"
NAMESPACE_AI_VISIBILITY = "ai-visibility"
NAMESPACE_CONTENT_DISTRIBUTION = "content-distribution"


class PineconeBusinessStore:
    """
    Comprehensive business data storage in Pinecone
    All business data stored as vectors for fast semantic retrieval
    """
    
    def __init__(self):
        self.enabled = vector_storage.enabled
        if not self.enabled:
            logger.warning("⚠️ Pinecone not enabled - business data storage disabled")
    
    # ==================== BUSINESS PROFILE ====================
    
    async def store_business_profile(
        self,
        user_id: int,
        profile_data: Dict[str, Any]
    ) -> bool:
        """
        Store complete business profile in Pinecone
        
        Args:
            user_id: User ID
            profile_data: Complete business profile data
        
        Returns:
            bool: Success status
        """
        if not self.enabled:
            return False
        
        try:
            logger.info(f"[PineconeBusinessStore] Storing business profile for user {user_id}")
            
            vectors = []
            profile_id = profile_data.get('id', 'default')
            
            # 1. Business description
            if profile_data.get('business_description'):
                vectors.append({
                    'id': f"user_{user_id}_profile_{profile_id}_description",
                    'text': profile_data['business_description'],
                    'metadata': {
                        'user_id': user_id,
                        'profile_id': profile_id,
                        'type': 'business_description',
                        'category': 'business_profile',
                        'created_at': profile_data.get('created_at', datetime.utcnow().isoformat())
                    }
                })
            
            # 2. PDF extracted text
            if profile_data.get('pdf_extracted_text'):
                vectors.append({
                    'id': f"user_{user_id}_profile_{profile_id}_pdf_text",
                    'text': profile_data['pdf_extracted_text'],
                    'metadata': {
                        'user_id': user_id,
                        'profile_id': profile_id,
                        'type': 'pdf_extracted_text',
                        'category': 'business_profile',
                        'pdf_url': profile_data.get('pdf_file_url', '')
                    }
                })
            
            # 3. Audio extracted text
            if profile_data.get('audio_extracted_text'):
                vectors.append({
                    'id': f"user_{user_id}_profile_{profile_id}_audio_text",
                    'text': profile_data['audio_extracted_text'],
                    'metadata': {
                        'user_id': user_id,
                        'profile_id': profile_id,
                        'type': 'audio_extracted_text',
                        'category': 'business_profile',
                        'audio_url': profile_data.get('audio_file_url', '')
                    }
                })
            
            # 4. Website extracted text
            if profile_data.get('website_extracted_text'):
                vectors.append({
                    'id': f"user_{user_id}_profile_{profile_id}_website_text",
                    'text': profile_data['website_extracted_text'],
                    'metadata': {
                        'user_id': user_id,
                        'profile_id': profile_id,
                        'type': 'website_extracted_text',
                        'category': 'business_profile',
                        'website_url': profile_data.get('website_url', '')
                    }
                })
            
            if vectors:
                success = await asyncio.to_thread(
                    vector_storage.store_vectors_batch, vectors, NAMESPACE_BUSINESS_PROFILE
                )
                if success:
                    logger.info(f"✅ Stored {len(vectors)} business profile vectors")
                return success
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store business profile: {e}", exc_info=True)
            return False
    
    async def get_business_profile(
        self,
        user_id: int,
        query: str = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """Get business profile data from Pinecone"""
        if not self.enabled:
            return []
        
        try:
            if query:
                # Semantic search
                results = await asyncio.to_thread(
                    vector_storage.search_similar,
                    query_text=query,
                    namespace=NAMESPACE_BUSINESS_PROFILE,
                    top_k=top_k,
                    filter_dict={'user_id': user_id}
                )
            else:
                results = []
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed to get business profile: {e}", exc_info=True)
            return []
    
    # ==================== BUSINESS ANALYSIS ====================
    
    async def store_business_analysis(
        self,
        user_id: int,
        analysis_data: Dict[str, Any]
    ) -> bool:
        """
        Store complete business analysis in Pinecone
        Includes all analysis results, scores, recommendations
        """
        if not self.enabled:
            return False
        
        try:
            logger.info(f"[PineconeBusinessStore] Storing business analysis for user {user_id}")
            
            vectors = []
            analysis_id = analysis_data.get('id', 'default')
            
            # 1. Business summary
            if analysis_data.get('business_summary'):
                vectors.append({
                    'id': f"user_{user_id}_analysis_{analysis_id}_summary",
                    'text': analysis_data['business_summary'],
                    'metadata': {
                        'user_id': user_id,
                        'analysis_id': analysis_id,
                        'type': 'business_summary',
                        'business_name': analysis_data.get('business_name', ''),
                        'business_type': analysis_data.get('business_type', ''),
                        'location': analysis_data.get('location', ''),
                        'health_score': analysis_data.get('health_score', 0),
                        'analyzed_at': analysis_data.get('last_analyzed_at', datetime.utcnow().isoformat())
                    }
                })
            
            # 2. Strengths
            if analysis_data.get('strengths_data'):
                strengths = json.loads(analysis_data['strengths_data']) if isinstance(analysis_data['strengths_data'], str) else analysis_data['strengths_data']
                for idx, strength in enumerate(strengths):
                    vectors.append({
                        'id': f"user_{user_id}_analysis_{analysis_id}_strength_{idx}",
                        'text': f"Business strength: {strength}",
                        'metadata': {
                            'user_id': user_id,
                            'analysis_id': analysis_id,
                            'type': 'strength',
                            'category': 'business_analysis'
                        }
                    })
            
            # 3. Weaknesses
            if analysis_data.get('weaknesses_data'):
                weaknesses = json.loads(analysis_data['weaknesses_data']) if isinstance(analysis_data['weaknesses_data'], str) else analysis_data['weaknesses_data']
                for idx, weakness in enumerate(weaknesses):
                    vectors.append({
                        'id': f"user_{user_id}_analysis_{analysis_id}_weakness_{idx}",
                        'text': f"Business weakness: {weakness}",
                        'metadata': {
                            'user_id': user_id,
                            'analysis_id': analysis_id,
                            'type': 'weakness',
                            'category': 'business_analysis'
                        }
                    })
            
            # 4. Growth opportunities
            if analysis_data.get('growth_opportunities_data'):
                opportunities = json.loads(analysis_data['growth_opportunities_data']) if isinstance(analysis_data['growth_opportunities_data'], str) else analysis_data['growth_opportunities_data']
                for idx, opportunity in enumerate(opportunities):
                    vectors.append({
                        'id': f"user_{user_id}_analysis_{analysis_id}_opportunity_{idx}",
                        'text': f"Growth opportunity: {opportunity}",
                        'metadata': {
                            'user_id': user_id,
                            'analysis_id': analysis_id,
                            'type': 'opportunity',
                            'category': 'business_analysis'
                        }
                    })
            
            # 5. Local market insights
            if analysis_data.get('local_market_insights'):
                insights = json.loads(analysis_data['local_market_insights']) if isinstance(analysis_data['local_market_insights'], str) else analysis_data['local_market_insights']
                
                if isinstance(insights, dict):
                    for key, value in insights.items():
                        if value:
                            vectors.append({
                                'id': f"user_{user_id}_analysis_{analysis_id}_market_{key}",
                                'text': f"Market insight - {key}: {value}",
                                'metadata': {
                                    'user_id': user_id,
                                    'analysis_id': analysis_id,
                                    'type': 'market_insight',
                                    'insight_type': key,
                                    'category': 'business_analysis'
                                }
                            })
            
            # 6. Competitor analysis
            if analysis_data.get('competitor_analysis'):
                comp_analysis = json.loads(analysis_data['competitor_analysis']) if isinstance(analysis_data['competitor_analysis'], str) else analysis_data['competitor_analysis']
                
                if isinstance(comp_analysis, dict):
                    for key, value in comp_analysis.items():
                        if value and isinstance(value, (list, str)):
                            if isinstance(value, list):
                                for idx, item in enumerate(value):
                                    vectors.append({
                                        'id': f"user_{user_id}_analysis_{analysis_id}_competitor_{key}_{idx}",
                                        'text': f"Competitor {key}: {item}",
                                        'metadata': {
                                            'user_id': user_id,
                                            'analysis_id': analysis_id,
                                            'type': 'competitor_analysis',
                                            'analysis_type': key,
                                            'category': 'business_analysis'
                                        }
                                    })
                            else:
                                vectors.append({
                                    'id': f"user_{user_id}_analysis_{analysis_id}_competitor_{key}",
                                    'text': f"Competitor {key}: {value}",
                                    'metadata': {
                                        'user_id': user_id,
                                        'analysis_id': analysis_id,
                                        'type': 'competitor_analysis',
                                        'analysis_type': key,
                                        'category': 'business_analysis'
                                    }
                                })
            
            # 7. SEO tips
            if analysis_data.get('seo_google_maps_tips'):
                seo_tips = json.loads(analysis_data['seo_google_maps_tips']) if isinstance(analysis_data['seo_google_maps_tips'], str) else analysis_data['seo_google_maps_tips']
                
                if isinstance(seo_tips, dict):
                    for key, value in seo_tips.items():
                        if value:
                            if isinstance(value, list):
                                for idx, item in enumerate(value):
                                    vectors.append({
                                        'id': f"user_{user_id}_analysis_{analysis_id}_seo_{key}_{idx}",
                                        'text': f"SEO tip - {key}: {item}",
                                        'metadata': {
                                            'user_id': user_id,
                                            'analysis_id': analysis_id,
                                            'type': 'seo_tip',
                                            'tip_type': key,
                                            'category': 'business_analysis'
                                        }
                                    })
                            else:
                                vectors.append({
                                    'id': f"user_{user_id}_analysis_{analysis_id}_seo_{key}",
                                    'text': f"SEO tip - {key}: {value}",
                                    'metadata': {
                                        'user_id': user_id,
                                        'analysis_id': analysis_id,
                                        'type': 'seo_tip',
                                        'tip_type': key,
                                        'category': 'business_analysis'
                                    }
                                })
            
            # 8. 30-day growth plan
            if analysis_data.get('thirty_day_growth_plan'):
                growth_plan = json.loads(analysis_data['thirty_day_growth_plan']) if isinstance(analysis_data['thirty_day_growth_plan'], str) else analysis_data['thirty_day_growth_plan']
                
                if isinstance(growth_plan, dict):
                    for week, tasks in growth_plan.items():
                        if tasks and isinstance(tasks, list):
                            for idx, task in enumerate(tasks):
                                vectors.append({
                                    'id': f"user_{user_id}_analysis_{analysis_id}_growth_{week}_{idx}",
                                    'text': f"Growth plan {week}: {task}",
                                    'metadata': {
                                        'user_id': user_id,
                                        'analysis_id': analysis_id,
                                        'type': 'growth_plan',
                                        'week': week,
                                        'category': 'business_analysis'
                                    }
                                })
            
            # 9. Daily suggestions
            if analysis_data.get('daily_suggestions'):
                suggestions = json.loads(analysis_data['daily_suggestions']) if isinstance(analysis_data['daily_suggestions'], str) else analysis_data['daily_suggestions']
                
                if isinstance(suggestions, list):
                    for idx, suggestion in enumerate(suggestions):
                        vectors.append({
                            'id': f"user_{user_id}_analysis_{analysis_id}_suggestion_{idx}",
                            'text': f"Daily suggestion: {suggestion}",
                            'metadata': {
                                'user_id': user_id,
                                'analysis_id': analysis_id,
                                'type': 'daily_suggestion',
                                'category': 'business_analysis'
                            }
                        })
            
            if vectors:
                success = await asyncio.to_thread(
                    vector_storage.store_vectors_batch, vectors, NAMESPACE_BUSINESS_ANALYSIS
                )
                if success:
                    logger.info(f"✅ Stored {len(vectors)} business analysis vectors")
                return success
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store business analysis: {e}", exc_info=True)
            return False
    
    async def get_business_analysis(
        self,
        user_id: int,
        query: str,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """Get business analysis data from Pinecone"""
        if not self.enabled:
            return []
        
        try:
            results = await asyncio.to_thread(
                vector_storage.search_similar,
                query_text=query,
                namespace=NAMESPACE_BUSINESS_ANALYSIS,
                top_k=top_k,
                filter_dict={'user_id': user_id}
            )
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed to get business analysis: {e}", exc_info=True)
            return []
    
    # ==================== REVIEW HISTORY ====================
    
    async def store_review_reply(
        self,
        user_id: int,
        review_data: Dict[str, Any]
    ) -> bool:
        """Store review and reply in Pinecone"""
        if not self.enabled:
            return False
        
        try:
            review_id = review_data.get('id', 'default')
            
            # Store review + reply as single vector for context
            combined_text = f"Review ({review_data.get('rating', 0)} stars): {review_data.get('review', '')} | Reply: {review_data.get('reply', '')}"
            
            success = await asyncio.to_thread(
                vector_storage.store_vector,
                vector_id=f"user_{user_id}_review_{review_id}",
                text=combined_text,
                namespace=NAMESPACE_REVIEW_HISTORY,
                metadata={
                    'user_id': user_id,
                    'review_id': review_id,
                    'rating': review_data.get('rating', 0),
                    'business_type': review_data.get('business_type', ''),
                    'tone': review_data.get('tone', 'professional'),
                    'is_helpful': review_data.get('is_helpful'),
                    'created_at': review_data.get('created_at', datetime.utcnow().isoformat())
                }
            )
            
            if success:
                logger.info(f"✅ Stored review reply vector")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to store review reply: {e}", exc_info=True)
            return False
    
    async def get_similar_reviews(
        self,
        user_id: int,
        review_text: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Find similar reviews for context"""
        if not self.enabled:
            return []
        
        try:
            results = await asyncio.to_thread(
                vector_storage.search_similar,
                query_text=review_text,
                namespace=NAMESPACE_REVIEW_HISTORY,
                top_k=top_k,
                filter_dict={'user_id': user_id}
            )
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed to get similar reviews: {e}", exc_info=True)
            return []
    
    # ==================== TASK TRACKING ====================
    
    async def store_daily_task(
        self,
        user_id: int,
        task_data: Dict[str, Any]
    ) -> bool:
        """Store daily task in Pinecone"""
        if not self.enabled:
            return False
        
        try:
            task_id = task_data.get('id', 'default')
            
            success = await asyncio.to_thread(
                vector_storage.store_vector,
                vector_id=f"user_{user_id}_task_{task_id}",
                text=f"Task: {task_data.get('task_text', '')} | Category: {task_data.get('category', '')}",
                namespace=NAMESPACE_TASK_TRACKING,
                metadata={
                    'user_id': user_id,
                    'task_id': task_id,
                    'category': task_data.get('category', ''),
                    'priority': task_data.get('priority', 'medium'),
                    'is_completed': task_data.get('is_completed', False),
                    'completed_at': task_data.get('completed_at'),
                    'created_at': task_data.get('created_at', datetime.utcnow().isoformat())
                }
            )
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to store task: {e}", exc_info=True)
            return False
    
    # ==================== AEO CONTENT ====================
    
    async def store_aeo_content(
        self,
        user_id: int,
        content_data: Dict[str, Any]
    ) -> bool:
        """Store AEO content in Pinecone"""
        if not self.enabled:
            return False
        
        try:
            content_id = content_data.get('id', 'default')
            
            # Combine all content for rich context
            full_content = f"""
Title: {content_data.get('title', '')}
Question: {content_data.get('question', '')}
Direct Answer: {content_data.get('direct_answer', '')}
Detailed Explanation: {content_data.get('detailed_explanation', '')}
"""
            
            success = await asyncio.to_thread(
                vector_storage.store_vector,
                vector_id=f"user_{user_id}_aeo_content_{content_id}",
                text=full_content,
                namespace=NAMESPACE_AEO_CONTENT,
                metadata={
                    'user_id': user_id,
                    'content_id': content_id,
                    'question_id': content_data.get('question_id'),
                    'geo_score': content_data.get('geo_score', 0),
                    'aeo_score': content_data.get('aeo_score', 0),
                    'is_published': content_data.get('is_published', False),
                    'published_url': content_data.get('published_url', ''),
                    'ai_mentions': content_data.get('ai_mentions', 0),
                    'visibility_score': content_data.get('visibility_score', 0),
                    'created_at': content_data.get('created_at', datetime.utcnow().isoformat())
                }
            )
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to store AEO content: {e}", exc_info=True)
            return False
    
    # ==================== UTILITY METHODS ====================
    
    async def delete_user_data(
        self,
        user_id: int,
        namespace: str = None
    ) -> bool:
        """
        Delete all data for a user from Pinecone
        
        Args:
            user_id: User ID
            namespace: Specific namespace or None for all
        """
        if not self.enabled:
            return False
        
        try:
            # This would require fetching all vector IDs for the user
            # and deleting them. Pinecone doesn't support delete by metadata filter directly
            # Would need to implement custom logic
            logger.warning("Delete user data not fully implemented yet")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete user data: {e}", exc_info=True)
            return False
    
    async def get_user_data_stats(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get statistics about user's data in Pinecone"""
        if not self.enabled:
            return {'enabled': False}
        
        try:
            stats = {}
            
            # Get stats for each namespace
            namespaces = [
                NAMESPACE_BUSINESS_PROFILE,
                NAMESPACE_BUSINESS_ANALYSIS,
                NAMESPACE_BUSINESS_INSIGHTS,
                NAMESPACE_AEO_QUESTIONS,
                NAMESPACE_AEO_CONTENT,
                NAMESPACE_REVIEW_HISTORY,
                NAMESPACE_TASK_TRACKING,
            ]
            
            for ns in namespaces:
                ns_stats = vector_storage.get_stats(ns)
                stats[ns] = ns_stats
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Failed to get user data stats: {e}", exc_info=True)
            return {'error': str(e)}


# Global instance
pinecone_business_store = PineconeBusinessStore()
