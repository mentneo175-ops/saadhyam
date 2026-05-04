# 🎯 INTEGRATION PROMPT FOR WEBSITE AI MODULE

## Context
I have a main application with a Backend folder structure containing an `ai_models` directory with existing modules (`business_analysis` and `review_reply_ai`). I need to integrate this `website_ai` module into `Backend/ai_models/website_ai/` without disturbing the existing application workflow.

---

## 📋 Pre-Integration Checklist

✅ **Cleanup Complete** - Unnecessary files removed
✅ **Essential Files Only** - Module is streamlined
✅ **Documentation Updated** - Single comprehensive README.md
✅ **Ready for Integration** - Module structure optimized

---

## 🎯 Integration Objectives

### 1. **Structural Integration**
- Place the `website_ai` folder inside `Backend/ai_models/` directory
- Update all import paths from `app.*` to `Backend.ai_models.website_ai.*`
- Ensure no conflicts with existing `business_analysis` and `review_reply_ai` modules

### 2. **Backend Integration**
- Integrate website_ai routes into main application's routing system
- Add API endpoints with proper prefixing: `/api/v1/website-ai/`
- Merge database models with main app's database structure
- Integrate Celery tasks with main app's worker system
- Merge configuration settings into main app's config

### 3. **Frontend Integration**
- Analyze main application's UI framework and design system
- Match website_ai templates with main app's styling (colors, fonts, components)
- Integrate template gallery into main app's navigation
- Ensure inline editor works within main app context
- Update all static file paths and references

### 4. **Dependency Management**
- Merge `requirements.txt` into main app's requirements
- Resolve any version conflicts
- Ensure no duplicate dependencies

---

## 📁 Current Module Structure (After Cleanup)

```
website_ai/
├── README.md                          # Module documentation
├── requirements.txt                   # Dependencies
├── requirements-production.txt        # Production dependencies
├── .env.example                       # Environment template
├── CLEANUP_SUMMARY.md                 # Cleanup documentation
├── INTEGRATION_PROMPT.md              # This file
│
├── app/
│   ├── __init__.py
│   ├── main.py                        # FastAPI application
│   ├── config.py                      # Configuration
│   │
│   ├── api/v1/                        # Enterprise API
│   │   ├── routes/
│   │   │   ├── generation.py         # Async generation
│   │   │   └── jobs.py                # Job tracking
│   │   └── schemas/
│   │       ├── requests.py            # Request models
│   │       └── responses.py           # Response models
│   │
│   ├── core/services/                 # Core services
│   │   ├── generation_service.py      # Generation logic
│   │   └── storage_service.py         # Storage (S3/local)
│   │
│   ├── db/                            # Database layer
│   │   ├── session.py                 # Session management
│   │   └── models/
│   │       ├── content.py
│   │       ├── job.py
│   │       ├── theme_config.py
│   │       └── website.py
│   │
│   ├── workers/                       # Celery workers
│   │   ├── celery_app.py
│   │   └── tasks/
│   │       ├── generation_tasks.py
│   │       └── cleanup_tasks.py
│   │
│   ├── models/                        # Legacy (compatibility)
│   │   └── schema.py
│   │
│   ├── services/                      # Legacy (compatibility)
│   │   ├── ai_service.py
│   │   ├── template_service.py
│   │   ├── pipeline.py
│   │   └── database.py
│   │
│   ├── routes/                        # Legacy (compatibility)
│   │   ├── website.py
│   │   └── api.py
│   │
│   ├── templates/                     # 6 HTML templates
│   │   ├── hero-split.html
│   │   ├── card-masonry.html
│   │   ├── timeline-vertical.html
│   │   ├── magazine-grid.html
│   │   ├── bento-box.html
│   │   ├── parallax-scroll.html
│   │   ├── template-gallery.html
│   │   └── index.html
│   │
│   ├── static/
│   │   └── editor.js                  # Inline editor
│   │
│   └── utils/
│       └── logger.py
│
└── output/                            # Generated websites
```

---

## 🔧 Integration Steps

### Step 1: Move Module to Target Location
```bash
# Move the entire website_ai folder to Backend/ai_models/
mv website_ai Backend/ai_models/website_ai
```

### Step 2: Update Import Paths
Update all imports in the module from:
```python
from app.services.ai_service import ...
```
To:
```python
from Backend.ai_models.website_ai.app.services.ai_service import ...
```

Or use relative imports:
```python
from .services.ai_service import ...
```

### Step 3: Integrate Routes into Main App
In main application's route registration:
```python
from Backend.ai_models.website_ai.app.api.v1.routes import generation, jobs

# Register with prefix
app.include_router(
    generation.router,
    prefix="/api/v1/website-ai",
    tags=["website-ai"]
)
app.include_router(
    jobs.router,
    prefix="/api/v1/website-ai",
    tags=["website-ai"]
)
```

### Step 4: Merge Database Models
Add website_ai models to main app's database:
```python
# In main app's database initialization
from Backend.ai_models.website_ai.app.db.models import (
    Job, Website, Content, ThemeConfig
)
```

