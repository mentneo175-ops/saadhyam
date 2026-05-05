@echo off
echo Starting Celery Worker...
cd /d "%~dp0"
set PYTHONPATH=%CD%
python -m celery -A ai_models.website_ai.app.workers.celery_app worker --loglevel=info --pool=solo
pause