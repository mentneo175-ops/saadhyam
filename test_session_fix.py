"""
Test script to verify session security fix is working
Run this AFTER restarting the backend server
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "TestPassword123!"

print("=" * 60)
print("SESSION SECURITY FIX VERIFICATION TEST")
print("=" * 60)
print(f"Testing against: {BASE_URL}")
print(f"Time: {datetime.now()}")
print("=" * 60)
print()

def test_login():
    """Test login and get token"""
    print("TEST 1: Login and get token")
    print("-" * 60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✓ Login successful")
            print(f"  Token: {token[:50]}...")
            return token
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_protected_endpoint(token, test_name):
    """Test accessing protected endpoint"""
    print(f"\n{test_name}")
    print("-" * 60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✓ Access granted")
            return True
        elif response.status_code == 401:
            data = response.json()
            print(f"✗ Access denied: {data.get('detail')}")
            return False
        else:
            print(f"? Unexpected status: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_database_refresh_scenario():
    """Test the main scenario: login, clear DB, try to access"""
    print("\n" + "=" * 60)
    print("MAIN TEST: Database Refresh Scenario")
    print("=" * 60)
    
    # Step 1: Login
    token = test_login()
    if not token:
        print("\n✗ FAILED: Could not login")
        return False
    
    # Step 2: Verify access works
    if not test_protected_endpoint(token, "TEST 2: Verify access with valid token"):
        print("\n✗ FAILED: Token should work initially")
        return False
    
    # Step 3: Simulate database refresh
    print("\nTEST 3: Simulating database refresh")
    print("-" * 60)
    print("  MANUAL STEP REQUIRED:")
    print("  Run this SQL in your database:")
    print("  UPDATE users SET active_session_token = NULL WHERE email = '{TEST_EMAIL}';")
    print()
    input("  Press Enter after running the SQL command...")
    
    # Step 4: Try to access again (should fail)
    result = test_protected_endpoint(token, "TEST 4: Access after DB refresh (should FAIL)")
    
    if result == False:
        print("\n" + "=" * 60)
        print("✓✓✓ SUCCESS! FIX IS WORKING! ✓✓✓")
        print("=" * 60)
        print("The session was properly invalidated after database refresh.")
        print("Users will be forced to login again.")
        return True
    elif result == True:
        print("\n" + "=" * 60)
        print("✗✗✗ FAILED! FIX NOT WORKING! ✗✗✗")
        print("=" * 60)
        print("The session is still valid after database refresh.")
        print("This means the backend server was NOT restarted.")
        print()
        print("ACTION REQUIRED:")
        print("1. Stop the backend server completely")
        print("2. Clear Python cache: del /s /q __pycache__")
        print("3. Start the backend server again")
        print("4. Run this test again")
        return False
    else:
        print("\n✗ FAILED: Unexpected result")
        return False

def test_multi_browser_scenario():
    """Test multi-browser login scenario"""
    print("\n" + "=" * 60)
    print("BONUS TEST: Multi-Browser Login Scenario")
    print("=" * 60)
    
    # Login from "Browser A"
    print("\nSimulating Browser A login...")
    token_a = test_login()
    if not token_a:
        print("✗ FAILED: Could not login from Browser A")
        return False
    
    # Verify Browser A works
    if not test_protected_endpoint(token_a, "Browser A: Initial access"):
        print("✗ FAILED: Browser A should work initially")
        return False
    
    # Login from "Browser B" (same email)
    print("\nSimulating Browser B login (same email)...")
    token_b = test_login()
    if not token_b:
        print("✗ FAILED: Could not login from Browser B")
        return False
    
    # Verify Browser B works
    if not test_protected_endpoint(token_b, "Browser B: Access after login"):
        print("✗ FAILED: Browser B should work after login")
        return False
    
    # Try Browser A again (should fail)
    result = test_protected_endpoint(token_a, "Browser A: Access after Browser B login (should FAIL)")
    
    if result == False:
        print("\n✓ SUCCESS! Single-session enforcement is working!")
        print("  Browser A was logged out when Browser B logged in.")
        return True
    elif result == True:
        print("\n✗ FAILED! Both sessions are active!")
        print("  Single-session enforcement is NOT working.")
        return False
    else:
        print("\n✗ FAILED: Unexpected result")
        return False

# Run tests
if __name__ == "__main__":
    try:
        # Main test
        main_result = test_database_refresh_scenario()
        
        # Bonus test
        if main_result:
            print("\n" + "=" * 60)
            input("Press Enter to run bonus test (multi-browser scenario)...")
            test_multi_browser_scenario()
        
        print("\n" + "=" * 60)
        print("TEST COMPLETE")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
