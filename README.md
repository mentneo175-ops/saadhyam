# 🚀 Saadhyam AI - Complete Business Automation Platform

**Saadhyam AI** is a comprehensive business automation platform that combines AI-powered content creation, social media management, business analysis, and customer engagement tools in one unified solution.

## ✨ Features

### 🤖 AI-Powered Content Creation
- **Smart Content Generator**: Create engaging posts with AI-generated captions and images
- **Multi-Platform Publishing**: Direct posting to Instagram with automated scheduling
- **Image Generation**: FLUX-powered AI image generation with custom prompts
- **Content Optimization**: AI-driven content suggestions based on business type

### 📊 Business Intelligence
- **Business Analysis AI**: Comprehensive business insights and recommendations
- **Website AI Generator**: Create professional websites with AI assistance
- **Competitor Analysis**: Track and analyze competitor strategies
- **Performance Analytics**: Detailed metrics and growth tracking

### 🔐 Authentication & Security
- **Dual Authentication**: Email/password and Google OAuth support
- **Firebase Integration**: Secure, scalable authentication system
- **Account Merging**: Seamless integration between auth methods
- **Business Profile Management**: Comprehensive user onboarding

### 🌐 Social Media Management
- **Instagram Integration**: Direct posting with image and caption generation
- **Content Calendar**: Schedule and manage social media posts
- **Engagement Tracking**: Monitor post performance and engagement
- **Multi-Account Support**: Manage multiple social media accounts

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Neon DB)
- **Authentication**: Firebase Admin SDK
- **AI/ML**: Transformers, GROQ API, HuggingFace
- **Image Processing**: Pillow, OpenCV
- **Task Queue**: Celery with Redis
- **Cloud Storage**: Cloudinary

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **State Management**: React Context + Hooks
- **Build Tool**: Vite

### Infrastructure
- **Database**: Neon PostgreSQL
- **Cache**: Redis
- **File Storage**: Cloudinary
- **Authentication**: Firebase
- **Deployment**: Docker-ready

## 🚀 Complete Setup & Running Instructions

### Prerequisites
- **Python 3.10+** (Required for AI models)
- **Node.js 18+** (For frontend)
- **PostgreSQL** (or Neon DB account)
- **Redis server** (For Celery task queue)
- **Firebase project** (For authentication)
- **Git** (For cloning repository)

### 🔧 System Requirements
- **RAM**: Minimum 8GB (16GB recommended for AI models)
- **Storage**: 5GB free space (for AI model downloads)
- **OS**: Windows 10+, macOS 10.15+, or Linux

---

## 📦 Installation Guide

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd Sadhyam
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment
```bash
cd Backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

#### 2.2 Install All Dependencies
```bash
pip install -r requirements.txt
```

#### 2.3 Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your configuration
# Use any text editor (notepad, vim, code, etc.)
```

**Required Environment Variables:**
```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@host/database

# Firebase Authentication (REQUIRED)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json
FIREBASE_PROJECT_ID=your-firebase-project-id

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI Services
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_TOKEN=your-huggingface-token

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Instagram Integration
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:8000/auth/instagram/callback

# Server Configuration
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

#### 2.4 Firebase Setup (CRITICAL)
1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project or select existing
   - Enable Authentication > Google Sign-in

2. **Download Service Account Key**:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file
   - Rename to `firebase-adminsdk.json`
   - Place in `Backend/` directory

3. **Configure Frontend Firebase**:
   - Go to Project Settings > General
   - Copy Firebase config object
   - Update `Frontend/.env` with these values

#### 2.5 Database Setup
```bash
# Database will auto-initialize on first run
# Migrations will run automatically
python main.py
```

### Step 3: Frontend Setup

#### 3.1 Navigate to Frontend
```bash
cd ../Frontend
```

#### 3.2 Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3.3 Environment Configuration
```bash
# Copy example environment file
cp .env.example .env
```

**Frontend Environment Variables:**
```env
# Backend API URL
VITE_API_URL=http://localhost:8001

# Environment
VITE_ENV=development

# Firebase Configuration (Get from Firebase Console)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

---

## 🚀 Running the Application

### Option 1: Manual Start (Recommended for Development)

#### Terminal 1: Redis Server
```bash
# Windows (if Redis installed):
redis-server

# macOS (with Homebrew):
brew services start redis

# Linux:
sudo systemctl start redis

# Docker alternative:
docker run -d -p 6379:6379 redis:alpine
```

#### Terminal 2: Main Backend Server
```bash
cd Backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

python -m uvicorn main:app --reload --port 8001
```

#### Terminal 3: Business Analysis AI Model Server
```bash
cd Backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

python start_business_server.py
```

#### Terminal 4: Celery Worker (Background Tasks)
```bash
cd Backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Windows:
celery -A celery_worker.celery worker --loglevel=info --pool=solo

# macOS/Linux:
celery -A celery_worker.celery worker --loglevel=info
```

#### Terminal 5: Celery Flower (Task Monitoring - Optional)
```bash
cd Backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

celery -A celery_worker.celery flower --port=5555
```

