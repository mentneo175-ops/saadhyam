# 🚀 Production Deployment Guide - Saadhyam AI

## Current Issue: Hardcoded `localhost` URLs

Your application currently uses hardcoded `localhost:8000` and `localhost:5173` URLs throughout the codebase. This works for development but breaks in production.

---

## ✅ Solution: Environment-Based Configuration

### **Step 1: Create Environment Files**

#### **Frontend Environment Files**

Create these files in `Frontend/` directory:

**`.env.development`** (for local development)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
VITE_APP_URL=http://localhost:5173
VITE_ENVIRONMENT=development
```

**`.env.production`** (for production)
```env
VITE_API_BASE_URL=https://api.saadhyam.com
VITE_SOCKET_URL=https://api.saadhyam.com
VITE_APP_URL=https://app.saadhyam.com
VITE_ENVIRONMENT=production
```

**`.env.staging`** (for staging/testing)
```env
VITE_API_BASE_URL=https://api-staging.saadhyam.com
VITE_SOCKET_URL=https://api-staging.saadhyam.com
VITE_APP_URL=https://staging.saadhyam.com
VITE_ENVIRONMENT=staging
```

#### **Backend Environment Files**

Your `Backend/.env` already exists, but add these:

**`.env.development`**
```env
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/saadhyam_dev
FRONTEND_URL=http://localhost:5173
```

**`.env.production`**
```env
ENVIRONMENT=production
ALLOWED_ORIGINS=https://app.saadhyam.com
DATABASE_URL=postgresql://user:password@prod-db-server:5432/saadhyam_prod
FRONTEND_URL=https://app.saadhyam.com
```

---

### **Step 2: Create Configuration Files**

#### **Frontend: `Frontend/src/config/env.ts`**

```typescript
/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

interface EnvConfig {
  apiBaseUrl: string;
  socketUrl: string;
  appUrl: string;
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
}

// Get environment variables from Vite
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof window === 'undefined') return defaultValue;
  return import.meta.env[key] || defaultValue;
};

// Create configuration object
export const env: EnvConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000'),
  socketUrl: getEnvVar('VITE_SOCKET_URL', 'http://localhost:8000'),
  appUrl: getEnvVar('VITE_APP_URL', 'http://localhost:5173'),
  environment: getEnvVar('VITE_ENVIRONMENT', 'development') as EnvConfig['environment'],
  isDevelopment: getEnvVar('VITE_ENVIRONMENT', 'development') === 'development',
  isProduction: getEnvVar('VITE_ENVIRONMENT', 'development') === 'production',
};

// Log configuration in development
if (env.isDevelopment) {
  console.log('🔧 Environment Configuration:', env);
}

// Validate required environment variables
const requiredEnvVars = ['VITE_API_BASE_URL', 'VITE_SOCKET_URL'];
const missingEnvVars = requiredEnvVars.filter(key => !import.meta.env[key]);

if (missingEnvVars.length > 0 && typeof window !== 'undefined') {
  console.warn('⚠️ Missing environment variables:', missingEnvVars);
}

export default env;
```

#### **Backend: `Backend/config/env.py`**

```python
"""
Environment Configuration
Centralized configuration for all environment variables
"""

import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""
    
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    IS_DEVELOPMENT = ENVIRONMENT == "development"
    IS_PRODUCTION = ENVIRONMENT == "production"
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    
    # URLs
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    # CORS
    ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS", "")
    ALLOWED_ORIGINS: List[str] = (
        [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",") if origin.strip()]
        if ALLOWED_ORIGINS_STR
        else ["http://localhost:5173", "http://localhost:3000"]
    )
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/saadhyam")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-change-in-production")
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    
    # API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    
    @classmethod
    def validate(cls):
        """Validate required environment variables"""
        required_vars = []
        
        if cls.IS_PRODUCTION:
            required_vars = [
                "SECRET_KEY",
                "JWT_SECRET",
                "DATABASE_URL",
                "ALLOWED_ORIGINS",
            ]
        
        missing = [var for var in required_vars if not getattr(cls, var, None)]
        
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    @classmethod
    def log_config(cls):
        """Log configuration (hide sensitive data)"""
        print("=" * 60)
        print("🔧 Environment Configuration")
        print("=" * 60)
        print(f"Environment: {cls.ENVIRONMENT}")
        print(f"Host: {cls.HOST}:{cls.PORT}")
        print(f"Frontend URL: {cls.FRONTEND_URL}")
        print(f"Allowed Origins: {cls.ALLOWED_ORIGINS}")
        print(f"Database: {cls.DATABASE_URL.split('@')[1] if '@' in cls.DATABASE_URL else 'Not configured'}")
        print("=" * 60)

# Create config instance
config = Config()

# Validate and log in development
if config.IS_DEVELOPMENT:
    config.log_config()
```

---

### **Step 3: Update API Client**

#### **Frontend: `Frontend/src/lib/api.ts`**

Replace hardcoded URLs with environment config:

```typescript
import env from '@/config/env';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    // Use environment-based URL instead of hardcoded localhost
    this.baseURL = env.apiBaseUrl;
    
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }
  }

  // ... rest of the code
}

