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
**Saadhyam AI** is a comprehensive business automation platform that combines AI-powered content creation, social media management, business analysis, WhatsApp automation, and B2B networking tools in one unified solution.

---

## ✨ Core Features

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

### 🤖 AI-Powered Content Creation
- **Smart Content Generator**: Create engaging posts with AI-generated captions and images
- **Multi-Platform Publishing**: Direct posting to Instagram with automated scheduling
- **Image Generation**: FLUX-powered AI image generation with custom prompts
- **Content Optimization**: AI-driven content suggestions based on business type
- **Review Reply AI**: Generate professional responses to customer reviews

### 📊 Business Intelligence
- **Business Analysis AI**: Comprehensive business insights powered by Google Gemini API
- **Real-time Market Data**: Live competitor analysis with Google Search grounding
- **Website AI Generator**: Create professional websites with AI assistance
- **Performance Analytics**: Detailed metrics and growth tracking
- **Competitor Tracking**: Monitor and analyze competitor strategies

### 💬 WhatsApp Sales & Automation
- **WhatsApp Business Integration**: Official Meta WhatsApp Cloud API
- **Customer Chat Management**: CRM-style conversation dashboard
- **Broadcast Campaigns**: Send bulk messages to multiple customers
- **Smart Automations**: Auto-replies, follow-ups, and scheduled messages
- **AI-Powered Responses**: Gemini-powered intelligent reply generation
- **Analytics & Reporting**: Track delivery, read rates, and engagement
- **Template Messages**: Support for approved WhatsApp templates

### 🌐 B2B Business Network
- **Neural Network Visualization**: Interactive AI-style business discovery
- **City-Wide Search**: Find businesses across your entire city (50km radius)
- **Real Business Data**: OpenStreetMap integration via Overpass API
- **Category Explorer**: Browse businesses by industry categories
- **AI Loading Animation**: Futuristic network connection visualization
- **Business Details**: View services, location, and contact information

### 🔐 Authentication & Security
- **Dual Authentication**: Email/password and Google OAuth support
- **Firebase Integration**: Secure, scalable authentication system
- **Account Merging**: Seamless integration between auth methods
- **Business Profile Management**: Comprehensive user onboarding
- **Secure Logout**: Complete data cleanup on sign out

### 📱 Social Media Management
- **Instagram Integration**: Direct posting with image and caption generation
- **Content Calendar**: Schedule and manage social media posts
- **Engagement Tracking**: Monitor post performance and engagement
- **Multi-Account Support**: Manage multiple social media accounts

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL (Neon DB)
- **Authentication**: Firebase Admin SDK
- **AI/ML**: 
  - Google Gemini API (Business Analysis)
  - TinyLlama (Review Replies)
  - GROQ API (Image Generation)
  - HuggingFace Transformers
- **Task Queue**: Celery with Redis
- **Cloud Storage**: Cloudinary
- **APIs**: Meta WhatsApp Cloud API, OpenStreetMap Overpass API

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library with Framer Motion
- **Visualization**: React Flow (B2B Network)
- **State Management**: React Context + Hooks
- **Build Tool**: Vite

### Infrastructure
- **Database**: Neon PostgreSQL
- **Cache**: Redis
- **File Storage**: Cloudinary
- **Authentication**: Firebase
- **Deployment**: Docker-ready

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL** (or Neon DB account)
- **Redis server**
- **Firebase project**
- **Git**

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 5GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

---

## 📦 Installation

### 1. Clone Repository
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
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration
```

### 4. Firebase Setup (Required)

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication > Google Sign-in
3. Download service account key (Project Settings > Service Accounts)
4. Save as `Backend/firebase-adminsdk.json`
5. Copy Firebase config to `Frontend/.env`

### 5. Database Setup

Database will auto-initialize on first run with automatic migrations.

---

## 🏃 Running the Application

### Start Backend Server

### Start Redis
```bash
# Windows (if installed):
redis-server

# macOS:
brew services start redis

# Docker:
docker run -d -p 6379:6379 redis:alpine
```

### Start Backend
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

### Start Celery Worker (Optional - for background tasks)
```bash
cd Backend
venv\Scripts\activate

# Windows:
celery -A celery_worker worker --loglevel=info --pool=solo

# macOS/Linux:
celery -A celery_worker worker --loglevel=info
```

### Start Frontend
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
### Access Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host/database

# Firebase (REQUIRED)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json
FIREBASE_PROJECT_ID=your-firebase-project-id

# Redis
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-super-secret-jwt-key
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI Services
GEMINI_API_KEY=your-google-ai-studio-api-key
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_TOKEN=your-huggingface-token

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# WhatsApp (Meta Business Platform)
WHATSAPP_APP_ID=your-whatsapp-app-id
WHATSAPP_APP_SECRET=your-whatsapp-app-secret
WHATSAPP_VERIFY_TOKEN=your-verify-token

# Instagram
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

# Server
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:8080"]
```

