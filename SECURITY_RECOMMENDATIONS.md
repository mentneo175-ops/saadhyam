# 🔒 Security & Route Protection Recommendations

**Application:** Saadhyam AI Platform  
**Date:** May 15, 2026  
**Priority:** HIGH - Production Deployment

---

## 📊 Current Security Status

### ✅ What's Already Implemented

1. **JWT Authentication**
   - Bearer token authentication
   - Token validation with `get_current_user` dependency
   - Firebase Admin SDK integration
   - Token expiration handling

2. **CORS Protection**
   - CORSMiddleware configured
   - Allowed origins specified
   - Credentials support enabled

3. **Password Security**
   - PBKDF2-SHA256 hashing (100,000 rounds)
   - Bcrypt fallback support
   - Password length validation

4. **API Rate Limiting (Partial)**
   - Gemini API rate limiter (5 requests/minute)
   - Custom rate limiter for AI services
   - Not applied to all routes

5. **Database Security**
   - PostgreSQL with NeonDB
   - Connection pooling
   - SQL injection protection (SQLAlchemy ORM)

---

## ⚠️ Critical Security Gaps

### 🔴 HIGH PRIORITY (Fix Immediately)

#### 1. **Missing Global Rate Limiting**
**Risk:** API abuse, DDoS attacks, resource exhaustion  
**Current State:** Only Gemini API has rate limiting  
**Impact:** Attackers can overwhelm your server with unlimited requests

**Solution:**
```python
# Install slowapi
pip install slowapi

# Add to main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to routes
@router.post("/api/auth/login")
@limiter.limit("5/minute")  # 5 login attempts per minute
async def login(request: Request, ...):
    pass
```

**Recommended Limits:**
- Login/Register: `5/minute` per IP
- Password Reset: `3/hour` per IP
- API calls (authenticated): `100/minute` per user
- Public endpoints: `20/minute` per IP
- File uploads: `10/hour` per user
- AI generation: `10/minute` per user

---

#### 2. **No Request Size Limits**
**Risk:** Memory exhaustion, server crash  
**Current State:** No file size or request body limits  
**Impact:** Attackers can upload huge files or send massive payloads

**Solution:**
```python
# Add to main.py
from fastapi import Request
from fastapi.exceptions import RequestValidationError

# Limit request body size (10MB default)
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=413,
            detail="Request body too large. Maximum size is 10MB"
        )
    return await call_next(request)

# For file uploads
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(..., max_length=5*1024*1024)  # 5MB limit
):
    pass
```

**Recommended Limits:**
- Images: 5MB
- Videos: 50MB
- Documents: 10MB
- JSON requests: 1MB

---

#### 3. **CORS Configuration Too Permissive**
**Risk:** Cross-site attacks, unauthorized access  
**Current State:** Allows multiple origins including localhost  
**Impact:** Production site vulnerable to CSRF attacks

**Current Configuration:**
```python
allow_origins=[
    "http://localhost:8080",
    "http://localhost:8081",
    # ... more localhost ports
]
```

**Production Solution:**
```python
import os

# Environment-based CORS
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    allowed_origins = [
        "https://yourdomain.com",
        "https://www.yourdomain.com",
        "https://app.yourdomain.com"
    ]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:5173"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    max_age=3600  # Cache preflight for 1 hour
)
```

---

#### 4. **No Token Blacklist (Redis)**
**Risk:** Stolen tokens remain valid until expiration  
**Current State:** Comment says "Redis not available"  
**Impact:** Logged-out users can still access API

**Solution:**
```python
# Install redis
pip install redis

# Add to utils/dependencies.py
import redis
from config.settings import settings

redis_client = redis.from_url(settings.REDIS_URL)

def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db_sync),
) -> User:
    # ... existing token decode logic ...
    
    # Check if token is blacklisted
    if redis_client.get(f"blacklist:{token}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    
    # ... rest of logic ...

# Add logout endpoint
@router.post("/logout")
async def logout(
    authorization: str = Header(...),
    current_user: User = Depends(get_current_user)
):
    token = authorization.split()[1]
    # Blacklist token until expiration
    redis_client.setex(
        f"blacklist:{token}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "1"
    )
    return {"message": "Logged out successfully"}
```

---

