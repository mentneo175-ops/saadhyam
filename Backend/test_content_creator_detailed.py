"""
Detailed test script for Content Creator API
Tests all features and edge cases
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"


def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)


def print_test(test_name: str):
    """Print test name"""
    print(f"\n🧪 TEST: {test_name}")
    print("-" * 70)


def test_content_generation(payload: Dict[str, Any], test_name: str) -> bool:
    """Test content generation with given payload"""
    print_test(test_name)
    
    url = f"{BASE_URL}/content/generate"
    print(f"📤 Request: POST {url}")
    print(f"📦 Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=60)
        elapsed_time = time.time() - start_time
        
        print(f"\n⏱️  Response Time: {elapsed_time:.2f} seconds")
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"📄 Response:")
            print(json.dumps(result, indent=2))
            
            # Validate response structure
            if result.get("status") == "success":
                content = result.get("content", {})
                
                # Check all required fields
                has_caption = bool(content.get("caption"))
                has_hashtags = bool(content.get("hashtags"))
                has_script = bool(content.get("script"))
                
                print(f"\n✅ Validation:")
                print(f"   Caption present: {has_caption}")
                print(f"   Hashtags present: {has_hashtags} ({len(content.get('hashtags', []))} tags)")
                print(f"   Script present: {has_script}")
                
                if has_caption and has_hashtags and has_script:
                    print(f"\n✅ TEST PASSED: {test_name}")
                    return True
                else:
                    print(f"\n❌ TEST FAILED: Missing required fields")
                    return False
            else:
                print(f"\n❌ TEST FAILED: Status is not 'success'")
                return False
        else:
            print(f"📄 Error Response:")
            print(json.dumps(response.json(), indent=2))
            print(f"\n❌ TEST FAILED: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        return False


def test_health_check() -> bool:
    """Test health check endpoint"""
    print_test("Health Check")
    
    url = f"{BASE_URL}/content/health"
    print(f"📤 Request: GET {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"📥 Status Code: {response.status_code}")
        print(f"📄 Response:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print(f"\n✅ TEST PASSED: Health Check")
            return True
        else:
            print(f"\n❌ TEST FAILED: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        return False


def test_invalid_request() -> bool:
    """Test with invalid request data"""
    print_test("Invalid Request Handling")
    
    url = f"{BASE_URL}/content/generate"
    payload = {
        "business_type": "Salon",
        # Missing required fields
    }
    
    print(f"📤 Request: POST {url}")
    print(f"📦 Payload (intentionally incomplete):")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"📥 Status Code: {response.status_code}")
        print(f"📄 Response:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 422:  # Validation error expected
            print(f"\n✅ TEST PASSED: Properly rejected invalid request")
            return True
        else:
            print(f"\n⚠️  Unexpected status code (expected 422)")
            return False
            
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        return False


def main():
    """Run all content creator tests"""
    print_section("CONTENT CREATOR API - COMPREHENSIVE TESTS")
    print("\n⚠️  Make sure the backend is running on http://localhost:8000")
    print("⚠️  Make sure HUGGINGFACE_TOKEN is set in Backend/.env")
    print("\nPress Enter to start tests...")
    input()
    
    results = []
    
    # Test 1: Health Check
    print_section("TEST 1: Health Check")
    results.append(("Health Check", test_health_check()))
    
    # Test 2: Instagram Promotion (English)
    print_section("TEST 2: Instagram Promotion - English")
    results.append((
        "Instagram Promotion (English)",
        test_content_generation({
            "business_type": "Beauty Salon",
            "platform": "instagram",
            "goal": "promotion",
            "tone": "friendly",
            "language": "english"
        }, "Instagram Promotion - English")
    ))
    
    # Test 3: Facebook Engagement (English)
    print_section("TEST 3: Facebook Engagement - English")
    results.append((
        "Facebook Engagement (English)",
        test_content_generation({
            "business_type": "Restaurant",
            "platform": "facebook",
            "goal": "engagement",
            "tone": "professional",
            "language": "english"
        }, "Facebook Engagement - English")
    ))
    
    # Test 4: Reels Branding (English)
    print_section("TEST 4: Reels Branding - English")
    results.append((
        "Reels Branding (English)",
        test_content_generation({
            "business_type": "Fitness Center",
            "platform": "reels",
            "goal": "branding",
            "tone": "local",
            "language": "english"
        }, "Reels Branding - English")
    ))
    
    # Test 5: Hindi Content
    print_section("TEST 5: Hindi Content")
    results.append((
        "Hindi Content",
        test_content_generation({
            "business_type": "Grocery Store",
            "platform": "instagram",
            "goal": "promotion",
            "tone": "friendly",
            "language": "hindi"
        }, "Hindi Content")
    ))
    
    # Test 6: Telugu Content
    print_section("TEST 6: Telugu Content")
    results.append((
        "Telugu Content",
        test_content_generation({
            "business_type": "Clothing Store",
            "platform": "facebook",
            "goal": "engagement",
            "tone": "local",
            "language": "telugu"
        }, "Telugu Content")
    ))
    
    # Test 7: Professional Tone
    print_section("TEST 7: Professional Tone")
    results.append((
        "Professional Tone",
        test_content_generation({
            "business_type": "Law Firm",
            "platform": "instagram",
            "goal": "branding",
            "tone": "professional",
            "language": "english"
        }, "Professional Tone")
    ))
    
    # Test 8: Local Tone
    print_section("TEST 8: Local Tone")
    results.append((
        "Local Tone",
        test_content_generation({
            "business_type": "Local Bakery",
            "platform": "facebook",
            "goal": "promotion",
            "tone": "local",
            "language": "english"
        }, "Local Tone")
    ))
    
    # Test 9: Invalid Request
    print_section("TEST 9: Invalid Request Handling")
    results.append(("Invalid Request Handling", test_invalid_request()))
    
    # Summary
    print_section("TEST SUMMARY")
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<50} {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'='*70}")
    print(f"Total Tests: {len(results)}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/len(results)*100):.1f}%")
    print(f"{'='*70}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Content Creator is working perfectly!")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Check the output above for details.")
    
    # Feature checklist
    print_section("FEATURE CHECKLIST")
    print("✅ Health check endpoint")
    print("✅ Content generation endpoint")
    print("✅ Multiple platforms (Instagram, Facebook, Reels)")
    print("✅ Multiple goals (Promotion, Engagement, Branding)")
    print("✅ Multiple tones (Professional, Friendly, Local)")
    print("✅ Multiple languages (English, Hindi, Telugu)")
    print("✅ Caption generation")
    print("✅ Hashtag generation")
    print("✅ Script generation")
    print("✅ Error handling")
    print("✅ Input validation")


if __name__ == "__main__":
    main()
