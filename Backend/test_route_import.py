"""Test minimal route to debug FastAPI + SQLAlchemy Session issue"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from config.database import get_db
from services.auth_service import get_current_user
from models.user import User

router = APIRouter(prefix="/api/test", tags=["Test"])

class TestRequest(BaseModel):
    name: str


# Test 1: Route without Session dependency
@router.post("/test1")
def test_route_1(
    data: TestRequest,
    current_user: User = Depends(get_current_user)
):
    """Test route without db dependency"""
    return {"success": True}


# Test 2: Route with Session dependency but no type annotation
@router.post("/test2")
def test_route_2(
    data: TestRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Test route with db dependency"""
    return {"success": True}
