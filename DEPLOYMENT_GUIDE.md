# Sadhyam AI - Single Server Deployment Guide

## 🎯 Overview

This guide explains how to deploy the entire Sadhyam AI application on **ONE SERVER** efficiently.

---

## 📊 Current Architecture

Your application has:
- **Frontend**: React + Vite (Port 5173 dev, Port 80/443 production)
- **Backend**: FastAPI (Port 8000)
- **Database**: PostgreSQL (Port 5432)
- **AI Models**: 
  - TinyLlama (loaded in main backend)
  - Gemini API (external, no server needed)
- **Background Jobs**: 
  - Instagram post scheduler
  - Token refresh scheduler
- **Real-time**: Socket.IO (integrated in backend)

---

## 🚀 Recommended Single Server Setup

### **Option 1: All-in-One Server (Recommended for Start)**

**Server Specs:**
- **CPU**: 4-8 cores
- **RAM**: 16GB minimum (32GB recommended)
- **Storage**: 100GB SSD
- **OS**: Ubuntu 22.04 LTS

**Why this works:**
- ✅ Your AI models use external APIs (Gemini, Mistral)
- ✅ TinyLlama is small and loads on-demand
- ✅ Background jobs are lightweight schedulers
- ✅ Socket.IO is integrated (no separate server)
- ✅ PostgreSQL is efficient for your user base

**Cost**: $40-80/month (DigitalOcean, Linode, Vultr)

---

## 📦 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│           SINGLE SERVER (Ubuntu 22.04)          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  NGINX (Reverse Proxy + SSL)             │  │
│  │  - Port 80/443 → Frontend (static)       │  │
│  │  - /api → Backend (port 8000)            │  │
│  │  - /socket.io → Backend (WebSocket)      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Frontend (Built Static Files)           │  │
│  │  - Served by NGINX                       │  │
│  │  - No Node.js needed in production       │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Backend (FastAPI + Uvicorn)             │  │
│  │  - Port 8000 (internal)                  │  │
│  │  - 4 workers (gunicorn + uvicorn)        │  │
│  │  - TinyLlama loaded on-demand            │  │
│  │  - Socket.IO integrated                  │  │
│  │  - Background schedulers running         │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  PostgreSQL Database                     │  │
│  │  - Port 5432 (localhost only)            │  │
│  │  - Optimized for concurrent connections  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Process Manager (PM2 or Supervisor)     │  │
│  │  - Auto-restart on crash                 │  │
│  │  - Log management                        │  │
│  │  - Resource monitoring                   │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Deployment

### **1. Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.11 python3.11-venv python3-pip postgresql postgresql-contrib nginx certbot python3-certbot-nginx git curl

# Install Node.js (for building frontend only)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### **2. Database Setup**

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE sadhyam_db;
CREATE USER sadhyam_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sadhyam_db TO sadhyam_user;
\q
EOF
```

### **3. Application Setup**

```bash
# Create app directory
sudo mkdir -p /var/www/sadhyam
sudo chown $USER:$USER /var/www/sadhyam
cd /var/www/sadhyam

# Clone your repository
git clone https://github.com/yourusername/sadhyam.git .

# Backend setup
cd Backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create production .env
cat > .env << EOF
DATABASE_URL=postgresql://sadhyam_user:your_secure_password@localhost:5432/sadhyam_db
SECRET_KEY=your_super_secret_key_here
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com
GEMINI_API_KEY=your_gemini_key
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
# Add all other environment variables
EOF