#### 5. **Missing Input Validation**
**Risk:** SQL injection, XSS, command injection  
**Current State:** Basic Pydantic validation only  
**Impact:** Malicious input can compromise system

**Solution:**
```python
# Create utils/validators.py
import re
from typing import Optional
from fastapi import HTTPException

def sanitize_string(value: str, max_length: int = 255) -> str:
    """Remove dangerous characters"""
    if not value:
        return value
    
    # Remove HTML tags
    value = re.sub(r'<[^>]+>', '', value)
    
    # Remove SQL injection attempts
    dangerous_patterns = [
        r'(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)',
        r'(--|;|\/\*|\*\/)',
        r'(\bOR\b\s+\d+\s*=\s*\d+)',
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            raise HTTPException(
                status_code=400,
                detail="Invalid input detected"
            )
    
    return value[:max_length]

def validate_email(email: str) -> str:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format"
        )
    return email.lower()

def validate_phone(phone: str) -> str:
    """Validate phone number"""
    # Remove non-digits
    phone = re.sub(r'\D', '', phone)
    if len(phone) < 10 or len(phone) > 15:
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number"
        )
    return phone
```

---

### 🟡 MEDIUM PRIORITY (Fix Before Production)

#### 6. **No HTTPS Enforcement**
**Risk:** Man-in-the-middle attacks, credential theft  
**Solution:**
```python
# Add to main.py
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

if ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

---

#### 7. **Missing Security Headers**
**Risk:** XSS, clickjacking, MIME sniffing attacks  
**Solution:**
```python
# Add to main.py
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

---

#### 8. **No API Key Rotation**
**Risk:** Compromised API keys remain valid indefinitely  
**Solution:**
```python
# Create utils/api_key_manager.py
import secrets
from datetime import datetime, timedelta

class APIKeyManager:
    def generate_api_key(self, user_id: int, db: Session) -> str:
        """Generate new API key for user"""
        key = f"sk_{secrets.token_urlsafe(32)}"
        
        # Store in database with expiration
        api_key = APIKey(
            user_id=user_id,
            key_hash=hash_password(key),
            expires_at=datetime.utcnow() + timedelta(days=90),
            created_at=datetime.utcnow()
        )
        db.add(api_key)
        db.commit()
        
        return key  # Return only once
    
    def rotate_api_key(self, old_key: str, db: Session) -> str:
        """Rotate API key"""
        # Revoke old key
        old_key_obj = db.query(APIKey).filter(
            APIKey.key_hash == hash_password(old_key)
        ).first()
        
        if old_key_obj:
            old_key_obj.revoked = True
            db.commit()
        
        # Generate new key
        return self.generate_api_key(old_key_obj.user_id, db)
```

---

#### 9. **No Audit Logging**
**Risk:** Cannot track security incidents or user actions  
**Solution:**
```python
# Create utils/audit_logger.py
import logging
from datetime import datetime
from models.audit_log import AuditLog

class AuditLogger:
    @staticmethod
    def log_action(
        user_id: int,
        action: str,
        resource: str,
        ip_address: str,
        user_agent: str,
        db: Session
    ):
        """Log user action for audit trail"""
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow()
        )
        db.add(log)
        db.commit()

# Use in routes
@router.post("/api/sensitive-action")
async def sensitive_action(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    AuditLogger.log_action(
        user_id=current_user.id,
        action="SENSITIVE_ACTION",
        resource="/api/sensitive-action",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent"),
        db=db
    )
    # ... rest of logic ...
```

---

#### 10. **Weak Password Policy**
**Risk:** Easy-to-guess passwords, brute force attacks  
**Solution:**
```python
# Add to utils/validators.py
import re

def validate_password_strength(password: str) -> str:
    """Enforce strong password policy"""
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters"
        )
    
    if len(password) > 128:
        raise HTTPException(
            status_code=400,
            detail="Password too long (max 128 characters)"
        )
    
    # Check for complexity
    has_upper = re.search(r'[A-Z]', password)
    has_lower = re.search(r'[a-z]', password)
    has_digit = re.search(r'\d', password)
    has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
    
    if not (has_upper and has_lower and has_digit and has_special):
        raise HTTPException(
            status_code=400,
            detail="Password must contain uppercase, lowercase, digit, and special character"
        )
    
    # Check against common passwords
    common_passwords = ["password", "12345678", "qwerty", "admin"]
    if password.lower() in common_passwords:
        raise HTTPException(
            status_code=400,
            detail="Password is too common"
        )
    
    return password
```

