#!/usr/bin/env python3
"""
Fix the failed analysis by triggering a new comprehensive analysis
"""

import requests
import json
import time

# Use the same token from the previous test
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNCwiZW1haWwiOiJzYWlraXJhbm1haW4xNzA4QGdtYWlsLmNvbSIsImlhdCI6MTc3OTM2MzgwOSwiZXhwIjoxNzc5OTY4NjA5fQ.ZBhpuch6i80UFPEJzgry8f5WEEeN0VGsTw1Ipofde40"

API_BASE = "http://localhost:8000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def trigger_analysis():
    """Trigger a new comprehensive analysis"""
    print("🚀 Triggering new comprehensive analysis...")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/comprehensive-analysis/trigger", 
            headers=headers, 
            timeout=180  # 3 minutes timeout
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Analysis triggered successfully!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Failed to trigger analysis: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def check_status():
    """Check analysis status"""
    print("\n🔍 Checking analysis status...")
    
    try:
        response = requests.get(f"{API_BASE}/api/comprehensive-analysis/status", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Message: {data.get('message', 'No message')}")
            return data.get('status')
        else:
            print(f"❌ Failed to check status: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

# Main execution
print("=" * 60)
print("🔧 FIXING FAILED ANALYSIS")
print("=" * 60)

# Check current status
current_status = check_status()

if current_status == "error":
    print("\n📋 Current analysis is in error state. Triggering new analysis...")
    
    if trigger_analysis():
        print("\n⏳ Analysis started. This will take 2-3 minutes...")
        print("💡 You can refresh your dashboard in a few minutes to see the data.")
        
        # Monitor progress for a bit
        for i in range(6):  # Check for 1 minute
            time.sleep(10)
            status = check_status()
            if status == "completed":
                print("\n🎉 Analysis completed successfully!")
                break
            elif status == "analyzing":
                print(f"⏳ Still analyzing... ({i+1}/6)")
            else:
                print(f"📊 Status: {status}")
    else:
        print("\n❌ Failed to trigger analysis. Please check backend logs.")
        
elif current_status == "completed":
    print("\n✅ Analysis is already completed. The issue might be elsewhere.")
    
elif current_status == "analyzing":
    print("\n⏳ Analysis is currently in progress. Please wait...")
    
else:
    print(f"\n❓ Unknown status: {current_status}")

print("\n" + "=" * 60)
print("🏁 DONE")
print("=" * 60)