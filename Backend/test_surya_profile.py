"""
Test script for surya_4670 profile with force_refresh
"""
import requests
import json

# Test the influencer trust endpoint with force_refresh
url = "http://localhost:8000/api/influencer-trust/analyze-profile"
data = {
    "username": "surya_4670",
    "force_refresh": True
}

print("🧪 Testing surya_4670 profile with force_refresh=True...")
print(f"📡 Requesting: {url}")
print(f"📋 Username: {data['username']}")
print(f"🔄 Force Refresh: {data['force_refresh']}")
print()

try:
    response = requests.post(url, json=data, timeout=30)
    
    print(f"📊 Response Status: {response.status_code}")
    print()
    
    if response.status_code == 200:
        result = response.json()
        
        print("✅ SUCCESS! Got response from backend")
        print()
        
        # Check data source
        instagram_data = result.get("instagram_data", {})
        data_source = instagram_data.get("data_source", "unknown")
        
        print(f"📍 Data Source: {data_source}")
        print()
        
        if data_source == "instagram_graph_api":
            print("🎉 REAL DATA FROM INSTAGRAM GRAPH API!")
        elif data_source == "cached":
            print("⚠️ CACHED DATA (force_refresh not working!)")
        elif data_source == "mock_data_fallback":
            print("❌ MOCK DATA (Graph API failed)")
        else:
            print(f"📊 Data from: {data_source}")
        
        print()
        print(f"   Username: @{instagram_data.get('username')}")
        print(f"   Full Name: {instagram_data.get('full_name')}")
        print(f"   Followers: {instagram_data.get('follower_count', 0):,}")
        print(f"   Following: {instagram_data.get('following_count', 0):,}")
        print(f"   Posts: {instagram_data.get('media_count', 0):,}")
        
        print()
        print("=" * 60)
        
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)
        
except requests.exceptions.RequestException as e:
    print(f"❌ Network Error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
