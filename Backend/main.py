"""
Saadhyam AI Backend
Full Backend with all services
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
# Load environment variables first from the backend workspace
import os
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
import socketio
from middleware.asgi_protocol_middleware import ProtocolSafeASGI
from sqlalchemy import inspect, select, text
from sqlalchemy.ext.asyncio import AsyncSession

# Load environment variables first from the backend workspace
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

# Configure logging early
from config.logging_config import configure_logging
import os
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
configure_logging(ENVIRONMENT)

from config.database import init_db, close_db, get_db, sync_engine
from config.settings import settings
from migrations.add_name_column import migrate_add_name_column
from services.realtime_service import realtime_service


def ensure_notifications_schema():
    try:
        inspector = inspect(sync_engine)
        if not inspector.has_table("notifications"):
            return

        columns = {column["name"] for column in inspector.get_columns("notifications")}
        alterations = []

        if "user_id" not in columns:
            alterations.append("ADD COLUMN user_id INTEGER")
        if "type" not in columns:
            alterations.append("ADD COLUMN type VARCHAR(50) DEFAULT 'info'")
        if "source" not in columns:
            alterations.append("ADD COLUMN source VARCHAR(50) DEFAULT 'admin'")
        if "is_read" not in columns:
            alterations.append("ADD COLUMN is_read BOOLEAN DEFAULT FALSE")
        if "read_at" not in columns:
            alterations.append("ADD COLUMN read_at TIMESTAMP")
        if "extra_data" not in columns:
            alterations.append("ADD COLUMN extra_data JSON")
        if "updated_at" not in columns:
            alterations.append("ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

        if not alterations:
            return

        with sync_engine.begin() as connection:
            for statement in alterations:
                connection.execute(text(f"ALTER TABLE notifications {statement}"))

        logging.info("✅ Notifications schema repaired for shared inbox support")
    except Exception as e:
        logging.warning(f"Notifications schema repair skipped: {e}")

# Initialize Firebase Service
try:
    from services.firebase_service import firebase_service
    firebase_initialized = firebase_service.is_firebase_available()
    if firebase_initialized:
        logging.info("✅ Firebase service initialized successfully")
    else:
        logging.error("❌ Firebase service failed to initialize")
        logging.error("❌ Google OAuth authentication will NOT work")
        logging.error("❌ Please check Firebase configuration in FIREBASE_SETUP.md")
except Exception as e:
    logging.error(f"❌ Failed to initialize Firebase service: {e}")
    logging.error("❌ Google OAuth authentication will NOT work")
    firebase_initialized = False

# Import routers - only include those that are working
try:
    from routes.review_reply import router as review_reply_router
    review_reply_available = True
except Exception as e:
    logging.error(f"Review Reply router not available: {e}", exc_info=True)
    review_reply_available = False

try:
    from routes.auth import router as auth_router
    auth_available = True
except Exception as e:
    logging.error(f"Auth router not available: {e}", exc_info=True)
    auth_available = False

try:
    from routes.protected import router as protected_router
    protected_available = True
except Exception as e:
    logging.error(f"Protected router not available: {e}", exc_info=True)
    protected_available = False

try:
    from routes.notifications import router as notifications_router
    notifications_available = True
except Exception as e:
    logging.error(f"Notifications router not available: {e}", exc_info=True)
    notifications_available = False

try:
    from routes.internal_notifications import router as internal_notifications_router
    internal_notifications_available = True
except Exception as e:
    logging.error(f"Internal notifications router not available: {e}", exc_info=True)
    internal_notifications_available = False

try:
    from routes.instagram import router as instagram_router
    instagram_available = True
except Exception as e:
    logging.error(f"Instagram router not available: {e}", exc_info=True)
    instagram_available = False

try:
    from routes.instagram_oauth import router as instagram_oauth_router
    instagram_oauth_available = True
except Exception as e:
    logging.error(f"Instagram OAuth router not available: {e}", exc_info=True)
    instagram_oauth_available = False

try:
    from routes.instagram_post import router as instagram_post_router
    instagram_post_available = True
except Exception as e:
    logging.error(f"Instagram Post router not available: {e}", exc_info=True)
    instagram_post_available = False

try:
    from routes.youtube_oauth import router as youtube_oauth_router
    from routes.youtube import router as youtube_router
    youtube_available = True
except Exception as e:
    logging.error(f"YouTube router not available: {e}", exc_info=True)
    youtube_available = False

try:
    from routes.settings import router as settings_router
    settings_available = True
except Exception as e:
    logging.error(f"Settings router not available: {e}", exc_info=True)
    settings_available = False

try:
    from routes.crud import router as crud_router
    crud_available = True
except Exception as e:
    logging.error(f"CRUD router not available: {e}", exc_info=True)
    crud_available = False
    

try:
    from routes.ai import router as ai_router, check_model_server_health
    ai_available = True
except Exception as e:
    logging.error(f"AI router not available: {e}", exc_info=True)
    ai_available = False
    async def check_model_server_health() -> bool:
        return False

# OLD TinyLlama Business Analysis - DISABLED (now using Gemini API)
# try:
#     from routes.business import router as business_router
#     business_available = True
# except Exception as e:
#     logging.warning(f"Business Analysis router not available: {e}")
#     business_available = False
business_available = False

try:
    from routes.profile import router as profile_router
    profile_available = True
    logging.info("✅ Profile router imported successfully")
except Exception as e:
    logging.error(f"Profile router not available: {e}", exc_info=True)
    profile_available = False

try:
    from routes.website_serving import router as website_serving_router
    website_serving_available = True
    logging.info("✅ Website serving router imported successfully")
except Exception as e:
    logging.error(f"Website serving router not available: {e}", exc_info=True)
    website_serving_available = False

try:
    from routes.assistant import router as assistant_router
    assistant_available = True
except Exception as e:
    logging.warning(f"Assistant router not available: {e}")
    assistant_available = False

try:
    from routes.content_creator import router as content_creator_router
    content_creator_available = True
except Exception as e:
    logging.warning(f"Content Creator router not available: {e}")
    content_creator_available = False

try:
    from routes.image_generator import router as image_generator_router
    image_generator_available = True
except Exception as e:
    logging.warning(f"Image Generator router not available: {e}")
    image_generator_available = False

try:
    from routes.auto_blogger import router as auto_blogger_router
    auto_blogger_available = True
except Exception as e:
    logging.warning(f"Auto Blogger router not available: {e}")
    auto_blogger_available = False

# Disable auto blogger for now
auto_blogger_available = False

try:
    from routes.realtime_business import router as realtime_business_router
    realtime_business_available = True
except Exception as e:
    logging.warning(f"Real-time Business Intelligence router not available: {e}")
    realtime_business_available = False

try:
    from routes.business_analysis_gemini import router as business_analysis_gemini_router
    business_analysis_gemini_available = True
    logging.info("✅ Business Analysis (Gemini) router imported successfully")
except Exception as e:
    logging.warning(f"Business Analysis (Gemini) router not available: {e}")
    business_analysis_gemini_available = False

try:
    from routes.comprehensive_business_analysis import router as comprehensive_business_analysis_router
    comprehensive_business_analysis_available = True
    logging.info("✅ Comprehensive Business Analysis router imported successfully")
except Exception as e:
    logging.warning(f"Comprehensive Business Analysis router not available: {e}")
    comprehensive_business_analysis_available = False

try:
    from routes.business_input import router as business_input_router
    business_input_available = True
    logging.info("✅ Business Input router imported successfully")
except Exception as e:
    logging.warning(f"Business Input router not available: {e}")
    business_input_available = False

try:
    from routes.business_compatibility import router as business_compatibility_router
    business_compatibility_available = True
    logging.info("✅ Business Compatibility router imported successfully")
except Exception as e:
    logging.warning(f"Business Compatibility router not available: {e}")
    business_compatibility_available = False

try:
    from routes.partnership_agent import router as partnership_agent_router
    partnership_agent_available = True
    logging.info("✅ Partnership Agent router imported successfully")
except Exception as e:
    logging.warning(f"Partnership Agent router not available: {e}")
    partnership_agent_available = False

try:
    from routes.customer_retention import router as customer_retention_router
    customer_retention_available = True
    logging.info("✅ Customer Retention Agent router imported successfully")
except Exception as e:
    logging.warning(f"Customer Retention Agent router not available: {e}")
    customer_retention_available = False

try:
    from routes.aeo_geo import router as aeo_geo_router
    aeo_geo_available = True
    logging.info("✅ AEO/GEO router imported successfully")
except Exception as e:
    logging.warning(f"AEO/GEO router not available: {e}")
    aeo_geo_available = False

try:
    from routes.blog import router as blog_router
    blog_available = True
    logging.info("✅ Blog router imported successfully")
except Exception as e:
    logging.warning(f"Blog router not available: {e}")
    blog_available = False

try:
    from routes.whatsapp_auth import router as whatsapp_auth_router
    whatsapp_auth_available = True
    logging.info("✅ WhatsApp Auth router imported successfully")
except Exception as e:
    logging.warning(f"WhatsApp Auth router not available: {e}")
    whatsapp_auth_available = False

try:
    from routes.whatsapp_webhook import router as whatsapp_webhook_router
    whatsapp_webhook_available = True
    logging.info("✅ WhatsApp Webhook router imported successfully")
except Exception as e:
    logging.warning(f"WhatsApp Webhook router not available: {e}")
    whatsapp_webhook_available = False

try:
    from routes.dashboard_analytics import router as dashboard_analytics_router
    dashboard_analytics_available = True
    logging.info("✅ Dashboard Analytics router imported successfully")
except Exception as e:
    logging.warning(f"Dashboard Analytics router not available: {e}")
    dashboard_analytics_available = False

try:
    from routes.whatsapp_messages import router as whatsapp_messages_router
    whatsapp_messages_available = True
    logging.info("✅ WhatsApp Messages router imported successfully")
except Exception as e:
    logging.warning(f"WhatsApp Messages router not available: {e}")
    whatsapp_messages_available = False

try:
    from routes.whatsapp_campaigns import router as whatsapp_campaigns_router
    whatsapp_campaigns_available = True
    logging.info("✅ WhatsApp Campaigns router imported successfully")
except Exception as e:
    logging.warning(f"WhatsApp Campaigns router not available: {e}")
    whatsapp_campaigns_available = False

try:
    from routes.whatsapp_automation import router as whatsapp_automation_router
    whatsapp_automation_available = True
    logging.info("✅ WhatsApp Automation router imported successfully")
except Exception as e:
    logging.warning(f"WhatsApp Automation router not available: {e}")
    whatsapp_automation_available = False

try:
    from routes.b2b_network import router as b2b_network_router
    b2b_network_available = True
    logging.info("✅ B2B Network router imported successfully")
except Exception as e:
    logging.warning(f"B2B Network router not available: {e}")
    b2b_network_available = False

try:
    from routes.b2b_chat import router as b2b_chat_router
    b2b_chat_available = True
    logging.info("✅ B2B Chat router imported successfully")
except Exception as e:
    logging.warning(f"B2B Chat router not available: {e}")
    b2b_chat_available = False

try:
    from routes.instagram_analytics import router as instagram_analytics_router
    instagram_analytics_available = True
    logging.info("✅ Instagram Analytics router imported successfully")
except Exception as e:
    logging.warning(f"Instagram Analytics router not available: {e}")
    instagram_analytics_available = False

try:
    from routes.instagram_token_management import router as instagram_token_management_router
    instagram_token_management_available = True
    logging.info("✅ Instagram Token Management router imported successfully")
except Exception as e:
    logging.warning(f"Instagram Token Management router not available: {e}")
    instagram_token_management_available = False

try:
    from routes.task_tracking import router as task_tracking_router
    task_tracking_available = True
    logging.info("✅ Task Tracking router imported successfully")
except Exception as e:
    logging.warning(f"Task Tracking router not available: {e}")
    task_tracking_available = False

try:
    from routes.radar import router as radar_router
    radar_available = True
    logging.info("✅ Radar AI router imported successfully")
except Exception as e:
    logging.warning(f"Radar AI router not available: {e}")
    radar_available = False

try:
    from routes.competitor_intelligence import router as competitor_intelligence_router
    competitor_intelligence_available = True
    logging.info("✅ Competitor Intelligence AI router imported successfully")
except Exception as e:
    logging.warning(f"Competitor Intelligence AI router not available: {e}")
    competitor_intelligence_available = False

try:
    from routes.voice_agent import router as voice_agent_router
    voice_agent_available = True
    logging.info("✅ Voice Agent router imported successfully")
except Exception as e:
    logging.error(f"❌ Voice Agent router not available: {e}")
    logging.error(f"❌ Error type: {type(e).__name__}")
    logging.error(f"❌ Full traceback:", exc_info=True)
    voice_agent_available = False

try:
    from routes.voice_agent_v2 import router as voice_agent_v2_router
    voice_agent_v2_available = True
    logging.info("✅ Voice Agent V2 router imported successfully")
except Exception as e:
    logging.error(f"❌ Voice Agent V2 router not available: {e}")
    logging.error(f"❌ Error type: {type(e).__name__}")
    logging.error(f"❌ Full traceback:", exc_info=True)
    voice_agent_v2_available = False

try:
    from routes.voice_command import router as voice_command_router
    voice_command_available = True
    logging.info("✅ Voice Command router imported successfully")
except Exception as e:
    logging.error(f"❌ Voice Command router not available: {e}")
    voice_command_available = False

try:
    from routes.webhooks import router as webhooks_router
    webhooks_available = True
    logging.info("✅ Webhooks router imported successfully")
except Exception as e:
    logging.warning(f"Webhooks router not available: {e}")
    webhooks_available = False
try:
    from routes.user_api_keys import router as user_api_keys_router
    user_api_keys_available = True
    logging.info("✅ User API Keys router imported successfully")
except Exception as e:
    logging.warning(f"User API Keys router not available: {e}")
    user_api_keys_available = False

try:
    from routes.user_instagram_oauth import router as user_instagram_oauth_router
    user_instagram_oauth_available = True
    logging.info("✅ User Instagram OAuth router imported successfully")
except Exception as e:
    logging.warning(f"User Instagram OAuth router not available: {e}")
    user_instagram_oauth_available = False

try:
    from routes.google_business import router as google_business_router
    google_business_available = True
    logging.info("✅ Google Business router imported successfully")
except Exception as e:
    logging.warning(f"Google Business router not available: {e}")
    google_business_available = False

try:
    from routes.meta_oauth import router as meta_oauth_router
    meta_oauth_available = True
    logging.info("✅ Meta OAuth router imported successfully")
except Exception as e:
    logging.warning(f"Meta OAuth router not available: {e}")
    meta_oauth_available = False

try:
    from routes.meta_ads import router as meta_ads_router
    meta_ads_available = True
    logging.info("✅ Meta Ads router imported successfully")
except Exception as e:
    logging.warning(f"Meta Ads router not available: {e}")
    meta_ads_available = False

try:
    from routes.cache_management import router as cache_management_router
    cache_management_available = True
    logging.info("✅ Cache Management router imported successfully")
except Exception as e:
    logging.warning(f"Cache Management router not available: {e}")
    cache_management_available = False

try:
    from routes.health import router as health_router
    health_available = True
    logging.info("✅ Health Check router imported successfully")
except Exception as e:
    logging.warning(f"Health Check router not available: {e}")
    health_available = False

try:
    from routes.public import router as public_router
    public_available = True
    logging.info("✅ Public API router imported successfully")
except Exception as e:
    logging.warning(f"Public API router not available: {e}")
    public_available = False

try:
    from routes.plugins import router as plugins_router
    plugins_available = True
    logging.info("✅ Plugins router imported successfully")
except Exception as e:
    logging.warning(f"Plugins router not available: {e}")
    plugins_available = False

try:
    from routes.problem_context import router as problem_context_router
    problem_context_available = True
    logging.info("✅ Problem Context router imported successfully")
except Exception as e:
    logging.warning(f"Problem Context router not available: {e}")
    problem_context_available = False

try:
    from routes.problems import router as problems_router
    problems_available = True
    logging.info("✅ Problem Engine Complete router imported successfully")
except Exception as e:
    logging.warning(f"Problem Engine Complete router not available: {e}")
    problems_available = False

try:
    from routes.opportunities import router as opportunities_router
    opportunities_available = True
    logging.info("✅ Opportunities Complete router imported successfully")
except Exception as e:
    logging.warning(f"Opportunities Complete router not available: {e}")
    opportunities_available = False

try:
    from ai_models.website_ai.app.api.v1.routes import generation as website_ai_generation
    from ai_models.website_ai.app.api.v1.routes import jobs as website_ai_jobs
    from ai_models.website_ai.app.api.v1.routes import websites as website_ai_websites
    from ai_models.website_ai.app.routes import website as website_ai_website
    from ai_models.website_ai.app.routes import api as website_ai_api
    website_ai_available = True
except Exception as e:
    logging.warning(f"Website AI router not available: {e}")
    website_ai_available = False

# Get logger after logging is configured
logger = logging.getLogger(__name__)

# Remove duplicate logging configuration (now handled by logging_config.py)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle
    """
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 Starting Saadhyam AI Backend")
    logger.info("=" * 60)
    
    # Check Firebase status
    logger.info("🔥 Firebase Authentication Status:")
    if firebase_initialized:
        logger.info("   ✅ Firebase Admin SDK: INITIALIZED")
        logger.info("   ✅ Google OAuth: AVAILABLE")
        logger.info("   ✅ Real Firebase tokens: ACCEPTED")
        logger.info("   ❌ Mock/Demo tokens: REJECTED")
    else:
        logger.error("   ❌ Firebase Admin SDK: NOT INITIALIZED")
        logger.error("   ❌ Google OAuth: NOT AVAILABLE")
        logger.error("   ❌ Please check FIREBASE_SETUP.md for configuration")
    logger.info("=" * 60)
    
    # Real-time service status
    logger.info("🔌 Real-time Communication Status:")
    logger.info("   ✅ Socket.IO Server: INITIALIZED")
    logger.info("   ✅ Real-time messaging: ENABLED")
    logger.info("   ✅ Typing indicators: ENABLED")
    logger.info("   ✅ Online presence: ENABLED")
    logger.info("   ✅ Live updates: ENABLED")
    logger.info("=" * 60)
    
    try:
        # Initialize database
        logger.info("[*] Initializing database...")
        await init_db()
        logger.info("[OK] Database initialized")
        
        # Start feature flags poller
        logger.info("🔄 Starting feature flags poller...")
        try:
            from feature_flags import start_poller
            await start_poller(app)
            logger.info("✅ Feature flags poller started")
        except Exception as e:
            logger.error(f"❌ Failed to start feature flags poller: {e}")

        
        # Run migrations
        logger.info("[*] Skipping migrations (disabled for faster startup)...")
        # migrate_add_name_column()
        # from migrations.add_business_analysis_table import migrate_add_business_analysis_table
        # migrate_add_business_analysis_table()
        # from migrations.add_business_profile_fields import migrate_add_business_profile_fields
        # migrate_add_business_profile_fields()
        # from migrations.add_comprehensive_business_analysis import migrate_add_comprehensive_business_analysis
        # migrate_add_comprehensive_business_analysis()
        # from migrations.fix_description_nullable import migrate_fix_description_nullable
        # migrate_fix_description_nullable()

        # from migrations.add_aeo_geo_tables import migrate_add_aeo_geo_tables
        # migrate_add_aeo_geo_tables()
        # from migrations.add_blogs_table import migrate_add_blogs_table
        # migrate_add_blogs_table()
        # from migrations.add_website_id_to_user import run_migration as migrate_add_website_id
        # migrate_add_website_id()
        # from migrations.add_whatsapp_tables import migrate_add_whatsapp_tables
        # migrate_add_whatsapp_tables()
        # from migrations.add_location_coordinates import migrate_add_location_coordinates
        # migrate_add_location_coordinates()
        # from migrations.add_user_id_to_review_history import migrate_add_user_id_to_review_history
        # migrate_add_user_id_to_review_history()
        # from migrations.add_instagram_analytics_tables import migrate_add_instagram_analytics_tables
        # migrate_add_instagram_analytics_tables()
        # from migrations.add_task_tracking_tables import migrate_add_task_tracking_tables
        # migrate_add_task_tracking_tables()
        # from migrations.add_voice_agent_tables import migrate_add_voice_agent_tables
        # migrate_add_voice_agent_tables()
        # from migrations.add_slug_to_websites import run_migration as migrate_add_slug_to_websites
        # migrate_add_slug_to_websites()
        logger.info("[OK] Migrations completed")
        try:
            from migrations.add_meta_ads_tables import migrate_add_meta_ads_tables
            migrate_add_meta_ads_tables()
            from migrations.add_ai_audience_insights_table import migrate_add_ai_audience_insights_table
            migrate_add_ai_audience_insights_table()
            from migrations.fix_campaign_status_enum import migrate_fix_campaign_status_enum
            migrate_fix_campaign_status_enum()
            from migrations.update_campaign_status_enum import migrate_update_campaign_status_enum
            migrate_update_campaign_status_enum()
            from migrations.add_session_tracking import migrate_add_session_tracking
            migrate_add_session_tracking()
            from migrations.add_chat_tables import migrate_add_chat_tables
            migrate_add_chat_tables()
            from migrations.add_youtube_tables import migrate_add_youtube_tables
            migrate_add_youtube_tables()
            from migrations.add_youtube_cloudinary_fields import migrate_add_youtube_cloudinary_fields
            migrate_add_youtube_cloudinary_fields()
            # Campaign lifecycle columns (soft-delete + archive)
            try:
                from migrations.add_campaign_lifecycle_columns import run_migration as run_campaign_lifecycle_migration
                from config.database import SyncSessionLocal
                if SyncSessionLocal is not None:
                    _mig_db = SyncSessionLocal()
                    try:
                        run_campaign_lifecycle_migration(_mig_db)
                    finally:
                        _mig_db.close()
                else:
                    logger.warning("⚠️ Campaign lifecycle migration skipped: sync engine unavailable")
            except Exception as _mig_err:
                logger.warning(f"⚠️ Campaign lifecycle migration skipped: {_mig_err}")
            from migrations.add_user_api_keys_tables import migrate_add_user_api_keys_tables
            migrate_add_user_api_keys_tables()
            from migrations.add_plugin_tables import migrate_add_plugin_tables
            migrate_add_plugin_tables()
            try:
                from migrations.add_problem_engine_tables import migrate_add_problem_engine_tables
                migrate_add_problem_engine_tables()
                from migrations.add_problem_engine_phase2_tables import migrate_add_problem_engine_phase2_tables
                migrate_add_problem_engine_phase2_tables()
                from migrations.add_problem_engine_learning_tables import migrate_add_problem_engine_learning_tables
                migrate_add_problem_engine_learning_tables()
            except Exception as _pe_err:
                logger.warning(f"⚠️ Problem engine migrations skipped: {_pe_err}")
            logger.info("✅ Migrations completed")
        except Exception as _all_mig_err:
            logger.warning(f"⚠️ Migrations skipped (sync DB unavailable): {_all_mig_err}")
            logger.warning("⚠️ API will still function normally via async engine")
        
        # Start scheduler for processing scheduled Instagram posts
        logger.info("🔄 Starting Instagram post scheduler...")
        try:
            from services.scheduler import start_scheduler
            start_scheduler()
            logger.info("✅ Instagram post scheduler started (checks every 1 minute)")
        except Exception as e:
            logger.error(f"❌ Failed to start scheduler: {e}")
            logger.warning("⚠️  Scheduled posts will not be automatically processed")
        
        # Start token refresh scheduler
        logger.info("🔄 Starting Instagram token refresh scheduler...")
        try:
            from tasks.token_refresh_task import start_token_refresh_scheduler
            start_token_refresh_scheduler()
            logger.info("✅ Token refresh scheduler started (runs daily at 2 AM)")
        except Exception as e:
            logger.error(f"❌ Failed to start token refresh scheduler: {e}")
            logger.warning("⚠️  Tokens will not be automatically refreshed")
        
        # Initialize Plugin System
        logger.info("🔌 Starting comprehensive plugin system...")
        try:
            from services.master_plugin_initialization import initialize_complete_plugin_system
            from config.database import async_engine
            from sqlalchemy.ext.asyncio import AsyncSession
            
            # Create database session for plugin initialization
            async with AsyncSession(async_engine) as db:
                await initialize_complete_plugin_system(db)
            
            logger.info("✅ Plugin system initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize plugin system: {e}")
            logger.warning("⚠️  Plugin marketplace will not be available")
            # Continue startup even if plugin system fails
        
        # NOTE: AI models configuration:
        # - Review Reply AI: TinyLlama loaded in main backend (port 8000)
        # - Business Analysis: Gemini API with Google Search grounding (comprehensive analysis)
        logger.info("🧠 AI Model Architecture:")
        logger.info("   - Main Backend (port 8000): TinyLlama for review replies")
        logger.info("   - Business Analysis: Gemini API with Google Search grounding")
        logger.info("   - Expected inference: 2-5 seconds per request (review replies)")
        
        # Load TinyLlama for review replies in background (non-blocking)
        if settings.LOAD_TINYLLAMA_ON_STARTUP:
            logger.info("🔄 TinyLlama will load in background (non-blocking startup)...")
            try:
                import threading
                from ai_models.review_reply_ai.model_loader import load_model, is_model_loaded
                
                def load_model_background():
                    try:
                        logger.info("🔄 Background: Loading TinyLlama model...")
                        load_model()
                        if is_model_loaded():
                            logger.info("✅ Background: TinyLlama loaded successfully")
                        else:
                            logger.warning("⚠️  Background: TinyLlama may not have loaded properly")
                    except Exception as e:
                        logger.error(f"❌ Background: Failed to load TinyLlama: {e}")
                
                # Start loading in background thread
                model_thread = threading.Thread(target=load_model_background, daemon=True)
                model_thread.start()
                logger.info("✅ TinyLlama loading started in background")
                
            except Exception as e:
                logger.error(f"❌ Failed to start TinyLlama background loading: {e}")
                logger.warning("⚠️  Continuing without AI model - fallback responses will be used")
        else:
            logger.info("⏭️  TinyLlama loading skipped (LOAD_TINYLLAMA_ON_STARTUP=False)")
            logger.info("   Model will load on first use if needed")
        
        logger.info("✅ Model architecture configured")
        
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
        # Stop scheduler
        logger.info("🔄 Stopping Instagram post scheduler...")
        try:
            from services.scheduler import stop_scheduler
            stop_scheduler()
            logger.info("✅ Scheduler stopped")
        except Exception as e:
            logger.error(f"❌ Error stopping scheduler: {e}")
        
        # Stop token refresh scheduler
        logger.info("🔄 Stopping token refresh scheduler...")
        try:
            from tasks.token_refresh_task import stop_token_refresh_scheduler
            stop_token_refresh_scheduler()
            logger.info("✅ Token refresh scheduler stopped")
        except Exception as e:
            logger.error(f"❌ Error stopping token refresh scheduler: {e}")
        
        # Close database
        logger.info("🔄 Closing database connections...")
        await close_db()
        logger.info("✅ Database connections closed")
        
        # Stop feature flags poller
        logger.info("🔄 Stopping feature flags poller...")
        try:
            from feature_flags import stop_poller
            await stop_poller(app)
            logger.info("✅ Feature flags poller stopped")
        except Exception as e:
            logger.error(f"❌ Error stopping feature flags poller: {e}")

        
        logger.info("=" * 60)
        logger.info("✅ Application shutdown complete")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}", exc_info=True)


