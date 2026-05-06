#!/usr/bin/env python3
"""
Firebase Connection Test Script
Tests Firebase Admin SDK initialization and token verification
Run this to quickly test Firebase without starting the full backend
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Add the Backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
load_dotenv()

def test_firebase_credentials_file():
    """Test if Firebase credentials file exists and is valid JSON"""
    print("🔍 Testing Firebase credentials file...")
    
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./firebase-adminsdk.json")
    full_path = backend_dir / credentials_path.lstrip('./')
    
    print(f"📁 Credentials path: {full_path}")
    
    if not full_path.exists():
        print(f"❌ FAIL: Firebase credentials file not found: {full_path}")
        return False
    
    try:
        with open(full_path, 'r') as f:
            cred_data = json.load(f)
        
        # Check required fields
        required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id']
        missing_fields = [field for field in required_fields if field not in cred_data]
        
        if missing_fields:
            print(f"❌ FAIL: Missing required fields: {missing_fields}")
            return False
        
        # Check for placeholder values
        if (cred_data.get('private_key', '').startswith('PLACEHOLDER') or 
            cred_data.get('private_key_id', '').startswith('PLACEHOLDER') or
            cred_data.get('client_id', '').startswith('PLACEHOLDER')):
            print("❌ FAIL: Firebase credentials file contains placeholder values")
            print("❌ Please download the REAL Firebase service account key from Firebase Console")
            return False
        
        # Check private key format
        private_key = cred_data.get('private_key', '')
        if not private_key.startswith('-----BEGIN PRIVATE KEY-----'):
            print("❌ FAIL: Private key does not start with proper PEM header")
            print(f"🔍 Actually starts with: {private_key[:50]}...")
            return False
        
        if not (private_key.endswith('-----END PRIVATE KEY-----\\n') or private_key.endswith('-----END PRIVATE KEY-----\n')):
            print("❌ FAIL: Private key does not end with proper PEM footer")
            print(f"🔍 Actually ends with: ...{private_key[-50:]}")
            return False
        
        print("✅ PASS: Firebase credentials file is valid JSON with required fields")
        print(f"📋 Project ID: {cred_data.get('project_id')}")
        print(f"📧 Client Email: {cred_data.get('client_email')}")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ FAIL: Invalid JSON in Firebase credentials file: {e}")
        return False
    except Exception as e:
        print(f"❌ FAIL: Error reading Firebase credentials file: {e}")
        return False

def test_environment_variables():
    """Test if required environment variables are set"""
    print("\n🔍 Testing environment variables...")
    
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    
    if not credentials_path:
        print("❌ FAIL: GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
        return False
    
    if not project_id:
        print("❌ FAIL: FIREBASE_PROJECT_ID environment variable not set")
        return False
    
    print(f"✅ PASS: GOOGLE_APPLICATION_CREDENTIALS = {credentials_path}")
    print(f"✅ PASS: FIREBASE_PROJECT_ID = {project_id}")
    return True

def test_firebase_admin_import():
    """Test if Firebase Admin SDK can be imported"""
    print("\n🔍 Testing Firebase Admin SDK import...")
    
    try:
        import firebase_admin
        from firebase_admin import credentials, auth
        print("✅ PASS: Firebase Admin SDK imported successfully")
        print(f"📦 Firebase Admin version: {firebase_admin.__version__}")
        return True
    except ImportError as e:
        print(f"❌ FAIL: Cannot import Firebase Admin SDK: {e}")
        print("💡 Try: pip install firebase-admin")
        return False

def test_firebase_initialization():
    """Test Firebase Admin SDK initialization"""
    print("\n🔍 Testing Firebase Admin SDK initialization...")
    
    try:
        import firebase_admin
        from firebase_admin import credentials, auth
        
        # Clear any existing Firebase apps
        try:
            firebase_admin.delete_app(firebase_admin.get_app())
        except ValueError:
            pass  # No app to delete
        
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./firebase-adminsdk.json")
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        
        full_path = backend_dir / credentials_path.lstrip('./')
        
        print(f"🔑 Initializing with credentials: {full_path}")
        print(f"📋 Project ID: {project_id}")
        
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate(str(full_path))
        app = firebase_admin.initialize_app(cred, {
            'projectId': project_id,
        })
        
        print("✅ PASS: Firebase Admin SDK initialized successfully")
        print(f"📱 App name: {app.name}")
        
        # Test connection by trying to get a non-existent user
        try:
            auth.get_user('test-connection-uid-that-does-not-exist')
        except auth.UserNotFoundError:
            print("✅ PASS: Firebase connection test successful (UserNotFoundError expected)")
            return True
        except Exception as e:
            print(f"❌ FAIL: Firebase connection test failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Firebase initialization failed: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        
        # Provide specific error guidance
        error_str = str(e).lower()
        if 'malformedframing' in error_str or 'pem file' in error_str:
            print("💡 SOLUTION: Private key format issue detected")
            print("   1. Download a fresh Firebase service account key from Firebase Console")
            print("   2. Replace the entire firebase-adminsdk.json file")
            print("   3. Make sure the private key has proper \\n line breaks")
        elif 'certificate' in error_str:
            print("💡 SOLUTION: Certificate issue detected")
            print("   1. Check if the private key is complete and not truncated")
            print("   2. Verify the project_id matches your Firebase project")
        elif 'permission' in error_str or 'access' in error_str:
            print("💡 SOLUTION: Permission issue detected")
            print("   1. Check if the service account has proper permissions")
            print("   2. Verify the service account is enabled in Firebase Console")
        
        return False

def test_mock_token_verification():
    """Test that mock tokens are properly rejected"""
    print("\n🔍 Testing mock token rejection...")
    
    try:
        from services.firebase_service import firebase_service
        
        # Test various mock token formats
        mock_tokens = [
            "mock-token-test",
            "demo-token-123",
            "mock-token-email=test@example.com",
            "fake-firebase-token"
        ]
        
        for mock_token in mock_tokens:
            try:
                result = firebase_service.verify_id_token(mock_token)
                print(f"❌ FAIL: Mock token was accepted: {mock_token}")
                return False
            except Exception as e:
                if "Mock tokens not accepted" in str(e) or "Invalid" in str(e):
                    print(f"✅ PASS: Mock token properly rejected: {mock_token}")
                else:
                    print(f"⚠️  WARN: Mock token rejected with unexpected error: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error testing mock token rejection: {e}")
        return False

def main():
    """Run all Firebase tests"""
    print("🔥 Firebase Connection Test Suite")
    print("=" * 50)
    
    tests = [
        ("Environment Variables", test_environment_variables),
        ("Credentials File", test_firebase_credentials_file),
        ("Firebase Admin Import", test_firebase_admin_import),
        ("Firebase Initialization", test_firebase_initialization),
        ("Mock Token Rejection", test_mock_token_verification),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ FAIL: {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("🏁 Test Results Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Firebase is configured correctly.")
        print("🚀 You can now start the backend server with working Firebase authentication.")
    else:
        print("⚠️  SOME TESTS FAILED. Please fix the issues above before starting the backend.")
        print("📖 Check FIREBASE_SETUP.md for detailed setup instructions.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)