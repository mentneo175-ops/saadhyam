"""
History Service
Manages review reply history in database
"""

import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from db.models import ReviewHistory

logger = logging.getLogger(__name__)


class HistoryService:
    """Service for managing review reply history"""
    
    @staticmethod
    def save_reply(
        db: Session,
        user_id: int,
        review: str,
        rating: int,
        business_type: str,
        reply: str,
        tone: str = "professional"
    ) -> ReviewHistory:
        """
        Save generated reply to database (SYNC version)
        
        Args:
            db: Database session
            user_id: ID of the user (can be None for unauthenticated requests)
            review: Original review text
            rating: Review rating (1-5)
            business_type: Type of business
            reply: Generated reply
            tone: Tone used for generation
        
        Returns:
            ReviewHistory object
        """
        
        try:
            logger.info(f"💾 Saving reply to database...")
            
            history = ReviewHistory(
                user_id=user_id,
                review=review,
                rating=rating,
                business_type=business_type,
                reply=reply,
                tone=tone,
                created_at=datetime.utcnow()
            )
            
            db.add(history)
            db.commit()
            db.refresh(history)
            
            logger.info(f"✅ Reply saved with ID: {history.id}")
            return history
            
        except Exception as e:
            logger.error(f"❌ Error saving reply: {e}")
            db.rollback()
            raise
    
    
    @staticmethod
    def get_history(
        db: Session,
        user_id: int,
        limit: int = 4,
        offset: int = 0
    ) -> list:
        """
        Get reply history for a specific user (SYNC version)
        
        Args:
            db: Database session
            user_id: ID of the user
            limit: Number of records to return (default 4)
            offset: Offset for pagination
        
        Returns:
            List of ReviewHistory objects
        """
        
        try:
            logger.info(f"📖 Fetching history for user {user_id} (limit: {limit}, offset: {offset})...")
            
            stmt = select(ReviewHistory).where(
                ReviewHistory.user_id == user_id
            ).order_by(
                desc(ReviewHistory.created_at)
            ).limit(limit).offset(offset)
            
            result = db.execute(stmt)
            history = result.scalars().all()
            
            logger.info(f"✅ Retrieved {len(history)} records")
            return history
            
        except Exception as e:
            logger.error(f"❌ Error fetching history: {e}")
            raise
    
    
    @staticmethod
    def get_history_by_business(
        db: Session,
        business_type: str,
        limit: int = 20
    ) -> list:
        """
        Get history for specific business type (SYNC version)
        
        Args:
            db: Database session
            business_type: Type of business
            limit: Number of records to return
        
        Returns:
            List of ReviewHistory objects
        """
        
        try:
            logger.info(f"📖 Fetching history for {business_type}...")
            
            stmt = select(ReviewHistory).where(
                ReviewHistory.business_type == business_type
            ).order_by(
                desc(ReviewHistory.created_at)
            ).limit(limit)
            
            result = db.execute(stmt)
            history = result.scalars().all()
            
            logger.info(f"✅ Retrieved {len(history)} records for {business_type}")
            return history
            
        except Exception as e:
            logger.error(f"❌ Error fetching history: {e}")
            raise
    
    
    @staticmethod
    def get_history_by_rating(
        db: Session,
        rating: int,
        limit: int = 20
    ) -> list:
        """
        Get history for specific rating (SYNC version)
        
        Args:
            db: Database session
            rating: Review rating (1-5)
            limit: Number of records to return
        
        Returns:
            List of ReviewHistory objects
        """
        
        try:
            logger.info(f"📖 Fetching history for rating {rating}...")
            
            stmt = select(ReviewHistory).where(
                ReviewHistory.rating == rating
            ).order_by(
                desc(ReviewHistory.created_at)
            ).limit(limit)
            
            result = db.execute(stmt)
            history = result.scalars().all()
            
            logger.info(f"✅ Retrieved {len(history)} records for rating {rating}")
            return history
            
        except Exception as e:
            logger.error(f"❌ Error fetching history: {e}")
            raise
    
    
    @staticmethod
    def save_feedback(
        db: Session,
        history_id: int,
        is_helpful: bool,
        feedback: str = None
    ) -> ReviewHistory:
        """
        Save user feedback on generated reply (SYNC version)
        
        Args:
            db: Database session
            history_id: ID of the history record
            is_helpful: Whether reply was helpful
            feedback: Optional feedback text
        
        Returns:
            Updated ReviewHistory object
        """
        
        try:
            logger.info(f"💬 Saving feedback for history {history_id}...")
            
            stmt = select(ReviewHistory).where(ReviewHistory.id == history_id)
            result = db.execute(stmt)
            history = result.scalar_one_or_none()
            
            if not history:
                logger.error(f"❌ History record {history_id} not found")
                raise ValueError(f"History record {history_id} not found")
            
            history.is_helpful = is_helpful
            history.feedback = feedback
            history.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(history)
            
            logger.info(f"✅ Feedback saved")
            return history
            
        except Exception as e:
            logger.error(f"❌ Error saving feedback: {e}")
            db.rollback()
            raise
    
    
    @staticmethod
    def get_stats(db: Session) -> dict:
        """
        Get statistics about generated replies (SYNC version)
        
        Args:
            db: Database session
        
        Returns:
            Dict with statistics
        """
        
        try:
            logger.info("📊 Calculating statistics...")
            
            # Total replies
            total_stmt = select(ReviewHistory)
            total_result = db.execute(total_stmt)
            total_count = len(total_result.scalars().all())
            
            # Helpful replies
            helpful_stmt = select(ReviewHistory).where(ReviewHistory.is_helpful == True)
            helpful_result = db.execute(helpful_stmt)
            helpful_count = len(helpful_result.scalars().all())
            
            # By rating
            rating_stats = {}
            for rating in range(1, 6):
                rating_stmt = select(ReviewHistory).where(ReviewHistory.rating == rating)
                rating_result = db.execute(rating_stmt)
                rating_stats[f"rating_{rating}"] = len(rating_result.scalars().all())
            
            stats = {
                "total_replies": total_count,
                "helpful_replies": helpful_count,
                "helpful_percentage": (helpful_count / total_count * 100) if total_count > 0 else 0,
                "by_rating": rating_stats
            }
            
            logger.info(f"✅ Statistics calculated: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"❌ Error calculating statistics: {e}")
            raise
