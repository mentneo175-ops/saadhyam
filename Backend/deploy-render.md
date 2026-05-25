# 🚀 Render Deployment Guide - Saadhyam AI Backend

## Step 1: Repository Setup

1. **Ensure your code is pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

## Step 2: Create Render Services

### Option A: Using render.yaml (Recommended - Automated)

1. **Go to [render.com](https://render.com) Dashboard**
2. **Click "New" → "Blueprint"**
3. **Connect your GitHub repository**
4. **Select the repository containing your backend**
5. **Render will automatically detect `render.yaml` and create:**
   - Web Service: `saadhyam-backend`
   - Redis Service: `saadhyam-redis`

### Option B: Manual Setup (Alternative)

If you prefer manual setup:

1. **Create Redis Service First:**
   - New → Redis
   - Name: `saadhyam-redis`
   - Plan: Free
   - Region: Oregon

2. **Create Web Service:**
   - New → Web Service
   - Connect GitHub repository
   - Name: `saadhyam-backend`
   - Environment: Docker
   - Plan: Free
   - Region: Oregon
   - Branch: main
   - Dockerfile Path: `./Dockerfile`

## Step 3: Environment Variables (If using Manual Setup)

Copy these environment variables to your Render web service:

```env
# Core Settings
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=[Render will auto-generate]
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
LOAD_TINYLLAMA_ON_STARTUP=False
CELERY_WORKER_CONCURRENCY=1

# Database (Your existing NeonDB)
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_yMY4QBN0dInc@ep-calm-frost-anaytjtm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require

# Redis (Will be auto-connected if using Blueprint)
REDIS_URL=[Auto-populated by Render Redis service]

# CORS (Update with your frontend URL after deployment)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://saadhyam-frontend.onrender.com

# All your API keys (already configured in render.yaml)
```

## Step 4: Deployment Process

1. **Render will automatically:**
   - Build your Docker image
   - Install dependencies from requirements.txt
   - Run database migrations
   - Start Redis server
   - Launch Celery workers
   - Start FastAPI server with Socket.IO

2. **Monitor the build logs for:**
   - ✅ Docker build success
   - ✅ Dependencies installation
   - ✅ Database connection
   - ✅ Redis connection
   - ✅ Server startup on assigned port

## Step 5: Post-Deployment Verification

### Check Health Endpoint
Your backend will be available at: `https://saadhyam-backend.onrender.com`

Test the health endpoint:
```bash
curl https://saadhyam-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai_models": "loaded"
  }
}
```

### Test Key Endpoints
```bash
# Test authentication
curl https://saadhyam-backend.onrender.com/auth/health

# Test AI services
curl https://saadhyam-backend.onrender.com/api/ai/health

# Test Instagram integration
curl https://saadhyam-backend.onrender.com/api/instagram/health
```

## Step 6: Update Frontend Configuration

After successful backend deployment, update your frontend to use the new backend URL:

```typescript
// In your frontend API configuration
const API_BASE_URL = 'https://saadhyam-backend.onrender.com';
```

## Step 7: Update Redirect URIs

Update these redirect URIs in your external services:

### Instagram/Facebook App Settings
- **Instagram Redirect URI:** `https://saadhyam-backend.onrender.com/auth/instagram/callback`
- **Meta OAuth Redirect URI:** `https://saadhyam-backend.onrender.com/auth/meta/callback`

### WhatsApp Cloud API
- **Webhook URL:** `https://saadhyam-backend.onrender.com/api/whatsapp/webhook`
- **Redirect URI:** `https://saadhyam-backend.onrender.com/api/whatsapp/callback`

## Troubleshooting Common Issues

### 1. Build Failures
- **Check Dockerfile syntax**
- **Verify requirements.txt dependencies**
- **Ensure entrypoint.sh is executable**

### 2. Database Connection Issues
- **Verify DATABASE_URL format**
- **Check NeonDB connection limits**
- **Ensure SSL mode is required**

### 3. Redis Connection Issues
- **Verify Redis service is running**
- **Check REDIS_URL environment variable**
- **Ensure Celery can connect**

### 4. Port Issues
- **Render automatically assigns PORT environment variable**
- **Your entrypoint.sh handles this correctly**

### 5. Memory Issues (Free Plan Limitations)
- **Free plan has 512MB RAM limit**
- **LOAD_TINYLLAMA_ON_STARTUP=False (already set)**
- **CELERY_WORKER_CONCURRENCY=1 (already set)**

## Monitoring & Logs

1. **View Logs:** Render Dashboard → Your Service → Logs
2. **Monitor Performance:** Check CPU and memory usage
3. **Health Checks:** Render automatically monitors `/health` endpoint

## Scaling (When Ready)

When you outgrow the free plan:
- **Upgrade to Starter ($7/month) for:**
  - 1GB RAM
  - More CPU
  - Custom domains
  - Better performance

## Security Notes

✅ **Already Configured:**
- Environment variables are encrypted
- Database uses SSL
- API keys are properly secured
- CORS is configured for production
- Rate limiting is enabled
- Request size limits are set

## Success Indicators

Your deployment is successful when you see:
- ✅ Build completed without errors
- ✅ Health endpoint returns 200 OK
- ✅ Database migrations completed
- ✅ Redis connection established
- ✅ Celery workers started
- ✅ FastAPI server running
- ✅ Socket.IO real-time features working

## Next Steps After Deployment

1. **Deploy your frontend** (Netlify/Vercel recommended)
2. **Update CORS origins** with your frontend URL
3. **Test all integrations** (Instagram, WhatsApp, etc.)
4. **Set up monitoring** and alerts
5. **Configure custom domain** (optional)

---

🎉 **Your Saadhyam AI backend is now ready for production on Render!**