@echo off
echo Starting Celery Worker...
call venv\Scripts\activate
python -m celery -A celery_worker worker --loglevel=info --pool=solo