# Create FastAPI app
app = FastAPI(
    title="Saadhyam AI",
    description="Review Reply AI Service with Real-time Communication",
    version="1.0.0",
    lifespan=lifespan
)

# Feature flags guard: polls admin public features and blocks disabled endpoints
try:
    # Support both package execution (from . import ...) and direct module execution.
    try:
        from . import feature_flags  # type: ignore
    except Exception:
        import feature_flags  # type: ignore
    feature_flags.setup(app)
except Exception:
    # Import errors should not prevent app from starting; log and continue
    import logging
    logging.getLogger("feature_flags").exception("Failed to initialize feature flags middleware")

# Add custom exception handler for h11 protocol errors and ExceptionGroup
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
import sys

# Check if ExceptionGroup is available (Python 3.11+)
if sys.version_info >= (3, 11):
    ExceptionGroup = ExceptionGroup
else:
    try:
        from exceptiongroup import ExceptionGroup
    except ImportError:
        ExceptionGroup = None

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler to catch h11 protocol errors, ExceptionGroup, and other unhandled exceptions.
    This prevents cascading errors and provides clean error responses.
    """
    from starlette.exceptions import HTTPException as StarletteHTTPException
    from fastapi.exceptions import RequestValidationError
    from fastapi.responses import JSONResponse

    # Dynamically extract and apply CORS headers from request
    origin = request.headers.get("origin")
    cors_headers = {}
    if origin:
        cors_headers["Access-Control-Allow-Origin"] = origin
        cors_headers["Access-Control-Allow-Credentials"] = "true"
        cors_headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        cors_headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since"

    # Handle standard HTTP and validation exceptions
    if isinstance(exc, (StarletteHTTPException, RequestValidationError)):
        status_code = exc.status_code if isinstance(exc, StarletteHTTPException) else 422
        detail = exc.detail if isinstance(exc, StarletteHTTPException) else exc.errors()
        return JSONResponse(
            status_code=status_code,
            content={"detail": detail},
            headers=cors_headers
        )

    # Handle ExceptionGroup (from anyio TaskGroup)
    if ExceptionGroup and isinstance(exc, ExceptionGroup):
        logger.error(f"❌ Exception group with {len(exc.exceptions)} exceptions")
        for i, sub_exc in enumerate(exc.exceptions):
            logger.error(f"  Sub-exception {i+1}: {type(sub_exc).__name__}: {sub_exc}")
        
        # Return error for the first exception
        first_exc = exc.exceptions[0] if exc.exceptions else exc
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Internal Server Error: {str(first_exc)}" if settings.DEBUG else "Our intelligence engine is currently optimizing. Insights are being computed, please check back shortly.",
                "error_type": type(first_exc).__name__
            },
            headers=cors_headers
        )
    
    # Check if it's an h11 protocol error
    if "h11" in str(type(exc).__module__) or "LocalProtocolError" in str(type(exc).__name__):
        logger.error(f"❌ HTTP protocol error: {exc}")
        # Don't try to send response if connection is already in error state
        # Just log and return None to prevent further errors
        return None
    
    # Log other unhandled exceptions
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    
    try:
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Internal Server Error: {str(exc)}" if settings.DEBUG else "Our intelligence engine is currently optimizing. Insights are being computed, please check back shortly."
            },
            headers=cors_headers
        )
    except Exception as send_error:
        # If we can't send the response, just log it
        logger.error(f"❌ Failed to send error response: {send_error}")
        return None

# Mount Socket.IO app for real-time communication
# Wrap the Socket.IO ASGI app and protect it with the protocol-safe wrapper
sio_asgi_app = socketio.ASGIApp(
    socketio_server=realtime_service.sio,
    other_asgi_app=app,
    socketio_path='socket.io'
)

# Wrap with ProtocolSafeASGI to suppress h11 LocalProtocolError and ConnectionResetError
sio_asgi_app = ProtocolSafeASGI(sio_asgi_app)

# Website AI static files - Simple direct mapping
BASE_DIR = Path(__file__).resolve().parent
WEBSITE_AI_STATIC = BASE_DIR / "ai_models" / "website_ai" / "app" / "static"

# Create a simple output directory that matches the URL structure
WEBSITE_AI_OUTPUT = BASE_DIR / "website_ai_output"  # Simple path
WEBSITE_AI_STATIC.mkdir(parents=True, exist_ok=True)
WEBSITE_AI_OUTPUT.mkdir(parents=True, exist_ok=True)

app.mount("/website-ai/static", StaticFiles(directory=str(WEBSITE_AI_STATIC)), name="website_ai_static")
app.mount("/website-ai/output", StaticFiles(directory=str(WEBSITE_AI_OUTPUT)), name="website_ai_output")
app.mount("/voice-audio", StaticFiles(directory=str(BASE_DIR / "audio_output")), name="voice_audio")
app.mount("/audio", StaticFiles(directory=str(BASE_DIR / "audio_output")), name="audio")

# Content Creator / Image Generator output directory
OUTPUT_IMAGES_DIR = BASE_DIR / "output" / "images"
OUTPUT_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/output", StaticFiles(directory=str(BASE_DIR / "output")), name="output")

# ============================================
# SECURITY MIDDLEWARE (Phase 1)
# ============================================
from middleware.security import (
    setup_rate_limiting,
    add_security_headers,
    limit_request_size
)

# Setup rate limiting
limiter = setup_rate_limiting(app)
logging.info("✅ Rate limiting configured")

# Add security headers middleware
app.middleware("http")(add_security_headers)
logging.info("✅ Security headers middleware added")

# Add request size limit middleware
app.middleware("http")(limit_request_size)
logging.info("✅ Request size limit middleware added")

# ============================================
# CORS CONFIGURATION
# ============================================
import os
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else None

# Local development origins
cors_origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Always include default production/staging Vercel origins
default_prod_origins = [
    "https://saadhyam-psi.vercel.app",
    "https://saadhyam-production.up.railway.app",
]
cors_origins.extend(default_prod_origins)

if ALLOWED_ORIGINS:
    # Add custom origins from environment
    env_origins = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]
    cors_origins.extend(env_origins)

# Remove duplicates
cors_origins = list(set(cors_origins))
logging.info(f"✅ CORS Origins configured: {cors_origins}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://saadhyam-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

ensure_notifications_schema()

# Include routers - only include those that loaded successfully
print("=" * 60)
print("REGISTERING ROUTERS...")
print("=" * 60)

try:
    if auth_available:
        print(f"Auth router available: {auth_router}")
        print(f"Auth router prefix: {auth_router.prefix}")
        print(f"Auth router routes: {len(auth_router.routes)}")
        app.include_router(auth_router)
        print("[OK] AUTH ROUTER INCLUDED SUCCESSFULLY")
        logging.info("✅ Auth router included in app")
    else:
        print("[FAIL] AUTH ROUTER NOT AVAILABLE")
        logging.error("❌ Auth router NOT available")
except Exception as e:
    print(f"[FAIL] FAILED TO INCLUDE AUTH ROUTER: {e}")
    import traceback
    traceback.print_exc()
    
try:
    if protected_available:
        app.include_router(protected_router)
        print("[OK] PROTECTED ROUTER INCLUDED")
        logging.info("✅ Protected router included in app")
    else:
        print("[FAIL] PROTECTED ROUTER NOT AVAILABLE")
        logging.error("❌ Protected router NOT available")
except Exception as e:
    print(f"[FAIL] FAILED TO INCLUDE PROTECTED ROUTER: {e}")
    import traceback
    traceback.print_exc()

try:
    if notifications_available:
        app.include_router(notifications_router)
    if internal_notifications_available:
        app.include_router(internal_notifications_router)
        print("[OK] NOTIFICATIONS ROUTER INCLUDED")
        logging.info("✅ Notifications router included in app")
    else:
        print("[FAIL] NOTIFICATIONS ROUTER NOT AVAILABLE")
        logging.error("❌ Notifications router NOT available")
except Exception as e:
    print(f"[FAIL] FAILED TO INCLUDE NOTIFICATIONS ROUTER: {e}")
    import traceback
    traceback.print_exc()
if instagram_available:
    app.include_router(instagram_router)
if instagram_oauth_available:
    app.include_router(instagram_oauth_router)
if instagram_post_available:
    app.include_router(instagram_post_router)
if youtube_available:
    app.include_router(youtube_oauth_router)
    app.include_router(youtube_router)
if settings_available:
    app.include_router(settings_router)
if crud_available:
    app.include_router(crud_router)
if ai_available:
    app.include_router(ai_router)
if review_reply_available:
    app.include_router(review_reply_router)
# OLD TinyLlama Business Analysis - DISABLED (now using Gemini API)
# if business_available:
#     app.include_router(business_router)
if profile_available:
    app.include_router(profile_router)
    logging.info("✅ Profile router included in app")
if radar_available:
    app.include_router(radar_router)
    logging.info("✅ Radar AI router included in app")
if competitor_intelligence_available:
    app.include_router(competitor_intelligence_router)
    logging.info("✅ Competitor Intelligence AI router included in app")
if assistant_available:
    app.include_router(assistant_router)
if content_creator_available:
    app.include_router(content_creator_router)
if image_generator_available:
    app.include_router(image_generator_router)
if auto_blogger_available:
    app.include_router(auto_blogger_router)
if realtime_business_available:
    app.include_router(realtime_business_router)
    logging.info("✅ Real-time Business Intelligence router included in app")
if business_analysis_gemini_available:
    app.include_router(business_analysis_gemini_router)
    logging.info("✅ Business Analysis (Gemini) router included in app")
if comprehensive_business_analysis_available:
    app.include_router(comprehensive_business_analysis_router)
    logging.info("✅ Comprehensive Business Analysis router included in app")
if website_serving_available:
    app.include_router(website_serving_router)
    logging.info("✅ Website serving router included in app")
if business_input_available:
    app.include_router(business_input_router)
    logging.info("✅ Business Input router included in app")
if business_compatibility_available:
    app.include_router(business_compatibility_router)
    logging.info("✅ Business Compatibility router included in app")
if partnership_agent_available:
    app.include_router(partnership_agent_router)
    logging.info("✅ Partnership Agent router included in app")
if customer_retention_available:
    app.include_router(customer_retention_router)
    logging.info("✅ Customer Retention Agent router included in app")
if aeo_geo_available:
    app.include_router(aeo_geo_router)
    logging.info("✅ AEO/GEO router included in app")
if blog_available:
    app.include_router(blog_router)
    logging.info("✅ Blog router included in app")
if whatsapp_auth_available:
    app.include_router(whatsapp_auth_router)
    logging.info("✅ WhatsApp Auth router included in app")
if whatsapp_webhook_available:
    app.include_router(whatsapp_webhook_router)
    logging.info("✅ WhatsApp Webhook router included in app")
if whatsapp_messages_available:
    app.include_router(whatsapp_messages_router)
    logging.info("✅ WhatsApp Messages router included in app")
if whatsapp_campaigns_available:
    app.include_router(whatsapp_campaigns_router)
    logging.info("✅ WhatsApp Campaigns router included in app")
if whatsapp_automation_available:
    app.include_router(whatsapp_automation_router)
    logging.info("✅ WhatsApp Automation router included in app")
if b2b_network_available:
    app.include_router(b2b_network_router)
    logging.info("✅ B2B Network router included in app")
if b2b_chat_available:
    app.include_router(b2b_chat_router)
    logging.info("✅ B2B Chat router included in app")
if instagram_analytics_available:
    app.include_router(instagram_analytics_router)
    logging.info("✅ Instagram Analytics router included in app")
if instagram_token_management_available:
    app.include_router(instagram_token_management_router)
    logging.info("✅ Instagram Token Management router included in app")
if task_tracking_available:
    app.include_router(task_tracking_router)
    logging.info("✅ Task Tracking router included in app")
if voice_agent_available:
    app.include_router(voice_agent_router, prefix="/api")
    logging.info("✅ Voice Agent router included in app")
if voice_agent_v2_available:
    app.include_router(voice_agent_v2_router)
    logging.info("✅ Voice Agent V2 router included in app")
if voice_command_available:
    app.include_router(voice_command_router, prefix="/api/voice-command")
    logging.info("✅ Voice Command router included in app")
if webhooks_available:
    app.include_router(webhooks_router)
    logging.info("✅ Webhooks router included in app")

if meta_oauth_available:
    app.include_router(meta_oauth_router)
    logging.info("✅ Meta OAuth router included in app")
if meta_ads_available:
    app.include_router(meta_ads_router)
    logging.info("✅ Meta Ads router included in app")
if cache_management_available:
    app.include_router(cache_management_router)
    logging.info("✅ Cache Management router included in app")
if health_available:
    app.include_router(health_router)
    logging.info("✅ Health Check router included in app")
if public_available:
    app.include_router(public_router)
    logging.info("✅ Public API router included in app")
if google_business_available:
    app.include_router(google_business_router)
    logging.info("✅ Google Business router included in app")

if user_api_keys_available:
    app.include_router(user_api_keys_router)
    logging.info("✅ User API Keys router included in app")

if user_instagram_oauth_available:
    app.include_router(user_instagram_oauth_router)
    logging.info("✅ User Instagram OAuth router included in app")
if dashboard_analytics_available:
    app.include_router(dashboard_analytics_router)
    logging.info("✅ Dashboard Analytics router included in app")
if plugins_available:
    app.include_router(plugins_router, prefix="/api")
    logging.info("✅ Plugins router included in app")
if problem_context_available:
    app.include_router(problem_context_router)
    logging.info("✅ Problem Context router included in app")
if problems_available:
    app.include_router(problems_router)
    logging.info("✅ Problem Engine Complete router included in app")
if opportunities_available:
    app.include_router(opportunities_router)
    logging.info("✅ Opportunities Complete router included in app")
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
        website_ai_websites.router,
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

@app.get("/test", tags=["Health"])
async def test():
    """Simple test endpoint"""
    auth_routes = [str(r.path) for r in fastapi_app.routes if '/auth' in str(r.path)]
    return {
        "status": "ok",
        "message": "Backend is responding",
        "total_routes": len(fastapi_app.routes),
        "auth_routes_count": len(auth_routes),
        "auth_routes": auth_routes[:10]  # First 10 auth routes
    }

@app.get("/test-auth", tags=["Health"])
async def test_auth(authorization: str = None):
    """Test endpoint with auth header"""
    return {"status": "ok", "authorization": authorization}

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


@app.get("/api/routes", tags=["Health"])
async def list_routes():
    """List all registered routes for debugging"""
    routes = []
    for route in fastapi_app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name
            })
    return {"routes": routes}


@app.get("/api/debug-imports", tags=["Health"])
async def debug_imports():
    """Debug route to get full traceback of failed imports"""
    import traceback
    results = {}
    
    # Try importing routes.auth
    try:
        import routes.auth
        results["routes.auth"] = "ok"
    except Exception as e:
        results["routes.auth"] = {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        
    # Try importing routes.profile
    try:
        import routes.profile
        results["routes.profile"] = "ok"
    except Exception as e:
        results["routes.profile"] = {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        
    # Check what routers loaded successfully according to global flags
    global_vars = globals()
    router_status = {}
    for var_name, var_val in global_vars.items():
        if var_name.endswith("_available"):
            router_status[var_name] = var_val
    results["router_status_flags"] = router_status
    
    return results


@app.get("/api/features/public", tags=["Health"])
async def get_public_features():
    """Returns actual cached feature flags fetched from the admin service"""
    from feature_flags import FEATURE_CACHE
    return list(FEATURE_CACHE.values())



@app.post("/api/admin/broadcast-notification")
async def api_broadcast_notification(payload: dict, db: AsyncSession = Depends(get_db)):
    title = payload.get("title")
    message = payload.get("message")
    notification_type = payload.get("type", "info")
    user_id = payload.get("user_id")
    email = payload.get("email")
    target_type = payload.get("target_type") or ("targeted" if user_id or email else "global")
    created_by = payload.get("created_by")
    extra_data = payload.get("extra_data") or {
        key: value
        for key, value in payload.items()
        if key not in {"title", "message", "type", "user_id", "email", "target_type", "created_by", "extra_data"}
    }
    
    if not title or not message:
        return {"ok": False, "error": "Title and message are required"}

    from models.notification import UserNotification
    from models.user import User

    recipient_ids: list[int] = []
    if user_id:
        recipient_ids = [int(user_id)]
    elif email:
        result = await db.execute(select(User).where(User.email == email.strip()))
        matched_user = result.scalars().first()
        if matched_user:
            recipient_ids = [matched_user.id]

    if not recipient_ids:
        result = await db.execute(select(User.id).where(User.is_active.is_(True)))
        recipient_ids = [row[0] for row in result.all()]

    persisted_notifications: list[UserNotification] = []
    for recipient_id in recipient_ids:
        notification_row = UserNotification(
            user_id=recipient_id,
            title=title.strip(),
            message=message.strip(),
            type=notification_type,
            target_type=target_type,
            source="admin",
            created_by=created_by,
            extra_data=extra_data or None,
        )
        db.add(notification_row)
        persisted_notifications.append(notification_row)

    await db.commit()

    for notification_row in persisted_notifications:
        await db.refresh(notification_row)
        await realtime_service.notify_user(
            notification_row.user_id,
            {
                "id": notification_row.id,
                "title": notification_row.title,
                "message": notification_row.message,
                "type": notification_row.type,
                "target_type": notification_row.target_type,
                "source": notification_row.source,
                "created_by": notification_row.created_by,
                "extra_data": notification_row.extra_data,
            },
        )

    try:
        from feature_flags import fetch_features_once
        import asyncio
        asyncio.create_task(fetch_features_once(timeout=3))
    except Exception as e:
        import logging
        logging.getLogger("main").warning(f"Failed to trigger feature flags refresh on broadcast: {e}")

    return {"ok": True, "delivered_to": len(persisted_notifications)}


# Save a reference to the original FastAPI app before wrapping it
fastapi_app = app

# Alias app to sio_asgi_app so uvicorn main:app uses Socket.IO wrapper
app = sio_asgi_app


if __name__ == "__main__":
    import uvicorn
    
    # Run Socket.IO ASGI app for real-time WebSocket support
    uvicorn.run(
        "main:sio_asgi_app",  # Use Socket.IO wrapper for WebSocket support
        host="0.0.0.0",
        port=8001,
        log_level="info",
        reload=True
    )
