"""
Health Check Routes
Monitor backend service health and dependencies
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from config.database import get_db
from services.vector_storage_service import vector_storage
from services.firebase_service import firebase_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """Basic health check - API is running"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Saadhyam AI Backend"
    }


@router.get("/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check - monitor all dependencies"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    try:
        # Check Database
        try:
            db.execute("SELECT 1")
            health_status["services"]["database"] = {
                "status": "healthy",
                "message": "PostgreSQL connection OK"
            }
        except Exception as e:
            health_status["status"] = "degraded"
            health_status["services"]["database"] = {
                "status": "unhealthy",
                "error": str(e)
            }
        
        # Check Pinecone Vector DB
        try:
            if vector_storage.enabled:
                health_status["services"]["pinecone"] = {
                    "status": "healthy",
                    "message": "Pinecone connected"
                }
            else:
                health_status["services"]["pinecone"] = {
                    "status": "disconnected",
                    "message": "Pinecone not configured"
                }
        except Exception as e:
            health_status["services"]["pinecone"] = {
                "status": "unhealthy",
                "error": str(e)
            }
        
        # Check Firebase
        try:
            if firebase_service.is_firebase_available():
                health_status["services"]["firebase"] = {
                    "status": "healthy",
                    "message": "Firebase configured"
                }
            else:
                health_status["services"]["firebase"] = {
                    "status": "disconnected",
                    "message": "Firebase not configured"
                }
        except Exception as e:
            health_status["services"]["firebase"] = {
                "status": "unhealthy",
                "error": str(e)
            }
        
        # Overall status
        if any(svc.get("status") == "unhealthy" for svc in health_status["services"].values()):
            health_status["status"] = "unhealthy"
        elif any(svc.get("status") == "disconnected" for svc in health_status["services"].values()):
            if health_status["status"] != "unhealthy":
                health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }


@router.get("/ready")
async def readiness_check(db: Session = Depends(get_db)):
    """Readiness check - for Kubernetes/load balancer"""
    try:
        # Check critical dependencies
        db.execute("SELECT 1")
        
        if not firebase_service.is_firebase_available():
            return {
                "ready": False,
                "message": "Firebase not configured"
            }, 503
        
        return {
            "ready": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {
            "ready": False,
            "error": str(e)
        }, 503


@router.get("/stats")
async def service_stats(db: Session = Depends(get_db)):
    """Get service statistics"""
    try:
        stats = {
            "timestamp": datetime.utcnow().isoformat(),
            "services": {}
        }
        
        # Pinecone stats
        if vector_storage.enabled:
            try:
                # Get stats for main namespaces
                namespaces = [
                    "business-analysis",
                    "business-profile",
                    "business-insights"
                ]
                
                pinecone_stats = {}
                for ns in namespaces:
                    try:
                        ns_stats = vector_storage.get_stats(ns)
                        pinecone_stats[ns] = ns_stats
                    except:
                        pass
                
                stats["services"]["pinecone"] = {
                    "enabled": True,
                    "namespaces": pinecone_stats
                }
            except Exception as e:
                stats["services"]["pinecone"] = {
                    "enabled": True,
                    "error": str(e)
                }
        
        return stats
        
    except Exception as e:
        logger.error(f"Stats retrieval failed: {e}")
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }
