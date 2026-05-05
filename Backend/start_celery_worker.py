#!/usr/bin/env python3
"""
Celery worker startup script
"""
import os
import sys
from pathlib import Path

# Add the Backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables
os.environ.setdefault('PYTHONPATH', str(backend_dir))

if __name__ == '__main__':
    from celery import Celery
    from celery.bin import worker
    
    # Import the celery app
    from ai_models.website_ai.app.workers.celery_app import celery_app
    
    # Start the worker
    worker_instance = worker.worker(app=celery_app)
    worker_instance.run(loglevel='info')