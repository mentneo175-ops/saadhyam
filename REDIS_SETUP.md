# 🔴 Redis Setup Guide for Windows

## Option 1: Docker Command (Recommended)

### Quick Start - Single Command:
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

### With Persistence (Data survives container restart):
```bash
docker run -d --name redis -p 6379:6379 -v redis-data:/data redis:latest redis-server --appendonly yes
```

### With Password Protection:
```bash
docker run -d --name redis -p 6379:6379 redis:latest redis-server --requirepass your_password_here
```

---

## Option 2: Docker Compose (Best for Development)

### Create `docker-compose.redis.yml`:
```yaml
version: '3.8'

services:
  redis:
    image: redis:latest
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis-data:
```

### Run with Docker Compose:
```bash
docker-compose -f docker-compose.redis.yml up -d
```

---

## Option 3: Redis with Redis Commander (GUI)

### Create `docker-compose.redis-full.yml`:
```yaml
version: '3.8'

services:
  redis:
    image: redis:latest
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: redis-commander
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis-data:
```

### Run:
```bash
docker-compose -f docker-compose.redis-full.yml up -d
```

### Access Redis Commander:
- URL: http://localhost:8081
- View and manage Redis data through web UI

---

## 🚀 Quick Commands

### Start Redis:
```bash
docker start redis
```

### Stop Redis:
```bash
docker stop redis
```

### Restart Redis:
```bash
docker restart redis
```

### View Redis Logs:
```bash
docker logs redis
```

### Follow Redis Logs (live):
```bash
docker logs -f redis
```

### Check Redis Status:
```bash
docker ps | findstr redis
```

### Connect to Redis CLI:
```bash
docker exec -it redis redis-cli
```

### Test Redis Connection:
```bash
docker exec -it redis redis-cli ping
# Should return: PONG
```

### Remove Redis Container:
```bash
docker stop redis
docker rm redis
```

### Remove Redis Container and Data:
```bash
docker stop redis
docker rm redis
docker volume rm redis-data
```

---

## 🔧 Configuration for Your Backend

### Update `Backend/.env`:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Or if using password:
# REDIS_PASSWORD=your_password_here

# Redis URL (alternative format)
REDIS_URL=redis://localhost:6379/0
```

---

## 🧪 Test Redis Connection

### Using Python:
```python
import redis

# Test connection
r = redis.Redis(host='localhost', port=6379, db=0)
r.ping()  # Should return True
print("Redis connected!")

# Set a value
r.set('test', 'Hello Redis!')

# Get a value
value = r.get('test')
print(value)  # Should print: b'Hello Redis!'
```

### Using Redis CLI:
```bash
# Connect to Redis
docker exec -it redis redis-cli

# Test commands
127.0.0.1:6379> PING
PONG

127.0.0.1:6379> SET mykey "Hello"
OK

127.0.0.1:6379> GET mykey
"Hello"

127.0.0.1:6379> EXIT
```

---

## 📦 Install Redis Python Client

```bash
cd Backend
pip install redis
```

Or add to `requirements.txt`:
```
redis==5.0.1
```

---

## 🐛 Troubleshooting

### Issue: Docker not found
**Solution:**
1. Install Docker Desktop for Windows
2. Download from: https://www.docker.com/products/docker-desktop/
3. Restart your computer after installation

### Issue: Port 6379 already in use
**Solution:**
```bash
# Find process using port 6379
netstat -ano | findstr :6379

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
docker run -d --name redis -p 6380:6379 redis:latest
```

### Issue: Cannot connect to Redis
**Solution:**
```bash
# Check if Redis is running
docker ps | findstr redis

# Check Redis logs
docker logs redis

# Restart Redis
docker restart redis
```

### Issue: Permission denied
**Solution:**
- Run PowerShell or CMD as Administrator
- Or check Docker Desktop is running

---

## 🎯 Recommended Setup for Your Project

### Step 1: Run Redis with Docker
```bash
docker run -d --name redis -p 6379:6379 -v redis-data:/data redis:latest redis-server --appendonly yes
```

### Step 2: Verify Redis is Running
```bash
docker ps | findstr redis
```

### Step 3: Test Connection
```bash
docker exec -it redis redis-cli ping
```

### Step 4: Update Backend .env
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### Step 5: Install Python Redis Client
```bash
cd Backend
pip install redis
```

### Step 6: Restart Backend
```bash
python main.py
```

---

## 📊 Redis Usage in Your Project

Redis can be used for:
- ✅ Caching API responses
- ✅ Session storage
- ✅ Rate limiting
- ✅ Queue management (Celery)
- ✅ Real-time data
- ✅ Temporary data storage

---

## 🔒 Production Configuration

For production, use password protection:

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  --restart unless-stopped \
  redis:latest \
  redis-server \
  --appendonly yes \
  --requirepass "your_strong_password_here"
```

Update `.env`:
```env
REDIS_PASSWORD=your_strong_password_here
REDIS_URL=redis://:your_strong_password_here@localhost:6379/0
```

---

## 📝 Summary

**Quickest way to get started:**

1. Run this command:
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

2. Verify it's running:
```bash
docker exec -it redis redis-cli ping
```

3. You're done! Redis is now running on `localhost:6379`

---

## 🎉 That's It!

Redis is now ready to use with your Saadhyam Business AI project!
