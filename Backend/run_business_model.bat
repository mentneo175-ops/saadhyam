@echo off
REM Start Business Analysis Model Server on Port 9001
REM This must be run BEFORE starting main.py

echo.
echo ================================================================================
echo Starting Business Analysis Model Server (Port 9001)
echo ================================================================================
echo.
echo This server loads Mistral-7B with LoRA adapter for business analysis
echo GPU: GTX 1650 (4GB VRAM) with CPU offloading
echo.
echo IMPORTANT: Keep this terminal open while using the backend
echo.
echo ================================================================================
echo.

python business_model.py

pause
