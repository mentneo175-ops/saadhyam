"""
Task Tracking API Routes
API endpoints for daily tasks and growth journey tracking
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from config.database import get_sync_db
from utils.dependencies import get_current_user
from models.user import User
from models.task_tracking import DailyTask, GrowthMetric
from services.task_tracking_service import task_tracking_service
from services.task_generation_service import task_generation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["Task Tracking"])


# ======================== Pydantic Schemas ========================

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    points: int = Field(default=10, ge=1, le=100)
    estimated_minutes: int = Field(default=15, ge=1, le=480)
    assigned_date: Optional[datetime] = None
    due_date: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    priority: str
    points: int
    estimated_minutes: int
    is_completed: bool
    completed_at: Optional[datetime]
    assigned_date: datetime
    due_date: Optional[datetime]
    is_ai_generated: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]
    total: int
    completed: int
    pending: int
    total_points: int
    earned_points: int


class GrowthMetricResponse(BaseModel):
    id: int
    metric_date: datetime
    tasks_assigned: int
    tasks_completed: int
    completion_rate: float
    points_earned: int
    total_points: int
    streak_days: int
    growth_score: float
    productivity_score: float
    consistency_score: float
    
    class Config:
        from_attributes = True


class GrowthChartDataResponse(BaseModel):
    metrics: List[GrowthMetricResponse]
    days_analyzed: int


class CurrentStatsResponse(BaseModel):
    total_points: int
    streak_days: int
    growth_score: float
    completion_rate: float


# ======================== Task Endpoints ========================

@router.get(
    "/today",
    response_model=TaskListResponse,
    summary="Get Today's Tasks"
)
async def get_today_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Get all tasks assigned for today"""
    try:
        tasks = task_tracking_service.get_today_tasks(db, current_user.id)
        
        completed = sum(1 for t in tasks if t.is_completed)
        pending = len(tasks) - completed
        total_points = sum(t.points for t in tasks)
        earned_points = sum(t.points for t in tasks if t.is_completed)
        
        return TaskListResponse(
            tasks=[TaskResponse.from_orm(t) for t in tasks],
            total=len(tasks),
            completed=completed,
            pending=pending,
            total_points=total_points,
            earned_points=earned_points
        )
        
    except Exception as e:
        logger.error(f"❌ Error fetching today's tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch today's tasks"
        )


@router.get(
    "/history",
    response_model=TaskListResponse,
    summary="Get Task History"
)
async def get_task_history(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Get task history for the last N days"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        tasks = task_tracking_service.get_tasks_by_date_range(
            db, current_user.id, start_date, end_date
        )
        
        completed = sum(1 for t in tasks if t.is_completed)
        pending = len(tasks) - completed
        total_points = sum(t.points for t in tasks)
        earned_points = sum(t.points for t in tasks if t.is_completed)
        
        return TaskListResponse(
            tasks=[TaskResponse.from_orm(t) for t in tasks],
            total=len(tasks),
            completed=completed,
            pending=pending,
            total_points=total_points,
            earned_points=earned_points
        )
        
    except Exception as e:
        logger.error(f"❌ Error fetching task history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch task history"
        )


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Task"
)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Create a new daily task"""
    try:
        # Set assigned_date to today if not provided
        if task_data.assigned_date is None:
            task_data.assigned_date = datetime.now()
        
        task_dict = task_data.dict()
        task = await task_tracking_service.create_task(
            db=db,
            user_id=current_user.id,
            task_data=task_dict
        )
        
        # Update metrics
        await task_tracking_service.update_daily_metrics(db, current_user.id)
        
        return TaskResponse.from_orm(task)
        
    except Exception as e:
        logger.error(f"❌ Error creating task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task"
        )


@router.put(
    "/{task_id}/complete",
    response_model=TaskResponse,
    summary="Complete Task"
)
async def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Mark a task as completed"""
    try:
        task = await task_tracking_service.complete_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return TaskResponse.from_orm(task)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error completing task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete task"
        )


@router.put(
    "/{task_id}/uncomplete",
    response_model=TaskResponse,
    summary="Uncomplete Task"
)
async def uncomplete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Mark a task as not completed"""
    try:
        task = await task_tracking_service.uncomplete_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return TaskResponse.from_orm(task)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uncompleting task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to uncomplete task"
        )


@router.delete(
    "/{task_id}",
    summary="Delete Task"
)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Delete a task"""
    try:
        success = await task_tracking_service.delete_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return {"success": True, "message": "Task deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task"
        )


# ======================== Growth Metrics Endpoints ========================

@router.get(
    "/growth/chart-data",
    response_model=GrowthChartDataResponse,
    summary="Get Growth Chart Data"
)
async def get_growth_chart_data(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Get growth metrics data for the growth journey chart"""
    try:
        metrics = task_tracking_service.get_growth_metrics(
            db=db,
            user_id=current_user.id,
            days=days
        )
        
        return GrowthChartDataResponse(
            metrics=[GrowthMetricResponse.from_orm(m) for m in metrics],
            days_analyzed=days
        )
        
    except Exception as e:
        logger.error(f"❌ Error fetching growth chart data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch growth chart data"
        )


@router.get(
    "/growth/stats",
    response_model=CurrentStatsResponse,
    summary="Get Current Stats"
)
async def get_current_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Get current user stats (points, streak, growth score)"""
    try:
        stats = task_tracking_service.get_current_stats(db, current_user.id)
        
        return CurrentStatsResponse(**stats)
        
    except Exception as e:
        logger.error(f"❌ Error fetching current stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch current stats"
        )


@router.post(
    "/growth/update-metrics",
    summary="Update Daily Metrics"
)
async def update_daily_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Manually trigger daily metrics calculation"""
    try:
        metric = await task_tracking_service.update_daily_metrics(
            db=db,
            user_id=current_user.id
        )
        
        return {
            "success": True,
            "message": "Metrics updated successfully",
            "growth_score": metric.growth_score,
            "streak_days": metric.streak_days
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update metrics"
        )


@router.post(
    "/generate-daily",
    response_model=TaskListResponse,
    summary="Generate Daily Tasks"
)
async def generate_daily_tasks(
    num_tasks: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Generate AI-powered daily tasks based on user profile"""
    try:
        tasks = await task_generation_service.generate_daily_tasks(
            db=db,
            user_id=current_user.id,
            num_tasks=num_tasks
        )
        
        if not tasks:
            # Check if tasks already exist
            existing_tasks = task_tracking_service.get_today_tasks(db, current_user.id)
            if existing_tasks:
                return TaskListResponse(
                    tasks=[TaskResponse.from_orm(t) for t in existing_tasks],
                    total=len(existing_tasks),
                    completed=sum(1 for t in existing_tasks if t.is_completed),
                    pending=sum(1 for t in existing_tasks if not t.is_completed),
                    total_points=sum(t.points for t in existing_tasks),
                    earned_points=sum(t.points for t in existing_tasks if t.is_completed)
                )
        
        completed = sum(1 for t in tasks if t.is_completed)
        pending = len(tasks) - completed
        total_points = sum(t.points for t in tasks)
        earned_points = sum(t.points for t in tasks if t.is_completed)
        
        return TaskListResponse(
            tasks=[TaskResponse.from_orm(t) for t in tasks],
            total=len(tasks),
            completed=completed,
            pending=pending,
            total_points=total_points,
            earned_points=earned_points
        )
        
    except Exception as e:
        logger.error(f"❌ Error generating daily tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate daily tasks"
        )
