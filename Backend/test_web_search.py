"""
Test script to verify web search APIs are working
Run this before starting the server to test your API keys
"""

import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 70)
print("WEB SEARCH API TEST")
print("=" * 70)
print()

# Import the web search service
from services.web_search_service import WebSearchService

async def test_search():
    """Test web search with all available APIs"""
    
    # Create service instance
    service = WebSearchService()
    
    # Test query
    test_query = "Best Italian restaurants in New York"
    
    print(f"🔍 Testing search query: '{test_query}'")
    print()
    
    # Perform search
    try:
        results = await service.search(test_query, max_results=3)
        
        print("=" * 70)
        print("SEARCH RESULTS")
        print("=" * 70)
        print()
        
        print(f"✅ Provider: {results['provider'].upper()}")
        print(f"✅ Query: {results['query']}")
        print(f"✅ Results found: {len(results.get('results', []))}")
        print()
        
        if results.get('results'):
            print("Top 3 Results:")
            print("-" * 70)
            for i, result in enumerate(results['results'][:3], 1):
                print(f"\n{i}. {result['title']}")
                print(f"   {result['content'][:150]}...")
                print(f"   URL: {result['url']}")
        else:
            print("⚠️ No results found. Will use Google Grounding as fallback.")
        
        print()
        print("=" * 70)
        print("TEST COMPLETE")
        print("=" * 70)
        print()
        
        # Show summary
        if results['provider'] == 'tavily':
            print("✅ SUCCESS: Tavily AI is working!")
            print("   You have 1,000 free searches per month")
        elif results['provider'] == 'serper':
            print("✅ SUCCESS: Serper API is working!")
            print("   You have 2,500 free searches total")
        elif results['provider'] == 'brave':
            print("✅ SUCCESS: Brave Search is working!")
            print("   You have 2,000 free searches per month")
        else:
            print("⚠️ WARNING: No web search APIs working")
            print("   Will use Google Grounding (20 requests/day)")
        
        print()
        print("Next steps:")
        print("1. Restart your backend server")
        print("2. Generate a blog to see web search in action")
        print("3. Check backend logs for search results")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print()
        print("Troubleshooting:")
        print("1. Check API keys in .env file")
        print("2. Verify internet connection")
        print("3. Check API key quotas in provider dashboards")

# Run the test
if __name__ == "__main__":
    asyncio.run(test_search())
