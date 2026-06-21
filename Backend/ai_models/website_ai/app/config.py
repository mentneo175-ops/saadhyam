"""
Configuration management for Website Generator Microservice
"""
from functools import lru_cache
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "Website Generator Microservice"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/website_generator"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600  # 1 hour

    # Celery
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1")
    CELERY_TASK_TRACK_STARTED: bool = True
    CELERY_TASK_TIME_LIMIT: int = 600  # 10 minutes

    # Storage (S3/MinIO)
    STORAGE_TYPE: str = Field(default="local", validation_alias="WEBSITE_AI_STORAGE_TYPE")  # local, s3, minio
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "website-generator"
    S3_REGION: str = "us-east-1"
    LOCAL_STORAGE_PATH: str = Field(default="website_ai_output", validation_alias="WEBSITE_AI_LOCAL_STORAGE_PATH")

    # AI/LLM
    AI_MODEL_ID: str = Field(default="mistralai/Mistral-7B-Instruct-v0.2", validation_alias="WEBSITE_AI_MODEL_ID")
    AI_USE_FAKE_LLM: bool = Field(default=True, validation_alias="WEBSITE_AI_USE_FAKE_LLM")  # Use fallback for development
    AI_MAX_TOKENS: int = Field(default=900, validation_alias="WEBSITE_AI_MAX_TOKENS")
    AI_TEMPERATURE: float = Field(default=0.7, validation_alias="WEBSITE_AI_TEMPERATURE")
    HF_TOKEN: Optional[str] = None

    # Security
    API_KEY_HEADER: str = "X-API-Key"
    API_KEYS: list[str] = ["dev-key-12345"]  # In production, use secure keys
    CORS_ORIGINS: list[str] = ["*"]
    RATE_LIMIT_PER_MINUTE: int = 100

    # Job Processing
    JOB_RETENTION_DAYS: int = 30
    MAX_CONCURRENT_JOBS: int = 10
    JOB_POLL_INTERVAL: int = 2  # seconds

    # Templates
    TEMPLATE_DIR: str = "app/templates"
    STATIC_DIR: str = "app/static"
    DEFAULT_THEME: str = Field(default="hero-split", validation_alias="WEBSITE_AI_DEFAULT_THEME")
    AVAILABLE_THEMES: list[str] = [
        "hero-split",
        "card-masonry",
        "timeline-vertical",
        "magazine-grid",
        "bento-box",
        "parallax-scroll",
        "minimal-modern",
        "agency-dark",
        "retro-brutalism",
        "restaurant-showcase",
        "saas-dashboard",
        "creative-portfolio"
    ]

    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    LOG_LEVEL: str = "INFO"

    def __init__(self, **values):
        super().__init__(**values)
        import os
        # Override REDIS_URL and Celery URLs if REDIS_URL/REDIS_PRIVATE_URL is set in environment (Railway managed)
        redis_env = os.getenv("REDIS_URL") or os.getenv("REDIS_PRIVATE_URL")
        if redis_env:
            self.REDIS_URL = redis_env
            
        if "localhost" not in self.REDIS_URL and "127.0.0.1" not in self.REDIS_URL:
            # Auto-resolve Celery URLs using the production Redis URL
            base_redis = self.REDIS_URL.rstrip('/')
            # Remove DB index if present (e.g. /0)
            if base_redis.split('/')[-1].isdigit():
                base_redis = '/'.join(base_redis.split('/')[:-1])
            self.CELERY_BROKER_URL = f"{base_redis}/0"
            self.CELERY_RESULT_BACKEND = f"{base_redis}/1"
            print(f"🔄 website_ai settings: Auto-resolved CELERY_BROKER_URL using REDIS_URL")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Convenience function
settings = get_settings()
