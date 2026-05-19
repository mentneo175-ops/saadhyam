"""
Quick diagnostic script to check Gemini API rate limit status
Run this to see how many API keys are configured and test rate limiting
"""

import os
import asyncio
from dotenv import load_dotenv
from services.rate_limiter import gemini_rate_limiter

# Load environment variables
load_dotenv()


def check_api_keys():
    """Check which Gemini API keys are configured"""
    print("\n" + "="*60)
    print("GEMINI API KEY CONFIGURATION CHECK")
    print("="*60)
    
    keys = []
    
    # Check primary key
    key1 = os.getenv("GEMINI_API_KEY")
    if key1 and key1 != "your_google_ai_studio_api_key_here":
        keys.append(("GEMINI_API_KEY", key1[:20] + "..." if len(key1) > 20 else key1))
        print(f"✅ GEMINI_API_KEY: Configured ({key1[:20]}...)")
    else:
        print(f"❌ GEMINI_API_KEY: Not configured")
    
    # Check secondary key
    key2 = os.getenv("GEMINI_API_KEY_2")
    if key2 and key2 != "your_second_gemini_key_here":
        keys.append(("GEMINI_API_KEY_2", key2[:20] + "..." if len(key2) > 20 else key2))
        print(f"✅ GEMINI_API_KEY_2: Configured ({key2[:20]}...)")
    else:
        print(f"❌ GEMINI_API_KEY_2: Not configured")
    
    # Check tertiary key
    key3 = os.getenv("GEMINI_API_KEY_3")
    if key3 and key3 != "your_third_gemini_key_here":
        keys.append(("GEMINI_API_KEY_3", key3[:20] + "..." if len(key3) > 20 else key3))
        print(f"✅ GEMINI_API_KEY_3: Configured ({key3[:20]}...)")
    else:
        print(f"❌ GEMINI_API_KEY_3: Not configured")
    
    print("\n" + "-"*60)
    print(f"Total API Keys Configured: {len(keys)}")
    print(f"Maximum Requests Per Minute: {len(keys) * 5}")
    print("-"*60)
    
    if len(keys) == 0:
        print("\n⚠️  WARNING: No API keys configured!")
        print("   Add GEMINI_API_KEY to your .env file")
    elif len(keys) == 1:
        print("\n⚠️  RECOMMENDATION: Add more API keys for better performance")
        print("   Current capacity: 5 requests/minute")
        print("   With 3 keys: 15 requests/minute")
        print("\n   Get more keys from: https://aistudio.google.com/app/apikey")
        print("   Add to .env as GEMINI_API_KEY_2 and GEMINI_API_KEY_3")
    else:
        print(f"\n✅ GOOD: {len(keys)} API keys configured")
        print(f"   Capacity: {len(keys) * 5} requests/minute")
    
    return len(keys)


async def test_rate_limiter():
    """Test the rate limiter"""
    print("\n" + "="*60)
    print("RATE LIMITER TEST")
    print("="*60)
    print("Testing 7 rapid requests to see rate limiting in action...")
    print("(This will take ~60 seconds if you only have 1 API key)\n")
    
    for i in range(7):
        print(f"\nRequest #{i+1}:")
        print(f"  Remaining before request: {gemini_rate_limiter.get_remaining_requests()}/5")
        
        start_time = asyncio.get_event_loop().time()
        await gemini_rate_limiter.acquire()
        end_time = asyncio.get_event_loop().time()
        
        wait_time = end_time - start_time
        
        if wait_time > 1:
            print(f"  ⏳ Had to wait: {wait_time:.1f} seconds")
        else:
            print(f"  ✅ Approved immediately")
        
        print(f"  Remaining after request: {gemini_rate_limiter.get_remaining_requests()}/5")
    
    print("\n" + "-"*60)
    print("Rate limiter test complete!")
    print("-"*60)


async def main():
    """Main diagnostic function"""
    print("\n" + "="*60)
    print("SAADHYAM AI - RATE LIMIT DIAGNOSTIC TOOL")
    print("="*60)
    
    # Check API keys
    num_keys = check_api_keys()
    
    if num_keys == 0:
        print("\n❌ Cannot test rate limiter without API keys configured")
        return
    
    # Ask user if they want to test
    print("\n" + "="*60)
    response = input("\nDo you want to test the rate limiter? (y/n): ").lower()
    
    if response == 'y':
        await test_rate_limiter()
    else:
        print("\nSkipping rate limiter test.")
    
    print("\n" + "="*60)
    print("RECOMMENDATIONS")
    print("="*60)
    
    if num_keys == 1:
        print("""
1. Get 2 more free API keys from: https://aistudio.google.com/app/apikey
2. Add them to Backend/.env:
   GEMINI_API_KEY_2=your_second_key_here
   GEMINI_API_KEY_3=your_third_key_here
3. Restart the backend
4. Enjoy 3x capacity (15 requests/minute instead of 5)
""")
    elif num_keys == 2:
        print("""
1. Get 1 more free API key from: https://aistudio.google.com/app/apikey
2. Add it to Backend/.env:
   GEMINI_API_KEY_3=your_third_key_here
3. Restart the backend
4. Reach maximum free tier capacity (15 requests/minute)
""")
    else:
        print("""
✅ You have optimal configuration!
   - 3 API keys configured
   - 15 requests/minute capacity
   - Automatic fallback working

If you need more capacity, consider:
   - Upgrading to paid tier: https://ai.google.dev/pricing
   - Or adding more free keys from different Google accounts
""")
    
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