export const apiClient = new ApiClient();
```

---

### **Step 4: Update Socket.IO Configuration**

#### **Frontend: Socket.IO connections**

Replace:
```typescript
// ❌ OLD - Hardcoded
const socket = io("http://localhost:8000", {
  auth: { user_id: currentUserId },
});
```

With:
```typescript
// ✅ NEW - Environment-based
import env from '@/config/env';

const socket = io(env.socketUrl, {
  auth: { user_id: currentUserId },
  transports: ["websocket", "polling"],
});
```

---

### **Step 5: Update Backend CORS**

#### **Backend: `Backend/main.py`**

Replace:
```python
# ❌ OLD - Hardcoded
cors_origins = [
    "http://localhost:5173",
    "http://localhost:8080",
]
```

With:
```python
# ✅ NEW - Environment-based
from config.env import config

cors_origins = config.ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)
```

---

## 🌐 Production Deployment Options

### **Option 1: Traditional VPS/Cloud Server**

**Providers:** AWS EC2, DigitalOcean, Linode, Vultr

**Setup:**
1. **Backend**: Deploy on server with domain `api.saadhyam.com`
2. **Frontend**: Build and serve on `app.saadhyam.com`
3. **Database**: PostgreSQL on same server or managed service
4. **SSL**: Use Let's Encrypt (free) or Cloudflare

**Pros:** Full control, cost-effective
**Cons:** Manual setup, maintenance required

---

### **Option 2: Platform as a Service (PaaS)**

#### **Backend Options:**
- **Railway.app** (Recommended - Easy, affordable)
- **Render.com** (Free tier available)
- **Heroku** (Popular but expensive)
- **Fly.io** (Global deployment)

#### **Frontend Options:**
- **Vercel** (Recommended for React/Vite)
- **Netlify** (Easy deployment)
- **Cloudflare Pages** (Fast, free)

**Pros:** Easy deployment, auto-scaling, CI/CD
**Cons:** Can be expensive at scale

---

### **Option 3: Containerized Deployment**

**Using Docker + Kubernetes**

**Providers:** AWS ECS, Google Cloud Run, Azure Container Instances

**Pros:** Scalable, portable, professional
**Cons:** Complex setup, higher cost

---

## 📦 Recommended Production Stack

### **For Small to Medium Business:**

```
Frontend: Vercel (Free tier)
Backend: Railway.app ($5-20/month)
Database: Railway PostgreSQL (included)
Domain: Namecheap/GoDaddy ($10-15/year)
SSL: Automatic (included in Vercel/Railway)
CDN: Cloudflare (Free)
```

**Total Cost:** ~$10-30/month

---

### **For Enterprise/Scale:**

```
Frontend: AWS CloudFront + S3
Backend: AWS ECS/EKS or Google Cloud Run
Database: AWS RDS PostgreSQL
Domain: Route 53
SSL: AWS Certificate Manager (Free)
CDN: CloudFlare Enterprise
Monitoring: DataDog/New Relic
```

**Total Cost:** $100-500+/month (scales with usage)

---

## 🔒 Security Best Practices

### **1. Environment Variables**
- ✅ Never commit `.env` files to Git
- ✅ Use different secrets for dev/staging/prod
- ✅ Rotate secrets regularly
- ✅ Use secret management services (AWS Secrets Manager, etc.)

### **2. HTTPS Only**
- ✅ Force HTTPS in production
- ✅ Use HSTS headers
- ✅ Redirect HTTP to HTTPS

### **3. CORS Configuration**
- ✅ Only allow specific origins in production
- ✅ Never use `allow_origins=["*"]` in production

### **4. Database**
- ✅ Use connection pooling
- ✅ Enable SSL for database connections
- ✅ Regular backups
- ✅ Use read replicas for scaling

---

## 🚀 Quick Deployment Guide

### **Step 1: Prepare Code**
```bash
# Add .env files to .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore

# Create example env file
cp .env .env.example
# Remove sensitive values from .env.example
```

### **Step 2: Deploy Backend (Railway.app)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables in Railway dashboard
# Deploy
railway up
```

### **Step 3: Deploy Frontend (Vercel)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd Frontend
vercel --prod

# Add environment variables in Vercel dashboard
```

### **Step 4: Configure Domain**
1. Point `api.saadhyam.com` to Railway
2. Point `app.saadhyam.com` to Vercel
3. SSL certificates auto-generated

---

## 📝 Checklist Before Going Live

- [ ] All environment variables configured
- [ ] Database backups enabled
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Error logging setup (Sentry, LogRocket)
- [ ] Performance monitoring (Google Analytics, Mixpanel)
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] API documentation updated
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

---

## 🆘 Common Issues & Solutions

### **Issue: CORS errors in production**
**Solution:** Add production domain to `ALLOWED_ORIGINS` in backend `.env`

### **Issue: WebSocket connection fails**
**Solution:** Ensure Socket.IO URL uses `https://` in production

### **Issue: Database connection timeout**
**Solution:** Use connection pooling, increase timeout, check firewall rules

### **Issue: 502 Bad Gateway**
**Solution:** Backend not running, check logs, restart service

---

**Last Updated:** May 17, 2026
**Status:** 📋 READY FOR IMPLEMENTATION