### Frontend (.env)
```env
# Backend API
VITE_API_URL=http://localhost:8000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

---

## 📁 Project Structure

```
Sadhyam/
├── Backend/
│   ├── ai_models/           # AI model implementations
│   ├── config/              # Database and app configuration
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
│   ├── tasks/               # Celery background tasks
│   ├── utils/               # Utility functions
│   ├── main.py              # Application entry point
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
│   │   ├── components/      # Reusable UI components
│   │   ├── routes/          # Page components
│   │   ├── lib/             # API client and utilities
│   │   ├── hooks/           # Custom React hooks
│   │   └── styles.css       # Global styles
│   ├── package.json         # Node.js dependencies
│   └── vite.config.ts       # Vite configuration
│
└── README.md                # This file
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
## 🌐 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:8080 | React application |
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger documentation |
| Redis | localhost:6379 | Message broker |

---

## 📱 Key API Endpoints

### Authentication
- `POST /auth/register` - Email registration
- `POST /auth/login` - Email login
- `POST /auth/google` - Google OAuth
- `POST /auth/logout` - User logout
- `GET /me` - Get current user

### Content Creation
- `POST /content/generate` - Generate AI content
- `POST /instagram/schedule-post` - Schedule Instagram post
- `GET /instagram/posts` - Get scheduled posts

### Business Analysis
- `POST /ai/business-analysis` - Analyze business
- `GET /api/business/latest` - Get latest analysis

### WhatsApp
- `GET /api/whatsapp/chats` - Get all chats
- `POST /api/whatsapp/send-message` - Send message
- `POST /api/whatsapp/broadcast` - Send broadcast
- `GET /api/whatsapp/analytics` - Get analytics

### B2B Network
- `GET /api/b2b-network/nearby/me` - Get nearby businesses (city-wide)
- `GET /api/b2b-network/nearby` - Get businesses by coordinates
- `GET /api/b2b-network/categories` - Get business categories

### Profile
- `GET /api/profile/business` - Get business profile
- `PUT /api/profile/business` - Update business profile

---

## 🤖 AI Models & Services

### Google Gemini API (Cloud-Based)
- **Business Analysis**: Gemini 2.5 Flash with Google Search grounding
- **Real-time Insights**: Live market data and competitor analysis
- **Fast Response**: 2-5 seconds per request
- **Get API Key**: https://aistudio.google.com/app/apikey

### TinyLlama (Local - CPU Optimized)
- **Review Reply AI**: Professional customer review responses
- **Load Time**: 30-60 seconds on first start
- **Memory Usage**: ~2-4GB RAM

### GROQ API (Cloud-Based)
- **Image Generation**: FLUX-powered AI image creation
- **Fast Generation**: 5-10 seconds per image

### OpenStreetMap Overpass API
- **B2B Network Data**: Real business information
- **City-Wide Coverage**: 50km radius search
- **Free & Open**: No API key required

---

## 🐛 Troubleshooting

### Common Issues

#### Firebase Authentication Errors
```bash
# Check firebase-adminsdk.json exists
# Verify FIREBASE_PROJECT_ID matches your project
```

#### AI Model Loading Issues
```bash
# Ensure sufficient RAM (8GB+)
# Check internet connection for model downloads
# Clear cache: rm -rf ~/.cache/huggingface/
```

#### Celery Worker Issues
```bash
# Ensure Redis is running
# Check REDIS_URL in .env
# Use --pool=solo on Windows
```

#### Database Connection Issues
```bash
# Check DATABASE_URL format
# Ensure PostgreSQL/Neon DB is accessible
# Run migrations: python main.py
```

#### Port Conflicts
```bash
# Kill existing processes
# Windows: netstat -ano | findstr :8000
# macOS/Linux: lsof -ti:8000 | xargs kill
```

#### B2B Network Not Loading
```bash
# Set business location in profile
# Check Overpass API is accessible
# Verify 50km radius search is working
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

## 🚀 Deployment

### Docker Deployment (Recommended)
```bash
# Build and run
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Production Deployment

#### Backend
```bash
# Set production environment
export DEBUG=False
export ENVIRONMENT=production

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Start Celery worker
celery -A celery_worker worker --loglevel=info
```

#### Frontend
```bash
# Build for production
npm run build

# Serve with nginx or deploy to CDN
# Built files in dist/ directory
```

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

This project is licensed under the MIT License.

---

## 🆘 Support

For support, email support@saadhyam.ai

---

**Built with ❤️ by the Saadhyam AI Team @Mentneo**
