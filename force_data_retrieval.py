#!/usr/bin/env python3
"""
Force data retrieval from Neon DB by bypassing status checks
"""

import requests
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNCwiZW1haWwiOiJzYWlraXJhbm1haW4xNzA4QGdtYWlsLmNvbSIsImlhdCI6MTc3OTM2MzgwOSwiZXhwIjoxNzc5OTY4NjA5fQ.ZBhpuch6i80UFPEJzgry8f5WEEeN0VGsTw1Ipofde40"

API_BASE = "http://localhost:8000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def force_update_analysis_status():
    """Try to update the analysis status from error to completed"""
    print("🔧 Attempting to fix analysis status...")
    
    # First, let's try to trigger a status update
    try:
        # Try to get any existing analysis and force it to completed status
        response = requests.post(
            f"{API_BASE}/api/comprehensive-analysis/fix-status", 
            headers=headers,
            json={"force_completed": True}
        )
        
        if response.status_code == 200:
            print("✅ Status fix attempted")
            return True
        else:
            print(f"⚠️  Status fix response: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Status fix failed: {e}")
        return False

def try_direct_database_query():
    """Try to get data directly from database regardless of status"""
    print("\n🗄️  Trying direct database queries...")
    
    # Try different approaches to get the data
    endpoints_to_try = [
        ("/api/comprehensive-analysis/business-analysis?ignore_status=true", "Business Analysis (Ignore Status)"),
        ("/api/comprehensive-analysis/competitor-analysis?ignore_status=true", "Competitor Analysis (Ignore Status)"),
        ("/api/comprehensive-analysis/business-analysis?force_retrieve=true", "Business Analysis (Force Retrieve)"),
        ("/api/business/analysis/raw", "Raw Business Analysis"),
        ("/api/profile/business/analysis", "Profile Business Analysis"),
    ]
    
    found_data = False
    
    for endpoint, description in endpoints_to_try:
        try:
            response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
            print(f"\n🔍 {description}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Found data!")
                
                # Check if this actually has useful data
                if isinstance(data, dict):
                    if data.get('status') == 'success' or data.get('success') == True:
                        print(f"   📊 Data preview: {str(data)[:200]}...")
                        found_data = True
                    elif 'strengths' in data or 'analysis' in data or 'business_name' in data:
                        print(f"   📊 Raw data found: {str(data)[:200]}...")
                        found_data = True
                    else:
                        print(f"   ⚠️  Response: {data}")
                else:
                    print(f"   📊 Data: {str(data)[:200]}...")
                    
            else:
                print(f"   ❌ {response.text}")
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")
    
    return found_data

def reset_analysis_status_in_db():
    """Try to reset the analysis status directly"""
    print("\n🔄 Attempting to reset analysis status...")
    
    try:
        # Try to update the status directly
        response = requests.patch(
            f"{API_BASE}/api/comprehensive-analysis/status", 
            headers=headers,
            json={"status": "completed", "force": True}
        )
        
        if response.status_code == 200:
            print("✅ Status reset successful")
            return True
        else:
            print(f"⚠️  Status reset response: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Status reset failed: {e}")
        return False

def check_cache_keys():
    """Check if there are any cached results we can use"""
    print("\n🗂️  Checking for cached data...")
    
    cache_endpoints = [
        ("/api/cache/keys", "Cache Keys"),
        ("/api/cache/business-analysis", "Cached Business Analysis"),
        ("/api/cache/stats", "Cache Statistics"),
    ]
    
    for endpoint, description in cache_endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}", headers=headers)
            print(f"\n🔍 {description}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Data: {json.dumps(data, indent=2)[:300]}...")
            else:
                print(f"   ❌ {response.text}")
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")

# Main execution
print("=" * 60)
print("🔧 FORCE DATA RETRIEVAL FROM NEON DB")
print("=" * 60)

print("📋 You have 9 days of data in Neon DB")
print("💡 The issue is likely that analysis status is 'error' but data exists")

# Step 1: Try to fix the status
force_update_analysis_status()

# Step 2: Try direct database queries
found_data = try_direct_database_query()

# Step 3: Try to reset status
if not found_data:
    reset_analysis_status_in_db()
    
    # Try getting data again after status reset
    print("\n🔄 Retrying data retrieval after status reset...")
    try:
        response = requests.get(f"{API_BASE}/api/comprehensive-analysis/business-analysis", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print("✅ Data retrieved after status reset!")
            print(f"📊 Preview: {json.dumps(data, indent=2)[:300]}...")
            found_data = True
        else:
            print(f"❌ Still no data: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

# Step 4: Check cache
check_cache_keys()

if found_data:
    print("\n🎉 SUCCESS: Found existing data!")
    print("💡 Try refreshing your dashboard now.")
else:
    print("\n❌ No existing data found in accessible format.")
    print("💡 The data might be in Neon DB but not accessible via current API.")
    print("💡 You may need to trigger a new analysis.")

print("\n" + "=" * 60)
print("🏁 FORCE RETRIEVAL COMPLETE")
print("=" * 60)