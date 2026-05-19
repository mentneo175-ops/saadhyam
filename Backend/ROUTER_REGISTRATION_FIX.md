# Router Registration Fix

## Problem
Routers registered at module-level are not accessible when using `uvicorn --reload`.

## Solution
The issue is in `main.py` - routers are being registered at module import time (lines ~580-720), but uvicorn's reload mechanism doesn't properly handle this.

## Quick Fix
Since the codebase is large and complex, the quickest fix is to:

1. **Stop using --reload for production/testing**
2. **Manually restart the server after code changes**

## To Start Server Without Reload:
```bash
cd "d:\saadhyam new repo\saadhyam\Backend"
..\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
```

## To Test:
```bash
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"test123\",\"name\":\"Test\"}"
```

## Why This Happens
- Module-level code runs when Python imports the module
- Uvicorn with `--reload` uses a separate process that doesn't see the registered routers
- The logs show routers being registered because that's the import-time execution
- But the actual serving process doesn't have them

## Proper Fix (For Later)
Move all router registrations into the `lifespan` function or a startup event. This requires significant refactoring of `main.py`.
