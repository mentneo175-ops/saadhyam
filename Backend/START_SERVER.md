# Quick Start Guide

## The Issue
You're using a different virtual environment (`venv` instead of `.venv`), and there are dependency conflicts.

## Solution: Use the Existing .venv

The `.venv` folder already has all dependencies installed. Use that instead:

### Step 1: Activate the correct virtual environment
```bash
cd "d:\saadhyam new repo\saadhyam\Backend"
..\.venv\Scripts\Activate
```

### Step 2: Start the server WITHOUT --reload
```bash
python -m uvicorn main:app --port 8000
```

## Why This Works
- The `.venv` folder already has all dependencies installed and working
- Running without `--reload` fixes the router registration bug
- You'll need to manually restart after code changes

## To Test Registration
Once the server is running, go to:
http://localhost:8080/signup

And try creating an account with:
- Email: your@email.com
- Password: yourpassword
- Name: Your Name

The `/auth/register` endpoint should now work!

## Important Notes
1. **Don't use `venv`** - use `.venv` instead
2. **Don't use `--reload`** - it causes the router registration bug
3. **Frontend is already running** on port 8080
4. After starting backend, both servers will be running and you can register

## If You Get "Module Not Found" Errors
The `.venv` has everything installed. Just make sure you're using:
```bash
..\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
```

Not:
```bash
py main.py  # This won't work
```
