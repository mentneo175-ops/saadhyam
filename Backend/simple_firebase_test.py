#!/usr/bin/env python3
"""
Simple Firebase Test - Direct file reading
"""

import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_direct():
    """Test Firebase file directly"""
    
    # Read the file directly
    with open('firebase-adminsdk.json', 'r') as f:
        data = json.load(f)
    
    print("🔍 Direct file reading:")
    print(f"   Project ID: {data.get('project_id')}")
    print(f"   Client Email: {data.get('client_email')}")
    
    private_key = data.get('private_key', '')
    print(f"   Private Key starts with: {private_key[:50]}...")
    print(f"   Private Key ends with: ...{private_key[-50:]}")
    print(f"   Private Key length: {len(private_key)}")
    
    # Test Firebase initialization
    try:
        import firebase_admin
        from firebase_admin import credentials, auth
        
        # Clear existing apps
        try:
            firebase_admin.delete_app(firebase_admin.get_app())
        except ValueError:
            pass
        
        print("\n🔥 Testing Firebase initialization...")
        cred = credentials.Certificate('firebase-adminsdk.json')
        app = firebase_admin.initialize_app(cred, {
            'projectId': data.get('project_id'),
        })
        
        print("✅ SUCCESS: Firebase initialized!")
        
        # Test connection
        try:
            auth.get_user('test-uid-that-does-not-exist')
        except auth.UserNotFoundError:
            print("✅ SUCCESS: Firebase connection working!")
            return True
        except Exception as e:
            print(f"❌ FAIL: Firebase connection error: {e}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Firebase initialization error: {e}")
        return False

if __name__ == "__main__":
    test_direct()