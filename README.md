# 🚀 Saadhyam AI - Complete Business Intelligence Platform

> **AI-Powered Business Management, Content Creation & Automation Platform**

A comprehensive platform that helps businesses with intelligent content creation, business analysis, social media management, WhatsApp automation, task tracking, and B2B networking.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Business Analysis** - Comprehensive business insights using Gemini AI with Google Search grounding
- **Blog Generation** - SEO-optimized blog posts with web research (Tavily/Serper)
- **Content Creation** - AI-generated social media content for Instagram, Facebook, WhatsApp
- **Image Generation** - AI-powered images using FLUX/Stable Diffusion
- **Review Reply AI** - Automated professional review responses using TinyLlama
- **Personal Assistant** - AI-powered business assistant using Groq

### 📊 Business Management
- **Business Profile** - Comprehensive business information management
- **Analytics Dashboard** - Real-time business intelligence and metrics
- **Task Tracking System** - AI-suggested daily tasks with growth journey visualization
- **Competitor Analysis** - Track and analyze competitor strategies
- **Growth Metrics** - Track completion rates, streaks, and growth scores

### 📱 Social Media & Content
- **Instagram Analytics** - Complete analytics dashboard with AI-powered insights
  - Account metrics and performance tracking
  - Post, Reel, and Story analytics
  - AI recommendations and growth predictions
  - Trend detection and content suggestions
- **Instagram Posting** - Post scheduling and automated publishing
- **Content Calendar** - Schedule and manage social media posts
- **Engagement Tracking** - Monitor post performance and engagement

### 💬 WhatsApp Business Automation
- **WhatsApp Business Integration** - Official Meta WhatsApp Cloud API
- **Customer Chat Management** - CRM-style conversation dashboard
- **Broadcast Campaigns** - Send bulk messages to multiple customers
- **Smart Automations** - Auto-replies, follow-ups, and scheduled messages
- **AI-Powered Responses** - Gemini-powered intelligent reply generation
- **Analytics & Reporting** - Track delivery, read rates, and engagement
- **Template Messages** - Support for approved WhatsApp templates

### 🌐 Website & SEO
- **Website Generator** - AI-generated business websites with 6 templates
- **Blog Publishing** - Automatic blog publishing to customer websites
- **AEO/GEO Optimization** - Answer Engine & Generative Engine Optimization
- **SEO Tools** - Keyword research and optimization

### 🤝 B2B Business Network
- **Neural Network Visualization** - Interactive AI-style business discovery
- **City-Wide Search** - Find businesses across your entire city (50km radius)
- **Real Business Data** - OpenStreetMap integration via Overpass API
- **Category Explorer** - Browse businesses by industry categories
- **AI Loading Animation** - Futuristic network connection visualization
- **Business Details** - View services, location, and contact information

### 🔐 Authentication & Security
- **Dual Authentication** - Email/password and Google OAuth support
- **Firebase Integration** - Secure, scalable authentication system
- **Account Merging** - Seamless integration between auth methods
- **Business Profile Management** - Comprehensive user onboarding
- **Secure Logout** - Complete data cleanup on sign out

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
- **Cloud Storage:** Cloudinary
- **APIs:** Meta WhatsApp Cloud API, OpenStreetMap Overpass API

### Frontend
- **Framework:** React 19 + TanStack Start
- **Styling:** Tailwind CSS 4.2
- **UI Components:** Radix UI
- **State Management:** TanStack Query + React Context
- **Visualization:** Recharts (Growth Charts), React Flow (B2B Network)
- **Build Tool:** Vite 7

---

## 📦 Prerequisites

### Required Software
- **Python:** 3.11 or higher
- **Node.js:** 18 or higher
- **npm:** 9 or higher
- **Redis:** Latest version (for background tasks)
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
- **WhatsApp** (Meta Business Platform)
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
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux

# Edit .env file with your API keys (see Configuration section)
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../Frontend

# Install dependencies
npm install

# Copy environment template
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux

# Edit .env file with your configuration
```

### 4. Redis Setup

**Windows:**
```bash
# Download Redis for Windows from:
# https://github.com/microsoftarchive/redis/releases
# Or use Docker:
docker run -d -p 6379:6379 redis:alpine
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

---

## ⚙️ Configuration

### Backend Configuration

Edit `Backend/.env` with your API keys:

