"""
Test script for Content Creator and Image Generator APIs
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"


def test_content_generation():
    """Test content generation endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Content Generation API")
    print("="*60)
    
    url = f"{BASE_URL}/content/generate"
    payload = {
        "business_type": "Salon",
        "platform": "instagram",
        "goal": "promotion",
        "tone": "friendly",
        "language": "english"
    }
    
    print(f"\n📤 Request to: {url}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"📄 Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ Content generation test PASSED")
            return True
        else:
            print("\n❌ Content generation test FAILED")
            return False
            
    except Exception as e:
        print(f"\n❌ Content generation test ERROR: {e}")
        return False


def test_image_generation():
    """Test image generation endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Image Generation API")
    print("="*60)
    
    url = f"{BASE_URL}/image/generate"
    payload = {
        "business_type": "Salon",
        "use_case": "poster",
        "offer": "20% discount",
        "style": "premium",
        "model": "flux"
    }
    
    print(f"\n📤 Request to: {url}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        print("\n⏳ Generating image (this may take 30-60 seconds)...")
        response = requests.post(url, json=payload, timeout=300)
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"📄 Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ Image generation test PASSED")
            return True
        else:
            print("\n❌ Image generation test FAILED")
            return False
            
    except Exception as e:
        print(f"\n❌ Image generation test ERROR: {e}")
        return False


def test_health_checks():
    """Test health check endpoints"""
    print("\n" + "="*60)
    print("TEST 3: Health Check Endpoints")
    print("="*60)
    
    endpoints = [
        "/content/health",
        "/image/health"
    ]
    
    all_passed = True
    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n📤 Request to: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            print(f"📥 Response Status: {response.status_code}")
            print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
            
            if response.status_code == 200:
                print(f"✅ {endpoint} - PASSED")
            else:
                print(f"❌ {endpoint} - FAILED")
                all_passed = False
                
        except Exception as e:
            print(f"❌ {endpoint} - ERROR: {e}")
            all_passed = False
    
    return all_passed


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 TESTING NEW AI APIS")
    print("="*60)
    print("\nMake sure the backend is running on http://localhost:8000")
    print("Press Enter to start tests...")
    input()
    
    results = []
    
    # Test health checks first
    results.append(("Health Checks", test_health_checks()))
    
    # Test content generation
    results.append(("Content Generation", test_content_generation()))
    
    # Test image generation
    results.append(("Image Generation", test_image_generation()))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print(f"\nTotal: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print("\n⚠️  SOME TESTS FAILED")


if __name__ == "__main__":
    main()
