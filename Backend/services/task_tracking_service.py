"""
Task Tracking Service
CRUD operations and business logic for task tracking and growth metrics
"""

import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, func
from models.task_tracking import DailyTask, GrowthMetric, TaskTemplate
from models.user import User

logger = logging.getLogger(__name__)


class TaskTrackingService:
    """Service for task tracking and growth metrics"""
    
    # ======================== Task Operations ========================
    
    @staticmethod
    async def create_task(
        db: Session,
        user_id: int,
        task_data: Dict[str, Any]
    ) -> DailyTask:
        """Create a new daily task"""
        try:
            task = DailyTask(
                user_id=user_id,
                **task_data
            )
            
            db.add(task)
            db.commit()
            db.refresh(task)
            
            logger.info(f"✅ Created task: {task.title} for user {user_id}")
            return task
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error creating task: {e}")
            raise
    
    @staticmethod
    def get_today_tasks(
        db: Session,
        user_id: int
    ) -> List[DailyTask]:
        """Get today's tasks for a user"""
        try:
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start + timedelta(days=1)
            
            tasks = db.query(DailyTask).filter(
                and_(
                    DailyTask.user_id == user_id,
                    DailyTask.assigned_date >= today_start,
                    DailyTask.assigned_date < today_end
                )
            ).order_by(
                DailyTask.priority.desc(),
                DailyTask.created_at
            ).all()
            
            return tasks
            
        except Exception as e:
            logger.error(f"❌ Error fetching today's tasks: {e}")
            return []
    
    @staticmethod
    def get_tasks_by_date_range(
        db: Session,
        user_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[DailyTask]:
        """Get tasks within a date range"""
        try:
            tasks = db.query(DailyTask).filter(
                and_(
                    DailyTask.user_id == user_id,
                    DailyTask.assigned_date >= start_date,
                    DailyTask.assigned_date <= end_date
                )
            ).order_by(DailyTask.assigned_date.desc()).all()
            
            return tasks
            
        except Exception as e:
            logger.error(f"❌ Error fetching tasks by date range: {e}")
            return []
    
    @staticmethod
    def get_task_by_id(
        db: Session,
        task_id: int,
        user_id: int
    ) -> Optional[DailyTask]:
        """Get a specific task by ID"""
        try:
            return db.query(DailyTask).filter(
                and_(
                    DailyTask.id == task_id,
                    DailyTask.user_id == user_id
                )
            ).first()
        except Exception as e:
            logger.error(f"❌ Error fetching task: {e}")
            return None
    
    @staticmethod
    async def complete_task(
        db: Session,
        task_id: int,
        user_id: int
    ) -> Optional[DailyTask]:
        """Mark a task as completed"""
        try:
            task = db.query(DailyTask).filter(
                and_(
                    DailyTask.id == task_id,
                    DailyTask.user_id == user_id
                )
            ).first()
            
            if not task:
                return None
            
            if task.is_completed:
                logger.info(f"⚠️ Task {task_id} already completed")
                return task
            
            task.is_completed = True
            task.completed_at = datetime.utcnow()
            
            db.commit()
            db.refresh(task)
            
            # Update daily metrics
            await TaskTrackingService.update_daily_metrics(db, user_id)
            
            logger.info(f"✅ Task completed: {task.title} (+{task.points} points)")
            return task
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error completing task: {e}")
            raise
    
    @staticmethod
    async def uncomplete_task(
        db: Session,
        task_id: int,
        user_id: int
    ) -> Optional[DailyTask]:
        """Mark a task as not completed"""
        try:
            task = db.query(DailyTask).filter(
                and_(
                    DailyTask.id == task_id,
                    DailyTask.user_id == user_id
                )
            ).first()
            
            if not task:
                return None
            
            task.is_completed = False
            task.completed_at = None
            
            db.commit()
            db.refresh(task)
            
            # Update daily metrics
            await TaskTrackingService.update_daily_metrics(db, user_id)
            
            logger.info(f"✅ Task uncompleted: {task.title}")
            return task
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error uncompleting task: {e}")
            raise
    
    @staticmethod
    async def delete_task(
        db: Session,
        task_id: int,
        user_id: int
    ) -> bool:
        """Delete a task"""
        try:
            task = db.query(DailyTask).filter(
                and_(
                    DailyTask.id == task_id,
                    DailyTask.user_id == user_id
                )
            ).first()
            
            if not task:
                return False
            
            db.delete(task)
            db.commit()
            
            # Update daily metrics
            await TaskTrackingService.update_daily_metrics(db, user_id)
            
            logger.info(f"✅ Task deleted: {task.title}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error deleting task: {e}")
            return False
    
    # ======================== Growth Metrics Operations ========================
    
    @staticmethod
    async def update_daily_metrics(
        db: Session,
        user_id: int,
        target_date: Optional[datetime] = None
    ) -> GrowthMetric:
        """Calculate and update daily growth metrics"""
        try:
            if target_date is None:
                target_date = datetime.now()
            
            # Get date range for the day
            day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            # Get tasks for the day
            tasks = db.query(DailyTask).filter(
                and_(
                    DailyTask.user_id == user_id,
                    DailyTask.assigned_date >= day_start,
                    DailyTask.assigned_date < day_end
                )
            ).all()
            
            # Calculate metrics
            tasks_assigned = len(tasks)
            tasks_completed = sum(1 for t in tasks if t.is_completed)
            completion_rate = (tasks_completed / tasks_assigned * 100) if tasks_assigned > 0 else 0
            points_earned = sum(t.points for t in tasks if t.is_completed)
            
            # Category breakdown
            category_counts = {
                'marketing': 0,
                'content': 0,
                'engagement': 0,
                'analytics': 0,
                'growth': 0
            }
            
            for task in tasks:
                if task.is_completed and task.category in category_counts:
                    category_counts[task.category] += 1
            
            # Calculate streak
            streak_days = await TaskTrackingService._calculate_streak(db, user_id, day_start)
            
            # Get previous total points
            previous_metric = db.query(GrowthMetric).filter(
                and_(
                    GrowthMetric.user_id == user_id,
                    GrowthMetric.metric_date < day_start
                )
            ).order_by(desc(GrowthMetric.metric_date)).first()
            
            previous_total = previous_metric.total_points if previous_metric else 0
            total_points = previous_total + points_earned
            
            # Calculate scores
            productivity_score = TaskTrackingService._calculate_productivity_score(
                tasks_completed, tasks_assigned, tasks
            )
            consistency_score = TaskTrackingService._calculate_consistency_score(streak_days)
            growth_score = TaskTrackingService._calculate_growth_score(
                completion_rate, productivity_score, consistency_score
            )
            
            # Check if metric already exists for this date
            existing_metric = db.query(GrowthMetric).filter(
                and_(
                    GrowthMetric.user_id == user_id,
                    GrowthMetric.metric_date >= day_start,
                    GrowthMetric.metric_date < day_end
                )
            ).first()
            
            if existing_metric:
                # Update existing metric
                existing_metric.tasks_assigned = tasks_assigned
                existing_metric.tasks_completed = tasks_completed
                existing_metric.completion_rate = completion_rate
                existing_metric.points_earned = points_earned
                existing_metric.total_points = total_points
                existing_metric.streak_days = streak_days
                existing_metric.marketing_tasks = category_counts['marketing']
                existing_metric.content_tasks = category_counts['content']
                existing_metric.engagement_tasks = category_counts['engagement']
                existing_metric.analytics_tasks = category_counts['analytics']
                existing_metric.growth_tasks = category_counts['growth']
                existing_metric.growth_score = growth_score
                existing_metric.productivity_score = productivity_score
                existing_metric.consistency_score = consistency_score
                existing_metric.updated_at = datetime.utcnow()
                
                metric = existing_metric
            else:
                # Create new metric
                metric = GrowthMetric(
                    user_id=user_id,
                    metric_date=day_start,
                    tasks_assigned=tasks_assigned,
                    tasks_completed=tasks_completed,
                    completion_rate=completion_rate,
                    points_earned=points_earned,
                    total_points=total_points,
                    streak_days=streak_days,
                    marketing_tasks=category_counts['marketing'],
                    content_tasks=category_counts['content'],
                    engagement_tasks=category_counts['engagement'],
                    analytics_tasks=category_counts['analytics'],
                    growth_tasks=category_counts['growth'],
                    growth_score=growth_score,
                    productivity_score=productivity_score,
                    consistency_score=consistency_score
                )
                db.add(metric)
            
            db.commit()
            db.refresh(metric)
            
            logger.info(f"✅ Updated metrics for user {user_id}: Score={growth_score:.1f}, Streak={streak_days}")
            return metric
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error updating daily metrics: {e}")
            raise
    
    @staticmethod
    async def _calculate_streak(
        db: Session,
        user_id: int,
        current_date: datetime
    ) -> int:
        """Calculate current streak of consecutive days with completed tasks"""
        try:
            streak = 0
            check_date = current_date
            
            # Check backwards from current date
            for _ in range(365):  # Max 1 year streak
                day_start = check_date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                
                # Check if user completed at least 1 task on this day
                completed_count = db.query(func.count(DailyTask.id)).filter(
                    and_(
                        DailyTask.user_id == user_id,
                        DailyTask.assigned_date >= day_start,
                        DailyTask.assigned_date < day_end,
                        DailyTask.is_completed == True
                    )
                ).scalar()
                
                if completed_count > 0:
                    streak += 1
                    check_date -= timedelta(days=1)
                else:
                    break
            
            return streak
            
        except Exception as e:
            logger.error(f"❌ Error calculating streak: {e}")
            return 0
    
    @staticmethod
    def _calculate_productivity_score(
        tasks_completed: int,
        tasks_assigned: int,
        tasks: List[DailyTask]
    ) -> float:
        """Calculate productivity score based on completion and efficiency"""
        if tasks_assigned == 0:
            return 0.0
        
        # Base score from completion rate
        completion_rate = tasks_completed / tasks_assigned
        base_score = completion_rate * 70  # 70% weight
        
        # Bonus for completing high-priority tasks
        high_priority_completed = sum(
            1 for t in tasks 
            if t.is_completed and t.priority == 'high'
        )
        priority_bonus = min(high_priority_completed * 5, 30)  # Max 30% bonus
        
        return min(base_score + priority_bonus, 100)
    
    @staticmethod
    def _calculate_consistency_score(streak_days: int) -> float:
        """Calculate consistency score based on streak"""
        # Logarithmic scale: 1 day = 20, 7 days = 60, 30 days = 90, 90+ days = 100
        if streak_days == 0:
            return 0
        elif streak_days == 1:
            return 20
        elif streak_days < 7:
            return 20 + (streak_days - 1) * 6.67  # ~40 at 4 days
        elif streak_days < 30:
            return 60 + (streak_days - 7) * 1.3  # ~90 at 30 days
        else:
            return min(90 + (streak_days - 30) * 0.17, 100)  # 100 at 90+ days
    
    @staticmethod
    def _calculate_growth_score(
        completion_rate: float,
        productivity_score: float,
        consistency_score: float
    ) -> float:
        """Calculate overall growth score"""
        # Weighted average
        growth_score = (
            completion_rate * 0.4 +  # 40% weight
            productivity_score * 0.3 +  # 30% weight
            consistency_score * 0.3  # 30% weight
        )
        
        return round(growth_score, 2)
    
    @staticmethod
    def get_growth_metrics(
        db: Session,
        user_id: int,
        days: int = 30
    ) -> List[GrowthMetric]:
        """Get growth metrics for the last N days"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            metrics = db.query(GrowthMetric).filter(
                and_(
                    GrowthMetric.user_id == user_id,
                    GrowthMetric.metric_date >= cutoff_date
                )
            ).order_by(GrowthMetric.metric_date).all()
            
            return metrics
            
        except Exception as e:
            logger.error(f"❌ Error fetching growth metrics: {e}")
            return []
    
    @staticmethod
    def get_current_stats(
        db: Session,
        user_id: int
    ) -> Dict[str, Any]:
        """Get current user stats (points, streak, etc.)"""
        try:
            # Get latest metric
            latest_metric = db.query(GrowthMetric).filter(
                GrowthMetric.user_id == user_id
            ).order_by(desc(GrowthMetric.metric_date)).first()
            
            if not latest_metric:
                return {
                    "total_points": 0,
                    "streak_days": 0,
                    "growth_score": 0,
                    "completion_rate": 0
                }
            
            return {
                "total_points": latest_metric.total_points,
                "streak_days": latest_metric.streak_days,
                "growth_score": latest_metric.growth_score,
                "completion_rate": latest_metric.completion_rate
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching current stats: {e}")
            return {
                "total_points": 0,
                "streak_days": 0,
                "growth_score": 0,
                "completion_rate": 0
            }
    
    # ======================== Task Template Operations ========================
    
    @staticmethod
    def get_task_templates(
        db: Session,
        category: Optional[str] = None,
        business_type: Optional[str] = None
    ) -> List[TaskTemplate]:
        """Get task templates filtered by category and business type"""
        try:
            query = db.query(TaskTemplate).filter(TaskTemplate.is_active == True)
            
            if category:
                query = query.filter(TaskTemplate.category == category)
            
            if business_type:
                query = query.filter(
                    or_(
                        TaskTemplate.business_type == business_type,
                        TaskTemplate.business_type.is_(None)
                    )
                )
            
            templates = query.all()
            return templates
            
        except Exception as e:
            logger.error(f"❌ Error fetching task templates: {e}")
            return []


# Create singleton instance
task_tracking_service = TaskTrackingService()
