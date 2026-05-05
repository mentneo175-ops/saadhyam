#!/usr/bin/env python
"""
Windows-compatible Celery worker starter
"""
import os
import sys
from celery import Celery
from celery.bin import worker

# Add the Backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Windows compatibility environment variable
os.environ['FORKED_BY_MULTIPROCESSING'] = '1'

if __name__ == '__main__':
    # Import the Celery app
    from ai_models.website_ai.app.workers.celery_app import celery_app
    
    # Create worker instance
    worker_instance = worker.worker(app=celery_app)
    
    # Start worker with Windows-compatible options
    worker_instance.run(
        loglevel='info',
        pool='solo',
        concurrency=1,
        without_gossip=True,
        without_mingle=True,
        without_heartbeat=True
    )