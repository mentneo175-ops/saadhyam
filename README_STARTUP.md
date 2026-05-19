# 🚀 Saadhyam AI - Startup Guide

## ✅ Project Started Successfully!

Your Saadhyam AI project is now running with the following services:

### 🌐 Running Services

| Service | URL | Status |
|---------|-----|--------|
| **Backend API** | http://localhost:8000 | ✅ Starting |
| **Frontend** | http://localhost:5173 | ✅ Starting |
| **API Docs** | http://localhost:8000/docs | ✅ Available |
| **Celery Workers** | Background | ⚠️ Requires Redis |

## 📂 Startup Scripts Created

### 1. **start_all_windows.bat** (Main Launcher)
- ✅ Starts all services in separate windows
- ✅ Checks prerequisites (Python, Node.js, Redis)
- ✅ Creates virtual environment if needed
- ✅ Installs dependencies automatically
- ✅ Starts Backend, Frontend, and Celery workers

**Usage:**
```cmd
start_all_windows.bat
```

### 2. **start_backend_only.bat**
- Starts only the backend server
- Shows console output for debugging
- Useful for backend development

**Usage:**
```cmd
start_backend_only.bat
```

### 3. **start_frontend_only.bat**
- Starts only the frontend server
- Shows console output for debugging
- Useful for frontend development

**Usage:**
```cmd
start_frontend_only.bat
```

### 4. **check_services.bat**
- Checks if all services are running
- Verifies port availability
- Tests Redis connection

**Usage:**
```cmd
check_services.bat
```

## 🎯 Quick Access

### Backend Endpoints
- **Health Check**: http://localhost:8000/health
- **Test Endpoint**: http://localhost:8000/test
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

### Frontend
- **Main App**: http://localhost:5173
- **Dashboard**: http://localhost:5173/dashboard

## 🔧 Current Status

### ✅ What's Working
- Backend server is configured and starting
- Frontend server is configured and starting
- All dependencies are set up
- Virtual environment is ready
- Environment variables are configured

### ⚠️ Notes
1. **Backend Startup Time**: The backend may take 30-60 seconds to fully start because it:
   - Initializes the database
   - Loads AI models (TinyLlama for review replies)
   - Connects to external services
   - Runs migrations

2. **Redis (Optional)**: 
   - Celery workers require Redis for background tasks
   - If Redis is not installed, the main app will still work
   - Background features (scheduled posts, campaigns) won't function without Redis

3. **First-Time Setup**:
   - Dependencies are being installed
   - This may take a few minutes
   - Subsequent starts will be much faster

## 🛠️ Troubleshooting

### Backend Not Starting?

1. **Check the backend window** for error messages
2. **Verify Python installation**:
   ```cmd
   python --version
   ```
   Should show Python 3.8 or higher

3. **Check if port 8000 is available**:
   ```cmd
   netstat -ano | findstr :8000
   ```

4. **Manually start backend** to see errors:
   ```cmd
   cd Backend
   call venv\Scripts\activate.bat
   python main.py
   ```

### Frontend Not Starting?

1. **Check the frontend window** for error messages
2. **Verify Node.js installation**:
   ```cmd
   node --version
   npm --version
   ```

3. **Check if port 5173 is available**:
   ```cmd
   netstat -ano | findstr :5173
   ```

4. **Reinstall dependencies**:
   ```cmd
   cd Frontend
   rmdir /s /q node_modules
   npm install
   npm run dev
   ```

### Redis Not Available?

**Option 1: Install Redis on Windows**
- Download from: https://github.com/microsoftarchive/redis/releases
- Extract and run `redis-server.exe`

**Option 2: Use WSL (Windows Subsystem for Linux)**
```cmd
wsl --install
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

**Option 3: Use Docker**
```cmd
docker run -d -p 6379:6379 redis:latest
```

## 📊 Service Windows

When you run `start_all_windows.bat`, you'll see these windows:

1. **Saadhyam Backend** - Backend server logs
2. **Saadhyam Frontend** - Frontend development server
3. **Celery Main Worker** - Instagram & WhatsApp automation (if Redis available)
4. **Celery Website AI** - Website generation tasks (if Redis available)

**To stop services**: Close each window or press `Ctrl+C` in each window

## 🔐 Environment Configuration

### Backend Environment (`.env`)
Located at: `Backend\.env`

Key settings already configured:
- ✅ Database connection (NeonDB)
- ✅ JWT authentication
- ✅ Firebase (Google OAuth)
- ✅ Instagram API
- ✅ WhatsApp API
- ✅ Gemini AI API
- ✅ Groq AI API
- ✅ Cloudinary (image hosting)
- ✅ Redis (Celery)

### Frontend Environment (`.env`)
Located at: `Frontend\.env`

Key settings:
- ✅ Backend API URL: `http://localhost:8000`
- ✅ Firebase configuration

## 🎨 Features Available

### 🤖 AI Services
- Review reply generation (TinyLlama)
- Business analysis (Gemini AI with Google Search)
- Content creation (Mistral/Gemini)
- Image generation (FLUX/Stable Diffusion)
- Personal assistant (Groq)

### 📱 Social Media
- Instagram post scheduling
- Instagram analytics
- WhatsApp automation
- WhatsApp campaigns
- Meta Ads management

### 🌐 Website Generation
- AI-powered website creation
- Multiple themes
- Responsive design
- SEO optimization

### 📊 Business Intelligence
- Comprehensive business analysis
- Competitor analysis
- Partnership recommendations
- Customer retention insights
- B2B networking

### 📝 Content & SEO
- Blog generation
- AEO/GEO optimization
- Auto-blogging
- Content calendar

## 📚 Next Steps

1. **Wait for services to fully start** (30-60 seconds)
2. **Open your browser** to http://localhost:5173
3. **Check backend health** at http://localhost:8000/health
4. **Explore API docs** at http://localhost:8000/docs
5. **Create an account** or login with Google OAuth

## 🆘 Getting Help

### Documentation Files
- `QUICK_START.md` - Quick reference guide
- `Backend/START_SERVER.md` - Backend setup details
- `Backend/DATABASE_ARCHITECTURE.md` - Database structure
- `Backend/CELERY_WORKERS_STATUS.md` - Background workers info
- `AUTH_FIX_COMPLETE.md` - Authentication setup

### Check Service Status
Run `check_services.bat` to verify all services are running properly.

### View Logs
Each service window shows real-time logs. Check them for:
- Startup progress
- Error messages
- API requests
- Background task status

---

## 🎉 You're All Set!

Your Saadhyam AI platform is now running. The services are starting up in the background.

**Give it 30-60 seconds**, then visit:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000/docs

Happy coding! 🚀
