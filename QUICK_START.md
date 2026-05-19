# Saadhyam AI - Quick Start Guide (Windows)

## 🚀 Starting the Project

### Option 1: One-Click Start (Recommended)
Double-click `start_all_windows.bat` in the root directory, or run:
```cmd
start_all_windows.bat
```

This will automatically:
- ✅ Check Python and Node.js installation
- ✅ Create/activate Python virtual environment
- ✅ Install dependencies if needed
- ✅ Start Backend server (Port 8000)
- ✅ Start Frontend server (Port 5173)
- ✅ Start Celery workers (if Redis is available)

### Option 2: Manual Start

#### Backend
```cmd
cd Backend
call venv\Scripts\activate.bat
python main.py
```

#### Frontend
```cmd
cd Frontend
npm run dev
```

#### Celery Workers (Optional - requires Redis)
```cmd
cd Backend
call venv\Scripts\activate.bat

REM Main worker (Instagram + WhatsApp)
celery -A celery_worker worker --loglevel=info --pool=solo

REM Website AI worker
celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📋 Prerequisites

### Required
- ✅ Python 3.8+ ([Download](https://www.python.org/))
- ✅ Node.js 16+ ([Download](https://nodejs.org/))

### Optional (for background tasks)
- Redis Server ([Windows Download](https://github.com/microsoftarchive/redis/releases))
  - Or use WSL: `wsl --install` then `sudo apt install redis-server`

## 🛑 Stopping Services

Each service runs in its own window. To stop:
1. Close the individual command windows, or
2. Press `Ctrl+C` in each window

## 🔧 Troubleshooting

### Backend won't start
- Check if port 8000 is already in use
- Verify Python virtual environment: `Backend\venv\Scripts\activate.bat`
- Install dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Check if port 5173 is already in use
- Install dependencies: `npm install`
- Clear cache: `npm run build` then `npm run dev`

### Celery workers not starting
- Install Redis (see Prerequisites)
- Start Redis: `redis-server` or WSL: `sudo service redis-server start`
- Check Redis connection: `redis-cli ping` (should return "PONG")

### Database connection issues
- Check `.env` file in Backend directory
- Verify DATABASE_URL is set correctly
- For local testing, SQLite is used by default

## 📝 Environment Configuration

### Backend (.env)
Located at: `Backend\.env`

Key configurations:
- `DATABASE_URL`: Database connection string
- `REDIS_URL`: Redis connection (for Celery)
- `SECRET_KEY`: JWT secret key
- `GEMINI_API_KEY`: Google AI API key
- `GROQ_API_KEY`: Groq API key
- `INSTAGRAM_APP_ID`: Instagram API credentials
- `WHATSAPP_TOKEN`: WhatsApp API token

### Frontend (.env)
Located at: `Frontend\.env`

Key configurations:
- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)
- `VITE_FIREBASE_*`: Firebase configuration

## 🎯 Features

- 🤖 AI-powered review reply generation
- 📊 Business analysis with Gemini AI
- 📱 Instagram post scheduling and automation
- 💬 WhatsApp automation and campaigns
- 🌐 Website generation with AI
- 📈 Analytics and insights
- 🎨 Content creation and image generation
- 🔄 Real-time updates with Socket.IO

## 📚 Additional Resources

- Backend API Documentation: http://localhost:8000/docs
- Frontend Routes: Check `Frontend\src\routes\`
- Database Models: Check `Backend\models\`
- API Routes: Check `Backend\routes\`

## 🆘 Need Help?

Check the following files for detailed information:
- `Backend\START_SERVER.md` - Backend setup guide
- `Backend\DATABASE_ARCHITECTURE.md` - Database structure
- `Backend\CELERY_WORKERS_STATUS.md` - Celery worker info
- `AUTH_FIX_COMPLETE.md` - Authentication setup

---

**Note**: Redis is optional but recommended for background task processing (scheduled posts, campaigns, etc.)