---

### 🟢 LOW PRIORITY (Nice to Have)

#### 11. **No 2FA/MFA**
**Risk:** Account takeover if password compromised  
**Solution:** Implement TOTP (Time-based One-Time Password)

#### 12. **No IP Whitelisting for Admin**
**Risk:** Admin panel accessible from anywhere  
**Solution:** Restrict admin routes to specific IPs

#### 13. **No Honeypot Fields**
**Risk:** Bot registrations  
**Solution:** Add hidden form fields to catch bots

#### 14. **No CAPTCHA**
**Risk:** Automated abuse  
**Solution:** Add reCAPTCHA to registration/login

---

## 🛡️ Route Protection Matrix

### Public Routes (No Authentication)
```
✅ GET  /health
✅ GET  /docs
✅ POST /auth/register
✅ POST /auth/login
✅ POST /auth/google
✅ POST /auth/forgot-password
✅ GET  /auth/verify-email
```

### Protected Routes (Requires Authentication)
```
🔒 GET  /me
🔒 POST /auth/logout
🔒 GET  /api/business/*
🔒 GET  /api/instagram/*
🔒 POST /api/instagram/*
🔒 GET  /api/whatsapp/*
🔒 POST /api/whatsapp/*
🔒 GET  /api/tasks/*
🔒 POST /api/tasks/*
🔒 GET  /api/voice-agent/*
🔒 POST /api/voice-agent/*
🔒 GET  /api/b2b-network/*
🔒 GET  /api/settings/*
🔒 PUT  /api/settings/*
```

### Admin Routes (Requires Admin Role)
```
🔐 GET  /admin/*
🔐 POST /admin/*
🔐 DELETE /admin/users/*
```

---

## 📋 Implementation Checklist

### Phase 1: Critical (Week 1)
- [ ] Implement global rate limiting (slowapi)
- [ ] Add request size limits
- [ ] Fix CORS for production
- [ ] Implement token blacklist (Redis)
- [ ] Add input validation/sanitization
- [ ] Add security headers middleware

### Phase 2: Important (Week 2)
- [ ] Enforce HTTPS in production
- [ ] Implement audit logging
- [ ] Add password strength validation
- [ ] Implement API key rotation
- [ ] Add role-based access control (RBAC)
- [ ] Set up monitoring/alerting

### Phase 3: Enhancement (Week 3)
- [ ] Add 2FA/MFA support
- [ ] Implement IP whitelisting for admin
- [ ] Add CAPTCHA to forms
- [ ] Set up WAF (Web Application Firewall)
- [ ] Implement session management
- [ ] Add security scanning (OWASP ZAP)

---

## 🚀 Quick Start Implementation

### 1. Install Required Packages
```bash
pip install slowapi redis python-multipart
```

### 2. Create Security Middleware File
```bash
# Create Backend/middleware/security.py
```

### 3. Update main.py
```python
from middleware.security import (
    add_rate_limiting,
    add_security_headers,
    limit_request_size
)

# Add middlewares
add_rate_limiting(app)
app.middleware("http")(add_security_headers)
app.middleware("http")(limit_request_size)
```

### 4. Update .env
```env
# Security Settings
ENVIRONMENT=production
RATE_LIMIT_ENABLED=true
MAX_REQUEST_SIZE_MB=10
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 📊 Security Monitoring

### Metrics to Track
1. Failed login attempts per IP
2. Rate limit violations
3. Invalid token attempts
4. Unusual API usage patterns
5. Large file upload attempts
6. SQL injection attempts
7. XSS attempts

### Alerting Rules
- Alert if >10 failed logins from same IP in 5 minutes
- Alert if rate limit exceeded >100 times in 1 hour
- Alert if >5 invalid tokens from same IP
- Alert if request size >50MB attempted

---

## 🔗 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)

---

**Priority:** Implement Phase 1 (Critical) before production deployment!  
**Estimated Time:** 2-3 days for Phase 1  
**Risk Level:** HIGH if not implemented

