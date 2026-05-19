"""
Test script to check Instagram endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("Testing Health Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_instagram_routes():
    """Test if Instagram routes are registered"""
    print("\n" + "="*60)
    print("Testing Instagram Routes Registration")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code == 200:
            openapi = response.json()
            instagram_paths = [path for path in openapi.get("paths", {}).keys() if "instagram" in path.lower()]
            
            print(f"Found {len(instagram_paths)} Instagram endpoints:")
            for path in instagram_paths:
                print(f"  - {path}")
            
            return len(instagram_paths) > 0
        else:
            print(f"Failed to get OpenAPI spec: {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_settings_routes():
    """Test if Settings routes are registered"""
    print("\n" + "="*60)
    print("Testing Settings Routes Registration")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code == 200:
            openapi = response.json()
            settings_paths = [path for path in openapi.get("paths", {}).keys() if "settings" in path.lower()]
            
            print(f"Found {len(settings_paths)} Settings endpoints:")
            for path in settings_paths:
                print(f"  - {path}")
            
            return len(settings_paths) > 0
        else:
            print(f"Failed to get OpenAPI spec: {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_comprehensive_analysis_routes():
    """Test if Comprehensive Analysis routes are registered"""
    print("\n" + "="*60)
    print("Testing Comprehensive Analysis Routes Registration")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code == 200:
            openapi = response.json()
            analysis_paths = [path for path in openapi.get("paths", {}).keys() if "comprehensive-analysis" in path.lower()]
            
            print(f"Found {len(analysis_paths)} Comprehensive Analysis endpoints:")
            for path in analysis_paths:
                print(f"  - {path}")
            
            return len(analysis_paths) > 0
        else:
            print(f"Failed to get OpenAPI spec: {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("SAADHYAM AI - BACKEND ENDPOINT DIAGNOSTICS")
    print("="*60)
    
    results = {
        "Health Check": test_health(),
        "Instagram Routes": test_instagram_routes(),
        "Settings Routes": test_settings_routes(),
        "Comprehensive Analysis Routes": test_comprehensive_analysis_routes(),
    }
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*60)
    if all_passed:
        print("✅ ALL TESTS PASSED - Backend is working correctly!")
    else:
        print("❌ SOME TESTS FAILED - Check the errors above")
    print("="*60)
    
    return all_passed

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
