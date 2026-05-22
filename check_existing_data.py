#!/usr/bin/env python3
"""
Check for existing data in database and cache
"""

import requests
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNCwiZW1haWwiOiJzYWlraXJhbm1haW4xNzA4QGdtYWlsLmNvbSIsImlhdCI6MTc3OTM2MzgwOSwiZXhwIjoxNzc5OTY4NjA5fQ.ZBhpuch6i80UFPEJzgry8f5WEEeN0VGsTw1Ipofde40"

API_BASE = "http://localhost:8000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def check_endpoint(endpoint, description):
    """Check an API endpoint and show detailed response"""
    print(f"\n🔍 {description}")
    print(f"   URL: {API_BASE}{endpoint}")
    
    try:
        response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"   Data: {json.dumps(data, indent=2)}")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")

def clear_cache_and_retry():
    """Clear cache and try to get fresh data"""
    print("\n🧹 Clearing cache to force fresh data retrieval...")
    
    try:
        # Try to clear cache
        response = requests.delete(f"{API_BASE}/api/cache/clear", headers=headers)
        if response.status_code == 200:
            print("   ✅ Cache cleared successfully")
        else:
            print(f"   ⚠️  Cache clear response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Cache clear failed: {e}")
    
    # Now try to get data again
    print("\n🔄 Retrying data retrieval after cache clear...")
    check_endpoint("/api/comprehensive-analysis/business-analysis", "Business Analysis (After Cache Clear)")

def check_database_tables():
    """Check if there are any database records"""
    print("\n🗄️  Checking database for stored analysis records...")
    
    # Try different endpoints that might have historical data
    endpoints = [
        ("/api/business/history?limit=5", "Business Analysis History"),
        ("/api/business/latest", "Latest Business Analysis"),
        ("/api/profile/business", "Business Profile"),
        ("/me", "User Profile"),
    ]
    
    for endpoint, desc in endpoints:
        check_endpoint(endpoint, desc)

# Main execution
print("=" * 60)
print("🔍 CHECKING FOR EXISTING DATA")
print("=" * 60)

print("📋 You mentioned having 9 days of data stored.")
print("💡 Let's check if the data exists but isn't being retrieved properly.")

# Check current status
check_endpoint("/api/comprehensive-analysis/status", "Current Analysis Status")

# Check for historical data
check_database_tables()

# Try clearing cache and retrying
clear_cache_and_retry()

# Check if there are any completed analyses in the database
print("\n🔍 Checking for ANY completed analysis records...")
check_endpoint("/api/comprehensive-analysis/business-analysis?force=true", "Force Business Analysis")

print("\n" + "=" * 60)
print("🏁 DATA CHECK COMPLETE")
print("=" * 60)