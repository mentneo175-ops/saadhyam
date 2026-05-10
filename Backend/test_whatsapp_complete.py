"""
Complete WhatsApp Module Test Suite
Tests all WhatsApp functionality end-to-end
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TOKEN = None  # Will be obtained via login

headers = {
    "Content-Type": "application/json"
}


def get_auth_token():
    """Get authentication token by logging in"""
    global TOKEN, headers
    
    print("\n" + "="*60)
    print("AUTHENTICATION")
    print("="*60)
    
    # Try to login with test credentials
    login_data = {
        "email": "test@example.com",
        "password": "test123456"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data
        )
        
        if response.status_code == 200:
            data = response.json()
            TOKEN = data.get("access_token")
            headers["Authorization"] = f"Bearer {TOKEN}"
            print(f"✅ Logged in successfully")
            print(f"Token: {TOKEN[:50]}...")
            return True
        else:
            print(f"⚠️  Login failed: {response.status_code}")
            print(f"Response: {response.json()}")
            
            # Try to register
            print("\n🔄 Attempting to register new user...")
            register_data = {
                "email": "test@example.com",
                "password": "test123456",
                "name": "Test User"
            }
            
            response = requests.post(
                f"{BASE_URL}/auth/register",
                json=register_data
            )
            
            if response.status_code == 201:
                data = response.json()
                TOKEN = data.get("access_token")
                headers["Authorization"] = f"Bearer {TOKEN}"
                print(f"✅ Registered and logged in successfully")
                print(f"Token: {TOKEN[:50]}...")
                return True
            else:
                print(f"❌ Registration failed: {response.status_code}")
                print(f"Response: {response.json()}")
                return False
                
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False


def test_connection_status():
    """Test 1: Check WhatsApp connection status"""
    print("\n" + "="*60)
    print("TEST 1: Connection Status")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/whatsapp/connection-status",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200


def test_embedded_signup():
    """Test 2: Get embedded signup URL"""
    print("\n" + "="*60)
    print("TEST 2: Embedded Signup URL")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/whatsapp/embedded-signup",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Signup URL: {data.get('signup_url', 'N/A')[:100]}...")
        print(f"State: {data.get('state', 'N/A')}")
    else:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200


def test_message_stats():
    """Test 3: Get message statistics"""
    print("\n" + "="*60)
    print("TEST 3: Message Statistics")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/whatsapp/messages/stats",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200


def test_conversations():
    """Test 4: Get conversations list"""
    print("\n" + "="*60)
    print("TEST 4: Conversations List")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/whatsapp/messages/conversations",
        headers=headers,
        params={"limit": 10, "offset": 0}
    )
    
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Total Conversations: {data.get('total', 0)}")
    print(f"Conversations: {len(data.get('conversations', []))}")
    
    return response.status_code == 200


def test_campaigns_list():
    """Test 5: Get campaigns list"""
    print("\n" + "="*60)
    print("TEST 5: Campaigns List")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/whatsapp/campaigns",
        headers=headers,
        params={"limit": 10, "offset": 0}
    )
    
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Total Campaigns: {data.get('total', 0)}")
    print(f"Campaigns: {len(data.get('campaigns', []))}")
    
    return response.status_code == 200


def test_create_campaign():
    """Test 6: Create a test campaign"""
    print("\n" + "="*60)
    print("TEST 6: Create Campaign")
    print("="*60)
    
    campaign_data = {
        "title": "Test Campaign",
        "description": "This is a test campaign",
        "message_content": "Hello! This is a test message from Saadhyam AI.",
        "recipient_list": ["+1234567890"],  # Replace with test number
        "scheduled_time": None  # Send immediately
    }
    
    response = requests.post(
        f"{BASE_URL}/api/whatsapp/campaigns",
        headers=headers,
        json=campaign_data
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        campaign_id = response.json().get('campaign', {}).get('id')
        print(f"\n✅ Campaign created with ID: {campaign_id}")
        return campaign_id
    
    return None


def test_automations_list():
    """Test 7: Get automations list"""
    print("\n" + "="*60)
    print("TEST 7: Automations List")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/whatsapp/automation",
        headers=headers,
        params={"limit": 10, "offset": 0}
    )
    
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Total Automations: {data.get('total', 0)}")
    print(f"Automations: {len(data.get('automations', []))}")
    
    return response.status_code == 200


def test_create_automation():
    """Test 8: Create a test automation"""
    print("\n" + "="*60)
    print("TEST 8: Create Automation")
    print("="*60)
    
    automation_data = {
        "name": "Welcome Message",
        "description": "Send welcome message to new customers",
        "automation_type": "welcome_message",
        "trigger_event": "new_message",
        "message_template": "Welcome to Saadhyam AI! How can we help you today?",
        "use_ai": False,
        "delay_minutes": 0
    }
    
    response = requests.post(
        f"{BASE_URL}/api/whatsapp/automation",
        headers=headers,
        json=automation_data
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        automation_id = response.json().get('automation', {}).get('id')
        print(f"\n✅ Automation created with ID: {automation_id}")
        return automation_id
    
    return None


def test_automation_stats():
    """Test 9: Get automation statistics"""
    print("\n" + "="*60)
    print("TEST 9: Automation Statistics")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/whatsapp/automation/stats/overview",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200


def test_webhook_verification():
    """Test 10: Webhook verification endpoint"""
    print("\n" + "="*60)
    print("TEST 10: Webhook Verification")
    print("="*60)
    
    # Note: Webhook verification should NOT require authentication
    # It's called by Meta's servers
    params = {
        "hub.mode": "subscribe",
        "hub.verify_token": "saadhyam_whatsapp_verify_token_2024",
        "hub.challenge": "test_challenge_123"
    }
    
    # Don't use auth headers for webhook verification
    response = requests.get(
        f"{BASE_URL}/api/whatsapp/webhook",
        params=params
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    expected_response = "test_challenge_123"
    success = response.status_code == 200 and response.text == expected_response
    
    if not success and response.status_code == 403:
        print("\n⚠️  Note: Webhook verification failed.")
        print("This might be due to verify token mismatch.")
        print("Check WHATSAPP_VERIFY_TOKEN in .env file.")
    
    return success


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("WHATSAPP MODULE - COMPLETE TEST SUITE")
    print("="*60)
    print(f"Testing against: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Get authentication token first
    if not get_auth_token():
        print("\n❌ Failed to authenticate. Cannot run tests.")
        print("Please ensure the backend is running and try again.")
        return
    
    results = {}
    
    # Run tests
    results['Connection Status'] = test_connection_status()
    results['Embedded Signup'] = test_embedded_signup()
    results['Message Stats'] = test_message_stats()
    results['Conversations List'] = test_conversations()
    results['Campaigns List'] = test_campaigns_list()
    results['Automations List'] = test_automations_list()
    results['Automation Stats'] = test_automation_stats()
    results['Webhook Verification'] = test_webhook_verification()
    
    # Optional: Create test data (uncomment if you want to test creation)
    # campaign_id = test_create_campaign()
    # automation_id = test_create_automation()
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    print("\n" + "="*60)
    print(f"Results: {passed}/{total} tests passed")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    print("="*60)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! WhatsApp module is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     WHATSAPP SALES & AUTOMATION MODULE - TEST SUITE         ║
║                                                              ║
║  This script tests all WhatsApp module endpoints            ║
║                                                              ║
║  BEFORE RUNNING:                                            ║
║  1. Ensure backend server is running (port 8000)            ║
║  2. Update TOKEN variable with your auth token              ║
║  3. Ensure database migrations have run                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    input("Press Enter to start tests...")
    
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error running tests: {e}")
        import traceback
        traceback.print_exc()
