"""Celery tasks for offloading AI/LLM workloads.
"""
import logging
from celery_worker import celery
import asyncio
from typing import Dict, Any

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=2)
def generate_business_analysis_task(self, user_id: int, business_profile: Dict[str, Any]):
    """Run the Gemini business analysis in a Celery worker and store results in Pinecone.

    Runs the async service in a new event loop to avoid blocking.
    """
    try:
        logger.info(f"[Celery] Starting business analysis task for user={user_id}")
        # Import here to avoid circular imports at module import time
        from services.gemini_business_analysis_service import generate_realtime_business_analysis
        from services.business_pinecone_service import store_business_analysis_in_pinecone

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        result = loop.run_until_complete(generate_realtime_business_analysis(business_profile))

        # Attempt to store result in Pinecone (best-effort)
        try:
            loop.run_until_complete(store_business_analysis_in_pinecone(user_id, result))
        except Exception as e:
            logger.warning(f"[Celery] Failed to store business analysis in Pinecone: {e}")

        loop.close()
        logger.info(f"[Celery] Business analysis task completed for user={user_id}")
        return {"success": True, "result_summary": {"status": result.get("status"), "health_score": result.get("health_score")}}
    except Exception as e:
        logger.error(f"[Celery] Business analysis task failed: {e}")
        try:
            # Retry with backoff
            raise self.retry(exc=e, countdown=60 * 2)
        except Exception:
            return {"success": False, "error": str(e)}