# Frontend setup
cd ../Frontend
npm install
npm run build  # Creates dist/ folder with static files
```

### **4. NGINX Configuration**

```bash
# Create NGINX config
sudo nano /etc/nginx/sites-available/sadhyam
```

```nginx
# /etc/nginx/sites-available/sadhyam

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend static files
    location / {
        root /var/www/sadhyam/Frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for AI operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO WebSocket
    location /socket.io {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File upload size limit
    client_max_body_size 50M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sadhyam /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### **5. SSL Certificate**

```bash
# Get free SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **6. Process Manager Setup (Using Supervisor)**

```bash
# Install supervisor
sudo apt install -y supervisor

# Create supervisor config
sudo nano /etc/supervisor/conf.d/sadhyam.conf
```

```ini
[program:sadhyam-backend]
directory=/var/www/sadhyam/Backend
command=/var/www/sadhyam/Backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --timeout 120 --access-logfile /var/log/sadhyam/access.log --error-logfile /var/log/sadhyam/error.log
user=www-data
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/var/log/sadhyam/backend-error.log
stdout_logfile=/var/log/sadhyam/backend-out.log
environment=PATH="/var/www/sadhyam/Backend/venv/bin"
```

```bash
# Create log directory
sudo mkdir -p /var/log/sadhyam
sudo chown www-data:www-data /var/log/sadhyam

# Start supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start sadhyam-backend
```

---

## 🔧 Resource Optimization

### **Backend Configuration**

```python
# Backend/config/settings.py

# Production settings
WORKERS = 4  # Number of Gunicorn workers (2 x CPU cores)
WORKER_CLASS = "uvicorn.workers.UvicornWorker"
TIMEOUT = 120  # Timeout for long AI operations
KEEPALIVE = 5

# Database connection pool
DATABASE_POOL_SIZE = 20
DATABASE_MAX_OVERFLOW = 10

# TinyLlama settings
LOAD_TINYLLAMA_ON_STARTUP = False  # Load on-demand to save memory
```

### **PostgreSQL Optimization**

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```conf
# Memory settings (for 16GB RAM server)
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB

# Connection settings
max_connections = 100

# Performance
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 📊 Monitoring & Maintenance

### **1. System Monitoring**

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Check system resources
htop  # CPU and RAM
df -h  # Disk space
sudo iotop  # Disk I/O
```

### **2. Application Logs**

```bash
# Backend logs
sudo tail -f /var/log/sadhyam/backend-error.log
sudo tail -f /var/log/sadhyam/backend-out.log

# NGINX logs
sudo tail -f /var/nginx/access.log
sudo tail -f /var/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### **3. Backup Strategy**

```bash
# Create backup script
sudo nano /usr/local/bin/backup-sadhyam.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sadhyam"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U sadhyam_user sadhyam_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploaded files (if any)
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/sadhyam/Backend/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-sadhyam.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-sadhyam.sh
```

---

## 🚦 Deployment Checklist

### **Before Deployment:**
- [ ] Update all environment variables in `.env`
- [ ] Change all default passwords
- [ ] Test application locally
- [ ] Build frontend (`npm run build`)
- [ ] Run database migrations
- [ ] Test all API endpoints

### **During Deployment:**
- [ ] Server provisioned and secured
- [ ] PostgreSQL installed and configured
- [ ] Application code deployed
- [ ] NGINX configured
- [ ] SSL certificate installed
- [ ] Supervisor configured
- [ ] Firewall configured (UFW)

### **After Deployment:**
- [ ] Test all features
- [ ] Check logs for errors
- [ ] Monitor resource usage
- [ ] Set up backups
- [ ] Configure monitoring alerts
- [ ] Document any issues

---

## 💰 Cost Breakdown (Single Server)

### **Monthly Costs:**

| Service | Provider | Specs | Cost |
|---------|----------|-------|------|
| **Server** | DigitalOcean/Linode | 4 CPU, 16GB RAM, 100GB SSD | $60-80 |
| **Domain** | Namecheap/GoDaddy | .com domain | $12/year |
| **SSL** | Let's Encrypt | Free SSL certificate | $0 |
| **Backups** | Server snapshots | Weekly snapshots | $5-10 |
| **External APIs** | Gemini, Instagram, etc. | Pay-as-you-go | $10-50 |

**Total: ~$75-140/month**

---

## 🔄 Scaling Strategy (When Needed)

### **When to Scale:**
- CPU usage consistently > 80%
- RAM usage consistently > 90%
- Response times > 3 seconds
- More than 1000 concurrent users

### **Scaling Options:**

**Option 1: Vertical Scaling (Easier)**
- Upgrade to 8 CPU, 32GB RAM server
- Cost: $120-160/month
- No code changes needed

**Option 2: Horizontal Scaling (Later)**
- Separate database server
- Add load balancer
- Multiple backend instances
- Cost: $200-300/month

---

## 🎯 Recommendations

### **For Initial Launch:**
✅ **Use Single Server** (Option 1)
- Simpler to manage
- Lower cost
- Sufficient for 100-1000 users
- Easy to monitor

### **When to Separate:**
❌ **Don't separate until:**
- You have 1000+ active users
- Server resources consistently maxed
- You have budget for $200+/month
- You have DevOps expertise

### **Current Setup is Perfect Because:**
1. ✅ AI models use external APIs (no GPU needed)
2. ✅ TinyLlama is small (loads on-demand)
3. ✅ Background jobs are lightweight
4. ✅ Socket.IO is integrated
5. ✅ PostgreSQL handles your load easily

---

## 📞 Support

If you need help with deployment:
1. Check logs first
2. Review this guide
3. Test locally before deploying
4. Monitor resource usage

**Remember: Start simple, scale when needed!** 🚀
