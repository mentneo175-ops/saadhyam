# Website AI Module

AI-powered website generation module for integration into the main application. Generates professional business websites with 6 unique templates and inline editing capabilities.

## 🎯 Purpose

This module is designed to be integrated into `Backend/ai_models/website_ai/` as part of the main application's AI services ecosystem, alongside `business_analysis` and `review_reply_ai` modules.

## ✨ Features

- **6 Unique Templates** - Hero Split, Card Masonry, Timeline, Magazine, Bento Box, Parallax
- **Inline Editing** - Edit any text directly on the generated pages
- **Template Gallery** - Browse templates with live previews
- **Comprehensive Sections** - 10-11 business-essential sections per template
- **AI Content Generation** - Automatic content creation using LLM
- **Async Job Processing** - Background task processing with Celery
- **Database Integration** - PostgreSQL with SQLAlchemy ORM
- **Storage Service** - S3/MinIO compatible storage for generated sites

## 📁 Module Structure (Integration-Ready)

```
website_ai/
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── requirements-production.txt        # Production dependencies
├── .env.example                       # Environment variables template
│
├── app/
│   ├── __init__.py
│   ├── main.py                        # FastAPI application entry
│   ├── config.py                      # Configuration management
│   │
│   ├── api/v1/                        # API v1 endpoints
│   │   ├── routes/
│   │   │   ├── generation.py         # Website generation endpoints
│   │   │   └── jobs.py                # Job status endpoints
│   │   └── schemas/
│   │       ├── requests.py            # Request models
│   │       └── responses.py           # Response models
│   │
│   ├── core/services/                 # Core business services
│   │   ├── generation_service.py      # Website generation logic
│   │   └── storage_service.py         # File storage (S3/local)
│   │
│   ├── db/                            # Database layer
│   │   ├── session.py                 # Database session management
│   │   └── models/
│   │       ├── content.py             # Content model
│   │       ├── job.py                 # Job tracking model
│   │       ├── theme_config.py        # Theme configuration
│   │       └── website.py             # Website model
│   │
│   ├── workers/                       # Celery workers
│   │   ├── celery_app.py              # Celery configuration
│   │   └── tasks/
│   │       ├── generation_tasks.py    # Generation tasks
│   │       └── cleanup_tasks.py       # Cleanup tasks
│   │
│   ├── models/                        # Legacy models (for compatibility)
│   │   └── schema.py                  # Pydantic schemas
│   │
│   ├── services/                      # Legacy services (for compatibility)
│   │   ├── ai_service.py              # AI/LLM service
│   │   ├── template_service.py        # Template rendering
│   │   ├── pipeline.py                # Generation pipeline
│   │   └── database.py                # Database operations
│   │
│   ├── routes/                        # Legacy routes (for compatibility)
│   │   ├── website.py                 # Website routes
│   │   └── api.py                     # API routes
│   │
│   ├── templates/                     # HTML templates
│   │   ├── hero-split.html
│   │   ├── card-masonry.html
│   │   ├── timeline-vertical.html
│   │   ├── magazine-grid.html
│   │   ├── bento-box.html
│   │   ├── parallax-scroll.html
│   │   ├── template-gallery.html
│   │   └── index.html
│   │
│   ├── static/                        # Frontend assets
│   │   └── editor.js                  # Inline editor
│   │
│   └── utils/
│       └── logger.py                  # Logging utilities
│
└── output/                            # Generated websites (local storage)
```

## 🔌 API Endpoints

### Generation API (v1)
- `POST /api/v1/generate` - Start async website generation
- `GET /api/v1/jobs/{job_id}` - Check job status
- `GET /api/v1/jobs/{job_id}/result` - Get generation result

### Legacy API (for backward compatibility)
- `POST /generate-website` - Synchronous generation
- `GET /templates` - List available templates
- `POST /api/content/{id}` - Save edited content
- `GET /api/content/{id}` - Retrieve content

## 🎨 Available Templates

1. **Hero Split** - Full-screen split layout (SaaS/Tech)
2. **Card Masonry** - Dark masonry grid (Creative Agencies)
3. **Timeline Vertical** - Elegant timeline (Professional Services)
4. **Magazine Grid** - Bold editorial (Media/Publishing)
5. **Bento Box** - Apple-inspired grid (Product Showcase)
6. **Parallax Scroll** - Futuristic scrolling (Tech Innovation)

## 🛠️ Technology Stack

- **Backend:** FastAPI, SQLAlchemy, Celery
- **Database:** PostgreSQL
- **Cache/Queue:** Redis
- **Storage:** S3/MinIO/Local
- **AI/LLM:** Transformers, HuggingFace
- **Frontend:** Vanilla JavaScript, CSS3

## 📝 Environment Variables

Required environment variables (add to main app's `.env`):

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/website_generator

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Storage
STORAGE_TYPE=local  # or s3, minio
LOCAL_STORAGE_PATH=./output
S3_BUCKET_NAME=website-generator  # if using S3

# AI/LLM
AI_USE_FAKE_LLM=true  # Use fake LLM for testing
AI_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.2
HF_TOKEN=your_huggingface_token  # if using real LLM

# Templates
DEFAULT_THEME=hero-split
```

## 🔗 Integration Requirements

### 1. Database Migration
- Run migrations to create required tables: `Job`, `Website`, `Content`, `ThemeConfig`

### 2. Celery Worker
- Start Celery worker for async task processing
- Worker command: `celery -A app.workers.celery_app worker --loglevel=info`

### 3. Route Registration
- Register routes in main app with prefix: `/api/v1/website-ai/`
- Mount static files and templates

### 4. Dependencies
- Merge `requirements.txt` into main app's requirements
- Install: `pip install -r requirements.txt`

## 📊 Integration Status

✅ **Ready for Integration**

- Async job processing implemented
- Database models defined
- Storage service abstracted
- API endpoints versioned
- Frontend templates ready
- Inline editing functional
- Configuration externalized

## 🚀 Next Steps for Integration

1. **Copy module** to `Backend/ai_models/website_ai/`
2. **Update imports** to use new path structure
3. **Merge configurations** into main app's config
4. **Run database migrations** to create tables
5. **Register routes** in main FastAPI app
6. **Start Celery worker** for background tasks
7. **Update frontend** to match main app's UI theme
8. **Test endpoints** through main app

---

**Module Version:** 2.0.0
**Integration Target:** Backend/ai_models/website_ai/
**Compatible With:** FastAPI 0.100+, Python 3.9+
