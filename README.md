# Sadhyam - AI-Powered Business Management Platform

<div align="center">

**A comprehensive business management platform with AI-powered features for social media management, business analysis, B2B networking, and automated marketing.**

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
- **Dashboard**: Centralized business management interface with real-time analytics
- **User Authentication**: Secure JWT-based authentication with Firebase integration
- **Profile Management**: Comprehensive user and business profile management

### 📱 Social Media Management
- **Instagram Analytics**: Track posts, stories, reels, and engagement metrics
- **Instagram OAuth**: Seamless Instagram Business Account integration
- **Instagram Post Scheduling**: Schedule and auto-publish Instagram content
- **WhatsApp Integration**: Automated messaging, campaigns, and customer engagement
- **WhatsApp Webhook**: Real-time message handling and automation

### 🤖 AI-Powered Features
- **Business Analysis**: AI-powered insights using Google Gemini with search grounding
- **Review Reply AI**: Automated review response generation
- **Content Creator**: AI-powered content and caption generation
- **Image Generator**: FLUX-based AI image generation
- **Personal Assistant**: DeepSeek/Groq-powered business assistant
- **Website AI**: Automated website generation and optimization
- **Voice Agent**: AI-powered voice interaction system

### 🌐 B2B & Networking
- **B2B Network**: Discover and connect with nearby businesses
- **B2B Chat**: Real-time messaging with business connections
- **Partnership Agent**: AI-powered partnership recommendations
- **Competitor Analysis**: Track and analyze competitor activities

### 📊 Marketing & SEO
- **SEO & Google Maps**: Local business optimization
- **AEO/GEO System**: Answer Engine Optimization and Generative Engine Optimization
- **Auto Blogger**: Automated blog content generation
- **Meta Ads Integration**: Facebook and Instagram advertising management

### 📈 Analytics & Tracking
- **Dashboard Analytics**: Real-time business performance metrics
- **Task Tracking**: Project and task management system
- **Customer Retention**: AI-powered customer retention strategies

### 🔄 Real-time Features
- **Socket.IO Integration**: Real-time messaging and notifications
- **Live Updates**: Real-time data synchronization
- **Typing Indicators**: Live typing status in chats
- **Online Presence**: User online/offline status tracking

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.104.1 | High-performance web framework |
| **Python** | 3.8+ | Core programming language |
| **PostgreSQL** | Latest | Primary database (via Neon) |
| **SQLAlchemy** | 2.0.23 | ORM for database operations |
| **Alembic** | 1.13.2 | Database migrations |
| **Redis** | 5.0.1 | Caching and message broker |
| **Celery** | 5.3.4 | Distributed task queue |
| **Socket.IO** | 5.11.0 | Real-time communication |
| **Uvicorn** | 0.24.0 | ASGI server |

### AI/ML Stack
| Technology | Purpose |
|------------|---------|
| **Google Gemini** | Business analysis with search grounding |
| **Groq** | Fast LLM inference |
| **DeepSeek** | Personal assistant AI |
| **Transformers** | HuggingFace model loading |
| **PyTorch** | Deep learning framework |
| **FLUX** | AI image generation |
| **Mistral** | Content generation |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | 5.8.3 | Type-safe JavaScript |
| **TanStack Router** | 1.168.0 | Client-side routing |
| **TanStack Query** | 5.83.0 | Data fetching and caching |
| **Tailwind CSS** | 4.2.1 | Utility-first CSS framework |
| **Vite** | 7.3.1 | Build tool and dev server |
| **Radix UI** | Latest | Accessible UI components |
| **Framer Motion** | 12.38.0 | Animation library |
| **Recharts** | 2.15.4 | Data visualization |
| **Leaflet** | 1.9.4 | Interactive maps |
| **Socket.IO Client** | 4.8.3 | Real-time client |

### External Services
- **Firebase**: Google OAuth authentication
- **Cloudinary**: Image and media storage
- **Meta Graph API**: Instagram and WhatsApp integration
- **Tavily**: Web search API
- **SerpAPI**: Google search results
- **Apify**: Instagram data scraping
- **Resend**: Email delivery
- **Pinecone**: Vector database for AEO/GEO

