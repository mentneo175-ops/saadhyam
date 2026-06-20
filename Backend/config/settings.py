import os
import json
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = {
        "extra": "ignore",
        "env_file": Path(__file__).resolve().parents[1] / ".env",
        "case_sensitive": True
    }

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/saadhyam"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Server
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    BACKEND_URL: str = "http://localhost:8000"

    # CORS origins can be supplied as a comma-separated string in .env
    CORS_ORIGINS: str = ""
    DEFAULT_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
    ]

    # Instagram API Configuration
    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    FACEBOOK_APP_SECRET: str = ""  # Alias for INSTAGRAM_APP_SECRET
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
    WHATSAPP_VERIFY_TOKEN: str = ""
    WHATSAPP_REDIRECT_URI: str = "http://localhost:8000/api/whatsapp/callback"
    
    # Legacy WhatsApp fields (for backward compatibility)
    WHATSAPP_APP_ID: str = ""
    WHATSAPP_APP_SECRET: str = ""
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""

    # Cloudinary Configuration (must be supplied via .env)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

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
    ENCRYPTION_KEY: str = ""

    # Security Configuration (Phase 1)
    RATE_LIMIT_ENABLED: bool = True
    MAX_REQUEST_SIZE_MB: int = 10
    ALLOWED_ORIGINS: str = ""

    # Meta Ads Configuration (Facebook/Instagram Ads)
    META_REDIRECT_URI: str = "http://localhost:8000/auth/meta/callback"

    # YouTube API Configuration (Google OAuth)
    YOUTUBE_CLIENT_ID: str = ""
    YOUTUBE_CLIENT_SECRET: str = ""
    YOUTUBE_REDIRECT_URI: str = "http://localhost:8081/youtube-oauth-callback"

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
    
    # Review Reply AI settings
    LOAD_TINYLLAMA_ON_STARTUP: bool = False  # Set to False for faster startup during development

    # HuggingFace Configuration (for FLUX Image Generation)
    HUGGINGFACE_TOKEN: str = ""
    HF_TOKEN: str = ""
    
    # Mistral Content Generation Configuration
    MISTRAL_CONTENT_MODE: str = "api"
    MISTRAL_TEXT_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.3"
    
    # AI Model Configuration for Content Generation
    GEMINI_CONTENT_MODEL: str = "gemini-2.5-flash"
    GEMINI_PRO_MODEL: str = "gemini-2.5-flash"
    GROQ_CONTENT_MODEL: str = "llama-3.1-8b-instant"
    GROQ_CONTENT_MODEL_FALLBACK: str = "llama3-8b-8192"

    # Firebase Configuration (Optional - for Google OAuth)
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    FIREBASE_PROJECT_ID: str = ""

    # AEO/GEO System Configuration
    OPENAI_API_KEY: str = ""
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX_NAME: str = "saadhyam-aeo-geo"
    GOOGLE_SEARCH_API_KEY: str = ""
    GOOGLE_SEARCH_ENGINE_ID: str = ""
    LINKEDIN_ACCESS_TOKEN: str = ""
    FACEBOOK_ACCESS_TOKEN: str = ""
    MEDIUM_API_TOKEN: str = ""
    WORDPRESS_API_URL: str = ""
    WORDPRESS_USERNAME: str = ""
    WORDPRESS_PASSWORD: str = ""
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    REDDIT_USER_AGENT: str = ""
    QUORA_SCRAPING_ENABLED: str = "false"
    AEO_GEO_ENABLED: str = "true"
    AEO_GEO_USE_MOCK_DATA: str = "false"
    AEO_GEO_AUTO_OPTIMIZATION: str = "true"
    AEO_GEO_CONTENT_GENERATION_MODEL: str = "gemini"
    AEO_GEO_QUESTION_DISCOVERY_MODEL: str = "gemini"

    # ============ Phase 2 Security Configuration ============
    
    # HTTPS Configuration
    ENFORCE_HTTPS: bool = True
    SSL_REDIRECT_CODE: int = 301  # HTTP status code for redirects
    
    # Audit Logging
    AUDIT_LOGGING_ENABLED: bool = True
    AUDIT_LOG_PATH: str = "logs/audit.log"
    AUDIT_LOG_LEVEL: str = "INFO"
    
    # Password Policy
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_NUMBERS: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = True
    PASSWORD_EXPIRY_DAYS: int = 90  # Force password change every 90 days
    PASSWORD_HISTORY_COUNT: int = 5  # Remember last 5 passwords
    
    # API Key Management
    API_KEY_ENABLED: bool = True
    API_KEY_ROTATION_DAYS: int = 90
    API_KEY_MAX_KEYS_PER_USER: int = 10
    
    # Role-Based Access Control (RBAC)
    RBAC_ENABLED: bool = True
    DEFAULT_USER_ROLE: str = "user"
    
    # Security Monitoring
    SECURITY_MONITORING_ENABLED: bool = True
    FAILED_LOGIN_THRESHOLD: int = 5  # Lock account after N failed attempts
    FAILED_LOGIN_WINDOW_MINUTES: int = 15
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_BURST: int = 10
    
    # IP Whitelist/Blacklist
    IP_WHITELIST_ENABLED: bool = False
    IP_BLACKLIST_ENABLED: bool = True
    
    # Session Configuration
    SESSION_TIMEOUT_MINUTES: int = 30
    SESSION_ABSOLUTE_TIMEOUT_MINUTES: int = 480  # 8 hours
    
    # Two-Factor Authentication (2FA)
    TWO_FACTOR_AUTH_ENABLED: bool = False
    TWO_FA_PROVIDER: str = "authenticator"  # authenticator, sms, email
    
    # Alert Configuration
    CRITICAL_ALERT_EMAIL: str = "security@saadhyam.com"
    SEND_SECURITY_ALERTS: bool = True
    ALERT_ON_SUSPICIOUS_ACTIVITY: bool = True
    ALERT_ON_FAILED_LOGIN: bool = True
    ALERT_ON_API_KEY_EXPOSURE: bool = True

    # Speech-to-Text, Text-to-Speech, & Telephony
    DEEPGRAM_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "TX3LPaxmHKxFdv7VOQHJ"
    ELEVENLABS_TELUGU_VOICE_ID: str = "EMxdghWQV7gqV33j4J3F"
    ELEVENLABS_HINDI_VOICE_ID: str = "uavKGt8JpB2lo1bcty9J"
    ELEVENLABS_TELUGU_VOICE_GENDER: str = "male"
    SARVAM_API_KEY: str = ""

    SARVAM_SPEAKER: str = "shubh"
    SARVAM_MODEL: str = "bulbul:v3"
    SARVAM_PACE: float = 1.1
    TTS_PROVIDER: str = "sarvam"
    EXOTEL_SID: str = ""
    EXOTEL_API_KEY: str = ""
    EXOTEL_API_TOKEN: str = ""
    EXOPHONE_NUMBER: str = ""
    EXOTEL_STREAM_URL: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    def __init__(self, **values):
        super().__init__(**values)
        # Find the first valid Gemini API key format (not empty, doesn't start with AQ. or mock values, starts with AIzaSy)
        keys = [self.GEMINI_API_KEY, self.GEMINI_API_KEY_2, self.GEMINI_API_KEY_3]
        valid_key = None
        for key in keys:
            if key and key.strip() and not key.startswith("AQ.") and not key.startswith("your_google_ai_studio_api") and key.strip().startswith("AIzaSy"):
                valid_key = key.strip()
                break
        
        if not valid_key:
            # Fallback to first non-empty, non-mock, non-AQ key
            for key in keys:
                if key and key.strip() and not key.startswith("AQ.") and not key.startswith("your_google_ai_studio_api"):
                    valid_key = key.strip()
                    break
        
        if valid_key and valid_key != self.GEMINI_API_KEY:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"🔄 Automatically resolved primary GEMINI_API_KEY to valid fallback key starting with {valid_key[:8]}")
            self.GEMINI_API_KEY = valid_key
            os.environ["GEMINI_API_KEY"] = valid_key

        # Override default/local URLs in production to point to the actual production host
        is_railway = bool(os.getenv("RAILWAY_PUBLIC_DOMAIN") or os.getenv("RAILWAY_STATIC_URL") or os.getenv("RAILWAY_PROJECT_NAME"))
        if self.ENVIRONMENT == "production" or is_railway:
            railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
            prod_host = f"https://{railway_domain}" if railway_domain else "https://saadhyam-production.up.railway.app"
            
            # If BACKEND_URL contains localhost, 127.0.0.1, or is empty, override it
            if not self.BACKEND_URL or "localhost" in self.BACKEND_URL or "127.0.0.1" in self.BACKEND_URL:
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"🔄 Deployed environment detected. Overriding BACKEND_URL to: {prod_host}")
                self.BACKEND_URL = prod_host
                
            # If EXOTEL_STREAM_URL contains localhost, 127.0.0.1, trycloudflare, or is empty, override it
            if (not self.EXOTEL_STREAM_URL or 
                "localhost" in self.EXOTEL_STREAM_URL or 
                "127.0.0.1" in self.EXOTEL_STREAM_URL or 
                "trycloudflare.com" in self.EXOTEL_STREAM_URL):
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"🔄 Deployed environment detected. Overriding EXOTEL_STREAM_URL to: {prod_host}")
                self.EXOTEL_STREAM_URL = prod_host

    def get_cors_origins(self) -> List[str]:

        raw_value = (self.CORS_ORIGINS or os.getenv("ALLOWED_ORIGINS", "")).strip()

        if not raw_value:
            return self.DEFAULT_CORS_ORIGINS

        try:
            parsed = json.loads(raw_value)
            if isinstance(parsed, list):
                return [str(origin).strip() for origin in parsed if str(origin).strip()]
        except json.JSONDecodeError:
            pass

        origins = [origin.strip() for origin in raw_value.split(",") if origin.strip()]
        return origins or self.DEFAULT_CORS_ORIGINS


settings = Settings()
