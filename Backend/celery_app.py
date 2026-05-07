"""
Simple Celery app entry point
This file makes it easier to run Celery commands
"""

from celery_worker import celery

# Export the celery app for command line usage
app = celery

if __name__ == "__main__":
    app.start()