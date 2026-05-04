"""
Saadhyam AI Backend
Full Backend with all services
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config.database import init_db, close_db
from migrations.add_name_column import migrate_add_name_column

# Import routers - only include those that are working
try:
    from routes.review_reply import router as review_reply_router
    review_reply_available = True
except Exception as e:
    logging.warning(f"Review Reply router not available: {e}")
    review_reply_available = False

try:
    from routes.auth import router as auth_router
    auth_available = True
except Exception as e:
    logging.warning(f"Auth router not available: {e}")
    auth_available = False

try:
    from routes.protected import router as protected_router
    protected_available = True
except Exception as e:
    logging.warning(f"Protected router not available: {e}")
    protected_available = False

try:
    from routes.instagram import router as instagram_router
    instagram_available = True
except Exception as e:
    logging.warning(f"Instagram router not available: {e}")
    instagram_available = False

try:
    from routes.instagram_oauth import router as instagram_oauth_router
    instagram_oauth_available = True
except Exception as e:
    logging.warning(f"Instagram OAuth router not available: {e}")
    instagram_oauth_available = False

try:
    from routes.instagram_post import router as instagram_post_router
    instagram_post_available = True
except Exception as e:
    logging.warning(f"Instagram Post router not available: {e}")
    instagram_post_available = False

try:
    from routes.settings import router as settings_router
    settings_available = True
except Exception as e:
    logging.warning(f"Settings router not available: {e}")
    settings_available = False

try:
    from routes.crud import router as crud_router
    crud_available = True
except Exception as e:
    logging.warning(f"CRUD router not available: {e}")
    crud_available = False
    

try:
    from routes.ai import router as ai_router, check_model_server_health
    ai_available = True
except Exception as e:
    logging.warning(f"AI router not available: {e}")
    ai_available = False
    async def check_model_server_health() -> bool:
        return False

try:
    from routes.business import router as business_router
    business_available = True
except Exception as e:
    logging.warning(f"Business Analysis router not available: {e}")
    business_available = False

try:
    from routes.profile import router as profile_router
    profile_available = True
    logging.info("✅ Profile router imported successfully")
except Exception as e:
    logging.warning(f"Profile router not available: {e}")
    profile_available = False

try:
    from routes.assistant import router as assistant_router
    assistant_available = True
except Exception as e:
    logging.warning(f"Assistant router not available: {e}")
    assistant_available = False

try:
    from ai_models.website_ai.app.api.v1.routes import generation as website_ai_generation
    from ai_models.website_ai.app.api.v1.routes import jobs as website_ai_jobs
    from ai_models.website_ai.app.routes import website as website_ai_website
    from ai_models.website_ai.app.routes import api as website_ai_api
    website_ai_available = True
except Exception as e:
    logging.warning(f"Website AI router not available: {e}")
    website_ai_available = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle
    """
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 Starting Saadhyam AI Backend")
    logger.info("=" * 60)
    
    try:
        # Initialize database
        logger.info("🔄 Initializing database...")
        await init_db()
        logger.info("✅ Database initialized")
        
        # Run migrations
        logger.info("🔄 Running migrations...")
        migrate_add_name_column()
        from migrations.add_business_analysis_table import migrate_add_business_analysis_table
        migrate_add_business_analysis_table()
        from migrations.add_business_profile_fields import migrate_add_business_profile_fields
        migrate_add_business_profile_fields()
        logger.info("✅ Migrations completed")
        
        # NOTE: AI models are now using TinyLlama for fast CPU inference:
        # - Review Reply AI: TinyLlama loaded in main backend (port 8000)
        # - Business Analysis: TinyLlama loaded in separate server (port 9001)
        logger.info("🧠 AI Model Architecture:")
        logger.info("   - Main Backend (port 8000): TinyLlama for review replies")
        logger.info("   - Business Model Server (port 9001): TinyLlama for business analysis")
        logger.info("   - Expected inference: 2-5 seconds per request")
        
        # Load TinyLlama for review replies
        logger.info("🔄 Loading TinyLlama for review replies...")
        try:
            from ai_models.review_reply_ai.model_loader import load_model, is_model_loaded
            load_model()
            if is_model_loaded():
                logger.info("✅ TinyLlama loaded successfully for review replies")
            else:
                logger.warning("⚠️  TinyLlama may not have loaded properly")
        except Exception as e:
            logger.error(f"❌ Failed to load TinyLlama: {e}")
            logger.warning("⚠️  Continuing without AI model - fallback responses will be used")
        
        logger.info("✅ Model architecture configured")
        
        logger.info("=" * 60)
        logger.info("✅ Application startup complete")
        logger.info("=" * 60)
        
        logger.info("=" * 60)
        logger.info("✅ Application startup complete")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info("🛑 Shutting down Saadhyam AI Backend")
    logger.info("=" * 60)
    
    try:
        # Close database
        logger.info("🔄 Closing database connections...")
        await close_db()
        logger.info("✅ Database connections closed")
        
        logger.info("=" * 60)
        logger.info("✅ Application shutdown complete")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}", exc_info=True)