```env
# ============================================
# Database (REQUIRED)
# ============================================
DATABASE_URL=postgresql+asyncpg://user:password@host/database

# ============================================
# Firebase Authentication (REQUIRED)
# ============================================
GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json
FIREBASE_PROJECT_ID=your-project-id

# ============================================
# JWT Security (REQUIRED)
# ============================================
SECRET_KEY=your-super-secret-jwt-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ============================================
# AI Services (REQUIRED)
# ============================================
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
HUGGINGFACE_TOKEN=your_huggingface_token

# ============================================
# Web Search APIs (REQUIRED for Blog Generation)
# ============================================
TAVILY_API_KEY=your_tavily_api_key
SERPER_API_KEY=your_serper_api_key

# ============================================
# Vector Database (REQUIRED for Business Analysis)
# ============================================
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=saadhyam-aeo-geo

# ============================================
# Redis (REQUIRED for Background Tasks)
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# Optional Services
# ============================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret

WHATSAPP_APP_ID=your_whatsapp_app_id
WHATSAPP_APP_SECRET=your_whatsapp_app_secret
WHATSAPP_VERIFY_TOKEN=your_verify_token

# ============================================
# Server Configuration
# ============================================
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:5173"]
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

### Option 1: Quick Start (All Services at Once) ⚡

**Windows:**
```bash
# Double-click start_all.bat or run:
start_all.bat
```

**macOS/Linux/Git Bash:**
```bash
# Make script executable (first time only):
chmod +x start_all.sh

# Run script:
./start_all.sh
```

This will automatically:
- ✅ Start Backend server on `http://localhost:8000`
- ✅ Start Frontend server on `http://localhost:5173`
- ✅ Open application in browser
- ✅ Display server logs

---

### Option 2: Manual Start (Individual Services)

#### 1. Start Redis (Required for background tasks)
```bash
# Windows (if installed):
redis-server

# macOS:
brew services start redis

# Docker:
docker run -d -p 6379:6379 redis:alpine
```

#### 2. Start Backend
```bash
cd Backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

python main.py
# Or with uvicorn:
# python -m uvicorn main:app --reload --port 8000
```

**Expected output:**
```
✅ Firebase Admin SDK: INITIALIZED
✅ Task Tracking router included in app
✅ Instagram Analytics router included in app
✅ Application startup complete
INFO: Uvicorn running on http://0.0.0.0:8000
```

#### 3. Start Frontend
```bash
cd Frontend
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

#### 4. Start Celery Worker (Optional - for background tasks)
```bash
cd Backend
venv\Scripts\activate

# Windows:
celery -A celery_worker worker --loglevel=info --pool=solo

