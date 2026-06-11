# Project Features

This document summarizes the main features and components of the repository.

## Backend

- FastAPI/ASGI service and HTTP endpoints (`Backend/main.py`, `model_server.py`).
- Database models and many migrations for features like YouTube, Instagram, WhatsApp, voice agents, and more.
- Role-Based Access Control and API key support.

## Background Jobs

- Celery-based task queue and workers (`Backend/celery_app.py`, `Backend/celery_worker.py`, ai worker modules).

## AI Capabilities

- Multiple AI modules under `Backend/ai_models/`:
  - `website_ai` — website generation, templates, generation jobs and pipelines.
  - `content_creator` — image/content generation, SD/LoRA tooling and pipelines.
  - `review_reply_ai` — automated review reply generation.

## Frontend

- React + TypeScript app built with Vite in `Frontend/`.
- Dashboard routes: analytics, chat, business analysis, blogs, Instagram, YouTube, checkout, plugins, automation, agents, and more.
- Client hooks for auth, realtime, voice, and feature gating.

## Voice & Audio

- Voice agent and speech features (frontend hooks `useSpeechRecognition`, `useVoiceExecutor`, `recordings/`, and `audio_output/`).

## OAuth & Integrations

- OAuth callbacks and integrations: Instagram, YouTube, Google Business, Firebase, Cloudinary, Meta Ads.

## Messaging & Chat6

- Chat-related routes, DB tables, and migration scripts supporting messaging functionality.

## Analytics & Insights

- Audience insights, Instagram analytics, competitor analysis, and meta-ads analytics.

## B2B / Partnerships

- B2B network and partner chat features in dashboard routes.

## Billing & Subscriptions

- Checkout flows and subscription-related migrations and fields.

## Storage & Search

- Storage services and Pinecone configuration support for vector search.

## Templates & Website Builder

- Pre-built website templates and template generation scripts (`Backend/ai_models/website_ai/app/templates/`).

## Deployment & Operations

- Dockerfile and `docker-compose.yml`.
- Deployment scripts and configs for Railway and Render (`deploy-railway.*`, `deploy-render.*`, `render.yaml`, `railway.json`).
- Start/stop and tunnel helper scripts (`start_all.bat`, `start_tunnel.bat`, etc.).

## Dev Tools & Utilities

- Scripts for migrations, environment fixes, route generation, and developer tooling.

## Security & Infrastructure

- Middleware for security, CORS, rate limiting, and feature flags.

## Data & Migration Utilities

- Extensive DB migration scripts and seeders for enabling feature rollout and data model evolution.

## Miscellaneous

- Example HTML templates in repo root (e.g., `template-01-luminary-hotel.html`).
- Requirements and package manifests for backend and AI submodules.

---

If you want this moved to a docs folder, converted to README format, or committed to the repo with a commit message, tell me how you want it saved.