#### Terminal 6: Frontend Development Server
```bash
cd Frontend
npm run dev
# or
yarn dev
```

### Option 2: Batch Scripts (Windows)

#### Start All Backend Services:
```bash
cd Backend
# Run all backend services
start_backend.bat
```

#### Start Individual Services:
```bash
# Main backend only
run_main_backend.bat

# Business model server only
run_business_model.bat

# Celery worker only
start_celery_worker.bat

# All TinyLlama servers
run_tinyllama_servers.bat
```

---

## 🤖 AI Models & Services

### TinyLlama Models (CPU Optimized)
- **Review Reply AI**: Loaded in main backend (port 8001)
- **Business Analysis AI**: Separate server (port 9001)
- **Expected Load Time**: 30-60 seconds on first start
- **Memory Usage**: ~2-4GB RAM per model

### Model Loading Process:
1. **Automatic Download**: Models download from HuggingFace on first run
2. **Local Caching**: Models cached in `~/.cache/huggingface/`
3. **Fast Inference**: 2-5 seconds per request after loading

### Supported AI Features:
- ✅ **Review Reply Generation**: Professional responses to customer reviews
- ✅ **Business Analysis**: Comprehensive business insights and recommendations
- ✅ **Content Creation**: AI-powered social media content
- ✅ **Image Generation**: FLUX-powered image creation via GROQ API

---

## 🔄 Celery Background Tasks

### What Celery Handles:
- **Content Generation**: AI-powered content creation
- **Image Processing**: Image optimization and manipulation
- **Email Notifications**: User notifications and alerts
- **Data Processing**: Heavy computational tasks
- **Social Media Posting**: Scheduled Instagram posts

### Celery Components:
1. **Worker**: Processes background tasks
2. **Broker**: Redis message queue
3. **Flower**: Web-based monitoring (optional)

### Monitoring Tasks:
- **Flower Dashboard**: http://localhost:5555
- **Redis CLI**: Monitor queue status
- **Backend Logs**: Task execution logs

---

## 🌐 Service URLs & Ports

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | React development server |
| **Main Backend** | http://localhost:8001 | FastAPI main server |
| **Business AI** | http://localhost:9001 | Business analysis model |
| **Flower** | http://localhost:5555 | Celery task monitoring |
| **Redis** | localhost:6379 | Message broker |

---

## 🧪 Testing the Setup

### 1. Health Checks
```bash
# Backend health
curl http://localhost:8001/health

# Business model health
curl http://localhost:9001/health

# Redis connection
redis-cli ping
```

### 2. Authentication Test
1. Open http://localhost:5173
2. Click "Sign Up" or "Sign In"
3. Try Google OAuth authentication
4. Complete business onboarding (new users)
5. Access dashboard features

### 3. AI Features Test
1. **Content Creator**: Generate AI content with images
2. **Business Analysis**: Run business analysis
3. **Instagram Integration**: Connect and post to Instagram
4. **Review Reply**: Generate professional review responses

---

## 🐛 Troubleshooting

### Common Issues:

#### 1. Firebase Authentication Errors
```bash
# Error: Firebase not configured
# Solution: Check firebase-adminsdk.json file exists and is valid
# Verify FIREBASE_PROJECT_ID in .env matches your project
```

#### 2. AI Model Loading Issues
```bash
# Error: Model loading failed
# Solution: Ensure sufficient RAM (8GB+)
# Check internet connection for model downloads
# Clear HuggingFace cache: rm -rf ~/.cache/huggingface/
```

#### 3. Celery Worker Issues
```bash
# Error: Celery worker not starting
# Solution: Ensure Redis is running
# Check REDIS_URL in .env
# Use --pool=solo on Windows
```

#### 4. Database Connection Issues
```bash
# Error: Database connection failed
# Solution: Check DATABASE_URL format
# Ensure PostgreSQL/Neon DB is accessible
# Run migrations: python main.py
```

#### 5. Port Conflicts
```bash
# Error: Port already in use
# Solution: Kill existing processes
# Windows: netstat -ano | findstr :8001
# macOS/Linux: lsof -ti:8001 | xargs kill
```

### Debug Mode:
```bash
# Enable debug logging
export DEBUG=True
export LOG_LEVEL=DEBUG

# Run with verbose output
python -m uvicorn main:app --reload --port 8001 --log-level debug
```

---

## 📊 Performance Optimization

### For Development:
- **RAM**: 8GB minimum, 16GB recommended
- **CPU**: Multi-core processor for AI models
- **Storage**: SSD recommended for faster model loading

### For Production:
- **Scale Celery Workers**: Multiple worker processes
- **Redis Clustering**: For high availability
- **Database Optimization**: Connection pooling
- **CDN**: For static assets and images

---

## 🔒 Security Checklist

### Before Deployment:
- [ ] Change default SECRET_KEY
- [ ] Use production DATABASE_URL
- [ ] Set DEBUG=False
- [ ] Configure CORS_ORIGINS properly
- [ ] Secure Firebase service account key
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper backup strategy

