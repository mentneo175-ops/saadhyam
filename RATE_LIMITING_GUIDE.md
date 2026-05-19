# Rate Limiting Implementation Guide

## Overview

This application now includes a comprehensive rate limiting system similar to ChatGPT's "Too many requests" handling. When users exceed rate limits, they see a user-friendly modal with clear information about when they can retry.

## Backend Implementation

### 1. Rate Limiting Middleware

The backend uses `slowapi` with Redis for distributed rate limiting:

**Location:** `Backend/middleware/security.py`

**Features:**
- Custom error handler with user-friendly messages
- Retry-After headers
- Configurable rate limits per endpoint
- Redis-backed storage for distributed systems

**Configuration:**
```python
# Environment variables in .env
RATE_LIMIT_ENABLED=true
REDIS_URL=memory://  # Use redis://localhost:6379 for production
```

### 2. Rate Limit Presets

Pre-configured rate limits for different endpoint types:

```python
from middleware.security import RateLimitDecorators

# Authentication endpoints
AUTH_LOGIN = "5/minute"
AUTH_REGISTER = "3/minute"
AUTH_PASSWORD_RESET = "3/hour"

# API endpoints
API_READ = "100/minute"
API_WRITE = "50/minute"
API_DELETE = "20/minute"

# AI/ML operations
AI_GENERATION = "10/minute"
AI_ANALYSIS = "20/minute"
```

### 3. Applying Rate Limits to Routes

**Example 1: Basic rate limiting**
```python
from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/api/generate")
@limiter.limit("10/minute")
async def generate_content(request: Request):
    # Your endpoint logic
    pass
```

**Example 2: Using presets**
```python
from middleware.security import RateLimitDecorators

@router.post("/auth/login")
@limiter.limit(RateLimitDecorators.AUTH_LOGIN)
async def login(request: Request):
    # Login logic
    pass
```

**Example 3: Multiple rate limits**
```python
@router.post("/api/ai/analyze")
@limiter.limit("10/minute")  # Per minute limit
@limiter.limit("100/hour")   # Per hour limit
async def analyze(request: Request):
    # Analysis logic
    pass
```

## Frontend Implementation

### 1. API Utility

**Location:** `Frontend/src/utils/api.ts`

Centralized API client with automatic rate limit error handling:

```typescript
import { apiPost, ApiRequestError } from '@/utils/api';

try {
  const result = await apiPost('/api/generate', { prompt: 'Hello' });
  console.log(result);
} catch (error) {
  if (error instanceof ApiRequestError && error.isRateLimitError) {
    // Rate limit error - will be handled by global context
    console.log('Rate limited:', error.rateLimitInfo);
  } else {
    // Other errors
    console.error('API error:', error.message);
  }
}
```

### 2. Global Rate Limit Context

**Location:** `Frontend/src/contexts/RateLimitContext.tsx`

Already integrated in `__root.tsx` - provides global rate limit handling:

```typescript
import { useRateLimit } from '@/contexts/RateLimitContext';

function MyComponent() {
  const { handleApiError, isRateLimited } = useRateLimit();

  const handleSubmit = async () => {
    try {
      const result = await apiPost('/api/endpoint', data);
      // Handle success
    } catch (error) {
      // Automatically shows modal if rate limited
      if (!handleApiError(error)) {
        // Handle other errors
        console.error(error);
      }
    }
  };

  return (
    <button disabled={isRateLimited} onClick={handleSubmit}>
      Submit
    </button>
  );
}
```

### 3. Rate Limit Modal

**Location:** `Frontend/src/components/RateLimitModal.tsx`

Automatically displayed by the global context when rate limit is exceeded.

**Features:**
- User-friendly error message
- Wait time display
- Retry time display
- Auto-dismisses after retry period
- Dark mode support

## Usage Examples

### Example 1: Protected API Route

```python
# Backend: routes/ai.py
from fastapi import APIRouter, Request, Depends
from middleware.security import RateLimitDecorators
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/api/ai", tags=["AI"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/generate-content")
@limiter.limit(RateLimitDecorators.AI_GENERATION)
async def generate_content(
    request: Request,
    prompt: str,
    current_user = Depends(get_current_user)
):
    # Generate content
    return {"content": "Generated content"}
```

