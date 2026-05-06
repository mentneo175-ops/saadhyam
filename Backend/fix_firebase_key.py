#!/usr/bin/env python3
"""
Fix Firebase Private Key Format
This script fixes common private key formatting issues in Firebase service account files
"""

import json
import os
from pathlib import Path

def fix_firebase_key():
    """Fix the private key format in Firebase service account file"""
    
    # Path to Firebase service account file
    firebase_file = Path("firebase-adminsdk.json")
    
    if not firebase_file.exists():
        print(f"❌ Firebase service account file not found: {firebase_file}")
        return False
    
    try:
        # Read the current file
        with open(firebase_file, 'r') as f:
            data = json.load(f)
        
        print("🔍 Current private key format:")
        private_key = data.get('private_key', '')
        print(f"   Starts with: {private_key[:30]}...")
        print(f"   Ends with: ...{private_key[-30:]}")
        print(f"   Length: {len(private_key)} characters")
        
        # Check if private key needs fixing
        if not private_key:
            print("❌ No private key found in file")
            return False
        
        # Fix common issues
        fixed_key = private_key
        
        # Ensure proper line breaks (should be \n not \\n in JSON)
        if '\\n' in fixed_key:
            print("🔧 Converting \\\\n to \\n...")
            fixed_key = fixed_key.replace('\\n', '\n')
        
        # Ensure proper PEM format
        if not fixed_key.startswith('-----BEGIN PRIVATE KEY-----'):
            print("❌ Private key doesn't start with proper PEM header")
            return False
        
        if not fixed_key.endswith('-----END PRIVATE KEY-----\n'):
            if fixed_key.endswith('-----END PRIVATE KEY-----'):
                print("🔧 Adding missing newline at end...")
                fixed_key += '\n'
            else:
                print("❌ Private key doesn't end with proper PEM footer")
                return False
        
        # Update the data
        data['private_key'] = fixed_key
        
        # Write back to file
        with open(firebase_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print("✅ Firebase service account file updated successfully")
        print("🔍 New private key format:")
        print(f"   Starts with: {fixed_key[:30]}...")
        print(f"   Ends with: ...{fixed_key[-30:]}")
        print(f"   Length: {len(fixed_key)} characters")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in Firebase service account file: {e}")
        return False
    except Exception as e:
        print(f"❌ Error fixing Firebase service account file: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Firebase Private Key Format Fixer")
    print("=" * 40)
    
    success = fix_firebase_key()
    
    if success:
        print("\n🎉 Private key format fixed!")
        print("🧪 Run 'python test_firebase.py' to test the connection")
    else:
        print("\n❌ Failed to fix private key format")
        print("💡 You may need to download a fresh service account key from Firebase Console")