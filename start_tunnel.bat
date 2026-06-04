@echo off
title Saadhyam AI - Cloudflare Tunnel
echo ============================================
echo   Starting Cloudflare Tunnel
echo ============================================
cd Backend
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)
python start_tunnel.py
pause
