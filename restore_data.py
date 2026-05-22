#!/usr/bin/env python3
"""
Restore dashboard data by checking cache and database
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

def clear_cache():
    """Clear the cache to force fresh data"""
    print("🧹 Clearing cache...")
    
    try:
        response = requests.delete(f"{API_BASE}/api/cache/clear", headers=headers)
        
        if response.status_code == 200:
            print("✅ Cache cleared successfully")
            return True
        else:
            print(f"⚠️  Cache clear failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception clearing cache: {e}")
        return False

def wait_and_trigger():
    """Wait for rate limit to reset and trigger analysis"""
    print("⏰ Waiting 5 minutes for Gemini API rate limit to reset...")
    print("💡 Gemini free tier: 5 requests per minute")
    
    # Wait 5 minutes (300 seconds)
    for i in range(30):  # 30 iterations of 10 seconds each
        remaining = 300 - (i * 10)
        print(f"⏳ {remaining} seconds remaining...")
        time.sleep(10)
    
    print("\n🚀 Rate limit should be reset. Triggering analysis...")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/comprehensive-analysis/trigger", 
            headers=headers, 
            timeout=180
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Analysis triggered successfully!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Still rate limited: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def check_database_directly():
    """Check if there's any data in the database we can use"""
    print("🔍 Checking database for any existing analysis data...")
    
    # Try to get the latest analysis regardless of status
    try:
        response = requests.get(f"{API_BASE}/api/business/latest", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Found some business analysis data in database!")
            print(f"Data preview: {json.dumps(data, indent=2)[:300]}...")
            return True
        else:
            print(f"❌ No data in database: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

# Main execution
print("=" * 60)
print("🔧 RESTORING DASHBOARD DATA")
print("=" * 60)

print("📋 The issue: Gemini API rate limit caused analysis to fail")
print("💡 Solution: Wait for rate limit reset and trigger new analysis")

# Option 1: Check if there's any cached or database data we can use
print("\n1️⃣ Checking for existing data...")
has_data = check_database_directly()

if not has_data:
    print("\n2️⃣ No existing data found. Need to trigger new analysis.")
    
    # Option 2: Clear cache and wait for rate limit
    clear_cache()
    
    # Ask user if they want to wait
    choice = input("\n❓ Do you want to wait 5 minutes for rate limit reset? (y/n): ").lower().strip()
    
    if choice == 'y':
        success = wait_and_trigger()
        
        if success:
            print("\n🎉 Analysis started! Your dashboard data should be restored in 2-3 minutes.")
            print("💡 Refresh your dashboard to see the data.")
        else:
            print("\n❌ Still having issues. You may need to wait longer or check API keys.")
    else:
        print("\n💡 You can manually trigger analysis later from the dashboard.")
        print("💡 Or wait a few minutes and try the refresh button in the dashboard.")

else:
    print("\n✅ Found existing data! Try refreshing your dashboard.")

print("\n" + "=" * 60)
print("🏁 RESTORATION COMPLETE")
print("=" * 60)
print("\n💡 TIPS TO AVOID THIS ISSUE:")
print("   - Gemini free tier has strict rate limits (5 requests/minute)")
print("   - The app caches data to reduce API calls")
print("   - Avoid triggering analysis multiple times quickly")
print("   - Consider upgrading to Gemini Pro for higher limits")