### Step 5: Integrate Celery Tasks
Register website_ai tasks with main Celery app:
```python
# In main Celery configuration
from Backend.ai_models.website_ai.app.workers.tasks import (
    generation_tasks, cleanup_tasks
)
```

### Step 6: Merge Configuration
Add to main app's `.env`:
```bash
# Website AI Module Configuration
WEBSITE_AI_STORAGE_TYPE=local
WEBSITE_AI_LOCAL_STORAGE_PATH=./output/website_ai
WEBSITE_AI_DEFAULT_THEME=hero-split
WEBSITE_AI_USE_FAKE_LLM=true
WEBSITE_AI_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.2
```

### Step 7: Update Frontend Styling
1. Extract CSS variables from main app
2. Create a theme adapter file:
```javascript
// theme-adapter.js
const mainAppTheme = {
    primaryColor: 'var(--main-primary)',
    secondaryColor: 'var(--main-secondary)',
    fontFamily: 'var(--main-font)',
    // ... other variables
};
```
3. Apply to website_ai templates

### Step 8: Mount Static Files
```python
# In main FastAPI app
from pathlib import Path

WEBSITE_AI_STATIC = Path("Backend/ai_models/website_ai/app/static")
WEBSITE_AI_TEMPLATES = Path("Backend/ai_models/website_ai/app/templates")

app.mount("/website-ai/static", StaticFiles(directory=str(WEBSITE_AI_STATIC)))
```

### Step 9: Run Database Migrations
```bash
# Create migration for website_ai tables
alembic revision --autogenerate -m "Add website_ai tables"

# Run migration
alembic upgrade head
```

### Step 10: Start Celery Worker
```bash
# Start worker with website_ai tasks
celery -A Backend.ai_models.website_ai.app.workers.celery_app worker --loglevel=info
```

---

## 🎨 Frontend UI Matching

### Required Changes:
1. **Color Scheme**: Update CSS variables in templates to match main app
2. **Typography**: Use main app's font families and sizes
3. **Components**: Adapt buttons, forms, cards to main app's design
4. **Navigation**: Integrate into main app's navigation structure
5. **Responsive Design**: Ensure breakpoints match main app

### Files to Update:
- `app/templates/*.html` - Update inline styles and classes
- `app/static/editor.js` - Match UI controls with main app
- Create `app/static/theme-adapter.css` - Bridge styling

---

## 📝 Environment Variables to Add

Add these to main application's `.env`:

```bash
# Website AI Module
WEBSITE_AI_STORAGE_TYPE=local
WEBSITE_AI_LOCAL_STORAGE_PATH=./output/website_ai
WEBSITE_AI_S3_BUCKET=website-generator  # if using S3
WEBSITE_AI_DEFAULT_THEME=hero-split
WEBSITE_AI_USE_FAKE_LLM=true
WEBSITE_AI_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.2
WEBSITE_AI_MAX_TOKENS=900
WEBSITE_AI_TEMPERATURE=0.7
```

---

## 🧪 Testing Checklist

After integration, test:

- [ ] Health check: `GET /api/v1/website-ai/health`
- [ ] Generate website: `POST /api/v1/website-ai/generate`
- [ ] Check job status: `GET /api/v1/website-ai/jobs/{job_id}`
- [ ] Get result: `GET /api/v1/website-ai/jobs/{job_id}/result`
- [ ] Template gallery loads correctly
- [ ] Inline editor works
- [ ] Content saves and loads
- [ ] All 6 templates render correctly
- [ ] UI matches main app design
- [ ] No conflicts with existing modules

---

## ⚠️ Critical Rules

1. **DO NOT** modify existing `business_analysis` or `review_reply_ai` modules
2. **DO NOT** change main app's database schema without migrations
3. **DO** use proper API prefixing: `/api/v1/website-ai/`
4. **DO** namespace all configuration with `WEBSITE_AI_` prefix
5. **DO** test thoroughly before deploying
6. **DO** maintain backward compatibility
7. **DO** follow main app's coding standards

---

## 📊 Expected Outcome

After successful integration:

✅ Website AI accessible at: `http://localhost:8000/api/v1/website-ai/`
✅ UI matches main application design perfectly
✅ All 6 templates working with inline editing
✅ Async job processing functional
✅ No disruption to existing modules
✅ Database properly integrated
✅ Celery tasks running smoothly
✅ Frontend seamlessly integrated

---

## 🚀 Quick Start Command

Once integrated, test with:

```bash
# Start main application
python -m uvicorn Backend.main:app --reload

# In another terminal, start Celery worker
celery -A Backend.ai_models.website_ai.app.workers.celery_app worker --loglevel=info

# Test the endpoint
curl -X POST "http://localhost:8000/api/v1/website-ai/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Test Company",
    "business_type": "Technology",
    "theme": "hero-split"
  }'
```

---

## 📞 Support

If you encounter issues during integration:

1. Check `CLEANUP_SUMMARY.md` for removed files
2. Review `README.md` for module documentation
3. Verify all import paths are updated
4. Ensure database migrations ran successfully
5. Check Celery worker logs for task errors

---

**Integration Version:** 2.0.0
**Target Location:** `Backend/ai_models/website_ai/`
**Status:** ✅ Ready for Integration
**Date:** 2026-05-04