# macOS/Linux:
celery -A celery_worker worker --loglevel=info
```

---

### Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

---

## 📁 Project Structure

```
Saadhyam/
├── Backend/
│   ├── ai_models/              # AI model implementations
│   │   ├── content_creator/    # Content generation
│   │   ├── review_reply_ai/    # Review reply AI (TinyLlama)
│   │   └── website_ai/         # Website generation
│   ├── config/                 # Configuration files
│   │   └── database.py         # Database connection
│   ├── migrations/             # Database migrations
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py
│   │   ├── task_tracking.py
│   │   ├── instagram_analytics.py
│   │   └── ...
│   ├── routes/                 # API endpoints
│   │   ├── auth.py
│   │   ├── task_tracking.py
│   │   ├── instagram_analytics.py
│   │   ├── whatsapp_messages.py
│   │   ├── b2b_network.py
│   │   └── ...
│   ├── services/               # Business logic
│   │   ├── task_tracking_service.py
│   │   ├── task_generation_service.py
│   │   ├── instagram_analytics_service.py
│   │   ├── instagram_ai_service.py
│   │   ├── gemini_business_analysis_service.py
│   │   └── ...
│   ├── utils/                  # Utility functions
│   ├── .env                    # Environment variables
│   ├── main.py                 # Application entry point
│   └── requirements.txt        # Python dependencies
│
├── Frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   │   ├── DailyTasksWidget.tsx
│   │   │   │   ├── GrowthChart.tsx
│   │   │   │   └── ...
│   │   │   ├── instagram/      # Instagram components
│   │   │   │   └── InstagramAnalyticsDashboard.tsx
│   │   │   └── b2b-network/    # B2B network components
│   │   ├── routes/             # Page components
│   │   │   ├── dashboard.index.tsx
│   │   │   ├── dashboard.daily-ask.tsx
│   │   │   ├── dashboard.instagram.tsx
│   │   │   ├── dashboard.whatsapp.tsx
│   │   │   └── ...
│   │   ├── lib/                # API client and utilities
│   │   ├── hooks/              # Custom React hooks
│   │   └── styles.css          # Global styles
│   ├── package.json            # Node.js dependencies
│   └── vite.config.ts          # Vite configuration
│
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── REDIS_SETUP.md              # Redis setup guide
├── start_all.bat               # Windows startup script
├── start_all.sh                # Unix startup script
├── stop_all.bat                # Windows stop script
└── stop_all.sh                 # Unix stop script
```

---

## 📚 API Documentation

### Authentication Endpoints

```
POST   /auth/register           - Register new user
POST   /auth/login              - Login with email/password
POST   /auth/google             - Login with Google OAuth
POST   /auth/logout             - Logout user
GET    /me                      - Get current user
```

### Task Tracking Endpoints

```
GET    /api/tasks/today         - Get today's tasks
GET    /api/tasks/history       - Get task history
POST   /api/tasks               - Create new task
PUT    /api/tasks/{id}/complete - Mark task as complete
DELETE /api/tasks/{id}          - Delete task
GET    /api/tasks/growth/chart-data - Get growth chart data
POST   /api/tasks/generate-daily - Generate AI-powered daily tasks
```

### Instagram Analytics Endpoints

```
GET    /api/instagram-analytics/account/{account_id}        - Get account analytics
GET    /api/instagram-analytics/posts/{account_id}          - Get post analytics
GET    /api/instagram-analytics/ai-insights/{account_id}    - Get AI insights
POST   /api/instagram-analytics/sync/{account_id}           - Sync Instagram data
```

### WhatsApp Endpoints

```
GET    /api/whatsapp/chats      - Get all chats
POST   /api/whatsapp/send-message - Send message
POST   /api/whatsapp/broadcast  - Send broadcast
GET    /api/whatsapp/analytics  - Get analytics
```

### B2B Network Endpoints

```
GET    /api/b2b-network/nearby/me - Get nearby businesses (city-wide)
GET    /api/b2b-network/nearby    - Get businesses by coordinates
GET    /api/b2b-network/categories - Get business categories
```

### Business Analysis Endpoints

```
POST   /ai/business-analysis    - Analyze business
GET    /api/comprehensive-analysis/business-analysis - Get analysis
GET    /business/analysis/realtime - Real-time intelligence
```

**Full API Documentation:** http://localhost:8000/docs

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** Import errors or module not found

**Solution:**
```bash
cd Backend
venv\Scripts\pip.exe install -r requirements.txt
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

### Task Tracking Issues

**Problem:** Tasks not loading (405 error)

**Solution:** Restart backend server to load task tracking router

**Problem:** Growth chart not updating

**Solution:** 
1. Complete at least one task to generate first metric
2. Check browser console for errors
3. Verify token: `localStorage.getItem("saadhyam_token")`

### Instagram Analytics Issues

**Problem:** Analytics not loading

**Solution:**
1. Verify Instagram account is connected in Settings
2. Click "Sync Data" to fetch latest analytics
3. Check backend logs for API errors

### Port Already in Use

**Problem:** Port 8000 or 5173 already in use

**Solution:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill
```

---

## 🔒 Security Checklist

### Before Deployment
- [ ] Change default SECRET_KEY
- [ ] Use production DATABASE_URL
- [ ] Set DEBUG=False
- [ ] Configure CORS_ORIGINS properly
- [ ] Secure Firebase service account key
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper backup strategy
- [ ] Configure rate limiting
- [ ] Enable security headers

---

## 📈 Performance Optimization

### Scaling
- **Multiple Celery Workers**: `celery -A celery_worker worker --concurrency=4`
- **Database Read Replicas**: Configure read/write splitting
- **Redis Clustering**: For high availability
- **CDN**: For static assets

### Monitoring
- **Application**: FastAPI metrics endpoint
- **Database**: PostgreSQL performance stats
- **Cache**: Redis monitoring
- **Tasks**: Celery Flower dashboard

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

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
- **OpenStreetMap** - Business location data

---

**Built with ❤️ by the Saadhyam AI Team @Mentneo**
