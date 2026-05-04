# Job Tracking System - Debug & Fix Summary

## Problem Identified
Frontend was calling `GET /api/v1/website-ai/jobs/{job_id}` but the endpoint only existed as `/jobs/{job_id}/status`, causing 404 errors.

## Root Causes
1. **Missing Endpoint**: No route for `/jobs/{job_id}` (without `/status` suffix)
2. **UUID Format Mismatch**: SQLite stores UUIDs without hyphens, but lookups weren't handling both formats
3. **Insufficient Logging**: No visibility into job creation, lookup, or processing
4. **Task Not Executing**: Celery tasks weren't being picked up by workers

## Fixes Applied

### 1. Added Missing Endpoint
**File**: `Backend/ai_models/website_ai/app/api/v1/routes/jobs.py`

```python
@router.get("/{job_id}")
async def get_job(job_id: str, db: Session = Depends(get_db)):
    """Main endpoint for job status - handles UUID with or without hyphens"""
    logger.info(f"📊 Fetching job status for: {job_id}")
    
    # Handle both UUID formats (with/without hyphens)
    job_id_clean = job_id.replace("-", "")
    job = db.query(Job).filter(Job.id == job_id_clean).first()
    
    if not job:
        logger.warning(f"❌ Job not found: {job_id}")
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    logger.info(f"✅ Job {job_id}: status={job.status}, progress={job.progress}%")
    return JobStatusResponse(...)
```

### 2. Enhanced Logging Throughout

**Generation Endpoint** (`generation.py`):
- ✅ Log job creation with full details
- ✅ Log Celery task queueing
- ✅ Log task ID for tracking

**Worker Task** (`generation_tasks.py`):
- ✅ Log task start with business details
- ✅ Log database lookup attempts
- ✅ Log status updates at each progress step
- ✅ Handle UUID format variations

### 3. Fixed Celery Configuration
**File**: `Backend/ai_models/website_ai/app/config.py`

Changed from hardcoded values to environment variables:
```python
CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1")
```

### 4. Worker Node Name Uniqueness
Started Website AI worker with unique node name to avoid conflicts:
```bash
celery -A ai_models.website_ai.app.workers.celery_app worker -n website_ai@%h
```

## Complete Job Lifecycle Flow

### 1. Job Creation (POST /api/v1/website-ai/generate)
```
User submits form
  ↓
Backend creates Job record in database
  - id: UUID (stored without hyphens in SQLite)
  - status: "pending"
  - progress: 0
  ↓
Backend queues Celery task
  - Task sent to Redis (db 0)
  ↓
Returns job_id to frontend (with hyphens for display)
```

### 2. Job Processing (Celery Worker)
```
Worker picks up task from Redis
  ↓
Looks up job in database (handles UUID format)
  ↓
Updates status to "processing", progress to 10%
  ↓
Generates AI content (progress: 30%)
  ↓
Renders template (progress: 60%)
  ↓
Saves to storage (progress: 80%)
  ↓
Creates Website record (progress: 90%)
  ↓
Updates job: status="completed", progress=100%
```

### 3. Status Polling (GET /api/v1/website-ai/jobs/{job_id})
```
Frontend polls every 2 seconds
  ↓
Backend receives job_id (with hyphens)
  ↓
Removes hyphens for database lookup
  ↓
Returns current status and progress
  ↓
Frontend updates UI
```

## API Endpoints

### POST /api/v1/website-ai/generate
**Request**:
```json
{
  "business_name": "My Business",
  "business_type": "Restaurant",
  "theme": "hero-split",
  "description": "...",
  "services": ["..."],
  "contact_email": "...",
  "contact_phone": "..."
}
```

**Response** (202 Accepted):
```json
{
  "job_id": "a0f6591d-0b2d-483c-af9a-21b3062cc213",
  "status": "pending",
  "message": "Website generation started. Use job_id to check status."
}
```

### GET /api/v1/website-ai/jobs/{job_id}
**Response** (200 OK):
```json
{
  "job_id": "a0f6591d-0b2d-483c-af9a-21b3062cc213",
  "status": "processing",
  "progress": 60,
  "created_at": "2026-05-04T16:55:00Z",
  "started_at": "2026-05-04T16:55:02Z",
  "completed_at": null,
  "error_message": null
}
```

**Possible Status Values**:
- `pending`: Job created, waiting for worker
- `processing`: Worker is generating website
- `completed`: Website generated successfully
- `failed`: Generation failed (check error_message)

## Verification Steps

1. **Check Backend Logs**:
   ```
   ✅ Created job {job_id} for website generation
   📝 Job details: status=pending, progress=0%
   📤 Queueing Celery task for job {job_id}
   ✅ Task queued with ID: {task_id}
   ```

2. **Check Worker Logs**:
   ```
   🚀 Starting website generation for job {job_id}
   🔍 Looking up job {job_id} in database
   ✅ Found job {job_id}, updating status to processing
   📝 Job {job_id}: status=processing, progress=10%
   ```

3. **Check Job Status**:
   ```bash
   curl http://localhost:8000/api/v1/website-ai/jobs/{job_id}
   ```

4. **Check Redis Queue**:
   ```python
   import redis
   r = redis.Redis(host='localhost', port=6379, db=0)
   print(f"Queue length: {r.llen('celery')}")
   ```

## Troubleshooting

### Job stays in "pending" status
- ✅ Check if Celery worker is running
- ✅ Check worker logs for errors
- ✅ Verify Redis connection
- ✅ Check if task is in Redis queue

### 404 Not Found errors
- ✅ Verify backend is running
- ✅ Check route is registered in main.py
- ✅ Verify job_id format (with/without hyphens)
- ✅ Check database for job existence

### Worker not processing tasks
- ✅ Verify unique worker node names
- ✅ Check Celery broker URL matches Redis
- ✅ Restart worker after code changes
- ✅ Check for duplicate worker warnings

## Services Status

✅ **Redis Server**: Port 6379
✅ **Main Celery Worker**: `celery@LATITUDE` (Instagram tasks)
✅ **Website AI Worker**: `website_ai@LATITUDE` (Website generation)
✅ **Backend**: Port 8000 (running manually by user)
✅ **Frontend**: Port 8081

## Next Steps

1. **Restart Backend**: User needs to restart the backend server to apply endpoint changes
2. **Test Generation**: Try generating a website from the frontend
3. **Monitor Logs**: Watch both backend and worker logs for the complete flow
4. **Verify Status Updates**: Confirm frontend receives status updates correctly

## Code Changes Summary

- ✅ Added `GET /jobs/{job_id}` endpoint
- ✅ Added UUID format handling (with/without hyphens)
- ✅ Added comprehensive logging throughout
- ✅ Fixed Celery configuration to use environment variables
- ✅ Enhanced error messages with context
- ✅ Worker task now handles UUID format variations
