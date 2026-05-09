# 🚀 Saadhyam AI - Complete Business Automation Platform

**Saadhyam AI** is a comprehensive business automation platform that combines AI-powered content creation, social media management, business analysis, WhatsApp automation, and B2B networking tools in one unified solution.

---

## ✨ Core Features

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
git clone <repository-url>
cd Sadhyam
```

### 2. Backend Setup

```bash
cd Backend

# Create virtual environment
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

## 🚀 Running the Application

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
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

python -m uvicorn main:app --reload --port 8000
```

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
│   ├── tasks/               # Celery background tasks
│   ├── utils/               # Utility functions
│   ├── main.py              # Application entry point
│   └── requirements.txt     # Python dependencies
│
├── Frontend/
│   ├── src/
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
