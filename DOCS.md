# Mentneo Saadhyam AI - Product Documentation

## Overview
Saadhyam AI is a business intelligence platform built by Mentneo. It helps businesses analyze performance, generate professional review replies, and produce actionable growth insights. The platform includes a FastAPI backend, a React + TypeScript frontend, and AI services powered by TinyLlama.

## Key Features
- Business Analysis AI: SWOT-style analysis with scores and recommendations.
- Review Reply AI: Professional review response generation using TinyLlama.
- User Management: Authentication and business profile onboarding.
- Dashboard: Business insights and performance metrics.
- Instagram Integration: Connect and manage Instagram business accounts.
- Website AI: Generate full business websites and templates.
- Storage: PostgreSQL (NeonDB) with SQLite fallback for local use.

## Architecture
### Services
- Main Backend (FastAPI): http://localhost:8000
  - Auth, profiles, review replies, settings, Instagram, Website AI.
- Business Model Server (FastAPI): http://localhost:9001
  - Business analysis AI.
- Frontend (Vite + React): http://localhost:5173 (default)
  - Dashboard and user experience.

### Components
- Backend: FastAPI, SQLAlchemy, Pydantic, TinyLlama models.
- Frontend: React, TypeScript, Tailwind CSS, TanStack Router.
- Website AI: Template-driven HTML generation with inline editing.

## Setup (Local Development)
### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend
1) Create and activate a virtual environment:
   - Windows:
     - `python -m venv venv`
     - `venv\Scripts\activate`
2) Install dependencies:
   - `pip install -r Backend\requirements.txt`
3) Configure environment:
   - Copy `Backend\.env.example` to `Backend\.env` and update values.
4) Start services:
   - Main backend: `python Backend\main.py`
   - Business analysis: `python Backend\business_model.py`

### Frontend
1) Install dependencies:
   - `cd Frontend`
   - `npm install` (or `bun install`)
2) Configure API URL:
   - `VITE_API_URL=http://localhost:8000`
3) Start dev server:
   - `npm run dev` (or `bun run dev`)

## Environment Variables
Key backend variables (from `Backend/.env.example`):
- `DATABASE_URL`
- `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Frontend variables:
- `VITE_API_URL`

## API Reference (Summary)
Base URLs:
- Main API: `http://localhost:8000`
- Business Analysis API: `http://localhost:9001`
- Swagger UI: `http://localhost:8000/docs`

Authentication:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Profiles:
- `GET /api/profile/`
- `GET /api/profile/business`
- `PUT /api/profile/business`
- `GET /api/profile/business/setup-status`

Business Analysis:
- `POST /api/business/analyze`
- `GET /api/business/history`
- `GET /api/business/latest`

Review Reply AI:
- `POST /ai/generate-review-reply`

Instagram:
- `GET /auth/instagram`
- `GET /instagram/posts`
- `POST /instagram/upload-and-post`

Settings:
- `GET /api/settings`
- `PUT /api/settings`

Website AI:
- UI: `http://localhost:8000/website-ai/`
- Templates: `http://localhost:8000/website-ai/templates`
- Generate (sync): `POST /website-ai/api/websites`
- Output: `http://localhost:8000/website-ai/output/<file>.html`

For full request/response examples, see API.md.

## Website AI Notes
- Generated pages can be edited inline using the built-in editor toolbar.
- Async generation endpoints exist under `/api/v1/website-ai` and can be used with a Celery worker.
- If async jobs are pending, start a worker:
  - `celery -A Backend.ai_models.website_ai.app.workers.celery_app worker --loglevel=info`

## Deployment
### Backend
- Dockerfiles and docker-compose are available in `Backend/`.
- Typical steps:
  - Build image from `Backend/Dockerfile`.
  - Configure environment variables in production.
  - Run behind a reverse proxy (Nginx or similar).

### Frontend
- Build a production bundle:
  - `npm run build`
- Deploy the `Frontend/dist` output to your hosting provider.
- Set `VITE_API_URL` to the production API URL.

## Verification
- Backend health:
  - `GET http://localhost:8000/health`
  - `GET http://localhost:9001/health`
- API docs:
  - `http://localhost:8000/docs`
  - `http://localhost:9001/docs`

## Troubleshooting
- Port in use: stop existing process on 8000/9001/5173.
- Database auth: verify `DATABASE_URL`, fallback to SQLite is supported.
- Slow first run: TinyLlama downloads and loads on first boot.

## Reference Files
- README.md
- QUICK_START.md
- API.md
- PROJECT_STRUCTURE.md
- Frontend/FRONTEND.md
