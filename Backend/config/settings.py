import os
import json
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = {
        "extra": "ignore",
        "env_file": ".env",
        "case_sensitive": True
    }

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
    
    # Instagram Graph API Access Token (for real data fetching)
    INSTAGRAM_ACCESS_TOKEN: str = ""
    INSTAGRAM_BUSINESS_ACCOUNT_ID: str = ""

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
    GEMINI_API_KEY_2: str = ""
    GEMINI_API_KEY_3: str = ""

    # Web Search APIs (for Blog Generation)
    TAVILY_API_KEY: str = ""
    SERPER_API_KEY: str = ""
    BRAVE_SEARCH_API_KEY: str = ""

    # RapidAPI Configuration (for Partnership Agent)
    RAPIDAPI_KEY: str = ""

    # Apify API Configuration (for Instagram Scraper)
    APIFY_API_TOKEN: str = ""

    # Resend API Configuration (for Email Sending)
    RESEND_API_KEY: str = ""

    # Tavily API Configuration (for Real-time Web Search)
    TAVILY_API_KEY: str = ""

    # SerpAPI Configuration (for Google Search Results)
    SERPAPI_KEY: str = ""

    # Token Encryption Key
    ENCRYPTION_KEY: str = "your-32-char-encryption-key-here"

    # Meta Ads Configuration (Facebook/Instagram Ads)
    META_REDIRECT_URI: str = "http://localhost:8000/auth/meta/callback"

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
    
    # Mistral Content Generation Configuration
    MISTRAL_CONTENT_MODE: str = "api"
    MISTRAL_TEXT_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.3"
    
    # AI Model Configuration for Content Generation
    GEMINI_CONTENT_MODEL: str = "gemini-1.5-flash"
    GROQ_CONTENT_MODEL: str = "llama-3.1-8b-instant"
    GROQ_CONTENT_MODEL_FALLBACK: str = "llama3-8b-8192"

    # Firebase Configuration (Optional - for Google OAuth)
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    FIREBASE_PROJECT_ID: str = ""

    # AEO/GEO System Configuration
    OPENAI_API_KEY: str = "your_openai_api_key_here"
    PINECONE_API_KEY: str = "your_pinecone_api_key_here"
    PINECONE_ENVIRONMENT: str = "your_pinecone_environment_here"
    PINECONE_INDEX_NAME: str = "saadhyam-aeo-geo"
    GOOGLE_SEARCH_API_KEY: str = "your_google_search_api_key_here"
    GOOGLE_SEARCH_ENGINE_ID: str = "your_search_engine_id_here"
    LINKEDIN_ACCESS_TOKEN: str = "your_linkedin_token_here"
    FACEBOOK_ACCESS_TOKEN: str = "your_facebook_token_here"
    MEDIUM_API_TOKEN: str = "your_medium_token_here"
    WORDPRESS_API_URL: str = "your_wordpress_url_here"
    WORDPRESS_USERNAME: str = "your_wordpress_username_here"
    WORDPRESS_PASSWORD: str = "your_wordpress_password_here"
    REDDIT_CLIENT_ID: str = "your_reddit_client_id_here"
    REDDIT_CLIENT_SECRET: str = "your_reddit_client_secret_here"
    REDDIT_USER_AGENT: str = "Saadhyam-AEO-Bot/1.0"
    QUORA_SCRAPING_ENABLED: str = "false"
    AEO_GEO_ENABLED: str = "true"
    AEO_GEO_USE_MOCK_DATA: str = "false"
    AEO_GEO_AUTO_OPTIMIZATION: str = "true"
    AEO_GEO_CONTENT_GENERATION_MODEL: str = "gemini"
    AEO_GEO_QUESTION_DISCOVERY_MODEL: str = "gemini"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        return v


settings = Settings()
