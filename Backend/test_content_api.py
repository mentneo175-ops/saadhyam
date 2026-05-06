#!/usr/bin/env python3
"""
Test Content Creator API
"""

import requests
import json

def test_content_api():
    """Test the content creator API endpoint"""
    
    url = "http://localhost:8000/content/generate"
    
    # Test data
    test_cases = [
        {
            "name": "Bike Showroom Diwali",
            "data": {
                "business_type": "Motorcycle Showroom",
                "platform": "instagram",
                "goal": "promotion",
                "tone": "friendly",
                "language": "english",
                "user_input": "bike showroom Diwali offer"
            }
        },
        {
            "name": "Salon Hair Treatment",
            "data": {
                "business_type": "Salon",
                "platform": "Instagram",  # Mixed case
                "goal": "PROMOTION",      # Upper case
                "tone": "Friendly",       # Mixed case
                "language": "English",    # Mixed case
                "user_input": "hair treatment discount"
            }
        },
        {
            "name": "Restaurant New Menu",
            "data": {
                "business_type": "Restaurant",
                "platform": "facebook",
                "goal": "branding",
                "tone": "professional",
                "language": "english",
                "user_input": "new menu launch"
            }
        }
    ]
    
    print("🚀 Testing Content Creator API")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print("-" * 30)
        
        try:
            response = requests.post(url, json=test_case['data'], timeout=30)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ SUCCESS")
                print(f"Headline: {result['content']['headline']}")
                print(f"Caption: {result['content']['caption'][:100]}...")
                print(f"CTA: {result['content']['cta']}")
                print(f"Hashtags: {result['content']['hashtags'][:3]}")
            else:
                print("❌ FAILED")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ CONNECTION ERROR - Is the server running?")
        except Exception as e:
            print(f"❌ ERROR: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    test_content_api()