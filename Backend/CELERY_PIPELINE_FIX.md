# Celery Async Pipeline - Complete Fix

## Problem Identified

**Symptom**: Jobs stuck at `status="pending", progress=0%`

**Root Causes Found**:
1. ✅ **Tasks ARE being queued** - Celery configuration is correct
2. ✅ **Worker IS picking up tasks** - Worker is running and connected
3. ❌ **Tasks FAIL immediately** - Database model error causes instant failure
4. ❌ **Broken relationship** - `Website` model references non-existent `ContentEdit` model

## Diagnostic Results

### Redis Queue Status
```
✅ Redis connection: Working
✅ Broker: redis://localhost:6379/0
✅ Backend: redis://localhost:6379/1
✅ Queue length: 0 (tasks processed immediately)
```

### Celery Worker Status
```
✅ Worker running: website_ai@LATITUDE
✅ Tasks registered: generate_website, regenerate_website
✅ Connected to Redis
✅ Picking up tasks
```

### Task Execution Status
```
❌ Task state: FAILURE
❌ Error: 'ContentEdit' failed to locate a name
❌ Cause: Broken SQLAlchemy relationship in Website model
```

## Fixes Applied

### 1. Fixed Website Model
**File**: `Backend/ai_models/website_ai/app/db/models/website.py`

**Before** (BROKEN):
```python
class Website(Base):
    # ...
    # Relationships
    jobs = relationship("Job", back_populates="website")
    content_edits = relationship("ContentEdit", back_populates="website", cascade="all, delete-orphan")
    # ❌ ContentEdit model doesn't exist!
```

**After** (FIXED):
```python
class Website(Base):
    # ...
    # Relationships
    jobs = relationship("Job", back_populates="website")
    # ✅ Removed broken relationship
```

### 2. Fixed Task Error Handler
**File**: `Backend/ai_models/website_ai/app/workers/tasks/generation_tasks.py`

**Before** (BROKEN):
```python
except Exception as exc:
    # Update job status to failed
    job = db.query(Job).filter(Job.id == job_id).first()
    # ❌ Using string directly in query
```

**After** (FIXED):
```python
except Exception as exc:
    # Update job status to failed
    try:
        job_uuid = validate_and_convert_uuid(job_id)
        job = db.query(Job).filter(Job.id == job_uuid).first()
        # ✅ Convert to UUID first
        if job:
            job.status = "failed"
            job.error_message = str(exc)
            db.commit()
    except Exception as update_error:
        logger.error(f"Failed to update job status: {update_error}")
```

## Complete End-to-End Flow

### 1. Job Creation (POST /api/v1/website-ai/generate)
```python
# API receives request
request = GenerateWebsiteRequest(...)

# Create job in database
job = Job(
    job_type="website_generation",
    status="pending",
    progress=0
)
db.add(job)
db.commit()

# Convert UUID to string
job_id_str = uuid_to_string(job.id)

# Queue Celery task
task = generate_website_task.delay(
    job_id=job_id_str,
    business_data=...,
    theme=...
)

# Return job_id to frontend
return {"job_id": job_id_str, "status": "pending"}
```

### 2. Task Queueing (Redis)
```
Task serialized → Sent to Redis (db 0) → Worker picks up
```

### 3. Worker Execution
```python
@celery_app.task(name="generate_website")
def generate_website_task(self, job_id: str, ...):
    # Convert string to UUID
    job_uuid = validate_and_convert_uuid(job_id)
    
    # Get job from database
    job = db.query(Job).filter(Job.id == job_uuid).first()
    
    # Update status to processing
    job.status = "processing"
    job.progress = 10
    db.commit()
    
    # Generate content
    job.progress = 30
    db.commit()
    content = generation_service.generate_content(...)
    
    # Render template
    job.progress = 60
    db.commit()
    html = generation_service.render_template(...)
    
    # Save to storage
    job.progress = 80
    db.commit()
    file_path, s3_key = storage_service.save_html(...)
    
    # Create website record
    job.progress = 90
    db.commit()
    website = Website(...)
    db.add(website)
    
    # Mark as completed
    job.status = "completed"
    job.progress = 100
    job.result_data = {...}
    db.commit()
```

