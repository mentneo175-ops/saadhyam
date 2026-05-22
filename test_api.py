#!/usr/bin/env python3
"""
Quick API test to check why dashboard data is not loading
"""

import requests
import json
import os
from pathlib import Path

# Get the token from localStorage (you'll need to provide this)
# You can get it from browser dev tools -> Application -> Local Storage -> saadhyam_token
TOKEN = input("Please enter your auth token from browser localStorage (saadhyam_token): ").strip()

if not TOKEN:
    print("❌ No token provided. Please get it from browser dev tools.")
    exit(1)

API_BASE = "http://localhost:8000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_endpoint(endpoint, description):
    """Test an API endpoint"""
    print(f"\n🔍 Testing {description}")
    print(f"   URL: {API_BASE}{endpoint}")
    
    try:
        response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {json.dumps(data, indent=2)[:200]}...")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")

# Test key endpoints
print("=" * 60)
print("🧪 TESTING DASHBOARD API ENDPOINTS")
print("=" * 60)

# Test health
test_endpoint("/health", "Health Check")

# Test auth
test_endpoint("/me", "Current User")

# Test business profile
test_endpoint("/api/profile/business", "Business Profile")

# Test comprehensive analysis status
test_endpoint("/api/comprehensive-analysis/status", "Analysis Status")

# Test business analysis data
test_endpoint("/api/comprehensive-analysis/business-analysis", "Business Analysis Data")

# Test competitor analysis data
test_endpoint("/api/comprehensive-analysis/competitor-analysis", "Competitor Analysis Data")

# Test AEO/GEO data
test_endpoint("/api/aeo-geo/overview", "AEO/GEO Overview")

print("\n" + "=" * 60)
print("🏁 TEST COMPLETE")
print("=" * 60)