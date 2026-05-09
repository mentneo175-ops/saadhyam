# Saadhyam AI - Complete Business Intelligence Platform

> **AI-Powered Business Management & Content Creation Platform**

Saadhyam AI is a comprehensive platform that helps businesses with intelligent content creation, business analysis, blog generation, website creation, and social media management.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### 🤖 AI-Powered Features
- **Business Analysis** - Comprehensive business intelligence using Gemini AI
- **Blog Generation** - SEO-optimized blog posts with web research (Tavily/Serper)
- **Content Creation** - Social media content for Instagram, Facebook, WhatsApp
- **Image Generation** - AI-generated images using FLUX/Stable Diffusion
- **Review Reply AI** - Automated professional review responses
- **Personal Assistant** - AI-powered business assistant using Groq

### 🌐 Website & Content
- **Website Generator** - AI-generated business websites with 6 templates
- **Blog Publishing** - Automatic blog publishing to customer websites
- **AEO/GEO Optimization** - Answer Engine & Generative Engine Optimization
- **SEO Tools** - Keyword research and optimization

### 📊 Business Management
- **Business Profile** - Comprehensive business information management
- **Analytics Dashboard** - Real-time business intelligence
- **Task Management** - AI-suggested tasks and workflows
- **Competitor Analysis** - Track and analyze competitors

### 🔗 Integrations
- **Instagram** - Post scheduling and management
- **Firebase Auth** - Google OAuth authentication
- **Cloudinary** - Image storage and management
- **NeonDB** - PostgreSQL database
- **Pinecone** - Vector database for semantic search

---

## 🛠 Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL (NeonDB) + Pinecone (Vector DB)
- **AI Models:** 
  - Google Gemini 2.5 Flash (Business Analysis, Blog Generation)
  - TinyLlama (Review Replies)
  - Groq (Personal Assistant)
  - FLUX/Stable Diffusion (Image Generation)
- **Web Search:** Tavily AI, Serper API
- **Task Queue:** Celery + Redis
- **Authentication:** Firebase Admin SDK + JWT

### Frontend
- **Framework:** React 19 + TanStack Start
- **Styling:** Tailwind CSS 4.2
- **UI Components:** Radix UI
- **State Management:** TanStack Query
- **Build Tool:** Vite 7

---

## 📦 Prerequisites

### Required Software
- **Python:** 3.11 or higher
- **Node.js:** 18 or higher
- **npm:** 9 or higher
- **Git:** Latest version

