"""
Test script to verify Celery task queueing and execution
"""
import sys
import os

# Add Backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_models.website_ai.app.workers.tasks.generation_tasks import generate_website_task
from ai_models.website_ai.app.workers.celery_app import celery_app
import redis

print("=" * 80)
print("CELERY TASK QUEUEING TEST")
print("=" * 80)

# Check Redis connection
print("\n1. Testing Redis connection...")
try:
    r = redis.Redis(host='localhost', port=6379, db=0)
    r.ping()
    print("   ✅ Redis connection successful")
    print(f"   Queue length before: {r.llen('celery')}")
except Exception as e:
    print(f"   ❌ Redis connection failed: {e}")
    sys.exit(1)

# Check Celery app configuration
print("\n2. Checking Celery configuration...")
print(f"   Broker: {celery_app.conf.broker_url}")
print(f"   Backend: {celery_app.conf.result_backend}")
print(f"   Registered tasks: {len(celery_app.tasks)}")
print(f"   Task names:")
for task_name in sorted(celery_app.tasks.keys()):
    if not task_name.startswith('celery.'):
        print(f"     - {task_name}")

# Test task queueing
print("\n3. Testing task queueing...")
try:
    test_job_id = "12345678-1234-1234-1234-123456789012"
    test_data = {
        "business_name": "Test Business",
        "business_type": "Restaurant",
        "description": "A test restaurant",
        "services": ["Dining", "Takeout"],
        "contact_email": "test@example.com"
    }
    
    print(f"   Queueing test task with job_id: {test_job_id}")
    result = generate_website_task.delay(
        job_id=test_job_id,
        business_data=test_data,
        theme="hero-split"
    )
    
    print(f"   ✅ Task queued successfully!")
    print(f"   Task ID: {result.id}")
    print(f"   Task state: {result.state}")
    
    # Check Redis queue
    queue_len = r.llen('celery')
    print(f"   Queue length after: {queue_len}")
    
    if queue_len > 0:
        print("   ✅ Task is in Redis queue!")
    else:
        print("   ⚠️  Task not in queue (might have been processed immediately)")
    
except Exception as e:
    print(f"   ❌ Task queueing failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n4. Checking task result...")
try:
    print(f"   Waiting for result (timeout: 5s)...")
    try:
        task_result = result.get(timeout=5)
        print(f"   ✅ Task completed: {task_result}")
    except Exception as e:
        print(f"   ⚠️  Task not completed yet or failed: {e}")
        print(f"   Task state: {result.state}")
        if result.failed():
            print(f"   Task info: {result.info}")
except Exception as e:
    print(f"   ❌ Error checking result: {e}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
