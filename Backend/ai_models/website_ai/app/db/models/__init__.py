"""
Database models for Website AI microservice
"""

# Import all models to ensure they are registered with SQLAlchemy
from .job import Job
from .website import Website
from .content import ContentEdit
from .theme_config import ThemeConfig

__all__ = [
    "Job",
    "Website", 
    "ContentEdit",
    "ThemeConfig"
]