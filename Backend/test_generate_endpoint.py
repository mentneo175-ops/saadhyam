"""
Test the generate endpoint to reproduce the 500 error
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 80)
print("TESTING GENERATE ENDPOINT")
print("=" * 80)

# Test data
test_request = {
    "business_name": "Test Restaurant",
    "business_type": "Restaurant",
    "description": "A cozy Italian restaurant",
    "services": ["Dining", "Takeout", "Delivery"],
    "theme": "hero-split",
    "contact_email": "test@restaurant.com",
    "contact_phone": "555-1234"
}

print("\n1. Sending POST request to /api/v1/website-ai/generate")
print(f"   Data: {test_request}")

try:
    response = client.post("/api/v1/website-ai/generate", json=test_request)
    
    print(f"\n2. Response received:")
    print(f"   Status code: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 202:
        print("\n✅ SUCCESS! Job created")
        job_id = response.json().get("job_id")
        print(f"   Job ID: {job_id}")
        
        # Test status endpoint
        print(f"\n3. Testing status endpoint: /api/v1/website-ai/jobs/{job_id}")
        status_response = client.get(f"/api/v1/website-ai/jobs/{job_id}")
        print(f"   Status code: {status_response.status_code}")
        print(f"   Response: {status_response.json()}")
    else:
        print(f"\n❌ FAILED with status {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
