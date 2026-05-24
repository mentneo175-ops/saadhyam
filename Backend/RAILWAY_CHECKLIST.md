# Railway Deployment Checklist

## Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] Railway account created at [railway.app](https://railway.app)
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] Docker installed (for local testing)
- [ ] Git repository set up

### ✅ Code Preparation
- [ ] All code committed to git
- [ ] Environment variables reviewed
- [ ] Dockerfile optimized for Railway
- [ ] entrypoint.sh is executable
- [ ] Health check endpoints working

### ✅ Configuration Files
- [ ] `railway.json` created
- [ ] `Procfile` created
- [ ] `.env.railway` template ready
- [ ] Deployment scripts ready

## Deployment Steps

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Deploy Application
Choose one method:

#### Method A: Automated Script (Windows)
```cmd
deploy-railway.bat
```

#### Method B: Automated Script (PowerShell)
```powershell
.\deploy-railway.ps1
```

#### Method C: Manual Commands
```bash
railway init
railway up
railway add postgresql
railway add redis
```

### 4. Configure Environment Variables
In Railway Dashboard, add:

#### Required Variables
```
ENVIRONMENT=production
SECRET_KEY=your-super-secret-key-here
DEBUG=False
LOAD_TINYLLAMA_ON_STARTUP=False
```

#### Database & Redis
Railway auto-populates:
- `DATABASE_URL`
- `REDIS_URL`

#### CORS Settings
```
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 5. Verify Deployment
- [ ] Check deployment logs: `railway logs`
- [ ] Test health endpoint: `https://your-app.railway.app/health`
- [ ] Verify all services are running
- [ ] Test API endpoints

## Post-Deployment Checklist

### ✅ Monitoring Setup
- [ ] Health checks configured
- [ ] Log monitoring set up
- [ ] Error tracking enabled
- [ ] Performance monitoring active

### ✅ Security Configuration
- [ ] Strong SECRET_KEY set
- [ ] CORS properly configured
- [ ] API keys secured
- [ ] HTTPS enabled (automatic on Railway)

### ✅ Performance Optimization
- [ ] AI model loading optimized
- [ ] Database connections tuned
- [ ] Celery workers configured
- [ ] Memory usage monitored

### ✅ Backup & Recovery
- [ ] Database backups enabled
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Rollback plan prepared

## Common Issues & Solutions

### Issue: Build Timeout
**Solution:** Optimize Dockerfile, use build cache

### Issue: Memory Limit Exceeded
**Solution:** Set `LOAD_TINYLLAMA_ON_STARTUP=False`, upgrade plan

### Issue: Database Connection Failed
**Solution:** Check DATABASE_URL format, verify service is running

### Issue: Redis Connection Failed
**Solution:** Verify REDIS_URL, check service status

### Issue: Port Binding Error
**Solution:** Ensure app uses `PORT` environment variable

## Environment Variables Reference

### Core Application
```
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Performance
```
LOAD_TINYLLAMA_ON_STARTUP=False
CELERY_WORKER_CONCURRENCY=1
```

### Database (Auto-populated by Railway)
```
DATABASE_URL=postgresql://...
```

### Redis (Auto-populated by Railway)
```
REDIS_URL=redis://...
CELERY_BROKER_URL=redis://...
CELERY_RESULT_BACKEND=redis://...
```

### CORS
```
ALLOWED_ORIGINS=https://your-domain.com,https://your-app.railway.app
```

### AI Services (Optional)
```
GROQ_API_KEY=your-key
OPENAI_API_KEY=your-key
GOOGLE_API_KEY=your-key
TAVILY_API_KEY=your-key
```

### Social Media APIs (Optional)
```
INSTAGRAM_CLIENT_ID=your-id
INSTAGRAM_CLIENT_SECRET=your-secret
WHATSAPP_ACCESS_TOKEN=your-token
META_APP_ID=your-id
META_APP_SECRET=your-secret
```

## Useful Railway Commands

```bash
# Check status
railway status

# View logs
railway logs

# Open in browser
railway open

# Get domain
railway domain

# List services
railway service

# Connect to database
railway connect postgresql

# Connect to Redis
railway connect redis

# Set environment variable
railway variables set KEY=value

# Deploy specific branch
railway up --detach

# Rollback deployment
railway rollback
```

## Support Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app/)
- [Deployment Guide](./RAILWAY_DEPLOYMENT.md)

## Success Criteria

Your deployment is successful when:
- [ ] Application starts without errors
- [ ] Health check returns 200 OK
- [ ] Database connections work
- [ ] Redis connections work
- [ ] API endpoints respond correctly
- [ ] Socket.IO connections work
- [ ] Background tasks process
- [ ] Logs show no critical errors