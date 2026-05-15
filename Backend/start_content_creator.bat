@echo off
echo Starting Content Creator AI...
cd ai_models\content_creator
call ..\..\venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8001