---

## 📁 Project Structure

```
Sadhyam/
├── Backend/                      # FastAPI backend application
│   ├── ai_models/               # AI model implementations
│   │   ├── content_creator/     # Content and image generation
│   │   ├── review_reply_ai/     # Review response AI
│   │   └── website_ai/          # Website generation AI
│   ├── config/                  # Configuration files
│   │   ├── database.py          # Database configuration
│   │   └── settings.py          # Application settings
│   ├── middleware/              # Custom middleware
│   │   └── security.py          # Security middleware
│   ├── migrations/              # Database migrations
│   ├── models/                  # SQLAlchemy models
│   │   ├── user.py             # User model
│   │   ├── chat.py             # Chat models
│   │   └── ...                 # Other models
│   ├── routes/                  # API route handlers
│   │   ├── auth.py             # Authentication routes
│   │   ├── instagram_analytics.py
│   │   ├── whatsapp_webhook.py
│   │   ├── b2b_network.py
│   │   ├── b2b_chat.py
│   │   └── ...                 # Other routes
│   ├── schemas/                 # Pydantic schemas
│   ├── services/                # Business logic services
│   │   ├── gemini_business_analysis_service.py
│   │   ├── instagram_ai_service.py
│   │   ├── meta_oauth_service.py
│   │   └── ...                 # Other services
│   ├── tasks/                   # Celery tasks
│   ├── utils/                   # Utility functions
│   ├── templates/               # Email/HTML templates
│   ├── main.py                  # Application entry point
│   ├── celery_worker.py         # Celery worker configuration
│   ├── requirements.txt         # Python dependencies
│   └── .env.example            # Environment variables template
│
├── Frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── b2b-network/    # B2B networking components
│   │   │   ├── instagram/      # Instagram components
│   │   │   └── ...            # Other components
│   │   ├── routes/             # TanStack Router routes
│   │   │   ├── dashboard.tsx   # Dashboard layout
│   │   │   ├── dashboard.instagram.tsx
│   │   │   ├── dashboard.b2b-chat.tsx
│   │   │   └── ...            # Other routes
│   │   ├── utils/              # Utility functions
│   │   ├── styles.css          # Global styles
│   │   └── main.tsx           # Application entry point
│   ├── package.json            # Node dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   ├── vite.config.ts          # Vite configuration
│   └── tailwind.config.js      # Tailwind configuration
│
├── start_all.bat               # Start all services (Windows)
├── stop_all.bat                # Stop all services (Windows)
├── README.md                   # This file
└── SECURITY_RECOMMENDATIONS.md # Security guidelines
```

---

## 📋 Prerequisites

Before installing Sadhyam, ensure you have the following installed:

