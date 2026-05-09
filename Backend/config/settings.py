import os
import json
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/saadhyam"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Server
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    BACKEND_URL: str = "http://localhost:8000"

    # CORS - Parse from JSON string in .env or use defaults
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
    ]

    # Instagram API Configuration
    INSTAGRAM_APP_ID: str = "your_instagram_app_id"
    INSTAGRAM_APP_SECRET: str = "your_instagram_app_secret"
    INSTAGRAM_REDIRECT_URI: str = "http://localhost:8000/auth/instagram/callback"
    INSTAGRAM_GRAPH_API_VERSION: str = "v19.0"

    # WhatsApp API Configuration (Meta WhatsApp Cloud API)
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    WHATSAPP_CONFIG_ID: str = ""
    WHATSAPP_API_VERSION: str = "v21.0"
    WHATSAPP_VERIFY_TOKEN: str = "saadhyam_whatsapp_verify_token_2024"
    WHATSAPP_REDIRECT_URI: str = "http://localhost:8000/api/whatsapp/callback"
    
    # Legacy WhatsApp fields (for backward compatibility)
    WHATSAPP_APP_ID: str = ""
    WHATSAPP_APP_SECRET: str = ""
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: str = "di16qmtbf"
    CLOUDINARY_API_KEY: str = "679832578499241"
    CLOUDINARY_API_SECRET: str = "ZuKhUD-ZGuFhdiwIyF1xWbl8m54"

    # DeepSeek API
    DEEPSEEK_API_KEY: str = ""

    # Groq API
    GROQ_API_KEY: str = ""

    # Google AI Studio (Gemini API)
    GEMINI_API_KEY: str = ""

    # Token Encryption Key
    ENCRYPTION_KEY: str = "your-32-char-encryption-key-here"

    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_TIMEZONE: str = "UTC"

    # Website AI settings
    WEBSITE_AI_USE_FAKE_LLM: bool = True
    WEBSITE_AI_MODEL_ID: str = "mistralai/Mistral-7B-Instruct-v0.2"
    WEBSITE_AI_MAX_TOKENS: int = 900
    WEBSITE_AI_TEMPERATURE: float = 0.7
    WEBSITE_AI_STORAGE_TYPE: str = "local"
    WEBSITE_AI_LOCAL_STORAGE_PATH: str = "./Backend/ai_models/website_ai/output"
    WEBSITE_AI_DEFAULT_THEME: str = "hero-split"

    # HuggingFace Configuration (for FLUX Image Generation)
    HUGGINGFACE_TOKEN: str = ""
    HF_TOKEN: str = ""

    # Firebase Configuration (Optional - for Google OAuth)
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    FIREBASE_PROJECT_ID: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