### Required API Keys
1. **Firebase** (Google OAuth) - [Get it here](https://console.firebase.google.com/)
2. **NeonDB** (Database) - [Get it here](https://neon.tech/)
3. **Gemini API** (AI) - [Get it here](https://aistudio.google.com/app/apikey)
4. **Tavily API** (Web Search) - [Get it here](https://tavily.com/)
5. **Serper API** (Web Search) - [Get it here](https://serper.dev/)
6. **Groq API** (Assistant) - [Get it here](https://console.groq.com/)
7. **HuggingFace Token** (Image Gen) - [Get it here](https://huggingface.co/settings/tokens)
8. **Pinecone API** (Vector DB) - [Get it here](https://www.pinecone.io/)

### Optional API Keys
- **Cloudinary** (Image Storage)
- **Instagram** (Social Media)
- **OpenAI** (Alternative AI)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/saadhyam-ai.git
cd saadhyam-ai
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv ../.venv

# Activate virtual environment
# On Windows:
..\.venv\Scripts\activate
# On macOS/Linux:
source ../.venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env

# Edit .env file with your API keys (see Configuration section)
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../Frontend

# Install dependencies
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

Edit `Backend/.env` with your API keys:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql+asyncpg://user:password@host/database

# Firebase Authentication (REQUIRED for Google OAuth)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json
FIREBASE_PROJECT_ID=your-project-id

# AI Services (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
HUGGINGFACE_TOKEN=your_huggingface_token

# Web Search APIs (REQUIRED for Blog Generation)
TAVILY_API_KEY=your_tavily_api_key
SERPER_API_KEY=your_serper_api_key

# Vector Database (REQUIRED for Business Analysis)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=saadhyam-aeo-geo

# Optional Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Authentication** → **Google Sign-In**
4. Go to **Project Settings** → **Service Accounts**
5. Click **Generate New Private Key**
6. Save the JSON file as `Backend/firebase-adminsdk.json`

### Frontend Configuration

Edit `Frontend/.env`:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🏃 Running the Application

### Start Backend Server

```bash
cd Backend
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

**Expected output:**
```
✅ Firebase Admin SDK: INITIALIZED
✅ Profile router included in app
✅ Business Input router included in app
✅ Application startup complete
INFO: Uvicorn running on http://127.0.0.1:8000
```

**Backend URLs:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Start Frontend Server

```bash
cd Frontend
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:8080/
```

**Frontend URL:** http://localhost:8080

---

## 📁 Project Structure

```
Saadhyam/
├── Backend/
│   ├── ai_models/           # AI model implementations
│   │   ├── content_creator/ # Content generation
│   │   ├── review_reply_ai/ # Review reply AI
│   │   └── website_ai/      # Website generation
│   ├── config/              # Configuration files
│   ├── db/                  # Database models
│   ├── migrations/          # Database migrations
│   ├── models/              # SQLAlchemy models
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   │   ├── auto_blogger_service.py
│   │   ├── web_search_service.py
│   │   ├── blog_service.py
│   │   └── business_pinecone_service.py
│   ├── utils/               # Utility functions
│   ├── .env                 # Environment variables
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
│
├── Frontend/
│   ├── src/
│   │   ├── routes/          # Page routes
│   │   ├── components/      # React components
│   │   ├── lib/             # API clients & utilities
│   │   └── styles/          # CSS styles
│   ├── .env                 # Environment variables
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite configuration
│
├── README.md                # This file
├── ARCHITECTURE_DIAGRAM.md  # System architecture
├── DATABASE_ARCHITECTURE.md # Database schema
├── BLOG_SYSTEM_COMPLETE.md  # Blog system docs
└── ADDING_API_KEYS_GUIDE.md # API key setup guide
```

---

## 📚 API Documentation

### Authentication Endpoints

```
POST   /auth/register        - Register new user
POST   /auth/login           - Login with email/password
POST   /auth/google          - Login with Google OAuth
POST   /auth/logout          - Logout user
GET    /me                   - Get current user
```

### Profile Endpoints

```
GET    /api/profile/                    - Get complete profile
GET    /api/profile/business            - Get business profile
PUT    /api/profile/business            - Update business profile
GET    /api/profile/business/setup-status - Check setup status
```

### Business Input Endpoints

```
POST   /api/business/upload-pdf         - Upload PDF
POST   /api/business/import-website     - Import from website
GET    /api/business/profile            - Get business profile
PUT    /api/business/profile            - Update profile
DELETE /api/business/profile/file       - Delete uploaded file
```

### Blog Endpoints

```
GET    /api/blogs/                      - List all blogs
POST   /api/blogs/generate              - Generate new blog
GET    /api/blogs/{id}                  - Get blog by ID
PUT    /api/blogs/{id}                  - Update blog
DELETE /api/blogs/{id}                  - Delete blog
POST   /api/blogs/{id}/publish          - Publish blog
```

### Content Creation Endpoints

```
POST   /content/generate                - Generate content
POST   /content/generate-image          - Generate image
```

### Business Analysis Endpoints

```
POST   /ai/business-analysis            - Analyze business
GET    /api/comprehensive-analysis/business-analysis - Get analysis
GET    /business/analysis/realtime      - Real-time intelligence
```

**Full API Documentation:** http://localhost:8000/docs

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** Import errors or module not found

**Solution:**
```bash
cd Backend
..\.venv\Scripts\pip.exe install -r requirements.txt
```

**Problem:** Database connection error

**Solution:** Check `DATABASE_URL` in `.env` file

**Problem:** Firebase authentication not working

**Solution:** 
1. Verify `firebase-adminsdk.json` exists in Backend folder
2. Check `FIREBASE_PROJECT_ID` in `.env`
3. Enable Google Sign-In in Firebase Console

### Frontend Won't Start

**Problem:** Module not found errors

**Solution:**
```bash
cd Frontend
npm install
```

**Problem:** Can't connect to backend

**Solution:** 
1. Verify backend is running on port 8000
2. Check `VITE_API_URL` in `Frontend/.env`

### 404 Errors on API Calls

**Problem:** Routes not found

**Solution:** Restart backend server
```bash
# Stop with Ctrl+C, then restart:
cd Backend
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

**Verify routes loaded:**
- Check logs for "✅ Profile router included in app"
- Check logs for "✅ Business Input router included in app"
- Visit http://localhost:8000/docs to see all endpoints

### Blog Generation Fails

**Problem:** "All API keys exhausted"

**Solution:** 
1. Check `GEMINI_API_KEY` in `.env`
2. Verify Tavily/Serper API keys are set
3. Wait for quota reset (midnight PT for Gemini)

**Problem:** Web search not working

**Solution:**
1. Verify `TAVILY_API_KEY` and `SERPER_API_KEY` in `.env`
2. Check package installed: `pip install tavily-python beautifulsoup4`

### Port Already in Use

**Problem:** Port 8000 or 8080 already in use

**Solution:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different ports:
# Backend:
uvicorn main:app --reload --port 8001

# Frontend: Edit vite.config.ts to change port
```

---

## 📞 Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review API documentation at http://localhost:8000/docs
3. Check logs for error messages
4. Verify all API keys are configured correctly

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI-powered business analysis and content generation
- **Tavily AI** - Web search and research
- **Serper API** - Google search integration
- **Firebase** - Authentication services
- **NeonDB** - Serverless PostgreSQL
- **Pinecone** - Vector database
- **HuggingFace** - AI model hosting

---

**Built with ❤️ by the Saadhyam AI Team**
