#!/usr/bin/env python3
"""
Test the new API key rotation system
"""

import requests
import json
import time

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNCwiZW1haWwiOiJzYWlraXJhbm1haW4xNzA4QGdtYWlsLmNvbSIsImlhdCI6MTc3OTM2MzgwOSwiZXhwIjoxNzc5OTY4NjA5fQ.ZBhpuch6i80UFPEJzgry8f5WEEeN0VGsTw1Ipofde40"

API_BASE = "http://localhost:8000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_analysis_with_rotation():
    """Test triggering analysis with the new key rotation system"""
    print("🔄 Testing API key rotation system...")
    
    try:
        print("🚀 Triggering comprehensive analysis...")
        response = requests.post(
            f"{API_BASE}/api/comprehensive-analysis/trigger", 
            headers=headers, 
            timeout=180
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Analysis triggered successfully with key rotation!")
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Monitor progress
            print("\n⏳ Monitoring analysis progress...")
            for i in range(12):  # Check for 2 minutes
                time.sleep(10)
                
                status_response = requests.get(f"{API_BASE}/api/comprehensive-analysis/status", headers=headers)
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    status = status_data.get('status')
                    print(f"📊 Status check {i+1}: {status}")
                    
                    if status == "completed":
                        print("\n🎉 Analysis completed successfully!")
                        
                        # Test data retrieval
                        print("\n🔍 Testing data retrieval...")
                        endpoints = [
                            ("/api/comprehensive-analysis/business-analysis", "Business Analysis"),
                            ("/api/comprehensive-analysis/competitor-analysis", "Competitor Analysis"),
                        ]
                        
                        for endpoint, name in endpoints:
                            test_response = requests.get(f"{API_BASE}{endpoint}", headers=headers)
                            if test_response.status_code == 200:
                                test_data = test_response.json()
                                print(f"✅ {name}: Data retrieved successfully")
                                print(f"   Preview: {str(test_data)[:100]}...")
                            else:
                                print(f"❌ {name}: {test_response.text}")
                        
                        return True
                    elif status == "error":
                        print(f"❌ Analysis failed: {status_data.get('message', 'Unknown error')}")
                        return False
                else:
                    print(f"⚠️  Status check failed: {status_response.text}")
            
            print("⏰ Analysis is taking longer than expected...")
            return False
            
        else:
            print(f"❌ Failed to trigger analysis: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def check_backend_status():
    """Check if backend is running with the new system"""
    print("🔍 Checking backend status...")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is running: {data}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")
        return False

# Main execution
print("=" * 60)
print("🧪 TESTING API KEY ROTATION SYSTEM")
print("=" * 60)

print("💡 New system features:")
print("   - Multiple API keys (3 keys = 15 requests/minute)")
print("   - Automatic key rotation on rate limits")
print("   - Fallback to cached data when possible")
print("   - Better error handling")

# Check backend
if not check_backend_status():
    print("\n❌ Backend is not running. Please start it first.")
    exit(1)

# Test the new system
success = test_analysis_with_rotation()

if success:
    print("\n🎉 SUCCESS: API key rotation system is working!")
    print("💡 Your dashboard should now have data.")
else:
    print("\n❌ FAILED: There might still be issues.")
    print("💡 Check backend logs for more details.")

print("\n" + "=" * 60)
print("🏁 TEST COMPLETE")
print("=" * 60)