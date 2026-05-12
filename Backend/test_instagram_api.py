"""
Test script to verify Instagram Graph API integration
"""
import requests
import json

# Test the influencer trust endpoint
url = "http://localhost:8000/api/influencer-trust/analyze-profile"
data = {
    "username": "saadhyam09876",
    "force_refresh": True
}

print("🧪 Testing Instagram Graph API integration...")
print(f"📡 Requesting: {url}")
print(f"📋 Username: {data['username']}")
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
            print()
            print(f"   Username: @{instagram_data.get('username')}")
            print(f"   Full Name: {instagram_data.get('full_name')}")
            print(f"   Followers: {instagram_data.get('follower_count', 0):,}")
            print(f"   Following: {instagram_data.get('following_count', 0):,}")
            print(f"   Posts: {instagram_data.get('media_count', 0):,}")
            print(f"   Bio: {instagram_data.get('biography', '')[:100]}...")
        elif data_source == "mock_data_fallback":
            print("⚠️ MOCK DATA (Graph API not working)")
            print()
            print(f"   Username: @{instagram_data.get('username')}")
            print(f"   Followers: {instagram_data.get('follower_count', 0):,}")
        else:
            print(f"📊 Data from: {data_source}")
            print()
            print(f"   Username: @{instagram_data.get('username')}")
            print(f"   Followers: {instagram_data.get('follower_count', 0):,}")
        
        print()
        
        # Show trust analysis
        trust_analysis = result.get("trust_analysis", {})
        if trust_analysis:
            print("🔍 Trust Analysis:")
            print(f"   Trust Score: {trust_analysis.get('trust_score', 0)}/100")
            print(f"   Authenticity: {trust_analysis.get('authenticity_level', 'unknown')}")
            print(f"   Recommendation: {trust_analysis.get('collaboration_recommendation', 'unknown')}")
        
        print()
        print("=" * 60)
        print("Full Response:")
        print(json.dumps(result, indent=2))
        
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)
        
except requests.exceptions.RequestException as e:
    print(f"❌ Network Error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
