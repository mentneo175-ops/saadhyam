@echo off
REM Start TinyLlama Business Analysis Model Server on Port 9001
REM This version uses TinyLlama for fast CPU inference (2-5 seconds)

echo.
echo ================================================================================
echo Starting TinyLlama Business Analysis Model Server (Port 9001)
echo ================================================================================
echo.
echo Model: TinyLlama-1.1B-Chat-v1.0
echo Device: CPU
echo Expected load time: ^< 30 seconds
echo Expected inference: 2-5 seconds
echo.
echo IMPORTANT: Keep this terminal open while using the backend
echo.
echo ================================================================================
echo.

python ai_models/business_analysis/model_server.py

pause