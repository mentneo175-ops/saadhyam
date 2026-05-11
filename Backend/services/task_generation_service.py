"""
Task Generation Service
AI-powered daily task generation based on user profile and connected features
"""

import logging
import random
from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.user import User
from models.task_tracking import TaskTemplate, DailyTask
from services.task_tracking_service import task_tracking_service

logger = logging.getLogger(__name__)


class TaskGenerationService:
    """Service for generating daily tasks"""
    
    @staticmethod
    async def generate_daily_tasks(
        db: Session,
        user_id: int,
        num_tasks: int = 5
    ) -> List[DailyTask]:
        """
        Generate daily tasks for a user based on their profile and connected features
        
        Args:
            db: Database session
            user_id: User ID
            num_tasks: Number of tasks to generate (default: 5)
            
        Returns:
            List of created tasks
        """
        try:
            logger.info(f"🎯 Generating {num_tasks} daily tasks for user {user_id}")
            
            # Get user profile
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"❌ User {user_id} not found")
                return []
            
            # Check what features user has connected
            has_instagram = await TaskGenerationService._check_instagram_connected(db, user_id)
            has_whatsapp = await TaskGenerationService._check_whatsapp_connected(db, user_id)
            has_website = user.last_generated_website_id is not None
            
            logger.info(f"📊 User features: Instagram={has_instagram}, WhatsApp={has_whatsapp}, Website={has_website}")
            
            # Get suitable task templates
            templates = TaskGenerationService._get_suitable_templates(
                db=db,
                business_type=user.business_type,
                has_instagram=has_instagram,
                has_whatsapp=has_whatsapp,
                has_website=has_website
            )
            
            if not templates:
                logger.warning(f"⚠️ No suitable templates found for user {user_id}")
                return []
            
            # Check if tasks already exist for today
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start + timedelta(days=1)
            
            existing_tasks = db.query(DailyTask).filter(
                and_(
                    DailyTask.user_id == user_id,
                    DailyTask.assigned_date >= today_start,
                    DailyTask.assigned_date < today_end
                )
            ).count()
            
            if existing_tasks > 0:
                logger.info(f"⏭️  User {user_id} already has {existing_tasks} tasks for today")
                return []
            
            # Select diverse tasks from different categories
            selected_templates = TaskGenerationService._select_diverse_tasks(
                templates, num_tasks
            )
            
            # Create tasks
            created_tasks = []
            for template in selected_templates:
                task_data = {
                    "title": template.title,
                    "description": template.description,
                    "category": template.category,
                    "priority": template.priority,
                    "points": template.points,
                    "estimated_minutes": template.estimated_minutes,
                    "assigned_date": today_start,
                    "is_ai_generated": True,
                    "ai_reasoning": f"Generated based on your {template.category} needs"
                }
                
                task = await task_tracking_service.create_task(
                    db=db,
                    user_id=user_id,
                    task_data=task_data
                )
                created_tasks.append(task)
                
                # Update template usage stats
                template.times_assigned += 1
                db.commit()
            
            # Initialize daily metrics
            await task_tracking_service.update_daily_metrics(db, user_id)
            
            logger.info(f"✅ Generated {len(created_tasks)} tasks for user {user_id}")
            return created_tasks
            
        except Exception as e:
            logger.error(f"❌ Error generating daily tasks: {e}")
            return []
    
    @staticmethod
    async def _check_instagram_connected(db: Session, user_id: int) -> bool:
        """Check if user has Instagram connected"""
        try:
            from models.instagram_analytics import InstagramBusinessAccount
            
            account = db.query(InstagramBusinessAccount).filter(
                and_(
                    InstagramBusinessAccount.user_id == user_id,
                    InstagramBusinessAccount.is_active == True
                )
            ).first()
            
            return account is not None
        except Exception:
            return False
    
    @staticmethod
    async def _check_whatsapp_connected(db: Session, user_id: int) -> bool:
        """Check if user has WhatsApp connected"""
        try:
            from models.whatsapp import WhatsAppConnection
            
            connection = db.query(WhatsAppConnection).filter(
                and_(
                    WhatsAppConnection.user_id == user_id,
                    WhatsAppConnection.is_active == True
                )
            ).first()
            
            return connection is not None
        except Exception:
            return False
    
    @staticmethod
    def _get_suitable_templates(
        db: Session,
        business_type: str = None,
        has_instagram: bool = False,
        has_whatsapp: bool = False,
        has_website: bool = False
    ) -> List[TaskTemplate]:
        """Get task templates suitable for user's profile"""
        try:
            # Get all active templates
            templates = db.query(TaskTemplate).filter(
                TaskTemplate.is_active == True
            ).all()
            
            # Filter based on requirements
            suitable_templates = []
            for template in templates:
                # Check feature requirements
                if template.requires_instagram and not has_instagram:
                    continue
                if template.requires_whatsapp and not has_whatsapp:
                    continue
                if template.requires_website and not has_website:
                    continue
                
                # Check business type (if specified)
                if template.business_type and business_type:
                    if template.business_type.lower() != business_type.lower():
                        continue
                
                suitable_templates.append(template)
            
            return suitable_templates
            
        except Exception as e:
            logger.error(f"❌ Error getting suitable templates: {e}")
            return []
    
    @staticmethod
    def _select_diverse_tasks(
        templates: List[TaskTemplate],
        num_tasks: int
    ) -> List[TaskTemplate]:
        """Select diverse tasks from different categories"""
        if len(templates) <= num_tasks:
            return templates
        
        # Group by category
        by_category = {}
        for template in templates:
            if template.category not in by_category:
                by_category[template.category] = []
            by_category[template.category].append(template)
        
        # Select tasks ensuring diversity
        selected = []
        categories = list(by_category.keys())
        
        # First pass: one from each category
        for category in categories:
            if len(selected) >= num_tasks:
                break
            
            # Prioritize high priority tasks
            category_templates = sorted(
                by_category[category],
                key=lambda t: (
                    {"high": 3, "medium": 2, "low": 1}.get(t.priority, 0),
                    -t.times_assigned  # Prefer less used templates
                ),
                reverse=True
            )
            
            if category_templates:
                selected.append(category_templates[0])
        
        # Second pass: fill remaining slots
        remaining_templates = [t for t in templates if t not in selected]
        while len(selected) < num_tasks and remaining_templates:
            # Pick randomly from remaining, weighted by priority
            high_priority = [t for t in remaining_templates if t.priority == "high"]
            medium_priority = [t for t in remaining_templates if t.priority == "medium"]
            low_priority = [t for t in remaining_templates if t.priority == "low"]
            
            if high_priority:
                task = random.choice(high_priority)
            elif medium_priority:
                task = random.choice(medium_priority)
            elif low_priority:
                task = random.choice(low_priority)
            else:
                break
            
            selected.append(task)
            remaining_templates.remove(task)
        
        return selected


# Create singleton instance
task_generation_service = TaskGenerationService()