## 📁 Project Structure

```
Sadhyam/
├── Backend/                 # FastAPI backend
│   ├── ai_models/          # AI model implementations
│   ├── config/             # Database and app configuration
│   ├── migrations/         # Database migrations
│   ├── models/             # SQLAlchemy models
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── main.py             # Application entry point
│   └── requirements.txt    # Python dependencies
├── Frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── routes/         # Page components
│   │   ├── lib/            # Utilities and API client
│   │   └── hooks/          # Custom React hooks
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@host/database

# Firebase Authentication (REQUIRED)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json
FIREBASE_PROJECT_ID=your-firebase-project-id

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Server Configuration
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# AI Services
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_TOKEN=your-huggingface-token
HF_TOKEN=your-huggingface-token

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Instagram Integration
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:8000/auth/instagram/callback
INSTAGRAM_GRAPH_API_VERSION=v19.0

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
CELERY_TASK_SERIALIZER=json
CELERY_ACCEPT_CONTENT=json
CELERY_RESULT_SERIALIZER=json
CELERY_TIMEZONE=UTC

# Website AI Module Configuration
WEBSITE_AI_USE_FAKE_LLM=true
WEBSITE_AI_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.2
WEBSITE_AI_MAX_TOKENS=900
WEBSITE_AI_TEMPERATURE=0.7
WEBSITE_AI_STORAGE_TYPE=local
WEBSITE_AI_LOCAL_STORAGE_PATH=./Backend/ai_models/website_ai/output
WEBSITE_AI_DEFAULT_THEME=hero-split

# Token Encryption
ENCRYPTION_KEY=your-32-char-encryption-key-here
```

#### Frontend (.env)
```env
# Backend API URL
VITE_API_URL=http://localhost:8001

# Environment
VITE_ENV=development

# Firebase Configuration (Get from Firebase Console)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

## 🔐 Authentication Flow

1. **User Registration/Login**
   - Email/password or Google OAuth
   - Firebase token verification
   - Account merging for existing users

2. **Business Onboarding**
   - New users complete business profile
   - Existing users skip to dashboard

3. **Session Management**
   - JWT tokens for API authentication
   - Automatic token refresh
   - Secure logout with token blacklisting

## 📱 API Endpoints

### Authentication
- `POST /auth/register` - Email registration
- `POST /auth/login` - Email login
- `POST /auth/google` - Google OAuth
- `POST /auth/logout` - User logout

### Content Creation
- `POST /api/content/generate` - Generate AI content
- `POST /api/content/instagram-post` - Post to Instagram
- `GET /api/content/history` - Content history

### Business Analysis
- `POST /api/business/analyze` - Business analysis
- `GET /api/business/insights` - Business insights

### Profile Management
- `GET /api/profile/business/setup-status` - Setup status
- `POST /api/profile/business` - Update business profile

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@saadhyam.ai or join our Discord community.

## 🚀 Deployment

### Docker Deployment (Recommended)
```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Production Deployment

#### 1. Backend Deployment
```bash
# Set production environment variables
export DEBUG=False
export ENVIRONMENT=production

# Install production dependencies
pip install -r requirements.txt

# Run database migrations
python main.py

# Start with Gunicorn (production WSGI server)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001

# Start Celery worker
celery -A celery_worker.celery worker --loglevel=info

# Start business model server
python start_business_server.py
```

#### 2. Frontend Deployment
```bash
# Build for production
npm run build

# Serve with nginx or deploy to CDN
# Built files will be in dist/ directory
```

#### 3. Production Services
- **Reverse Proxy**: Nginx or Apache
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis cluster for high availability
- **File Storage**: AWS S3 or Google Cloud Storage
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or similar

### Environment-Specific Configurations

#### Development
- Debug mode enabled
- Hot reloading
- Local database
- Single Redis instance

#### Staging
- Production-like setup
- Test data
- SSL certificates
- Load balancing

#### Production
- Debug mode disabled
- Database clustering
- Redis clustering
- CDN for static assets
- Monitoring and alerting
- Backup strategies

---

## 📈 Scaling & Performance

### Horizontal Scaling
```bash
# Multiple Celery workers
celery -A celery_worker.celery worker --concurrency=4

# Multiple backend instances
# Use load balancer (nginx, HAProxy)

# Database read replicas
# Configure read/write splitting
```

### Monitoring & Metrics
- **Application**: FastAPI metrics endpoint
- **Database**: PostgreSQL performance stats
- **Cache**: Redis monitoring
- **Tasks**: Celery Flower dashboard
- **Infrastructure**: System metrics (CPU, RAM, disk)

### Performance Optimization
- **Database**: Proper indexing, query optimization
- **Cache**: Redis for session storage and API caching
- **CDN**: Static asset delivery
- **AI Models**: Model quantization and optimization
- **Background Tasks**: Celery task prioritization

---

**Built with ❤️ by the Saadhyam AI Team**