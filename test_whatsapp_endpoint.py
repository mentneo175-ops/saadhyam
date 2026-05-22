#!/usr/bin/env python3
"""
Test WhatsApp endpoints to debug the "Not Found" issue
"""

import requests
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNCwiZW1haWwiOiJzYWlraXJhbm1haW4xNzA4QGdtYWlsLmNvbSIsImlhdCI6MTc3OTM2MzgwOSwiZXhwIjoxNzc5OTY4NjA5fQ.ZBhpuch6i80UFPEJzgry8f5WEEeN0VGsTw1Ipofde40"

API_BASE = "http://localhost:8000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_whatsapp_endpoints():
    """Test various WhatsApp endpoints to see which ones work"""
    
    endpoints = [
        ("/api/whatsapp/embedded-signup", "GET", "WhatsApp Embedded Signup"),
        ("/api/whatsapp/connection-status", "GET", "WhatsApp Connection Status"),
        ("/api/whatsapp/callback", "GET", "WhatsApp OAuth Callback"),
    ]
    
    print("🔍 Testing WhatsApp endpoints...")
    
    for endpoint, method, description in endpoints:
        try:
            print(f"\n📡 Testing {description}")
            print(f"   URL: {API_BASE}{endpoint}")
            print(f"   Method: {method}")
            
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   ✅ Success: {json.dumps(data, indent=2)[:200]}...")
                except:
                    print(f"   ✅ Success: {response.text[:200]}...")
            elif response.status_code == 404:
                print(f"   ❌ Not Found: {response.text}")
            elif response.status_code == 500:
                print(f"   ❌ Server Error: {response.text}")
            else:
                print(f"   ⚠️  Status {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")

def check_whatsapp_config():
    """Check WhatsApp configuration in .env"""
    print("\n🔧 Checking WhatsApp configuration...")
    
    try:
        with open("Backend/.env", "r") as f:
            env_content = f.read()
        
        # Check for required WhatsApp variables
        required_vars = [
            "META_APP_ID",
            "META_APP_SECRET", 
            "WHATSAPP_CONFIG_ID",
            "WHATSAPP_REDIRECT_URI"
        ]
        
        for var in required_vars:
            if f"{var}=" in env_content:
                # Extract value
                lines = env_content.split('\n')
                for line in lines:
                    if line.startswith(f"{var}="):
                        value = line.split('=', 1)[1]
                        if value and value != "your_whatsapp_app_id" and value != "your_whatsapp_app_secret":
                            print(f"   ✅ {var}: Configured")
                        else:
                            print(f"   ❌ {var}: Not configured (empty or default)")
                        break
            else:
                print(f"   ❌ {var}: Missing from .env")
                
    except Exception as e:
        print(f"   ❌ Error reading .env: {e}")

def test_meta_app_config():
    """Test if Meta app configuration is working"""
    print("\n🔍 Testing Meta app configuration...")
    
    try:
        # Try to get app info from Meta
        response = requests.get(
            "https://graph.facebook.com/v21.0/795095706777348",
            params={"fields": "name,category", "access_token": "795095706777348|82ce131266cf67edf276b83b4fa352d8"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Meta App Info: {data}")
        else:
            print(f"   ❌ Meta API Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")

# Main execution
print("=" * 60)
print("🧪 TESTING WHATSAPP ENDPOINTS")
print("=" * 60)

# Test backend health first
try:
    response = requests.get(f"{API_BASE}/health", timeout=5)
    if response.status_code == 200:
        print("✅ Backend is running")
    else:
        print(f"❌ Backend health check failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ Backend not accessible: {e}")
    exit(1)

# Test WhatsApp endpoints
test_whatsapp_endpoints()

# Check configuration
check_whatsapp_config()

# Test Meta app
test_meta_app_config()

print("\n" + "=" * 60)
print("🏁 TEST COMPLETE")
print("=" * 60)