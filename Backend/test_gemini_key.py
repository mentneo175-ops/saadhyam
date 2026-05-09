"""
Quick script to test if Gemini API key is loaded and working
Run this to verify your API key before starting the server
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get API keys
gemini_key_1 = os.getenv("GEMINI_API_KEY")
gemini_key_2 = os.getenv("GEMINI_API_KEY_2")
gemini_key_3 = os.getenv("GEMINI_API_KEY_3")

print("=" * 60)
print("GEMINI API KEY TEST")
print("=" * 60)

# Check which keys are loaded
keys = []
if gemini_key_1:
    keys.append(("GEMINI_API_KEY", gemini_key_1))
if gemini_key_2:
    keys.append(("GEMINI_API_KEY_2", gemini_key_2))
if gemini_key_3:
    keys.append(("GEMINI_API_KEY_3", gemini_key_3))

if not keys:
    print("❌ ERROR: No GEMINI_API_KEY found in .env file!")
    print("\nPlease add to your .env file:")
    print("GEMINI_API_KEY=your_api_key_here")
    exit(1)

print(f"✅ Found {len(keys)} API key(s) in .env file:\n")

# Test each key
for i, (key_name, key_value) in enumerate(keys, 1):
    print(f"{i}. {key_name}")
    print(f"   Value: {key_value[:20]}...{key_value[-10:]}")
    
    # Try to use the key
    try:
        genai.configure(api_key=key_value)
        model = genai.GenerativeModel('models/gemini-2.0-flash-exp')
        
        # Test with a simple prompt
        response = model.generate_content("Say 'API key is working!' in one sentence.")
        
        print(f"   Status: ✅ WORKING")
        print(f"   Response: {response.text[:50]}...")
        
    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg:
            print(f"   Status: ⚠️ QUOTA EXHAUSTED (20 requests/day limit reached)")
        elif "invalid" in error_msg.lower() or "400" in error_msg:
            print(f"   Status: ❌ INVALID API KEY")
        else:
            print(f"   Status: ❌ ERROR: {error_msg[:100]}")
    
    print()

print("=" * 60)
print("TEST COMPLETE")
print("=" * 60)
print("\nNext steps:")
print("1. If all keys show 'QUOTA EXHAUSTED', wait for quota reset (midnight PT)")
print("2. If keys show 'INVALID', get new keys from https://aistudio.google.com/")
print("3. If at least one key is 'WORKING', restart your backend server")
print("\nTo restart backend:")
print("   cd Backend")
print("   ..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000")
