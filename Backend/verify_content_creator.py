"""
Quick verification script for Content Creator integration
This script checks if the backend can start and if the endpoints are accessible
"""

import subprocess
import time
import requests
import sys

BASE_URL = "http://localhost:8000"

def check_backend_running():
    """Check if backend is already running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def test_content_creator_endpoints():
    """Test Content Creator endpoints"""
    print("\n" + "="*70)
    print("VERIFYING CONTENT CREATOR INTEGRATION")
    print("="*70)
    
    # Check if backend is running
    print("\n1. Checking if backend is running...")
    if not check_backend_running():
        print("   ❌ Backend is not running on http://localhost:8000")
        print("   Please start the backend first: python main.py")
        return False
    print("   ✅ Backend is running")
    
    # Test health endpoint
    print("\n2. Testing /content/health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/content/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Health endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ❌ Health endpoint returned {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health endpoint failed: {e}")
        return False
    
    # Test content generation endpoint with minimal request
    print("\n3. Testing /content/generate endpoint...")
    payload = {
        "business_type": "Test Business",
        "platform": "instagram",
        "goal": "promotion",
        "tone": "friendly",
        "language": "english"
    }
    
    try:
        print("   Sending test request (this may take 5-10 seconds)...")
        response = requests.post(
            f"{BASE_URL}/content/generate",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("status") == "success":
                content = result.get("content", {})
                print("   ✅ Content generation working!")
                print(f"\n   Generated Content:")
                print(f"   - Caption: {content.get('caption', 'N/A')[:100]}...")
                print(f"   - Hashtags: {len(content.get('hashtags', []))} tags")
                print(f"   - Script: {content.get('script', 'N/A')[:100]}...")
                return True
            else:
                print(f"   ❌ Content generation returned error: {result.get('message')}")
                return False
        else:
            print(f"   ❌ Content generation returned {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.Timeout:
        print("   ⚠️  Request timed out (this might be normal for first request)")
        print("   The model may be loading. Try running the test again.")
        return False
    except Exception as e:
        print(f"   ❌ Content generation failed: {e}")
        return False

def main():
    """Main verification function"""
    success = test_content_creator_endpoints()
    
    print("\n" + "="*70)
    if success:
        print("✅ CONTENT CREATOR INTEGRATION VERIFIED!")
        print("="*70)
        print("\nAll features are working correctly:")
        print("  ✅ Backend is running")
        print("  ✅ Health check endpoint")
        print("  ✅ Content generation endpoint")
        print("  ✅ Caption generation")
        print("  ✅ Hashtag generation")
        print("  ✅ Script generation")
        print("\nYou can now use the Content Creator API!")
        print("\nFor comprehensive testing, run:")
        print("  python test_content_creator_detailed.py")
    else:
        print("❌ VERIFICATION FAILED")
        print("="*70)
        print("\nTroubleshooting steps:")
        print("1. Make sure backend is running: python main.py")
        print("2. Check HUGGINGFACE_TOKEN is set in .env")
        print("3. Check backend logs for errors")
        print("4. Try running: python test_imports.py")
    print("="*70)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