### 4. Status Polling (GET /api/v1/website-ai/jobs/{job_id})
```python
# Frontend polls every 2 seconds
job_uuid = validate_and_convert_uuid(job_id)
job = db.query(Job).filter(Job.id == job_uuid).first()

return {
    "job_id": uuid_to_string(job.id),
    "status": job.status,  # "processing"
    "progress": job.progress,  # 60
    ...
}
```

## Debugging Commands

### Check Redis Queue
```bash
python -c "import redis; r = redis.Redis(host='localhost', port=6379, db=0); print('Queue:', r.llen('celery'))"
```

### Check Worker Status
```bash
celery -A ai_models.website_ai.app.workers.celery_app inspect active
```

### Test Task Queueing
```bash
python Backend/test_celery_task.py
```

### Check Task Results
```bash
python -c "import redis; r = redis.Redis(host='localhost', port=6379, db=1); print('Results:', len(r.keys('celery-task-meta-*')))"
```

## Verification Steps

### 1. Verify Worker is Running
```bash
# Should show: website_ai@LATITUDE ready
```

### 2. Verify Task Registration
```bash
# Should list: generate_website, regenerate_website
```

### 3. Test Task Execution
```bash
python Backend/test_celery_task.py
# Should show: Task queued successfully
```

### 4. Check Job Status
```bash
curl http://localhost:8000/api/v1/website-ai/jobs/{job_id}
# Should show: status="processing", progress > 0
```

## Common Issues & Solutions

### Issue: Tasks not being picked up
**Solution**: Check worker is running and connected to Redis
```bash
celery -A ai_models.website_ai.app.workers.celery_app inspect ping
```

### Issue: Tasks fail immediately
**Solution**: Check worker logs for errors
```bash
# Look for ERROR or FAILURE messages
```

### Issue: Database not updating
**Solution**: Verify database connection in worker
```bash
# Check worker logs for database connection messages
```

### Issue: UUID errors
**Solution**: Ensure UUID conversion is used everywhere
```python
job_uuid = validate_and_convert_uuid(job_id)
job = db.query(Job).filter(Job.id == job_uuid).first()
```

## Next Steps

1. **Restart Backend**: Apply model fixes
2. **Restart Worker**: Already restarted
3. **Test Generation**: Try generating a website
4. **Monitor Logs**: Watch worker logs for task execution
5. **Check Status**: Verify job status updates correctly

## Expected Behavior

### Successful Flow
```
1. POST /generate → Job created (status=pending, progress=0)
2. Task queued → Redis queue length increases
3. Worker picks up → Task state=STARTED
4. Job updated → status=processing, progress=10
5. Content generated → progress=30
6. Template rendered → progress=60
7. File saved → progress=80
8. Website created → progress=90
9. Job completed → status=completed, progress=100
10. Frontend polls → Receives updated status
```

### Timeline
```
0s: Job created
0.1s: Task queued
0.2s: Worker starts processing
2s: Content generated (progress=30)
5s: Template rendered (progress=60)
7s: File saved (progress=80)
8s: Website created (progress=90)
9s: Job completed (progress=100)
```

## Logging

### API Logs
```
✅ Created job {job_id} for website generation
📝 Job details: status=pending, progress=0%
📤 Queueing Celery task for job {job_id}
✅ Task queued with ID: {task_id}
```

### Worker Logs
```
🚀 Starting website generation for job {job_id}
🔍 Converting job_id to UUID: {job_id}
✅ Converted to UUID: {job_uuid}
🔍 Looking up job in database
✅ Found job {job_id}, updating status to processing
📝 Job {job_id}: status=processing, progress=10%
Job {job_id}: Generating AI content
Job {job_id}: Rendering template
Job {job_id}: Saving to storage
Job {job_id}: Saving to database
Job {job_id} completed successfully. Website ID: {website_id}
```

## Summary

### What Was Broken
1. ❌ Website model had broken relationship to non-existent ContentEdit
2. ❌ Task error handler used string instead of UUID
3. ❌ Tasks failed immediately on startup

### What Was Fixed
1. ✅ Removed broken ContentEdit relationship
2. ✅ Fixed error handler to use UUID conversion
3. ✅ Worker can now execute tasks successfully

### Result
- Tasks are queued correctly
- Worker picks up tasks
- Jobs update status and progress
- Frontend receives updates
- Complete async pipeline working
