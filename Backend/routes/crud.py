"""
CRUD routes for non-AI features
Handles tasks, competitors, automations, and settings
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from models.user import User
from utils.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["crud"])


# ============= TASKS (Daily Tasks) =============


class Task(BaseModel):
    id: Optional[int] = None
    title: str
    impact: str  # High, Medium, Low
    time: str  # e.g., "10 min"
    done: bool = False
    ai: bool = False
    icon: str = "Star"


class TaskResponse(BaseModel):
    success: bool
    task: Optional[Task] = None
    tasks: Optional[List[Task]] = None
    message: Optional[str] = None


# In-memory storage (replace with database in production)
tasks_db = {}


@router.get("/tasks", response_model=TaskResponse)
async def get_tasks(current_user: User = Depends(get_current_user)):
    """Get all tasks for current user"""
    user_tasks = tasks_db.get(current_user.id, [])
    return TaskResponse(success=True, tasks=user_tasks)


@router.post("/tasks", response_model=TaskResponse)
async def create_task(task: Task, current_user: User = Depends(get_current_user)):
    """Create a new task"""
    if current_user.id not in tasks_db:
        tasks_db[current_user.id] = []

    # Generate ID
    task.id = len(tasks_db[current_user.id]) + 1
    tasks_db[current_user.id].append(task.dict())

    return TaskResponse(success=True, task=task, message="Task created successfully")


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int, task: Task, current_user: User = Depends(get_current_user)
):
    """Update a task"""
    user_tasks = tasks_db.get(current_user.id, [])

    for i, t in enumerate(user_tasks):
        if t["id"] == task_id:
            task.id = task_id
            user_tasks[i] = task.dict()
            return TaskResponse(
                success=True, task=task, message="Task updated successfully"
            )

    raise HTTPException(status_code=404, detail="Task not found")


@router.delete("/tasks/{task_id}", response_model=TaskResponse)
async def delete_task(task_id: int, current_user: User = Depends(get_current_user)):
    """Delete a task"""
    user_tasks = tasks_db.get(current_user.id, [])

    for i, t in enumerate(user_tasks):
        if t["id"] == task_id:
            deleted_task = user_tasks.pop(i)
            return TaskResponse(success=True, message="Task deleted successfully")

    raise HTTPException(status_code=404, detail="Task not found")


# ============= COMPETITORS =============


class Competitor(BaseModel):
    id: Optional[int] = None
    name: str
    handle: str
    score: int = 0
    followers: str = "0"
    posts: int = 0
    engagement: str = "0%"
    trend: str = "up"
    insight: str = ""
    color: str = "from-purple-500 to-pink-500"


class CompetitorResponse(BaseModel):
    success: bool
    competitor: Optional[Competitor] = None
    competitors: Optional[List[Competitor]] = None
    message: Optional[str] = None


competitors_db = {}


@router.get("/competitors", response_model=CompetitorResponse)
async def get_competitors(current_user: User = Depends(get_current_user)):
    """Get all competitors for current user"""
    user_competitors = competitors_db.get(current_user.id, [])
    return CompetitorResponse(success=True, competitors=user_competitors)


@router.post("/competitors", response_model=CompetitorResponse)
async def create_competitor(
    competitor: Competitor, current_user: User = Depends(get_current_user)
):
    """Add a new competitor"""
    if current_user.id not in competitors_db:
        competitors_db[current_user.id] = []

    competitor.id = len(competitors_db[current_user.id]) + 1
    competitors_db[current_user.id].append(competitor.dict())

    return CompetitorResponse(
        success=True, competitor=competitor, message="Competitor added successfully"
    )


@router.put("/competitors/{competitor_id}", response_model=CompetitorResponse)
async def update_competitor(
    competitor_id: int,
    competitor: Competitor,
    current_user: User = Depends(get_current_user),
):
    """Update a competitor"""
    user_competitors = competitors_db.get(current_user.id, [])

    for i, c in enumerate(user_competitors):
        if c["id"] == competitor_id:
            competitor.id = competitor_id
            user_competitors[i] = competitor.dict()
            return CompetitorResponse(
                success=True,
                competitor=competitor,
                message="Competitor updated successfully",
            )

    raise HTTPException(status_code=404, detail="Competitor not found")


@router.delete("/competitors/{competitor_id}", response_model=CompetitorResponse)
async def delete_competitor(
    competitor_id: int, current_user: User = Depends(get_current_user)
):
    """Delete a competitor"""
    user_competitors = competitors_db.get(current_user.id, [])

    for i, c in enumerate(user_competitors):
        if c["id"] == competitor_id:
            user_competitors.pop(i)
            return CompetitorResponse(
                success=True, message="Competitor deleted successfully"
            )

    raise HTTPException(status_code=404, detail="Competitor not found")


# ============= AUTOMATION WORKFLOWS =============


class Workflow(BaseModel):
    id: Optional[int] = None
    name: str
    desc: str
    on: bool = False
    icon: str = "Workflow"
    runs: str = "0 runs"
    steps: List[str] = []
    color: str = "from-purple-500 to-pink-500"


class WorkflowResponse(BaseModel):
    success: bool
    workflow: Optional[Workflow] = None
    workflows: Optional[List[Workflow]] = None
    message: Optional[str] = None


workflows_db = {}


@router.get("/workflows", response_model=WorkflowResponse)
async def get_workflows(current_user: User = Depends(get_current_user)):
    """Get all workflows for current user"""
    user_workflows = workflows_db.get(current_user.id, [])
    return WorkflowResponse(success=True, workflows=user_workflows)


@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(
    workflow: Workflow, current_user: User = Depends(get_current_user)
):
    """Create a new workflow"""
    if current_user.id not in workflows_db:
        workflows_db[current_user.id] = []

    workflow.id = len(workflows_db[current_user.id]) + 1
    workflows_db[current_user.id].append(workflow.dict())

    return WorkflowResponse(
        success=True, workflow=workflow, message="Workflow created successfully"
    )


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int, workflow: Workflow, current_user: User = Depends(get_current_user)
):
    """Update a workflow (e.g., toggle on/off)"""
    user_workflows = workflows_db.get(current_user.id, [])

    for i, w in enumerate(user_workflows):
        if w["id"] == workflow_id:
            workflow.id = workflow_id
            user_workflows[i] = workflow.dict()
            return WorkflowResponse(
                success=True, workflow=workflow, message="Workflow updated successfully"
            )

    raise HTTPException(status_code=404, detail="Workflow not found")


@router.delete("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def delete_workflow(
    workflow_id: int, current_user: User = Depends(get_current_user)
):
    """Delete a workflow"""
    user_workflows = workflows_db.get(current_user.id, [])

    for i, w in enumerate(user_workflows):
        if w["id"] == workflow_id:
            user_workflows.pop(i)
            return WorkflowResponse(
                success=True, message="Workflow deleted successfully"
            )

    raise HTTPException(status_code=404, detail="Workflow not found")


# ============= USER SETTINGS =============


class UserSettings(BaseModel):
    full_name: str
    email: str
    phone: str
    timezone: str
    business_name: str
    industry: str
    description: str
    brand_voice: str
    target_audience: str


class SettingsResponse(BaseModel):
    success: bool
    settings: Optional[UserSettings] = None
    message: Optional[str] = None


settings_db = {}


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(current_user: User = Depends(get_current_user)):
    """Get user settings"""
    user_settings = settings_db.get(
        current_user.id,
        {
            "full_name": "User",
            "email": current_user.email,
            "phone": "",
            "timezone": "Asia/Kolkata (IST)",
            "business_name": "My Business",
            "industry": "",
            "description": "",
            "brand_voice": "",
            "target_audience": "",
        },
    )
    return SettingsResponse(success=True, settings=UserSettings(**user_settings))


@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    settings: UserSettings, current_user: User = Depends(get_current_user)
):
    """Update user settings"""
    settings_db[current_user.id] = settings.dict()
    return SettingsResponse(
        success=True, settings=settings, message="Settings saved successfully"
    )