### Required Software
- **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16 or higher** - [Download Node.js](https://nodejs.org/)
- **PostgreSQL** - [Download PostgreSQL](https://www.postgresql.org/download/) or use [Neon](https://neon.tech/)
- **Redis** - [Download Redis](https://redis.io/download) or use [Redis Cloud](https://redis.com/try-free/)
- **Git** - [Download Git](https://git-scm.com/downloads)

### Optional Software
- **Docker** - For containerized deployment
- **Postman** - For API testing

### System Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: Minimum 8GB (16GB recommended for AI features)
- **Storage**: 10GB free space
- **GPU**: Optional (NVIDIA GPU with CUDA for faster AI inference)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sadhyam.git
cd sadhyam
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd Backend
python -m venv venv
```

#### Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Install Additional Dependencies (Optional)

For voice agent features:
```bash
pip install -r requirements_voice.txt
```

### 3. Frontend Setup

```bash
cd Frontend
npm install
```

Or using Yarn:
```bash
yarn install
```

### 4. Database Setup

#### Option A: Using Neon (Recommended)

1. Create a free account at [Neon](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in `Backend/.env`

#### Option B: Local PostgreSQL

1. Install PostgreSQL
2. Create a database:
```sql
CREATE DATABASE saadhyam;
```
3. Update `DATABASE_URL` in `Backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://username:password@localhost/saadhyam
```

### 5. Redis Setup

#### Option A: Local Redis

**Windows:**
- Download Redis from [Redis Windows](https://github.com/microsoftarchive/redis/releases)
- Install and start Redis service

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

#### Option B: Redis Cloud

1. Create account at [Redis Cloud](https://redis.com/try-free/)
2. Create a database
3. Update `REDIS_URL` in `Backend/.env`

---

## ⚙️ Configuration

### Backend Configuration

1. Copy the example environment file:
```bash
cd Backend
copy .env.example .env  # Windows
# or
cp .env.example .env    # macOS/Linux
```

2. Edit `Backend/.env` with your configuration:

```env
# ============================================
# Database Configuration
# ============================================
DATABASE_URL=postgresql+asyncpg://user:password@host/database

# ============================================
# Application Settings
# ============================================
DEBUG=true
ENVIRONMENT=development
SECRET_KEY=your-super-secret-key-change-in-production
BACKEND_URL=http://localhost:8000

# ============================================
# Redis Configuration
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# AI API Keys
# ============================================
GEMINI_API_KEY=your_google_ai_studio_api_key
GROQ_API_KEY=your_groq_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
HUGGINGFACE_TOKEN=your_huggingface_token

# ============================================
# Social Media Integration
# ============================================
# Instagram
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token

# WhatsApp (Meta Cloud API)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
WHATSAPP_PHONE_ID=your_whatsapp_phone_id
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

# ============================================
# Cloud Services
# ============================================
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ============================================
# Firebase (Google OAuth)
# ============================================
GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json
FIREBASE_PROJECT_ID=your_firebase_project_id

# ============================================
# Search & Web APIs
# ============================================
TAVILY_API_KEY=your_tavily_api_key
SERPER_API_KEY=your_serper_api_key
SERPAPI_KEY=your_serpapi_key
BRAVE_SEARCH_API_KEY=your_brave_search_api_key

# ============================================
# Other Services
# ============================================
APIFY_API_TOKEN=your_apify_token
RESEND_API_KEY=your_resend_api_key
RAPIDAPI_KEY=your_rapidapi_key
PINECONE_API_KEY=your_pinecone_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Frontend Configuration

1. Copy the example environment file:
```bash
cd Frontend
copy .env.example .env  # Windows
# or
cp .env.example .env    # macOS/Linux
```

2. Edit `Frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

### Firebase Setup (Optional - for Google OAuth)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication → Google Sign-In
4. Download service account key
5. Save as `Backend/firebase-adminsdk.json`

---

## 🏃 Running the Application

### Quick Start (Windows)

The easiest way to start all services:

```bash
start_all.bat
```

This will start:
1. **Backend Server** (Port 8000)
2. **Celery Worker** (Background tasks)
3. **Celery Beat** (Task scheduler)
4. **Content Creator AI** (Port 8001)
5. **Frontend Server** (Port 8080)

### Manual Start

#### 1. Start Redis

```bash
redis-server
```

#### 2. Start Backend

```bash
cd Backend
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

python -m uvicorn main:app --reload --port 8000
```

#### 3. Start Celery Worker

```bash
cd Backend
venv\Scripts\activate

# Windows
python -m celery -A celery_worker worker --loglevel=info --pool=solo

# macOS/Linux
python -m celery -A celery_worker worker --loglevel=info
```

#### 4. Start Celery Beat (Task Scheduler)

```bash
cd Backend
venv\Scripts\activate
python -m celery -A celery_worker beat --loglevel=info
```

#### 5. Start Content Creator AI (Optional)

```bash
cd Backend/ai_models/content_creator
python -m uvicorn app.main:app --reload --port 8001
```

#### 6. Start Frontend

```bash
cd Frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Content Creator**: http://localhost:8001

### Stop All Services

**Windows:**
```bash
stop_all.bat
```

**Manual:**
- Close all terminal windows
- Or press `Ctrl+C` in each terminal

---

## 📚 API Documentation

### Interactive API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh access token

#### Instagram
- `GET /api/instagram/analytics` - Get Instagram analytics
- `POST /api/instagram/schedule-post` - Schedule Instagram post
- `GET /api/instagram/posts` - Get scheduled posts

#### WhatsApp
- `POST /api/whatsapp/send-message` - Send WhatsApp message
- `POST /api/whatsapp/webhook` - WhatsApp webhook endpoint
- `GET /api/whatsapp/campaigns` - Get WhatsApp campaigns

#### B2B Network
- `GET /api/b2b-network/nearby/me` - Get nearby businesses
- `POST /api/b2b-chat/connections/request` - Send connection request
- `GET /api/b2b-chat/rooms` - Get chat rooms

#### Business Analysis
- `POST /api/business-analysis/analyze` - Analyze business
- `GET /api/business-analysis/history` - Get analysis history

---

## 💻 Development

### Running Tests

```bash
cd Backend
pytest
```

### Code Formatting

**Backend:**
```bash
cd Backend
black .
isort .
```

**Frontend:**
```bash
cd Frontend
npm run format
npm run lint
```

### Database Migrations

Create a new migration:
```bash
cd Backend
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

### Adding New Dependencies

**Backend:**
```bash
cd Backend
pip install package_name
pip freeze > requirements.txt
```

**Frontend:**
```bash
cd Frontend
npm install package_name
```

---

## 🔒 Security

### Important Security Considerations

1. **Never commit `.env` files** to version control
2. **Change default SECRET_KEY** in production
3. **Use HTTPS** in production
4. **Enable rate limiting** for API endpoints
5. **Regularly update dependencies**
6. **Use strong passwords** for database and Redis
7. **Implement proper CORS** configuration
8. **Enable audit logging** for sensitive operations

### Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting middleware
- CORS protection
- Request size limits
- Security headers
- SQL injection protection (via SQLAlchemy)
- XSS protection

For detailed security recommendations, see [SECURITY_RECOMMENDATIONS.md](SECURITY_RECOMMENDATIONS.md)

---

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start

**Issue**: `ModuleNotFoundError`
```bash
# Solution: Ensure virtual environment is activated and dependencies installed
cd Backend
venv\Scripts\activate
pip install -r requirements.txt
```

**Issue**: Database connection error
```bash
# Solution: Check DATABASE_URL in .env and ensure PostgreSQL is running
# Test connection:
psql -h hostname -U username -d database_name
```

#### Frontend won't start

**Issue**: `Cannot find module`
```bash
# Solution: Delete node_modules and reinstall
cd Frontend
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Port already in use
```bash
# Solution: Kill process on port 8080
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8080 | xargs kill -9
```

#### Celery worker issues

**Issue**: Celery won't start on Windows
```bash
# Solution: Use --pool=solo flag
python -m celery -A celery_worker worker --loglevel=info --pool=solo
```

#### Redis connection error

**Issue**: `Error connecting to Redis`
```bash
# Solution: Ensure Redis is running
# Windows: Check Redis service in Services
# macOS: brew services start redis
# Linux: sudo systemctl start redis
```

### Getting Help

If you encounter issues:

1. Check the logs in `Backend/logs/`
2. Review the [API documentation](http://localhost:8000/docs)
3. Check environment variables in `.env`
4. Ensure all services are running
5. Verify database and Redis connections

---

## 📄 License

This project is proprietary software. All rights reserved.

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

## 🙏 Acknowledgments

- **FastAPI** - Modern web framework
- **React** - UI library
- **Google Gemini** - AI-powered analysis
- **Meta** - Instagram and WhatsApp APIs
- **HuggingFace** - AI model hosting
- **Neon** - Serverless PostgreSQL

---

<div align="center">

**Built with ❤️ by the Sadhyam Team**

</div>