```typescript
// Frontend: components/ContentGenerator.tsx
import { apiPost } from '@/utils/api';
import { useRateLimit } from '@/contexts/RateLimitContext';

export function ContentGenerator() {
  const { handleApiError, isRateLimited } = useRateLimit();
  const [loading, setLoading] = useState(false);

  const generateContent = async (prompt: string) => {
    setLoading(true);
    try {
      const result = await apiPost('/api/ai/generate-content', { prompt });
      console.log('Generated:', result.content);
    } catch (error) {
      if (!handleApiError(error)) {
        // Handle other errors
        alert('Failed to generate content');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={() => generateContent('Hello')}
      disabled={loading || isRateLimited}
    >
      {isRateLimited ? 'Rate Limited' : 'Generate'}
    </button>
  );
}
```

### Example 2: File Upload with Rate Limiting

```python
# Backend
@router.post("/upload")
@limiter.limit(RateLimitDecorators.FILE_UPLOAD)
async def upload_file(
    request: Request,
    file: UploadFile = File(...)
):
    # Handle upload
    return {"filename": file.filename}
```

```typescript
// Frontend
import { apiUpload } from '@/utils/api';
import { useRateLimit } from '@/contexts/RateLimitContext';

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const result = await apiUpload('/api/upload', formData);
    console.log('Uploaded:', result);
  } catch (error) {
    handleApiError(error);
  }
};
```

## Testing Rate Limits

### 1. Test Backend Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..20}; do
  curl -X POST http://localhost:8000/api/endpoint \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
done
```

### 2. Test Frontend Handling

```typescript
// In your component
const testRateLimit = async () => {
  // Send 15 requests quickly (limit is 10/minute)
  for (let i = 0; i < 15; i++) {
    try {
      await apiPost('/api/test', { index: i });
    } catch (error) {
      console.log(`Request ${i} failed:`, error);
    }
  }
};
```

## Configuration

### Backend Configuration

**Environment Variables (.env):**
```env
# Rate Limiting
RATE_LIMIT_ENABLED=true
REDIS_URL=memory://  # Development
# REDIS_URL=redis://localhost:6379  # Production

# Request Size Limits
MAX_REQUEST_SIZE_MB=10
```

### Customizing Rate Limits

**Per-endpoint customization:**
```python
# Strict limit for expensive operations
@router.post("/expensive-operation")
@limiter.limit("5/minute")
async def expensive_operation(request: Request):
    pass

# Relaxed limit for read operations
@router.get("/data")
@limiter.limit("200/minute")
async def get_data(request: Request):
    pass
```

## Production Recommendations

1. **Use Redis for distributed systems:**
   ```env
   REDIS_URL=redis://your-redis-host:6379
   ```

2. **Adjust limits based on your infrastructure:**
   - Start conservative (lower limits)
   - Monitor usage patterns
   - Gradually increase as needed

3. **Consider user tiers:**
   ```python
   def get_user_limit(user):
       if user.is_premium:
           return "100/minute"
       return "20/minute"
   
   @router.post("/api/endpoint")
   @limiter.limit(get_user_limit)
   async def endpoint(request: Request, user = Depends(get_current_user)):
       pass
   ```

4. **Monitor rate limit hits:**
   - Log rate limit violations
   - Alert on unusual patterns
   - Adjust limits based on data

## Troubleshooting

### Modal not showing?

1. Check that `RateLimitProvider` is in `__root.tsx` ✅ (Already done)
2. Verify API calls use the `api` utility functions
3. Check browser console for errors

### Rate limits not working?

1. Verify `RATE_LIMIT_ENABLED=true` in `.env`
2. Check Redis connection (if using Redis)
3. Ensure `@limiter.limit()` decorator is applied to routes
4. Check that `app.state.limiter` is set in `main.py`

### Different limits for different users?

Use dynamic rate limit functions:
```python
def get_rate_limit(request: Request):
    user = get_current_user(request)
    return user.rate_limit  # e.g., "100/minute"

@router.post("/api/endpoint")
@limiter.limit(get_rate_limit)
async def endpoint(request: Request):
    pass
```

## Summary

✅ **Backend:** Rate limiting middleware with custom error handler
✅ **Frontend:** Global context with automatic modal display
✅ **Integration:** Already integrated in `__root.tsx`
✅ **User Experience:** ChatGPT-style error messages

Your application now has enterprise-grade rate limiting with excellent user experience!