# Create FastAPI app
app = FastAPI(
    title="Saadhyam AI",
    description="Review Reply AI Service",
    version="1.0.0",
    lifespan=lifespan
)

# Website AI static files
BASE_DIR = Path(__file__).resolve().parent
WEBSITE_AI_STATIC = BASE_DIR / "ai_models" / "website_ai" / "app" / "static"
WEBSITE_AI_OUTPUT = BASE_DIR / "ai_models" / "website_ai" / "output"
WEBSITE_AI_STATIC.mkdir(parents=True, exist_ok=True)
WEBSITE_AI_OUTPUT.mkdir(parents=True, exist_ok=True)
app.mount("/website-ai/static", StaticFiles(directory=str(WEBSITE_AI_STATIC)), name="website_ai_static")
app.mount("/website-ai/output", StaticFiles(directory=str(WEBSITE_AI_OUTPUT)), name="website_ai_output")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - only include those that loaded successfully
if auth_available:
    app.include_router(auth_router)
if protected_available:
    app.include_router(protected_router)
if instagram_available:
    app.include_router(instagram_router)
if instagram_oauth_available:
    app.include_router(instagram_oauth_router)
if instagram_post_available:
    app.include_router(instagram_post_router)
if settings_available:
    app.include_router(settings_router)
if crud_available:
    app.include_router(crud_router)
if ai_available:
    app.include_router(ai_router)
if review_reply_available:
    app.include_router(review_reply_router)
if business_available:
    app.include_router(business_router)
if profile_available:
    app.include_router(profile_router)
    logging.info("✅ Profile router included in app")
if assistant_available:
    app.include_router(assistant_router)
if website_ai_available:
    app.include_router(
        website_ai_generation.router,
        prefix="/api/v1/website-ai",
        tags=["website-ai"],
    )
    app.include_router(
        website_ai_jobs.router,
        prefix="/api/v1/website-ai",
        tags=["website-ai"],
    )
    app.include_router(
        website_ai_website.router,
        prefix="/website-ai",
        tags=["website-ai-legacy"],
    )
    app.include_router(
        website_ai_api.router,
        prefix="/website-ai",
        tags=["website-ai-legacy"],
    )


# ============ Health Check Routes ============

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint"""
    return {
        "message": "Saadhyam AI Backend",
        "service": "Review Reply AI",
        "status": "running"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    model_server_ready = await check_model_server_health()
    return {
        "status": "healthy",
        "service": "Saadhyam AI",
        "model_server_ready": model_server_ready
    }


@app.get("/api/status", tags=["Health"])
async def status():
    """Get service status"""
    model_server_ready = await check_model_server_health()
    return {
        "service": "Review Reply AI",
        "version": "1.0.0",
        "status": "operational",
        "model_server_ready": model_server_ready,
        "features": [
            "Generate professional review replies",
            "Store reply history",
            "Get statistics",
            "Save user feedback"
        ]
    }


# ============ Error Handlers ============

from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
