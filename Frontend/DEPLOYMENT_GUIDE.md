# Frontend Deployment Guide

## 🎯 Deployment Order: Backend First, Then Frontend

### Why Backend First?
Your frontend (`api.ts`) uses `VITE_API_URL` to connect to the backend. You need the backend URL before deploying the frontend.

## 📋 Step-by-Step Deployment

### Phase 1: Deploy Backend (Complete This First)
1. Deploy backend to Railway (see Backend/RAILWAY_DEPLOYMENT.md)
2. Get your backend URL: `https://your-backend-abc123.railway.app`
3. Test backend health: `https://your-backend-abc123.railway.app/health`

### Phase 2: Configure Frontend Environment

#### Update Production Environment
Edit `.env.production` with your actual backend URL:

```env
# Replace with your actual Railway backend URL
VITE_API_BASE_URL=https://your-backend-abc123.railway.app
VITE_SOCKET_URL=https://your-backend-abc123.railway.app
VITE_APP_URL=https://your-frontend-domain.com
VITE_ENVIRONMENT=production
```

#### For Development Testing
Edit `.env.development` to test with deployed backend:

```env
VITE_API_BASE_URL=https://your-backend-abc123.railway.app
VITE_SOCKET_URL=https://your-backend-abc123.railway.app
VITE_APP_URL=http://localhost:5173
VITE_ENVIRONMENT=development
```

### Phase 3: Deploy Frontend

#### Option A: Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Or use CLI:
vercel env add VITE_API_BASE_URL production
vercel env add VITE_SOCKET_URL production
vercel env add VITE_APP_URL production
vercel env add VITE_ENVIRONMENT production
```

#### Option B: Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

#### Option C: Deploy to Railway (Frontend)
```bash
# In Frontend directory
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

#### Option D: Deploy to Cloudflare Pages
Your project already has Cloudflare configuration (`wrangler.jsonc`):

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run build
wrangler pages deploy dist
```

### Phase 4: Update Backend CORS

After deploying frontend, update backend CORS settings:

1. Go to Railway Dashboard > Your Backend Service > Variables
2. Update `ALLOWED_ORIGINS` with your frontend URL:
   ```
   ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-frontend-domain.vercel.app
   ```

## 🔧 Platform-Specific Configurations

### Vercel Configuration
Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify Configuration
Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Railway Configuration (Frontend)
Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false
  }
}
```

## 🌐 Environment Variables Reference

### Production Environment Variables
```env
VITE_API_BASE_URL=https://your-backend.railway.app
VITE_SOCKET_URL=https://your-backend.railway.app
VITE_APP_URL=https://your-frontend-domain.com
VITE_ENVIRONMENT=production
```

### Development Environment Variables
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
VITE_APP_URL=http://localhost:5173
VITE_ENVIRONMENT=development
```

## 🧪 Testing Deployment

### 1. Test Backend Connection
```bash
# Test from your local frontend
npm run dev

# Check browser console for API calls
# Should connect to: https://your-backend.railway.app
```

### 2. Test Production Build
```bash
# Build locally
npm run build

# Preview production build
npm run preview

# Test all features work
```

### 3. Test Deployed Frontend
1. Visit your deployed frontend URL
2. Test authentication (login/register)
3. Test API calls (dashboard, AI features)
4. Test Socket.IO connection (real-time features)

## 🚨 Common Issues & Solutions

### Issue: CORS Errors
**Solution:** Update backend `ALLOWED_ORIGINS` with frontend URL

### Issue: API Calls Fail
**Solution:** Check `VITE_API_BASE_URL` points to correct backend URL

### Issue: Socket.IO Connection Fails
**Solution:** Ensure `VITE_SOCKET_URL` matches backend URL

### Issue: Build Fails
**Solution:** Check all environment variables are set

### Issue: 404 on Refresh
**Solution:** Configure SPA redirects (see platform configs above)

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] Backend deployed and working
- [ ] Backend URL obtained
- [ ] Environment variables configured
- [ ] Local build tested

### Deployment
- [ ] Frontend deployed successfully
- [ ] Environment variables set on platform
- [ ] Backend CORS updated
- [ ] DNS configured (if custom domain)

### Post-Deployment
- [ ] Authentication works
- [ ] API calls successful
- [ ] Socket.IO connected
- [ ] All features functional
- [ ] Performance optimized

## 🔗 Useful Commands

```bash
# Local development with production backend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check build size
npm run build && du -sh dist

# Test API connection
curl https://your-backend.railway.app/health
```

## 📈 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Optimize images
# Use WebP format for images
# Implement lazy loading
```

### Caching Strategy
- Static assets: Long-term caching
- API responses: Short-term caching
- Images: CDN with compression

## 🔒 Security Considerations

- Use HTTPS for all environments
- Secure API keys in environment variables
- Implement proper CORS configuration
- Use CSP headers for XSS protection
- Regular dependency updates

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)