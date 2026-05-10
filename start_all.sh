#!/bin/bash

echo "============================================"
echo "  Starting Saadhyam AI - All Services"
echo "============================================"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[INFO] Python and Node.js detected"
echo ""

# Determine Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Start Backend Server
echo "============================================"
echo "  Starting Backend Server (Port 8000)"
echo "============================================"
cd Backend

# Check if virtual environment exists
if [ ! -f "venv/bin/activate" ]; then
    echo "[ERROR] Virtual environment not found!"
    echo "Please run: cd Backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment and start backend
source venv/bin/activate
$PYTHON_CMD main.py &
BACKEND_PID=$!
cd ..
echo "[SUCCESS] Backend server starting in virtual environment... (PID: $BACKEND_PID)"
echo ""

# Start Main Celery Worker (Instagram + WhatsApp)
echo "============================================"
echo "  Starting Main Celery Worker"
echo "  (Instagram Posts + WhatsApp Automation)"
echo "============================================"
cd Backend
source venv/bin/activate
celery -A celery_worker worker --loglevel=info &
CELERY_MAIN_PID=$!
cd ..
echo "[SUCCESS] Main Celery worker starting... (PID: $CELERY_MAIN_PID)"
echo ""

# Start Website AI Celery Worker
echo "============================================"
echo "  Starting Website AI Celery Worker"
echo "  (Website Generation Tasks)"
echo "============================================"
cd Backend
source venv/bin/activate
celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info &
CELERY_WEBSITE_PID=$!
cd ..
echo "[SUCCESS] Website AI Celery worker starting... (PID: $CELERY_WEBSITE_PID)"
echo ""

# Wait 3 seconds for backend to initialize
sleep 3

# Start Frontend Server
echo "============================================"
echo "  Starting Frontend Server (Port 5173)"
echo "============================================"
cd Frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo "[SUCCESS] Frontend server starting... (PID: $FRONTEND_PID)"
echo ""

echo "============================================"
echo "  All Services Started Successfully!"
echo "============================================"
echo ""
echo "Backend:       http://localhost:8000"
echo "Frontend:      http://localhost:5173"
echo ""
echo "Backend PID:         $BACKEND_PID"
echo "Celery Main PID:     $CELERY_MAIN_PID"
echo "Celery Website PID:  $CELERY_WEBSITE_PID"
echo "Frontend PID:        $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "============================================"
    echo "  Stopping All Services..."
    echo "============================================"
    kill $BACKEND_PID 2>/dev/null
    kill $CELERY_MAIN_PID 2>/dev/null
    kill $CELERY_WEBSITE_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "[SUCCESS] All services stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for processes
wait
