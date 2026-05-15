"""
Celery Application Configuration
"""

import os
from celery import Celery
from celery.schedules import crontab

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "voice_agent_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "tasks.campaign_tasks",
        "tasks.followup_tasks",
        "tasks.recording_tasks"
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    # Process pending follow-ups every 5 minutes
    'process-followups': {
        'task': 'tasks.followup_tasks.process_pending_followups',
        'schedule': crontab(minute='*/5'),
    },
    
    # Cleanup old recordings every day at 2 AM
    'cleanup-recordings': {
        'task': 'tasks.recording_tasks.cleanup_old_recordings',
        'schedule': crontab(hour=2, minute=0),
    },
    
    # Update campaign metrics every 10 minutes
    'update-campaign-metrics': {
        'task': 'tasks.campaign_tasks.update_campaign_metrics',
        'schedule': crontab(minute='*/10'),
    },
}

if __name__ == "__main__":
    celery_app.start()
