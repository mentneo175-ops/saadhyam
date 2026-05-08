# 🚀 Saadhyam AI - Quick Setup Guide

## ⚡ What Changed?

Your friend updated the project to use **Google Gemini API** instead of the local TinyLlama model for Business Analysis. This means:

✅ **No more Business Model Server** (Port 9001) - removed!
✅ **Cloud-based AI** - Faster, more accurate business analysis
✅ **Less RAM needed** - No heavy local model to load
✅ **Real-time insights** - Google Search grounding for live data

---

## 🔑 Required: Get Your Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `Backend/.env`:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

---

## 🚀 How to Run (Super Simple)

### Option 1: One-Click Start (Recommended)

```bash
# Just double-click this file:
start_all.bat

# Or run in terminal:
.\start_all.bat
```

This starts **4 services**:
1. Backend API (Port 8000)
2. Instagram Celery Worker
3. Website AI Celery Worker
4. Frontend (Port 5173)

### Option 2: Manual Start

**Terminal 1 - Redis:**
```bash
redis-server
# Or: docker run -d -p 6379:6379 redis:alpine
```

**Terminal 2 - Backend:**
```bash
cd Backend
venv\Scripts\activate
python main.py
```

**Terminal 3 - Instagram Worker:**
```bash
cd Backend
venv\Scripts\activate
celery -A celery_worker worker --loglevel=info --pool=solo
```

**Terminal 4 - Website AI Worker:**
```bash
cd Backend
venv\Scripts\activate
python -m celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo
```

**Terminal 5 - Frontend:**
```bash
cd Frontend
npm run dev
```

---

## 🌐 Access Your App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ✅ What's Running Now?

| Service | Status | Purpose |
|---------|--------|---------|
| Backend API | ✅ Running | Main server + TinyLlama for reviews |
| Gemini API | ☁️ Cloud | Business analysis (no local server) |
| Instagram Worker | ✅ Running | Background tasks for Instagram |
| Website AI Worker | ✅ Running | Website generation tasks |
| Frontend | ✅ Running | React UI |

---

## 🐛 Troubleshooting

### "Business Analysis not working"
**Solution:** Check if `GEMINI_API_KEY` is set in `Backend/.env`

### "Port 8000 already in use"
**Solution:** Kill existing process:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Or restart your computer
```

### "Redis connection failed"
**Solution:** Make sure Redis is running:
```bash
redis-server
# Or: docker run -d -p 6379:6379 redis:alpine
```

### "Celery worker not starting"
**Solution:** Make sure you're in Backend directory and venv is activated:
```bash
cd Backend
venv\Scripts\activate
celery -A celery_worker worker --loglevel=info --pool=solo
```

---

## 📝 Environment Variables Checklist

Make sure these are set in `Backend/.env`:

- ✅ `DATABASE_URL` - Your Neon DB connection string
- ✅ `GEMINI_API_KEY` - **NEW! Required for business analysis**
- ✅ `GROQ_API_KEY` - For content generation
- ✅ `HUGGINGFACE_TOKEN` - For image generation
- ✅ `CLOUDINARY_*` - For image storage
- ✅ `INSTAGRAM_*` - For Instagram integration
- ✅ `FIREBASE_*` - For authentication
- ✅ `REDIS_URL` - For Celery tasks

---

## 🎉 That's It!

Your app should now be running with the new Gemini-powered business analysis!

**Need help?** Check the full README.md for detailed instructions.
