@echo off
echo Starting Celery Beat...
call venv\Scripts\activate
python -m celery -A celery_worker beat --loglevel=info
