#!/bin/bash

echo "============================================"
echo "  Stopping Saadhyam AI - All Services"
echo "============================================"
echo ""

echo "[INFO] Stopping all Saadhyam AI services..."
echo ""

# Kill Backend Server (Port 8000)
echo "[1/5] Stopping Backend Server (Port 8000)..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
echo "[SUCCESS] Backend Server stopped"
echo ""

# Kill AI Model Server (Port 9000)
echo "[2/5] Stopping AI Model Server (Port 9000)..."
lsof -ti:9000 | xargs kill -9 2>/dev/null
echo "[SUCCESS] AI Model Server stopped"
echo ""

# Kill Frontend Server (Port 5173)
echo "[3/5] Stopping Frontend Server (Port 5173)..."
lsof -ti:5173 | xargs kill -9 2>/dev/null
echo "[SUCCESS] Frontend Server stopped"
echo ""

# Kill Celery Workers
echo "[4/5] Stopping Celery Workers..."
pkill -f "celery.*worker" 2>/dev/null
echo "[SUCCESS] Celery Workers stopped"
echo ""

# Kill remaining Python processes related to Saadhyam
echo "[5/5] Stopping remaining Python processes..."
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "main.py" 2>/dev/null
pkill -f "model_server.py" 2>/dev/null
echo "[SUCCESS] Remaining processes stopped"
echo ""

echo "============================================"
echo "  All Services Stopped Successfully!"
echo "============================================"
echo ""
echo "All Saadhyam AI services have been stopped:"
echo "  - Backend Server (Port 8000)"
echo "  - AI Model Server (Port 9000)"
echo "  - Frontend Server (Port 5173)"
echo "  - Celery Workers (Main + Website AI)"
echo ""
echo "You can now safely close this terminal."
echo ""
