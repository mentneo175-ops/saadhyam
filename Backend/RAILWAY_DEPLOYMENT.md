# Railway Deployment Guide for Saadhyam AI Backend

## Overview
This guide helps you deploy your multi-service Saadhyam AI backend to Railway. Your backend includes:
- FastAPI main application with Socket.IO
- Multiple AI models (TinyLlama, Gemini API)
- Celery workers for background tasks
- Redis for caching and message queuing
- PostgreSQL database
- Multiple specialized services (Instagram, WhatsApp, Business Analysis, etc.)

## Deployment Options

### Option 1: Single Service (Recommended)
Deploy everything as one Railway service using the existing Docker setup.

### Option 2: Multi-Service (Advanced)
Split into separate Railway services for better scalability.

## Quick Start (Option 1 - Single Service)

### 1. Prepare Your Repository
```bash
# Make sure you're in the Backend directory
cd Backend

# Ensure all files are committed
git add .
git commit -m "Prepare for Railway deployment"
```

### 2. Deploy to Railway

#### Method A: Railway CLI (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Method B: GitHub Integration
1. Push your code to GitHub
2. Go to [Railway Dashboard](https://railway.app/dashboard)
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-detect the Dockerfile

### 3. Configure Environment Variables

In Railway Dashboard, add these environment variables:

#### Required Variables
```
ENVIRONMENT=production
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DEBUG=False
LOAD_TINYLLAMA_ON_STARTUP=False
```

#### Database (Railway PostgreSQL)
```
# Railway will provide these automatically if you add PostgreSQL service
DATABASE_URL=postgresql://user:pass@host:port/db
```

#### Redis (Railway Redis)
```
# Railway will provide these automatically if you add Redis service
REDIS_URL=redis://host:port
CELERY_BROKER_URL=redis://host:port/0
CELERY_RESULT_BACKEND=redis://host:port/1
```

#### AI Services (Optional)
```
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
TAVILY_API_KEY=your-tavily-api-key
```

#### Social Media APIs (Optional)
```
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
```

### 4. Add Database and Redis Services

#### Add PostgreSQL
1. In Railway Dashboard, click "New Service"
2. Select "PostgreSQL"
3. Railway will automatically set DATABASE_URL

#### Add Redis
1. In Railway Dashboard, click "New Service"
2. Select "Redis"
3. Railway will automatically set REDIS_URL

### 5. Configure Networking
1. Go to your main service settings
2. Under "Networking", generate a domain
3. Update ALLOWED_ORIGINS environment variable with your domain

## Option 2: Multi-Service Deployment

For better scalability, you can split services:

### Service 1: Main API
- FastAPI application
- Socket.IO server
- Authentication routes

### Service 2: AI Workers
- Celery workers
- AI model processing
- Background tasks

### Service 3: Database Services
- PostgreSQL (Railway managed)
- Redis (Railway managed)

## Environment-Specific Configuration

### Development
```
ENVIRONMENT=development
DEBUG=True
LOAD_TINYLLAMA_ON_STARTUP=False
```

### Production
```
ENVIRONMENT=production
DEBUG=False
LOAD_TINYLLAMA_ON_STARTUP=False
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Monitoring and Logs

### View Logs
```bash
# Using Railway CLI
railway logs

# Or check Railway Dashboard > Service > Logs
```

### Health Checks
Your application includes health checks at:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed service status

## Troubleshooting

### Common Issues

#### 1. Port Configuration
Railway automatically sets the PORT environment variable. Your entrypoint.sh handles this correctly.

#### 2. Memory Limits
If you encounter memory issues:
- Set `LOAD_TINYLLAMA_ON_STARTUP=False`
- Consider splitting AI models into separate services
- Upgrade Railway plan for more memory

#### 3. Build Timeouts
If Docker build times out:
- Optimize Dockerfile layers
- Use Railway's build cache
- Consider pre-built base images

#### 4. Database Connection
Ensure DATABASE_URL format is correct:
```
postgresql://username:password@hostname:port/database_name
```

#### 5. Redis Connection
Ensure REDIS_URL format is correct:
```
redis://hostname:port
```

### Performance Optimization

#### 1. Reduce Startup Time
```bash
# In environment variables
LOAD_TINYLLAMA_ON_STARTUP=False
```

#### 2. Optimize Celery
```bash
# Reduce concurrency for memory efficiency
CELERY_WORKER_CONCURRENCY=1
```

#### 3. Database Optimization
- Use connection pooling
- Enable query optimization
- Consider read replicas for heavy workloads

## Scaling Considerations

### Horizontal Scaling
- Use Railway's auto-scaling features
- Split services by function
- Implement proper load balancing

### Vertical Scaling
- Monitor memory usage
- Upgrade Railway plan as needed
- Optimize AI model loading

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Set strong database passwords
- [ ] Configure CORS properly
- [ ] Enable HTTPS (Railway provides this)
- [ ] Secure API keys in environment variables
- [ ] Review Firebase configuration
- [ ] Enable rate limiting

## Cost Optimization

### Railway Pricing Tiers
- **Hobby**: $5/month - Good for development
- **Pro**: $20/month - Production ready
- **Team**: Custom pricing - Enterprise features

### Cost-Saving Tips
1. Use Railway's sleep feature for development
2. Optimize Docker image size
3. Monitor resource usage
4. Use efficient AI model loading

## Support and Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app/)

## Next Steps

1. Deploy using Option 1 (Single Service)
2. Test all endpoints and features
3. Configure monitoring and alerts
4. Set up CI/CD pipeline
5. Consider Option 2 for scaling needs

## Deployment Commands Summary

```bash
# Quick deployment
railway login
railway init
railway up

# Add services
railway add postgresql
railway add redis

# View logs
railway logs

# Open in browser
railway open
```